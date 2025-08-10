// Advanced Technical Indicators for Scalping Strategies
class TechnicalIndicators {
    constructor() {
        this.priceHistory = new Map(); // token -> price array
        this.volumeHistory = new Map(); // token -> volume array
        this.vwapHistory = new Map(); // token -> vwap array
    }

    // Update price and volume history
    updateHistory(token, price, volume, vwap) {
        if (!this.priceHistory.has(token)) {
            this.priceHistory.set(token, []);
            this.volumeHistory.set(token, []);
            this.vwapHistory.set(token, []);
        }

        const prices = this.priceHistory.get(token);
        const volumes = this.volumeHistory.get(token);
        const vwaps = this.vwapHistory.get(token);

        prices.push(price);
        volumes.push(volume);
        vwaps.push(vwap);

        // Keep last 100 data points
        if (prices.length > 100) {
            prices.shift();
            volumes.shift();
            vwaps.shift();
        }
    }

    // Calculate RSI
    calculateRSI(token, period = 14) {
        const prices = this.priceHistory.get(token) || [];
        if (prices.length < period + 1) return null;

        const gains = [];
        const losses = [];

        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            if (change >= 0) {
                gains.push(change);
                losses.push(0);
            } else {
                gains.push(0);
                losses.push(-change);
            }
        }

        const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

        if (avgLoss === 0) return 100;

        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    // Calculate Bollinger Bands
    calculateBollingerBands(token, period = 20, stdDev = 2) {
        const prices = this.priceHistory.get(token) || [];
        if (prices.length < period) return null;

        const recentPrices = prices.slice(-period);
        const sma = recentPrices.reduce((a, b) => a + b, 0) / period;
        
        const variance = recentPrices.reduce((sum, price) => {
            return sum + Math.pow(price - sma, 2);
        }, 0) / period;
        
        const standardDeviation = Math.sqrt(variance);
        
        return {
            upper: sma + (stdDev * standardDeviation),
            middle: sma,
            lower: sma - (stdDev * standardDeviation),
            bandwidth: (stdDev * standardDeviation * 2) / sma
        };
    }

    // Calculate MACD
    calculateMACD(token, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const prices = this.priceHistory.get(token) || [];
        if (prices.length < slowPeriod) return null;

        const ema12 = this.calculateEMA(prices, fastPeriod);
        const ema26 = this.calculateEMA(prices, slowPeriod);
        const macdLine = ema12 - ema26;
        
        // Calculate signal line (EMA of MACD)
        const macdValues = [];
        for (let i = slowPeriod; i < prices.length; i++) {
            const fastEMA = this.calculateEMA(prices.slice(0, i + 1), fastPeriod);
            const slowEMA = this.calculateEMA(prices.slice(0, i + 1), slowPeriod);
            macdValues.push(fastEMA - slowEMA);
        }
        
        const signalLine = this.calculateEMA(macdValues, signalPeriod);
        
        return {
            macd: macdLine,
            signal: signalLine,
            histogram: macdLine - signalLine
        };
    }

    // Calculate EMA
    calculateEMA(prices, period) {
        const multiplier = 2 / (period + 1);
        let ema = prices[0];
        
        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        
        return ema;
    }

    // Calculate Stochastic Oscillator
    calculateStochastic(token, period = 14) {
        const prices = this.priceHistory.get(token) || [];
        if (prices.length < period) return null;

        const recentPrices = prices.slice(-period);
        const highestHigh = Math.max(...recentPrices);
        const lowestLow = Math.min(...recentPrices);
        const currentPrice = prices[prices.length - 1];

        const k = ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100;
        
        return {
            k: k,
            d: k // Simplified - in real implementation, this would be SMA of %K
        };
    }

    // Calculate Support and Resistance levels
    calculateSupportResistance(token, lookback = 20) {
        const prices = this.priceHistory.get(token) || [];
        if (prices.length < lookback) return null;

        const recentPrices = prices.slice(-lookback);
        const highs = [];
        const lows = [];

        // Find local highs and lows
        for (let i = 1; i < recentPrices.length - 1; i++) {
            if (recentPrices[i] > recentPrices[i - 1] && recentPrices[i] > recentPrices[i + 1]) {
                highs.push(recentPrices[i]);
            }
            if (recentPrices[i] < recentPrices[i - 1] && recentPrices[i] < recentPrices[i + 1]) {
                lows.push(recentPrices[i]);
            }
        }

        const resistance = highs.length > 0 ? Math.max(...highs) : null;
        const support = lows.length > 0 ? Math.min(...lows) : null;

        return { support, resistance };
    }

    // Calculate Volume Profile
    calculateVolumeProfile(token) {
        const volumes = this.volumeHistory.get(token) || [];
        const prices = this.priceHistory.get(token) || [];
        
        if (volumes.length < 20) return null;

        const recentVolumes = volumes.slice(-20);
        const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
        const currentVolume = volumes[volumes.length - 1];

        return {
            avgVolume,
            currentVolume,
            volumeRatio: currentVolume / avgVolume,
            isHighVolume: currentVolume > avgVolume * 1.5
        };
    }

    // Calculate Fibonacci Retracement levels
    calculateFibonacciLevels(token, lookback = 20) {
        const prices = this.priceHistory.get(token) || [];
        if (prices.length < lookback) return null;

        const recentPrices = prices.slice(-lookback);
        const swingHigh = Math.max(...recentPrices);
        const swingLow = Math.min(...recentPrices);
        const range = swingHigh - swingLow;

        return {
            level0: swingHigh,
            level236: swingHigh - (range * 0.236),
            level382: swingHigh - (range * 0.382),
            level500: swingHigh - (range * 0.500),
            level618: swingHigh - (range * 0.618),
            level100: swingLow
        };
    }

    // Calculate Momentum
    calculateMomentum(token, period = 10) {
        const prices = this.priceHistory.get(token) || [];
        if (prices.length < period) return null;

        const currentPrice = prices[prices.length - 1];
        const pastPrice = prices[prices.length - period - 1];
        
        return ((currentPrice - pastPrice) / pastPrice) * 100;
    }
}

module.exports = TechnicalIndicators;