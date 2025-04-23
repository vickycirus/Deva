// Ultra-Short Candlestick Pattern Entry & Exit Algorithms (≤15 min holding, BUY Options only)
// Language: JavaScript

// Utility Functions
function isRSIOversold(rsi) {
    return rsi < 30;
}

function isVolumeSpike(currentVolume, avgVolume = 1) {
    return currentVolume > avgVolume * 1.5;
}

function isNearVWAP(price, vwap) {
    return Math.abs(price - vwap) / vwap < 0.005;
}

// Pattern 1: Tweezer Bottom
function tweezerPatternEntry(candles, rsi, volume, vwap) {
    if (candles.length < 2) return null;
    const lastTwo = candles.slice(-2);
    const isBottom = lastTwo[0].low === lastTwo[1].low && lastTwo[0].isBearish && lastTwo[1].isBullish;
    const valid = isVolumeSpike(volume, candles.avgVolume) &&
        isNearVWAP(candles.at(-1).close, vwap);

    if (isBottom && isRSIOversold(rsi) && valid) {
        return { action: 'BUY', stopLoss: lastTwo[1].low };
    }
    return null;
}

function tweezerPatternExit(entryPrice, currentPrice) {
    const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    return profitPercent >= 10 || profitPercent <= -5 ? 'EXIT' : 'HOLD';
}

// Pattern 2: Bullish Engulfing
function engulfingPatternEntry(candles, rsi, volume, vwap) {
    if (candles.length < 2) return null;
    const lastTwo = candles.slice(-2);
    const bullishEngulf = lastTwo[1].isBullish &&
        lastTwo[1].body > lastTwo[0].body &&
        isRSIOversold(rsi);
    const valid = isVolumeSpike(volume, candles.avgVolume) &&
        isNearVWAP(lastTwo[1].close, vwap);

    if (bullishEngulf && valid) {
        return { action: 'BUY', stopLoss: lastTwo[1].low };
    }
    return null;
}

function engulfingPatternExit(entryPrice, currentPrice) {
    const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    return profitPercent >= 10 || profitPercent <= -5 ? 'EXIT' : 'HOLD';
}

// Pattern 3: Hammer
function hammerPatternEntry(candle, rsi, volume, vwap) {
    const isHammer = candle.body < candle.upperShadow &&
        candle.lowerShadow > 2 * candle.body &&
        candle.isBullish;
    const valid = isRSIOversold(rsi) &&
        isVolumeSpike(volume, candle.avgVolume) &&
        isNearVWAP(candle.close, vwap);

    if (isHammer && valid) {
        return { action: 'BUY', stopLoss: candle.low };
    }
    return null;
}

function hammerPatternExit(entryPrice, currentPrice) {
    const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    return profitPercent >= 10 || profitPercent <= -5 ? 'EXIT' : 'HOLD';
}

// Pattern 4: Piercing Line
function piercingLineEntry(candles, rsi, volume, vwap) {
    if (candles.length < 2) return null;
    const [first, second] = candles.slice(-2);
    const isPiercing = first.isBearish &&
        second.isBullish &&
        second.open < first.low &&
        second.close > first.mid;
    const valid = isRSIOversold(rsi) &&
        isVolumeSpike(volume, candles.avgVolume) &&
        isNearVWAP(second.close, vwap);

    if (isPiercing && valid) {
        return { action: 'BUY', stopLoss: second.low };
    }
    return null;
}

function piercingLineExit(entryPrice, currentPrice) {
    const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    return profitPercent >= 10 || profitPercent <= -5 ? 'EXIT' : 'HOLD';
}

// Pattern 5: Morning Star
function morningStarEntry(candles, rsi, volume, vwap) {
    if (candles.length < 3) return null;
    const [first, second, third] = candles.slice(-3);
    const isGapDown = second.open < first.close;
    const isStar = second.body < first.body * 0.3;
    const isStrongRecovery = third.close > first.mid && third.isBullish;
    const valid = isRSIOversold(rsi) &&
        isVolumeSpike(volume, candles.avgVolume) &&
        isNearVWAP(third.close, vwap);

    if (first.isBearish && isGapDown && isStar && isStrongRecovery && valid) {
        return { action: 'BUY', stopLoss: second.low };
    }
    return null;
}

function morningStarExit(entryPrice, currentPrice) {
    const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    return profitPercent >= 10 || profitPercent <= -5 ? 'EXIT' : 'HOLD';
}

// Pattern 6: Inverted Hammer
function invertedHammerPatternEntry(candle, rsi, volume, vwap) {
    const isInvertedHammer = candle.upperShadow > 2 * candle.body &&
        candle.lowerShadow < candle.body &&
        candle.isBullish;
    const valid = isRSIOversold(rsi) &&
        isVolumeSpike(volume, candle.avgVolume) &&
        isNearVWAP(candle.close, vwap);

    if (isInvertedHammer && valid) {
        return { action: 'BUY', stopLoss: candle.low };
    }
    return null;
}

function invertedHammerPatternExit(entryPrice, currentPrice) {
    const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    return profitPercent >= 10 || profitPercent <= -5 ? 'EXIT' : 'HOLD';
}

// Pattern 7: Three White Soldiers
function threeWhiteSoldiersEntry(candles, rsi, volume, vwap) {
    if (candles.length < 3) return null;
    const [c1, c2, c3] = candles.slice(-3);
    const isThreeWhite = c1.isBullish && c2.isBullish && c3.isBullish &&
        c1.close > c1.open && c2.close > c2.open && c3.close > c3.open;
    const valid = isRSIOversold(rsi) &&
        isVolumeSpike(volume, candles.avgVolume) &&
        isNearVWAP(c3.close, vwap);

    if (isThreeWhite && valid) {
        return { action: 'BUY', stopLoss: c3.low };
    }
    return null;
}

function threeWhiteSoldiersExit(entryPrice, currentPrice) {
    const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    return profitPercent >= 10 || profitPercent <= -5 ? 'EXIT' : 'HOLD';
}

// Pattern 8: Bullish Harami
function bullishHaramiEntry(candles, rsi, volume, vwap) {
    if (candles.length < 2) return null;
    const [first, second] = candles.slice(-2);
    const isHarami = first.isBearish &&
        second.isBullish &&
        second.open < first.close &&
        second.close > second.open;
    const valid = isRSIOversold(rsi) &&
        isVolumeSpike(volume, candles.avgVolume) &&
        isNearVWAP(second.close, vwap);

    if (isHarami && valid) {
        return { action: 'BUY', stopLoss: second.low };
    }
    return null;
}

function bullishHaramiExit(entryPrice, currentPrice) {
    const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    return profitPercent >= 10 || profitPercent <= -5 ? 'EXIT' : 'HOLD';
}

// Pattern 9: Rising Three
function risingThreeEntry(candles, rsi, volume, vwap) {
    if (candles.length < 5) return null;
    const [c1, c2, c3, c4, c5] = candles.slice(-5);
    const isRisingThree = c1.isBearish && c2.isBullish && c3.isBullish && c4.isBullish && c5.isBullish;
    const valid = isRSIOversold(rsi) &&
        isVolumeSpike(volume, candles.avgVolume) &&
        isNearVWAP(c5.close, vwap);

    if (isRisingThree && valid) {
        return { action: 'BUY', stopLoss: c5.low };
    }
    return null;
}

function risingThreeExit(entryPrice, currentPrice) {
    const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    return profitPercent >= 10 || profitPercent <= -5 ? 'EXIT' : 'HOLD';
}

// Export all
module.exports = {
    tweezerPatternEntry,
    tweezerPatternExit,
    engulfingPatternEntry,
    engulfingPatternExit,
    hammerPatternEntry,
    hammerPatternExit,
    piercingLineEntry,
    piercingLineExit,
    morningStarEntry,
    morningStarExit,
    invertedHammerPatternEntry,
    invertedHammerPatternExit,
    threeWhiteSoldiersEntry,
    threeWhiteSoldiersExit,
    bullishHaramiEntry,
    bullishHaramiExit,
    risingThreeEntry,
    risingThreeExit
};
