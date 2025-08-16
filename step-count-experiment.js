/**
 * Binomial Tree Step Count Experiment
 * Test different step counts: 50, 100, 200, 500 steps
 * Using optimal 6.0% risk-free rate from previous experiment
 */

const fs = require('fs');
const BinomialOptions = require('./binomial-options.js');

function loadMarketData() {
  const data = JSON.parse(fs.readFileSync('market-data-clean.json', 'utf8'));
  return data.cleanOptions;
}

function validateWithSteps(options, steps, maxOptions = 200) {
  console.log(`\n🧪 Testing ${steps} steps`);
  console.log('========================');
  
  const results = [];
  const errors = [];
  const timings = [];
  
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
      riskFreeRate: 0.06, // Use optimal 6% rate
      volatility: option.marketIV,
      dividendYield: 0,
      steps: steps, // ← This is what we're testing
      optionType: option.type,
      exerciseStyle: 'american'
    };
    
    try {
      const startTime = process.hrtime.bigint();
      const ourPrice = BinomialOptions.price(params);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
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
        duration
      });
      
      timings.push(duration);
      
    } catch (error) {
      errors.push({
        symbol: option.symbol,
        error: error.message
      });
    }
  }
  
  // Calculate statistics
  if (results.length === 0) {
    return { steps, avgError: 999, medianError: 999, withinSpreadPercent: 0, avgTime: 999, results: [] };
  }
  
  const priceErrors = results.map(r => r.priceErrorPercent);
  const avgError = priceErrors.reduce((sum, err) => sum + err, 0) / priceErrors.length;
  const medianError = priceErrors.sort((a, b) => a - b)[Math.floor(priceErrors.length / 2)];
  const withinSpreadCount = results.filter(r => r.withinSpread).length;
  const withinSpreadPercent = (withinSpreadCount / results.length) * 100;
  const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
  
  const under5Percent = priceErrors.filter(err => err < 5).length;
  const under5PercentRate = (under5Percent / results.length) * 100;
  
  const under2Percent = priceErrors.filter(err => err < 2).length;
  const under2PercentRate = (under2Percent / results.length) * 100;
  
  console.log(`📊 Results: ${results.length} options tested`);
  console.log(`📈 Average error: ${avgError.toFixed(2)}%`);
  console.log(`📊 Median error: ${medianError.toFixed(2)}%`);
  console.log(`✅ Within spread: ${withinSpreadCount}/${results.length} (${withinSpreadPercent.toFixed(1)}%)`);
  console.log(`🎯 Under 5% error: ${under5Percent}/${results.length} (${under5PercentRate.toFixed(1)}%)`);
  console.log(`🌟 Under 2% error: ${under2Percent}/${results.length} (${under2PercentRate.toFixed(1)}%)`);
  console.log(`⏱️  Average time: ${avgTime.toFixed(2)}ms per option`);
  
  return {
    steps,
    avgError,
    medianError,
    withinSpreadPercent,
    under5PercentRate,
    under2PercentRate,
    avgTime,
    totalTested: results.length,
    errors: errors.length,
    results: results.slice(0, 5) // Keep first 5 for analysis
  };
}

function runStepCountExperiment() {
  console.log('🔬 Binomial Tree Step Count Experiment');
  console.log('Using optimal 6.0% risk-free rate');
  console.log('Testing steps: 50, 100, 200, 500');
  console.log('=====================================');
  
  const marketOptions = loadMarketData();
  console.log(`📊 Loaded ${marketOptions.length} market options\n`);
  
  // Test different step counts
  const stepsToTest = [50, 100, 200, 500];
  const experimentResults = [];
  
  for (const steps of stepsToTest) {
    const result = validateWithSteps(marketOptions, steps, 300);
    experimentResults.push(result);
  }
  
  // Analyze results
  console.log('\n📋 EXPERIMENT SUMMARY');
  console.log('=====================');
  console.log('Steps | Avg Error | Median | Within Spread | Under 5% | Under 2% | Avg Time');
  console.log('------|-----------|--------|---------------|----------|----------|----------');
  
  for (const result of experimentResults) {
    const steps = String(result.steps).padEnd(5);
    const avg = `${result.avgError.toFixed(2)}%`.padEnd(9);
    const median = `${result.medianError.toFixed(2)}%`.padEnd(6);
    const spread = `${result.withinSpreadPercent.toFixed(1)}%`.padEnd(13);
    const under5 = `${result.under5PercentRate.toFixed(1)}%`.padEnd(8);
    const under2 = `${result.under2PercentRate.toFixed(1)}%`.padEnd(8);
    const time = `${result.avgTime.toFixed(1)}ms`;
    console.log(`${steps} | ${avg} | ${median} | ${spread} | ${under5} | ${under2} | ${time}`);
  }
  
  // Find optimal step count
  const bestByAccuracy = experimentResults.reduce((best, current) => 
    current.avgError < best.avgError ? current : best
  );
  
  const bestBySpread = experimentResults.reduce((best, current) => 
    current.withinSpreadPercent > best.withinSpreadPercent ? current : best
  );
  
  // Calculate accuracy per time trade-off
  const efficiencyScores = experimentResults.map(result => ({
    steps: result.steps,
    score: (100 - result.avgError) / result.avgTime, // Higher is better
    avgError: result.avgError,
    avgTime: result.avgTime
  }));
  
  const bestEfficiency = efficiencyScores.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  
  console.log('\n🏆 OPTIMAL CONFIGURATIONS:');
  console.log(`📉 Best accuracy: ${bestByAccuracy.steps} steps (${bestByAccuracy.avgError.toFixed(2)}% error)`);
  console.log(`📊 Best spread performance: ${bestBySpread.steps} steps (${bestBySpread.withinSpreadPercent.toFixed(1)}% within)`);
  console.log(`⚡ Best efficiency: ${bestEfficiency.steps} steps (${bestEfficiency.avgError.toFixed(2)}% error, ${bestEfficiency.avgTime.toFixed(1)}ms)`);
  
  // Check for convergence
  console.log('\n🔍 CONVERGENCE ANALYSIS:');
  for (let i = 1; i < experimentResults.length; i++) {
    const current = experimentResults[i];
    const previous = experimentResults[i-1];
    const improvement = previous.avgError - current.avgError;
    const timeIncrease = current.avgTime / previous.avgTime;
    
    console.log(`${previous.steps} → ${current.steps} steps: ${improvement.toFixed(3)}% improvement, ${timeIncrease.toFixed(1)}x slower`);
  }
  
  // Look for diminishing returns
  const returns = [];
  for (let i = 1; i < experimentResults.length; i++) {
    const current = experimentResults[i];
    const previous = experimentResults[i-1];
    const improvement = previous.avgError - current.avgError;
    const timeIncrease = current.avgTime - previous.avgTime;
    const returnRatio = improvement / timeIncrease;
    returns.push({
      from: previous.steps,
      to: current.steps,
      improvement,
      timeIncrease,
      returnRatio
    });
  }
  
  console.log('\n📈 DIMINISHING RETURNS:');
  for (const ret of returns) {
    console.log(`${ret.from} → ${ret.to}: ${ret.improvement.toFixed(3)}% per ${ret.timeIncrease.toFixed(1)}ms = ${(ret.returnRatio * 1000).toFixed(3)} improvement/second`);
  }
  
  // Save detailed results
  const report = {
    experimentDate: new Date().toISOString(),
    riskFreeRate: 0.06,
    stepsToTest,
    results: experimentResults,
    bestConfigurations: {
      byAccuracy: bestByAccuracy,
      bySpread: bestBySpread,
      byEfficiency: bestEfficiency
    },
    convergenceAnalysis: returns,
    recommendation: {
      optimalSteps: bestEfficiency.steps,
      reasoning: `Best balance of accuracy (${bestEfficiency.avgError.toFixed(2)}% error) and speed (${bestEfficiency.avgTime.toFixed(1)}ms)`
    }
  };
  
  fs.writeFileSync('step-count-experiment.json', JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed results saved to: step-count-experiment.json`);
  
  return report;
}

// Run the experiment
if (require.main === module) {
  try {
    runStepCountExperiment();
  } catch (error) {
    console.error('\n💥 Experiment failed:', error.message);
    process.exit(1);
  }
}

module.exports = { runStepCountExperiment };