// utils/candles.js

const candleBuilders = {};  // To track all 272 stocks separately

// Update tick into the candle builder
function updateCandle(symbol, tickPrice, timestamp) {
    const minuteKey = getMinuteKey(timestamp);

    if (!candleBuilders[symbol]) {
        candleBuilders[symbol] = {};
    }

    let builder = candleBuilders[symbol][minuteKey];

    if (!builder) {
        // New minute, create a new candle
        builder = {
            open: tickPrice,
            high: tickPrice,
            low: tickPrice,
            close: tickPrice,
            startTime: minuteKey,
        };
        candleBuilders[symbol][minuteKey] = builder;
    } else {
        // Update existing candle
        builder.high = Math.max(builder.high, tickPrice);
        builder.low = Math.min(builder.low, tickPrice);
        builder.close = tickPrice;
    }
}

// Check and finalize completed candles
function finalizeCandles(currentTimestamp) {
    const completedCandles = [];

    for (const symbol in candleBuilders) {
        const minutes = Object.keys(candleBuilders[symbol]);

        for (const minKey of minutes) {
            if (minKey < getMinuteKey(currentTimestamp)) {
                // Candle is completed
                const candle = candleBuilders[symbol][minKey];
                completedCandles.push({
                    symbol,
                    open: candle.open,
                    high: candle.high,
                    low: candle.low,
                    close: candle.close,
                    startTime: candle.startTime,
                });

                // Remove from active builders
                delete candleBuilders[symbol][minKey];
            }
        }
    }

    return completedCandles;
}

// Helper: get "YYYY-MM-DD HH:MM" key
function getMinuteKey(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

module.exports = { updateCandle, finalizeCandles };
