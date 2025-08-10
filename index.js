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

const ScalpingStrategies = require('./strategies/scalpingStrategies');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('🗄️ MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

async function start() {
    // Initialize scalping strategies
    const scalpingStrategies = new ScalpingStrategies();
    
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
            const currentPrice = candle.close;
            const vwap = candle.vwap;
            const volume = candle.volume;

            // Check exit conditions for active positions
            const exitSignal = scalpingStrategies.checkExitConditions(token, currentPrice);
            if (exitSignal) {
                const stockSymbol = tokenToSymbol[token] || token;
                console.log(`🔄 Exit Signal: ${stockSymbol} - ${exitSignal.reason} (${exitSignal.profitPercent}%)`);
                
                const exitAlertMessage = `
🔄 *Exit Signal:* ${stockSymbol}
📊 *Reason:* ${exitSignal.reason}
💰 *Profit/Loss:* ${exitSignal.profitPercent}%
🕰️ *Time:* ${new Date().toLocaleTimeString()}
    `;
                await sendTelegramAlert(exitAlertMessage);
            }

            // Run master scalping strategy
            const signal = scalpingStrategies.masterScalpingStrategy(token, currentPrice, volume, vwap);

            if (signal) {
                const stockSymbol = tokenToSymbol[token] || token;
                const confidencePercent = (signal.confidence * 100).toFixed(1);

                console.log(`🚀 Scalping Signal: ${stockSymbol} ${signal.strategy} (${confidencePercent}% confidence) at ₹${currentPrice}`);

                // Record position for exit management
                scalpingStrategies.recordPosition(token, signal);

                const newPattern = new PatternModel({
                    stockName: stockSymbol,
                    patternName: signal.strategy,
                    action: signal.action,
                    stopLoss: signal.stopLoss,
                    price: currentPrice,
                    target: signal.target,
                    optionType: 'CALL',
                    confidence: signal.confidence,
                    timestamp: new Date(),
                });

                await newPattern.save();
                console.log('💾 Signal saved to MongoDB');

                const alertMessage = `
🧿 *Stock:* ${stockSymbol}
📈 *Strategy:* ${signal.strategy}
🔵 *Action:* ${signal.action} CALL
💰 *Price:* ₹${currentPrice}
🛡️ *Stop Loss:* ₹${signal.stopLoss}
🎯 *Target:* ₹${signal.target}
📊 *Confidence:* ${confidencePercent}%
📝 *Reason:* ${signal.reason}
🕰️ *Time:* ${new Date().toLocaleTimeString()}
🚀 *High-Accuracy Scalping Signal!*
    `;
                await sendTelegramAlert(alertMessage);
                console.log('🚀 Telegram alert sent!');
            }
        }
    }, 1000);
}

start().catch(console.error);
