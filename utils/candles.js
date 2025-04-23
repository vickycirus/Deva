// In utils/candles.js
const candleMap = new Map();  // token -> current building candle
const finalizedCandles = {};  // token -> array of candles
const rsiMap = new Map(); // token -> array of last 15 closes

function updateCandle(token, price, timestamp, volume = 1) {
    const candleKey = Math.floor(timestamp / 60000); // 1 min

    if (!candleMap.has(token)) {
        candleMap.set(token, {});
    }

    let current = candleMap.get(token);

    if (!current[candleKey]) {
        current[candleKey] = {
            open: price,
            high: price,
            low: price,
            close: price,
            volume: 0,
            volumePriceSum: 0,
            symbol: token,
            timestamp,
        };
    }

    let candle = current[candleKey];

    candle.high = Math.max(candle.high, price);
    candle.low = Math.min(candle.low, price);
    candle.close = price;
    candle.volume += volume;
    candle.volumePriceSum += price * volume;
}

function finalizeCandles(currentTime) {
    const candles = [];

    for (const [token, data] of candleMap.entries()) {
        for (const [key, candle] of Object.entries(data)) {
            const minute = parseInt(key);
            const nowMinute = Math.floor(currentTime / 60000);

            if (minute < nowMinute) {
                candle.vwap = parseFloat((candle.volumePriceSum / candle.volume).toFixed(2));

                if (!finalizedCandles[token]) finalizedCandles[token] = [];
                finalizedCandles[token].push(candle);

                // keep only last 20 candles per token
                if (finalizedCandles[token].length > 20) {
                    finalizedCandles[token].shift();
                }

                candles.push(candle);
                delete data[key]; // remove finalized
            }
        }
    }

    return candles;
}

function getAvgVolume(token) {
    const candles = finalizedCandles[token] || [];
    if (candles.length === 0) return 1;
    const total = candles.reduce((sum, c) => sum + (c.volume || 0), 0);
    return total / candles.length;
}
function calculateRSI(token, close) {
    if (!rsiMap.has(token)) {
        rsiMap.set(token, []);
    }

    const closes = rsiMap.get(token);
    closes.push(close);
    if (closes.length > 15) closes.shift(); // keep only last 15 closes

    if (closes.length < 15) return null; // need full 14 periods

    const gains = [], losses = [];

    for (let i = 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gains.push(diff);
        else losses.push(-diff);
    }

    const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / 14;

    if (avgLoss === 0) return 100; // prevent division by zero

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return parseFloat(rsi.toFixed(2));
}
module.exports = {
    updateCandle,
    finalizeCandles,
    getAvgVolume,
    calculateRSI
};
