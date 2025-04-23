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
const { getAvgVolume, calculateRSI } = require('./utils/candles');

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
    const allTokens = foStocks.map(stock => stock.token.toString());
    const tokenToSymbol = {};
    foStocks.forEach(stock => {
        tokenToSymbol[stock.token.toString()] = stock.symbol;
    });
    console.log(allTokens);
    console.log(`📦 Subscribing to ${allTokens.length} F&O stocks...`);
    // e.g. ["3045","2885","500325",…] 

    ws.fetchData({
        correlationID: 'test1',
        action: 1,        // subscribe
        mode: 1,        // LTP
        exchangeType: 1,        // 1 = NSE cash (i.e. underlying F&O stock)
        tokens: allTokens,
    });

    // ✅ Tick received
    ws.on('tick', (tick) => {
        try {
            const token = tick.token?.replace(/"/g, '');
            const ltp = parseFloat(tick.last_traded_price);

            if (!token || isNaN(ltp)) return;

            // console.log(`💹 Tick - Token: ${token}, LTP: ₹${ltp}`);
            const now = Date.now();
            updateCandle(token, ltp, now);
        } catch (e) {
            console.error('⚠️ Error processing tick:', e);
        }
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

            const token = candle.symbol;

            // const rsi = calculateRSI(token, candle.close); // ✅ Real RSI
            // if (rsi === null) {
            //     console.log(`⏳ Skipping ${token} - RSI not ready`);
            //     continue;
            // }
            const rsi = 25;
            const vwap = candle.vwap;
            const volume = candle.volume;
            const avgVolume = getAvgVolume(token);

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
            const detectedIndex = patterns.findIndex(p => p !== null);
            const detected = patterns[detectedIndex];
            const patternNames = [
                "Tweezer Bottom", "Bullish Engulfing", "Hammer",
                "Piercing Line", "Morning Star", "Inverted Hammer",
                "Three White Soldiers", "Bullish Harami", "Rising Three"
            ];

            if (detected) {
                const stockSymbol = tokenToSymbol[candle.symbol] || candle.symbol;

                console.log(`🚀 Pattern Detected: ${stockSymbol} ${patternNames[detectedIndex]} at ₹${candle.close}`);

                const newPattern = new PatternModel({
                    stockName: stockSymbol,
                    patternName: patternNames[detectedIndex],
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
🧿 *Stock:* ${stockSymbol}
📈 *Pattern:* ${patternNames[detectedIndex]}
🔵 *Action:* ${detected.action} CALL
💰 *Price:* ₹${candle.close}
🛡️ *Stop Loss:* ₹${detected.stopLoss}
🎯 *Target:* ₹${(candle.close * 1.10).toFixed(2)}
🕰️ *Time:* ${new Date().toLocaleTimeString()}
🚀 *New Pattern Detected!*
    `;
                await sendTelegramAlert(alertMessage);
                console.log('🚀 Telegram alert sent!');
            }

        }
    }, 1000);
}

start().catch(console.error);
