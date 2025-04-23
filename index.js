require('dotenv').config();
const { login } = require('./smartApiAuth');
const { sendTelegramAlert } = require('./utils/telegramAlert');
const { WebSocketV2 } = require('smartapi-javascript');
const { updateCandle, finalizeCandles } = require('./utils/candles');
const foStocks = require('./foStocks.json');
const mongoose = require('mongoose');
const PatternModel = require('./models/PatternModel');
const express = require('express');
const cors = require('cors');

const {
    tweezerPatternEntry,
    engulfingPatternEntry,
    hammerPatternEntry,
    piercingLineEntry,
    morningStarEntry,
    invertedHammerPatternEntry,
    threeWhiteSoldiersEntry,
    bullishHaramiEntry,
    risingThreeEntry
} = require('./patterns/patterns');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('🗄️ MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

async function start() {
    // Set up backend API to fetch patterns
    app.get('/patterns', async (req, res) => {
        try {
            const patterns = await PatternModel.find().sort({ timestamp: -1 }).limit(50);
            res.json(patterns);
        } catch (err) {
            res.status(500).send('Error fetching patterns');
        }
    });

    app.listen(3000, () => {
        console.log('🚀 Backend running at http://localhost:3000');
    });

    const { authToken, feedToken } = await login();
    if (!authToken || !feedToken) throw new Error('Login failed');

    console.log('✅ Login Success | authToken and feedToken ready');

    const ws = new WebSocketV2({
        clientcode: process.env.CLIENT_ID,
        jwttoken: authToken,
        apikey: process.env.API_KEY,
        feedtype: feedToken,
    });

    await ws.connect();
    console.log('🔌 WebSocketV2 connected');

    const allTokens = foStocks.map(stock => `nse_cm|${stock.token}`);
    console.log(`📦 Subscribing to ${allTokens.length} F&O stocks...`);

    ws.fetchData({
        correlationID: 'corr1',
        action: 1,
        mode: 1, // LTP
        exchangeType: 1, // NSE
        tokens: allTokens,
    });

    console.log('📡 Tokens subscription request sent');

    // ✅ Tick received
    ws.on('tick', (tick) => {
        if (!tick.token || !tick.ltp) return;

        console.log(`💹 Tick - Token: ${tick.token}, LTP: ₹${tick.ltp}`);
        const now = Date.now();
        updateCandle(tick.token, tick.ltp, now);
    });

    ws.on('error', (e) => console.error('🛑 WebSocket error:', e));
    ws.on('close', () => console.log('❌ WebSocket closed'));

    // ✅ Every 1 sec: finalize candles
    setInterval(async () => {
        const now = Date.now();
        const completedCandles = finalizeCandles(now);

        if (completedCandles.length > 0) {
            console.log(`🕯️ ${completedCandles.length} candle(s) finalized`);
        }

        for (const candle of completedCandles) {
            console.log('🧱 Final Candle:', candle);

            const rsi = 25;  // Placeholder: Improve later with real RSI
            const vwap = candle.open;
            const volume = 1000; // Placeholder
            const avgVolume = 800; // Placeholder

            const patterns = [
                tweezerPatternEntry([candle], rsi, volume, vwap),
                engulfingPatternEntry([candle], rsi, volume, vwap),
                hammerPatternEntry(candle, rsi, volume, vwap),
                piercingLineEntry([candle], rsi, volume, vwap),
                morningStarEntry([candle], rsi, volume, vwap),
                invertedHammerPatternEntry(candle, rsi, volume, vwap),
                threeWhiteSoldiersEntry([candle], rsi, volume, vwap),
                bullishHaramiEntry([candle], rsi, volume, vwap),
                risingThreeEntry([candle], rsi, volume, vwap),
            ];

            const detected = patterns.find(p => p !== null);

            if (detected) {
                console.log(`🚀 Pattern Detected: ${detected.action} ${detected.pattern || ''} at ₹${candle.close}`);

                const newPattern = new PatternModel({
                    stockName: candle.symbol,
                    patternName: detected.pattern || "Ultra Short Pattern",
                    action: detected.action,
                    stopLoss: detected.stopLoss,
                    price: candle.close,
                    target: parseFloat((candle.close * 1.10).toFixed(2)),
                    optionType: 'CALL',
                    timestamp: new Date(),
                });

                await newPattern.save();
                console.log('💾 Pattern saved to MongoDB');

                const alertMessage = `
🧿 *Stock:* ${candle.symbol}
📈 *Pattern:* ${detected.pattern || "Ultra Short"}
🔵 *Action:* ${detected.action} CALL
💰 *Price:* ₹${candle.close}
🛡️ *Stop Loss:* ₹${detected.stopLoss}
🎯 *Target:* ₹${(candle.close * 1.10).toFixed(2)}
🕰️ *Time:* ${new Date().toLocaleTimeString()}
🚀 *New Pattern Detected!*
`;

                await sendTelegramAlert(alertMessage);
                console.log('🚀 Telegram alert sent!');
            } else {
                console.log('😶 No pattern detected for this candle.');
            }
        }
    }, 1000);
}

start().catch(console.error);
