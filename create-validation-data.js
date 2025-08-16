/**
 * Create realistic validation data using Black-Scholes + market adjustments
 * This simulates real market conditions for testing
 */

const BinomialOptions = require('./binomial-options.js');
const fs = require('fs');

function generateRealisticMarketData() {
  const marketData = {};
  
  // Real market conditions as of late 2024
  const securities = [
    {
      symbol: 'SPY',
      price: 560.61,
      dividend: 0.013,
      baseVol: 0.18
    },
    {
      symbol: 'QQQ',
      price: 489.32,
      dividend: 0.005,
      baseVol: 0.22
    },
    {
      symbol: 'AAPL',
      price: 229.87,
      dividend: 0.004,
      baseVol: 0.25
    }
  ];
  
  const riskFreeRate = 0.0423; // Current 10-year treasury
  const expirations = [7, 14, 21, 30, 45, 60, 90]; // Days to expiry
  
  for (const security of securities) {
    console.log(`Generating realistic market data for ${security.symbol}...`);
    
    const options = [];
    
    for (const days of expirations) {
      const T = days / 252; // Trading days convention
      
      // Generate strikes around current price
      const strikes = [];
      const priceIncrement = security.price <= 100 ? 2.5 : 
                            security.price <= 300 ? 5 : 10;
      
      for (let i = -15; i <= 15; i++) {
        const strike = Math.round((security.price + i * priceIncrement) / priceIncrement) * priceIncrement;
        if (strike > 0) strikes.push(strike);
      }
      
      for (const strike of strikes) {
        // Create volatility smile (higher IV for OTM options)
        const moneyness = security.price / strike;
        const smileAdjustment = Math.abs(1 - moneyness) * 0.3;
        const timeAdjustment = Math.max(0, (60 - days) / 60) * 0.1; // Higher IV for shorter expiry
        const vol = security.baseVol + smileAdjustment + timeAdjustment;
        
        // Calculate theoretical prices
        const callBS = BinomialOptions.blackScholes({
          spotPrice: security.price,
          strikePrice: strike,
          timeToExpiry: T,
          riskFreeRate,
          volatility: vol,
          dividendYield: security.dividend,
          optionType: 'call'
        });
        
        const putBS = BinomialOptions.blackScholes({
          spotPrice: security.price,
          strikePrice: strike,
          timeToExpiry: T,
          riskFreeRate,
          volatility: vol,
          dividendYield: security.dividend,
          optionType: 'put'
        });
        
        // Add realistic bid-ask spreads
        const callSpread = Math.max(0.01, callBS * (0.02 + Math.random() * 0.02));
        const putSpread = Math.max(0.01, putBS * (0.02 + Math.random() * 0.02));
        
        // Add some market noise
        const noise = () => (Math.random() - 0.5) * 0.1;
        
        // Only include options with reasonable prices
        if (callBS > 0.05) {
          options.push({
            symbol: security.symbol,
            type: 'call',
            strike,
            expiration: days,
            expirationDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
            stockPrice: security.price,
            bid: Math.max(0.01, callBS - callSpread/2 + noise()),
            ask: callBS + callSpread/2 + noise(),
            lastPrice: callBS + noise(),
            mid: callBS + noise(),
            impliedVol: vol + noise() * 0.02,
            volume: Math.floor(Math.random() * 1000) + 10,
            openInterest: Math.floor(Math.random() * 5000) + 50,
            inTheMoney: security.price > strike
          });
        }
        
        if (putBS > 0.05) {
          options.push({
            symbol: security.symbol,
            type: 'put',
            strike,
            expiration: days,
            expirationDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
            stockPrice: security.price,
            bid: Math.max(0.01, putBS - putSpread/2 + noise()),
            ask: putBS + putSpread/2 + noise(),
            lastPrice: putBS + noise(),
            mid: putBS + noise(),
            impliedVol: vol + noise() * 0.02,
            volume: Math.floor(Math.random() * 1000) + 10,
            openInterest: Math.floor(Math.random() * 5000) + 50,
            inTheMoney: security.price < strike
          });
        }
      }
    }
    
    marketData[security.symbol] = {
      symbol: security.symbol,
      stockPrice: security.price,
      timestamp: new Date().toISOString(),
      options: options.filter(opt => opt.bid < opt.ask && opt.bid > 0) // Clean data
    };
    
    console.log(`✓ ${security.symbol}: ${marketData[security.symbol].options.length} realistic options generated`);
  }
  
  return marketData;
}

function saveValidationData(data) {
  // Save the main data
  fs.writeFileSync('realistic-market-data.json', JSON.stringify(data, null, 2));
  
  // Create summary
  const summary = {
    createdDate: new Date().toISOString(),
    description: 'Realistic synthetic market data for validation testing',
    totalOptions: 0,
    bySymbol: {}
  };
  
  for (const [symbol, symbolData] of Object.entries(data)) {
    summary.totalOptions += symbolData.options.length;
    summary.bySymbol[symbol] = {
      stockPrice: symbolData.stockPrice,
      optionCount: symbolData.options.length,
      calls: symbolData.options.filter(o => o.type === 'call').length,
      puts: symbolData.options.filter(o => o.type === 'put').length,
      avgImpliedVol: symbolData.options.reduce((sum, o) => sum + o.impliedVol, 0) / symbolData.options.length
    };
  }
  
  fs.writeFileSync('realistic-data-summary.json', JSON.stringify(summary, null, 2));
  
  console.log(`\n✓ Realistic market data saved to realistic-market-data.json`);
  console.log(`✓ Summary saved to realistic-data-summary.json`);
  console.log(`✓ Total options: ${summary.totalOptions}`);
  
  return summary;
}

// Main execution
console.log('Creating Realistic Market Validation Data');
console.log('=========================================\n');

const marketData = generateRealisticMarketData();
const summary = saveValidationData(marketData);

console.log('\n📊 Data Statistics:');
for (const [symbol, stats] of Object.entries(summary.bySymbol)) {
  console.log(`${symbol}: $${stats.stockPrice} | ${stats.optionCount} options | ${stats.avgImpliedVol.toFixed(1)}% avg IV`);
}

console.log('\n✅ Realistic validation data ready for testing!');