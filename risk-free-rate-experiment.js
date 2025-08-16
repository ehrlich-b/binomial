/**
 * Risk-Free Rate Experiment
 * Test different risk-free rates to reverse engineer what the market was using
 * Rates to test: 2.0%, 2.5%, 3.0%, 4.0%, 5.0%, 6.0%
 */

const fs = require('fs');
const BinomialOptions = require('./binomial-options.js');

function loadMarketData() {
  const data = JSON.parse(fs.readFileSync('market-data-clean.json', 'utf8'));
  return data.cleanOptions;
}

function validateWithRate(options, riskFreeRate, maxOptions = 200) {
  console.log(`\n🧪 Testing risk-free rate: ${(riskFreeRate * 100).toFixed(1)}%`);
  console.log('================================================');
  
  const results = [];
  const errors = [];
  
  // Take a sample of liquid options
  const sampleOptions = options
    .filter(opt => 
      opt.volume > 0 && 
      opt.daysToExpiry >= 7 && 
      opt.daysToExpiry <= 180 && 
      opt.spreadPercent < 0.3 &&
      opt.moneyness > 0.8 && opt.moneyness < 1.2
    )
    .slice(0, maxOptions);
  
  for (const option of sampleOptions) {
    const params = {
      spotPrice: option.stockPrice,
      strikePrice: option.strike,
      timeToExpiry: option.timeValue,
      riskFreeRate: riskFreeRate, // ← This is what we're testing
      volatility: option.marketIV,
      dividendYield: 0,
      steps: 100,
      optionType: option.type,
      exerciseStyle: 'american'
    };
    
    try {
      const ourPrice = BinomialOptions.price(params);
      const marketPrice = option.marketMid;
      const priceError = Math.abs(ourPrice - marketPrice);
      const priceErrorPercent = (priceError / marketPrice) * 100;
      const withinSpread = ourPrice >= option.marketBid && ourPrice <= option.marketAsk;
      
      results.push({
        symbol: option.symbol,
        type: option.type,
        strike: option.strike,
        daysToExpiry: option.daysToExpiry,
        marketPrice,
        ourPrice,
        priceError,
        priceErrorPercent,
        withinSpread,
        moneyness: option.moneyness,
        timeValue: option.timeValue,
        marketIV: option.marketIV
      });
      
    } catch (error) {
      errors.push({
        symbol: option.symbol,
        error: error.message
      });
    }
  }
  
  // Calculate statistics
  if (results.length === 0) {
    return { riskFreeRate, avgError: 999, medianError: 999, withinSpreadPercent: 0, results: [] };
  }
  
  const priceErrors = results.map(r => r.priceErrorPercent);
  const avgError = priceErrors.reduce((sum, err) => sum + err, 0) / priceErrors.length;
  const medianError = priceErrors.sort((a, b) => a - b)[Math.floor(priceErrors.length / 2)];
  const withinSpreadCount = results.filter(r => r.withinSpread).length;
  const withinSpreadPercent = (withinSpreadCount / results.length) * 100;
  
  const under5Percent = priceErrors.filter(err => err < 5).length;
  const under5PercentRate = (under5Percent / results.length) * 100;
  
  console.log(`📊 Results: ${results.length} options tested`);
  console.log(`📈 Average error: ${avgError.toFixed(2)}%`);
  console.log(`📊 Median error: ${medianError.toFixed(2)}%`);
  console.log(`✅ Within spread: ${withinSpreadCount}/${results.length} (${withinSpreadPercent.toFixed(1)}%)`);
  console.log(`🎯 Under 5% error: ${under5Percent}/${results.length} (${under5PercentRate.toFixed(1)}%)`);
  
  return {
    riskFreeRate,
    avgError,
    medianError,
    withinSpreadPercent,
    under5PercentRate,
    totalTested: results.length,
    errors: errors.length,
    results: results.slice(0, 10) // Keep first 10 for analysis
  };
}

function runRiskFreeRateExperiment() {
  console.log('🔬 Risk-Free Rate Experiment');
  console.log('Testing rates: 2.0%, 2.5%, 3.0%, 4.0%, 5.0%, 6.0%');
  console.log('============================================');
  
  const marketOptions = loadMarketData();
  console.log(`📊 Loaded ${marketOptions.length} market options\n`);
  
  // Test different risk-free rates
  const ratesToTest = [0.02, 0.025, 0.03, 0.04, 0.05, 0.06];
  const experimentResults = [];
  
  for (const rate of ratesToTest) {
    const result = validateWithRate(marketOptions, rate, 500);
    experimentResults.push(result);
  }
  
  // Find the optimal rate
  console.log('\n📋 EXPERIMENT SUMMARY');
  console.log('=====================');
  console.log('Rate    | Avg Error | Median Error | Within Spread | Under 5%');
  console.log('--------|-----------|--------------|---------------|----------');
  
  for (const result of experimentResults) {
    const rate = `${(result.riskFreeRate * 100).toFixed(1)}%`.padEnd(7);
    const avg = `${result.avgError.toFixed(2)}%`.padEnd(9);
    const median = `${result.medianError.toFixed(2)}%`.padEnd(12);
    const spread = `${result.withinSpreadPercent.toFixed(1)}%`.padEnd(13);
    const under5 = `${result.under5PercentRate.toFixed(1)}%`;
    console.log(`${rate} | ${avg} | ${median} | ${spread} | ${under5}`);
  }
  
  // Find best performing rate
  const bestByAvgError = experimentResults.reduce((best, current) => 
    current.avgError < best.avgError ? current : best
  );
  
  const bestBySpread = experimentResults.reduce((best, current) => 
    current.withinSpreadPercent > best.withinSpreadPercent ? current : best
  );
  
  const bestByUnder5 = experimentResults.reduce((best, current) => 
    current.under5PercentRate > best.under5PercentRate ? current : best
  );
  
  console.log('\n🏆 OPTIMAL RATES:');
  console.log(`📉 Best average error: ${(bestByAvgError.riskFreeRate * 100).toFixed(1)}% (${bestByAvgError.avgError.toFixed(2)}% error)`);
  console.log(`📊 Best spread performance: ${(bestBySpread.riskFreeRate * 100).toFixed(1)}% (${bestBySpread.withinSpreadPercent.toFixed(1)}% within)`);
  console.log(`🎯 Best under 5% rate: ${(bestByUnder5.riskFreeRate * 100).toFixed(1)}% (${bestByUnder5.under5PercentRate.toFixed(1)}% under 5%)`);
  
  // Look up actual Treasury rates for June 24, 2024
  console.log('\n📊 Market Context for June 24, 2024:');
  console.log('- 3-month Treasury: ~5.20%');
  console.log('- 1-year Treasury: ~5.10%');
  console.log('- 10-year Treasury: ~4.30%');
  console.log('- Fed Funds Rate: 5.25-5.50%');
  
  // Save detailed results
  const report = {
    experimentDate: new Date().toISOString(),
    ratesToTest,
    results: experimentResults,
    bestRates: {
      byAvgError: bestByAvgError,
      bySpread: bestBySpread,
      byUnder5: bestByUnder5
    },
    recommendation: {
      optimalRate: bestByAvgError.riskFreeRate,
      reasoning: `Rate of ${(bestByAvgError.riskFreeRate * 100).toFixed(1)}% minimizes average pricing error`
    }
  };
  
  fs.writeFileSync('risk-free-rate-experiment.json', JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed results saved to: risk-free-rate-experiment.json`);
  
  return report;
}

// Run the experiment
if (require.main === module) {
  try {
    runRiskFreeRateExperiment();
  } catch (error) {
    console.error('\n💥 Experiment failed:', error.message);
    process.exit(1);
  }
}

module.exports = { runRiskFreeRateExperiment };