/**
 * Error Pattern Analysis
 * Bucket errors by moneyness to check for volatility smile patterns
 * Using optimal parameters: 6.0% risk-free rate, 50 steps
 */

const fs = require('fs');
const BinomialOptions = require('./binomial-options.js');

function loadMarketData() {
  const data = JSON.parse(fs.readFileSync('market-data-clean.json', 'utf8'));
  return data.cleanOptions;
}

function validateWithOptimalParams(options, maxOptions = 1000) {
  console.log('🧪 Running validation with optimal parameters');
  console.log('Risk-free rate: 6.0%, Steps: 50');
  console.log('==========================================');
  
  const results = [];
  const errors = [];
  
  // Take a larger sample for pattern analysis
  const sampleOptions = options
    .filter(opt => 
      opt.volume > 0 && 
      opt.daysToExpiry >= 7 && 
      opt.daysToExpiry <= 180 && 
      opt.spreadPercent < 0.5 // Slightly relaxed for more data
    )
    .slice(0, maxOptions);
  
  console.log(`📊 Testing ${sampleOptions.length} options for pattern analysis\n`);
  
  for (const option of sampleOptions) {
    const params = {
      spotPrice: option.stockPrice,
      strikePrice: option.strike,
      timeToExpiry: option.timeValue,
      riskFreeRate: 0.06, // Optimal rate
      volatility: option.marketIV,
      dividendYield: 0,
      steps: 50, // Optimal steps
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
        stockPrice: option.stockPrice,
        moneyness: option.moneyness,
        marketPrice,
        ourPrice,
        priceError,
        priceErrorPercent,
        withinSpread,
        timeValue: option.timeValue,
        marketIV: option.marketIV,
        volume: option.volume,
        bidAskSpread: option.bidAskSpread
      });
      
    } catch (error) {
      errors.push({
        symbol: option.symbol,
        error: error.message
      });
    }
  }
  
  console.log(`✅ Successfully validated ${results.length} options, ${errors.length} errors\n`);
  return results;
}

function analyzeErrorPatterns(results) {
  console.log('🔍 ERROR PATTERN ANALYSIS');
  console.log('=========================');
  
  // 1. Moneyness buckets (volatility smile analysis)
  const moneynessBuckets = {
    'Deep ITM': { min: 0, max: 0.8, results: [] },
    'ITM': { min: 0.8, max: 0.95, results: [] },
    'ATM': { min: 0.95, max: 1.05, results: [] },
    'OTM': { min: 1.05, max: 1.2, results: [] },
    'Deep OTM': { min: 1.2, max: 10, results: [] }
  };
  
  for (const result of results) {
    for (const [bucket, config] of Object.entries(moneynessBuckets)) {
      if (result.moneyness >= config.min && result.moneyness < config.max) {
        config.results.push(result);
        break;
      }
    }
  }
  
  console.log('📊 MONEYNESS ANALYSIS (Volatility Smile Check):');
  console.log('Bucket     | Count | Avg Error | Median | Within Spread | Avg IV');
  console.log('-----------|-------|-----------|--------|---------------|--------');
  
  const moneynessStats = {};
  for (const [bucket, config] of Object.entries(moneynessBuckets)) {
    if (config.results.length === 0) continue;
    
    const errors = config.results.map(r => r.priceErrorPercent);
    const avgError = errors.reduce((sum, err) => sum + err, 0) / errors.length;
    const medianError = errors.sort((a, b) => a - b)[Math.floor(errors.length / 2)];
    const withinSpread = config.results.filter(r => r.withinSpread).length;
    const withinSpreadPercent = (withinSpread / config.results.length) * 100;
    const avgIV = config.results.reduce((sum, r) => sum + r.marketIV, 0) / config.results.length;
    
    moneynessStats[bucket] = {
      count: config.results.length,
      avgError,
      medianError,
      withinSpreadPercent,
      avgIV
    };
    
    const count = String(config.results.length).padEnd(5);
    const avg = `${avgError.toFixed(2)}%`.padEnd(9);
    const median = `${medianError.toFixed(2)}%`.padEnd(6);
    const spread = `${withinSpreadPercent.toFixed(1)}%`.padEnd(13);
    const iv = `${(avgIV * 100).toFixed(1)}%`;
    console.log(`${bucket.padEnd(10)} | ${count} | ${avg} | ${median} | ${spread} | ${iv}`);
  }
  
  // 2. Time to expiry buckets
  console.log('\n⏰ TIME TO EXPIRY ANALYSIS:');
  const timeBuckets = {
    'Short (7-30d)': { min: 7, max: 30, results: [] },
    'Medium (31-90d)': { min: 31, max: 90, results: [] },
    'Long (91-180d)': { min: 91, max: 180, results: [] }
  };
  
  for (const result of results) {
    for (const [bucket, config] of Object.entries(timeBuckets)) {
      if (result.daysToExpiry >= config.min && result.daysToExpiry <= config.max) {
        config.results.push(result);
        break;
      }
    }
  }
  
  console.log('Bucket        | Count | Avg Error | Median | Within Spread');
  console.log('--------------|-------|-----------|--------|---------------');
  
  const timeStats = {};
  for (const [bucket, config] of Object.entries(timeBuckets)) {
    if (config.results.length === 0) continue;
    
    const errors = config.results.map(r => r.priceErrorPercent);
    const avgError = errors.reduce((sum, err) => sum + err, 0) / errors.length;
    const medianError = errors.sort((a, b) => a - b)[Math.floor(errors.length / 2)];
    const withinSpread = config.results.filter(r => r.withinSpread).length;
    const withinSpreadPercent = (withinSpread / config.results.length) * 100;
    
    timeStats[bucket] = {
      count: config.results.length,
      avgError,
      medianError,
      withinSpreadPercent
    };
    
    const count = String(config.results.length).padEnd(5);
    const avg = `${avgError.toFixed(2)}%`.padEnd(9);
    const median = `${medianError.toFixed(2)}%`.padEnd(6);
    const spread = `${withinSpreadPercent.toFixed(1)}%`;
    console.log(`${bucket.padEnd(13)} | ${count} | ${avg} | ${median} | ${spread}`);
  }
  
  // 3. Call vs Put analysis
  console.log('\n📞 CALL vs PUT ANALYSIS:');
  const callResults = results.filter(r => r.type === 'call');
  const putResults = results.filter(r => r.type === 'put');
  
  const callErrors = callResults.map(r => r.priceErrorPercent);
  const putErrors = putResults.map(r => r.priceErrorPercent);
  
  const callAvgError = callErrors.reduce((sum, err) => sum + err, 0) / callErrors.length;
  const putAvgError = putErrors.reduce((sum, err) => sum + err, 0) / putErrors.length;
  
  const callWithinSpread = callResults.filter(r => r.withinSpread).length;
  const putWithinSpread = putResults.filter(r => r.withinSpread).length;
  
  console.log('Type | Count | Avg Error | Within Spread');
  console.log('-----|-------|-----------|---------------');
  console.log(`Call | ${callResults.length.toString().padEnd(5)} | ${callAvgError.toFixed(2)}%      | ${((callWithinSpread/callResults.length)*100).toFixed(1)}%`);
  console.log(`Put  | ${putResults.length.toString().padEnd(5)} | ${putAvgError.toFixed(2)}%      | ${((putWithinSpread/putResults.length)*100).toFixed(1)}%`);
  
  // 4. Outlier analysis
  console.log('\n🎯 OUTLIER ANALYSIS (>10% error):');
  const outliers = results.filter(r => r.priceErrorPercent > 10);
  console.log(`Found ${outliers.length} outliers (${((outliers.length/results.length)*100).toFixed(1)}% of total)`);
  
  if (outliers.length > 0) {
    // Analyze outlier characteristics
    const outlierMoneyness = outliers.map(r => r.moneyness);
    const outlierDaysToExpiry = outliers.map(r => r.daysToExpiry);
    const outlierIV = outliers.map(r => r.marketIV);
    
    const avgOutlierMoneyness = outlierMoneyness.reduce((sum, m) => sum + m, 0) / outlierMoneyness.length;
    const avgOutlierDays = outlierDaysToExpiry.reduce((sum, d) => sum + d, 0) / outlierDaysToExpiry.length;
    const avgOutlierIV = outlierIV.reduce((sum, iv) => sum + iv, 0) / outlierIV.length;
    
    console.log(`Outlier characteristics:`);
    console.log(`- Average moneyness: ${avgOutlierMoneyness.toFixed(3)}`);
    console.log(`- Average days to expiry: ${avgOutlierDays.toFixed(1)}`);
    console.log(`- Average IV: ${(avgOutlierIV * 100).toFixed(1)}%`);
    
    console.log('\nWorst outliers:');
    const worstOutliers = outliers
      .sort((a, b) => b.priceErrorPercent - a.priceErrorPercent)
      .slice(0, 5);
    
    for (const outlier of worstOutliers) {
      console.log(`  ${outlier.symbol} ${outlier.type} $${outlier.strike} ${outlier.daysToExpiry}d: ${outlier.priceErrorPercent.toFixed(1)}% error (moneyness=${outlier.moneyness.toFixed(2)}, IV=${(outlier.marketIV*100).toFixed(1)}%)`);
    }
  }
  
  return {
    moneynessStats,
    timeStats,
    callPutStats: {
      call: { count: callResults.length, avgError: callAvgError, withinSpreadPercent: (callWithinSpread/callResults.length)*100 },
      put: { count: putResults.length, avgError: putAvgError, withinSpreadPercent: (putWithinSpread/putResults.length)*100 }
    },
    outliers: outliers.length,
    outlierPercent: (outliers.length/results.length)*100
  };
}

function runErrorPatternAnalysis() {
  console.log('🔬 Error Pattern Analysis');
  console.log('Using optimal parameters: 6.0% risk-free rate, 50 steps');
  console.log('========================================================');
  
  const marketOptions = loadMarketData();
  
  // Run validation with optimal parameters
  const results = validateWithOptimalParams(marketOptions, 1000);
  
  // Analyze patterns
  const patterns = analyzeErrorPatterns(results);
  
  // Overall statistics
  const allErrors = results.map(r => r.priceErrorPercent);
  const avgError = allErrors.reduce((sum, err) => sum + err, 0) / allErrors.length;
  const withinSpread = results.filter(r => r.withinSpread).length;
  
  console.log('\n📊 OVERALL PERFORMANCE WITH OPTIMAL PARAMETERS:');
  console.log(`Total options: ${results.length}`);
  console.log(`Average error: ${avgError.toFixed(2)}%`);
  console.log(`Within spread: ${withinSpread}/${results.length} (${((withinSpread/results.length)*100).toFixed(1)}%)`);
  
  // Save detailed analysis
  const report = {
    analysisDate: new Date().toISOString(),
    parameters: { riskFreeRate: 0.06, steps: 50 },
    totalOptions: results.length,
    avgError,
    withinSpreadPercent: (withinSpread/results.length)*100,
    patterns,
    rawResults: results.slice(0, 100) // Save first 100 for detailed analysis
  };
  
  fs.writeFileSync('error-pattern-analysis.json', JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed analysis saved to: error-pattern-analysis.json`);
  
  return report;
}

// Run the analysis
if (require.main === module) {
  try {
    runErrorPatternAnalysis();
  } catch (error) {
    console.error('\n💥 Analysis failed:', error.message);
    process.exit(1);
  }
}

module.exports = { runErrorPatternAnalysis };