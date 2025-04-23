// // Ultra-Short Candlestick Pattern Entry & Exit Algorithms (≤15 min holding, BUY Options only)
// // Language: JavaScript

// // Utility function: RSI, VWAP, and Volume should be fed from real-time or historical source

// function isRSIOversold(rsi) {
//     return rsi < 30;
// }

// function isVolumeSpike(currentVolume, avgVolume) {
//     return currentVolume > avgVolume * 1.5;
// }

// function isNearVWAP(price, vwap) {
//     return Math.abs(price - vwap) / vwap < 0.005;
// }

// // Pattern 1: Tweezer Bottom (BUY Only)
// function tweezerPatternEntry(candles, rsi, volume, vwap) {
//     const lastTwo = candles.slice(-2);
//     const isBottom = lastTwo[0].low === lastTwo[1].low && lastTwo[0].isBearish && lastTwo[1].isBullish;
//     const valid = isVolumeSpike(volume, candles.avgVolume) && isNearVWAP(candles.slice(-1)[0].close, vwap);

//     if (isBottom && isRSIOversold(rsi) && valid) return { action: 'BUY', stopLoss: lastTwo[1].low };
//     return null;
// }

// function tweezerPatternExit(entryPrice, currentPrice) {
//     const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
//     if (profitPercent >= 10 || profitPercent <= -5) return 'EXIT';
//     return 'HOLD';
// }

// // Pattern 2: Bullish Engulfing (BUY Only)
// function engulfingPatternEntry(candles, rsi, volume, vwap) {
//     const lastTwo = candles.slice(-2);
//     const bullishEngulf = lastTwo[1].isBullish && lastTwo[1].body > lastTwo[0].body && isRSIOversold(rsi);
//     const valid = isVolumeSpike(volume, candles.avgVolume) && isNearVWAP(lastTwo[1].close, vwap);

//     if (bullishEngulf && valid) return { action: 'BUY', stopLoss: lastTwo[1].low };
//     return null;
// }

// function engulfingPatternExit(entryPrice, currentPrice) {
//     const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
//     if (profitPercent >= 10 || profitPercent <= -5) return 'EXIT';
//     return 'HOLD';
// }

// // Pattern 3: Hammer (BUY Only)
// function hammerPatternEntry(candle, rsi, volume, vwap) {
//     const isHammer = candle.body < candle.upperShadow && candle.lowerShadow > 2 * candle.body && candle.isBullish;
//     const valid = isRSIOversold(rsi) && isVolumeSpike(volume, candle.avgVolume) && isNearVWAP(candle.close, vwap);

//     if (isHammer && valid) return { action: 'BUY', stopLoss: candle.low };
//     return null;
// }

// function hammerPatternExit(entryPrice, currentPrice) {
//     const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
//     if (profitPercent >= 10 || profitPercent <= -5) return 'EXIT';
//     return 'HOLD';
// }

// // Pattern 4: Piercing Line (BUY Only)
// function piercingLineEntry(candles, rsi, volume, vwap) {
//     const [first, second] = candles.slice(-2);
//     const isPiercing = first.isBearish && second.isBullish && second.open < first.low && second.close > first.mid;
//     const valid = isRSIOversold(rsi) && isVolumeSpike(volume, candles.avgVolume) && isNearVWAP(second.close, vwap);

//     if (isPiercing && valid) return { action: 'BUY', stopLoss: second.low };
//     return null;
// }

// function piercingLineExit(entryPrice, currentPrice) {
//     const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
//     if (profitPercent >= 10 || profitPercent <= -5) return 'EXIT';
//     return 'HOLD';
// }

// // Pattern 5: Morning Star (BUY Only)
// function morningStarEntry(candles, rsi, volume, vwap) {
//     const [first, second, third] = candles.slice(-3);
//     const isGapDown = second.open < first.close;
//     const isStar = second.body < first.body * 0.3;
//     const isStrongRecovery = third.close > first.mid && third.isBullish;
//     const valid = isRSIOversold(rsi) && isVolumeSpike(volume, candles.avgVolume) && isNearVWAP(third.close, vwap);

//     if (first.isBearish && isGapDown && isStar && isStrongRecovery && valid) return { action: 'BUY', stopLoss: second.low };
//     return null;
// }

// function morningStarExit(entryPrice, currentPrice) {
//     const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
//     if (profitPercent >= 10 || profitPercent <= -5) return 'EXIT';
//     return 'HOLD';
// }

// // More patterns coming up: Inverted Hammer, Three White Soldiers, Bullish Harami, etc.
// // Say "continue with next" to add the remaining 5.

// function invertedHammerPatternEntry(candle, rsi, volume, vwap) {
//     const isInvertedHammer = candle.upperShadow > 2 * candle.body && candle.lowerShadow < candle.body && candle.isBullish;
//     const valid = isRSIOversold(rsi) && isVolumeSpike(volume, candle.avgVolume) && isNearVWAP(candle.close, vwap);

//     if (isInvertedHammer && valid) return { action: 'BUY', stopLoss: candle.low };
//     return null;
// }

// function invertedHammerPatternExit(entryPrice, currentPrice) {
//     const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
//     if (profitPercent >= 10 || profitPercent <= -5) return 'EXIT';
//     return 'HOLD';
// }

// function threeWhiteSoldiersEntry(candles, rsi, volume, vwap) {
//     const isThreeWhite = candles[0].isBullish && candles[1].isBullish && candles[2].isBullish &&
//         candles[0].close > candles[0].open && candles[1].close > candles[1].open &&
//         candles[2].close > candles[2].open;
//     const valid = isRSIOversold(rsi) && isVolumeSpike(volume, candles.avgVolume) && isNearVWAP(candles[2].close, vwap);

//     if (isThreeWhite && valid) return { action: 'BUY', stopLoss: candles[2].low };
//     return null;
// }

// function threeWhiteSoldiersExit(entryPrice, currentPrice) {
//     const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
//     if (profitPercent >= 10 || profitPercent <= -5) return 'EXIT';
//     return 'HOLD';
// }

// function bullishHaramiEntry(candles, rsi, volume, vwap) {
//     const isHarami = candles[0].isBearish && candles[1].isBullish && candles[1].close > candles[1].open && candles[1].open < candles[0].close;
//     const valid = isRSIOversold(rsi) && isVolumeSpike(volume, candles.avgVolume) && isNearVWAP(candles[1].close, vwap);

//     if (isHarami && valid) return { action: 'BUY', stopLoss: candles[1].low };
//     return null;
// }

// function bullishHaramiExit(entryPrice, currentPrice) {
//     const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
//     if (profitPercent >= 10 || profitPercent <= -5) return 'EXIT';
//     return 'HOLD';
// }
// function risingThreeEntry(candles, rsi, volume, vwap) {
//     const isRisingThree = candles[0].isBearish && candles[1].isBullish && candles[2].isBullish &&
//         candles[3].isBullish && candles[4].isBullish;
//     const valid = isRSIOversold(rsi) && isVolumeSpike(volume, candles.avgVolume) && isNearVWAP(candles[4].close, vwap);

//     if (isRisingThree && valid) return { action: 'BUY', stopLoss: candles[4].low };
//     return null;
// }

// function risingThreeExit(entryPrice, currentPrice) {
//     const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
//     if (profitPercent >= 10 || profitPercent <= -5) return 'EXIT';
//     return 'HOLD';
// }

// function risingThreeEntry(candles, rsi, volume, vwap) {
//     const isRisingThree = candles[0].isBearish && candles[1].isBullish && candles[2].isBullish &&
//         candles[3].isBullish && candles[4].isBullish;
//     const valid = isRSIOversold(rsi) && isVolumeSpike(volume, candles.avgVolume) && isNearVWAP(candles[4].close, vwap);

//     if (isRisingThree && valid) return { action: 'BUY', stopLoss: candles[4].low };
//     return null;
// }

// function risingThreeExit(entryPrice, currentPrice) {
//     const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
//     if (profitPercent >= 10 || profitPercent <= -5) return 'EXIT';
//     return 'HOLD';
// }

