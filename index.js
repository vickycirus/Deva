require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { login } = require('./smartApiAuth');           // UPDATED to return smartApi instance
const { sendTelegramAlert } = require('./utils/telegramAlert');
const { WebSocketV2, SmartAPI } = require('smartapi-javascript');
const { updateCandle, finalizeCandles } = require('./utils/candles');
const PatternModel = require('./models/PatternModel');
const foStocks = require('./foStocks.json');
const ti = require('technicalindicators');

//
// ─── HELPERS ─────────────────────────────────────────────────────────────────
//
function pad(n) { return n < 10 ? '0' + n : n; }
function formatDate(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}
 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

//
// ─── PATTERN ENTRIES ─────────────────────────────────────────────────────────
//
const {
    tweezerPatternEntry,
    engulfingPatternEntry,
    hammerPatternEntry,
    piercingLineEntry,
    morningStarEntry,
    invertedHammerPatternEntry,
    threeWhiteSoldiersEntry,
    bullishHaramiEntry,
    risingThreeEntry,
} = require('./patterns/patterns');

//
// ─── APP SETUP ───────────────────────────────────────────────────────────────
//
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true, useUnifiedTopology: true
})
    .then(() => console.log('🗄️ MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.get('/patterns', async (req, res) => {
    try {
        const patterns = await PatternModel.find().sort({ timestamp: -1 }).limit(50);
        res.json(patterns);
    } catch (e) {
        res.status(500).send('Error fetching patterns');
    }
});

//
// ─── MAIN ────────────────────────────────────────────────────────────────────
//
async function start() {
    app.listen(3000, () => {
        console.log('🚀 Backend running at http://localhost:3000');
    });

    // login() must now return { authToken, feedToken, smartApi }
    const { authToken, feedToken, smartApi } = await login();
    console.log('✅ Login Success | authToken and feedToken ready');

    // Prepare WebSocket
    const ws = new WebSocketV2({
        clientcode: process.env.CLIENT_ID,
        jwttoken: authToken,
        apikey: process.env.API_KEY,
        feedtype: feedToken,
    });

    await ws.connect();
    console.log('🔌 WebSocketV2 connected');

    // Dedupe & subscribe
    const allTokens = [...new Set(foStocks.map(s => s.token.toString()))];
    console.log(`📦 Subscribing to ${allTokens.length} F&O stocks…`);
    ws.fetchData({
        correlationID: 'main-sub',
        action: 1,   // subscribe
        mode: 1,   // LTP
        exchangeType: 1,   // NSE cash
        tokens: allTokens,
    });

    // Store minute‐candles per token
    const candleHistory = {};

    // TICK HANDLER → build in-progress candle
    ws.on('tick', raw => {
        const token = raw.token?.replace(/"/g, '');
        const ltp = parseFloat(raw.last_traded_price);
        if (!token || isNaN(ltp)) return;
        updateCandle(token, ltp, Number(raw.exchange_timestamp));
    });

    ws.on('error', e => console.error('🛑 WebSocket error:', e));
    ws.on('close', () => console.log('❌ WebSocket closed'));

    // FINALIZE every second
    setInterval(async () => {
        const now = Date.now();
        const completed = finalizeCandles(now);

        if (completed.length === 0) return;
        console.log(`🕯️ ${completed.length} candle(s) finalized`);

        for (const rawCandle of completed) {
            const token = rawCandle.token;
            // INIT history
            if (!candleHistory[token]) candleHistory[token] = [];

            // ENRICH candle
            const c = { ...rawCandle };
            c.isBullish = c.close > c.open;
            c.isBearish = !c.isBullish;
            c.body = Math.abs(c.close - c.open);
            c.upperShadow = c.high - Math.max(c.open, c.close);
            c.lowerShadow = Math.min(c.open, c.close) - c.low;
            c.mid = c.open + c.body / 2;
            candleHistory[token].push(c);

            // ── FETCH last 15m of 1-min candles from SmartAPI ──────────────
            const toDate = new Date();
            const fromDate = new Date(toDate.getTime() - 15 * 60 * 1000);
            let hist;
            try {
                hist = await smartApi.getCandleData({
                    exchange: "NSE",
                    symboltoken: token,
                    interval: "ONE_MINUTE",
                    fromdate: formatDate(fromDate),
                    todate: formatDate(toDate),
                });
            } catch (err) {
                console.error('⚠️ Failed to fetch historic data:', err);
                continue;
            }

            // PARSE OHLC array
            const closes = hist.map(o => parseFloat(o.close));
            const volumes = hist.map(o => parseFloat(o.volume));
            // VWAP = Σ(price × volume) / Σ(volume)
            const vwNumer = hist.reduce((sum, o) =>
                sum + parseFloat(o.close) * parseFloat(o.volume), 0
            );
            const totalVol = volumes.reduce((sum, v) => sum + v, 0);
            const vwap = totalVol ? vwNumer / totalVol : c.open;
            const volume = volumes[volumes.length - 1] || 0;
            const avgVolume = totalVol / volumes.length;

            // 14-period RSI on closes
            const rsiArr = ti.RSI.calculate({ values: closes, period: 14 });
            const rsi = rsiArr.length ? rsiArr[rsiArr.length - 1] : 50;

            // ── RUN your patterns ────────────────────────────────────────
            const hist2 = candleHistory[token].slice(-2);
            const hist3 = candleHistory[token].slice(-3);
            const hist5 = candleHistory[token].slice(-5);

            const patterns = [
                tweezerPatternEntry(hist2, rsi, volume, vwap),
                engulfingPatternEntry(hist2, rsi, volume, vwap),
                hammerPatternEntry(c, rsi, volume, vwap),
                piercingLineEntry(hist2, rsi, volume, vwap),
                morningStarEntry(hist3, rsi, volume, vwap),
                invertedHammerPatternEntry(c, rsi, volume, vwap),
                threeWhiteSoldiersEntry(hist3, rsi, volume, vwap),
                bullishHaramiEntry(hist2, rsi, volume, vwap),
                risingThreeEntry(hist5, rsi, volume, vwap),
            ];

            const detected = patterns.find(p => p !== null);
            if (!detected) {
                console.log('😶 No pattern detected for', token);
                continue;
            }

            console.log(`🚀 ${token}: Pattern Detected →`, detected);

            // SAVE & ALERT
            const newPattern = new PatternModel({
                stockName: token,
                patternName: detected.pattern || "Ultra Short",
                action: detected.action,
                stopLoss: detected.stopLoss,
                price: c.close,
                target: +(c.close * 1.10).toFixed(2),
                optionType: 'CALL',
                timestamp: new Date(),
            });
            await newPattern.save();

            const msg = `
🧿 *Token:* ${token}
📈 *Pattern:* ${detected.pattern || "Ultra Short"}
🔵 *Action:* ${detected.action} CALL
💰 *Price:* ₹${c.close}
🛡️ *Stop Loss:* ₹${detected.stopLoss}
🎯 *Target:* ₹${(c.close * 1.10).toFixed(2)}
🕰️ *Time:* ${new Date().toLocaleTimeString()}
🚀 *New Pattern Detected!*
`;
            await sendTelegramAlert(msg);
            console.log('🚀 Telegram alert sent!');
        }
    }, 1000);
}

start().catch(console.error);
