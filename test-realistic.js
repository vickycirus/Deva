// Realistic test with downtrend and oversold conditions
const ScalpingStrategies = require('./strategies/scalpingStrategies');

// Create realistic data with downtrend and oversold conditions
function generateRealisticData() {
    const data = [];
    let price = 100;
    let volume = 1000;
    let vwap = 100;
    
    // Initial uptrend
    for (let i = 0; i < 20; i++) {
        price += 0.5;
        volume += 100;
        vwap = price - 0.1;
        data.push({ price, volume, vwap });
    }
    
    // Downtrend with oversold conditions
    for (let i = 0; i < 30; i++) {
        price -= 1.5;
        volume += 200;
        vwap = price + 0.2;
        data.push({ price, volume, vwap });
    }
    
    // Volume spike and potential reversal
    for (let i = 0; i < 10; i++) {
        price -= 0.5;
        volume = 5000 + (i * 1000); // High volume spike
        vwap = price + 0.1;
        data.push({ price, volume, vwap });
    }
    
    return data;
}

function testRealisticStrategies() {
    console.log('🧪 Testing with Realistic Market Data...\n');
    
    const strategies = new ScalpingStrategies();
    const token = 'REALISTIC123';
    const sampleData = generateRealisticData();
    let signalsGenerated = 0;

    console.log('📊 Market Data Pattern:');
    console.log(`   Initial Price: ₹${sampleData[0].price}`);
    console.log(`   Final Price: ₹${sampleData[sampleData.length - 1].price}`);
    console.log(`   Price Change: ${((sampleData[sampleData.length - 1].price - sampleData[0].price) / sampleData[0].price * 100).toFixed(2)}%`);
    console.log(`   Max Volume: ${Math.max(...sampleData.map(d => d.volume))}`);
    console.log('');

    // Feed data to strategies
    sampleData.forEach((data, index) => {
        const signal = strategies.masterScalpingStrategy(token, data.price, data.volume, data.vwap);
        
        if (signal) {
            signalsGenerated++;
            console.log(`🚀 Signal ${signalsGenerated} at index ${index}:`);
            console.log(`   Strategy: ${signal.strategy}`);
            console.log(`   Action: ${signal.action}`);
            console.log(`   Price: ₹${data.price}`);
            console.log(`   Volume: ${data.volume}`);
            console.log(`   VWAP: ₹${data.vwap}`);
            console.log(`   Stop Loss: ₹${signal.stopLoss}`);
            console.log(`   Target: ₹${signal.target}`);
            console.log(`   Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
            console.log(`   Reason: ${signal.reason}`);
            console.log('');
        }
    });

    console.log(`📈 Test Results:`);
    console.log(`   Total data points: ${sampleData.length}`);
    console.log(`   Signals generated: ${signalsGenerated}`);
    console.log(`   Signal rate: ${((signalsGenerated / sampleData.length) * 100).toFixed(2)}%`);
    
    // Test individual strategies with final data point
    console.log('\n🔍 Testing Individual Strategies (Final Data Point):');
    
    const lastData = sampleData[sampleData.length - 1];
    console.log(`   Final Price: ₹${lastData.price}, Volume: ${lastData.volume}, VWAP: ₹${lastData.vwap}`);
    
    const strategiesList = [
        { name: 'VWAP+RSI+Volume', func: strategies.vwapRSIVolumeStrategy.bind(strategies) },
        { name: 'Bollinger+MACD', func: strategies.bollingerMACDStrategy.bind(strategies) },
        { name: 'Price Action+Stoch', func: strategies.priceActionStochasticStrategy.bind(strategies) },
        { name: 'MA Crossover+Volume', func: strategies.maCrossoverVolumeStrategy.bind(strategies) },
        { name: 'Fibonacci+RSI+Momentum', func: strategies.fibonacciRSIMomentumStrategy.bind(strategies) }
    ];

    strategiesList.forEach(strat => {
        const signal = strat.func(token, lastData.price, lastData.volume, lastData.vwap);
        if (signal) {
            console.log(`   ✅ ${strat.name}: ${(signal.confidence * 100).toFixed(1)}% confidence`);
            console.log(`      Reason: ${signal.reason}`);
        } else {
            console.log(`   ❌ ${strat.name}: No signal`);
        }
    });

    // Test with specific oversold conditions
    console.log('\n🎯 Testing with Specific Oversold Conditions:');
    
    // Create oversold scenario
    const oversoldData = {
        price: 55, // Low price
        volume: 8000, // High volume
        vwap: 55.5 // Near price
    };
    
    console.log(`   Test Price: ₹${oversoldData.price}, Volume: ${oversoldData.volume}, VWAP: ₹${oversoldData.vwap}`);
    
    strategiesList.forEach(strat => {
        const signal = strat.func(token, oversoldData.price, oversoldData.volume, oversoldData.vwap);
        if (signal) {
            console.log(`   ✅ ${strat.name}: ${(signal.confidence * 100).toFixed(1)}% confidence`);
            console.log(`      Reason: ${signal.reason}`);
        } else {
            console.log(`   ❌ ${strat.name}: No signal`);
        }
    });

    console.log('\n✅ Realistic strategy testing completed!');
}

// Run the test
testRealisticStrategies();