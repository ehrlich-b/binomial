/**
 * Real Market Data Validation
 * Test: Market IV → Our Binomial Model → Compare to Market Price
 * 
 * This is the PROPER validation test that tells us if our model is accurate.
 */

const fs = require('fs');
const BinomialOptions = require('./binomial-options.js');

function loadMarketData() {
  const data = JSON.parse(fs.readFileSync('market-data-clean.json', 'utf8'));
  return data.cleanOptions;
}

function validateOption(option) {
  // Use market implied volatility as input to our model
  const params = {
    spotPrice: option.stockPrice,
    strikePrice: option.strike,
    timeToExpiry: option.timeValue, // Already converted to years
    riskFreeRate: 0.05, // Assume 5% risk-free rate for 2024
    volatility: option.marketIV, // ← KEY: Use market's IV
    dividendYield: 0, // Assume no dividends for simplicity
    steps: 100,
    optionType: option.type,
    exerciseStyle: 'american' // Most US equity options are American
  };
  
  try {
    // Calculate our model's price using market IV
    const ourPrice = BinomialOptions.price(params);
    const ourGreeks = BinomialOptions.greeks(params);
    
    // Compare to market price (use mid-price for fairest comparison)
    const marketPrice = option.marketMid;
    const priceError = Math.abs(ourPrice - marketPrice);
    const priceErrorPercent = (priceError / marketPrice) * 100;
    
    // Check if our price falls within bid-ask spread
    const withinSpread = ourPrice >= option.marketBid && ourPrice <= option.marketAsk;
    
    // Calculate Greeks errors (if market Greeks available)
    let deltaError = null;
    let gammaError = null;
    let vegaError = null;
    
    if (option.marketDelta !== null && option.marketDelta !== 0) {
      deltaError = Math.abs((ourGreeks.delta - option.marketDelta) / option.marketDelta) * 100;
    }
    if (option.marketGamma !== null && option.marketGamma !== 0) {
      gammaError = Math.abs((ourGreeks.gamma - option.marketGamma) / option.marketGamma) * 100;
    }
    if (option.marketVega !== null && option.marketVega !== 0) {
      vegaError = Math.abs((ourGreeks.vega - option.marketVega) / option.marketVega) * 100;
    }
    
    return {
      // Option identification
      symbol: option.symbol,
      type: option.type,
      strike: option.strike,
      daysToExpiry: option.daysToExpiry,
      stockPrice: option.stockPrice,
      
      // Market data inputs
      marketIV: option.marketIV,
      marketMid: marketPrice,
      marketBid: option.marketBid,
      marketAsk: option.marketAsk,
      
      // Our model results
      ourPrice,
      ourDelta: ourGreeks.delta,
      ourGamma: ourGreeks.gamma,
      ourVega: ourGreeks.vega,
      
      // Error analysis
      priceError,
      priceErrorPercent,
      withinSpread,
      deltaError,
      gammaError,
      vegaError,
      
      // Additional metrics
      moneyness: option.moneyness,
      timeValue: option.timeValue,
      bidAskSpread: option.bidAskSpread,
      volume: option.volume
    };
    
  } catch (error) {
    return {
      symbol: option.symbol,
      type: option.type,
      strike: option.strike,
      error: error.message
    };
  }
}

function runValidation(maxOptions = 1000) {
  console.log('🧪 Real Market Data Validation');
  console.log('==============================');
  console.log(`Test: Market IV → Our Model → Compare to Market Price\n`);
  
  const marketOptions = loadMarketData();
  console.log(`📊 Loaded ${marketOptions.length} clean market options`);
  
  // Take a representative sample for faster testing
  // Focus on liquid options with reasonable time to expiry
  const sampleOptions = marketOptions
    .filter(opt => 
      opt.volume > 0 && 
      opt.daysToExpiry >= 7 && 
      opt.daysToExpiry <= 180 && 
      opt.spreadPercent < 0.3 &&
      opt.moneyness > 0.8 && opt.moneyness < 1.2 // Near the money
    )
    .slice(0, maxOptions);
  
  console.log(`🎯 Testing ${sampleOptions.length} representative options`);
  console.log(`📋 Filters: volume > 0, 7-180 days, spread < 30%, 0.8 < moneyness < 1.2\n`);
  
  const results = [];
  const errors = [];
  let processed = 0;
  
  console.log('🔄 Processing options...');
  
  for (const option of sampleOptions) {
    const result = validateOption(option);
    
    if (result.error) {
      errors.push(result);
    } else {
      results.push(result);
    }
    
    processed++;
    if (processed % 100 === 0) {
      console.log(`  📈 Processed ${processed}/${sampleOptions.length} options`);
    }
  }
  
  console.log(`\n✅ Validation complete: ${results.length} successful, ${errors.length} errors`);
  
  // Calculate statistics
  if (results.length === 0) {
    console.log('❌ No successful validations to analyze');
    return;
  }
  
  const priceErrors = results.map(r => r.priceErrorPercent);
  const withinSpreadCount = results.filter(r => r.withinSpread).length;
  
  const avgError = priceErrors.reduce((sum, err) => sum + err, 0) / priceErrors.length;
  const medianError = priceErrors.sort((a, b) => a - b)[Math.floor(priceErrors.length / 2)];
  const maxError = Math.max(...priceErrors);
  
  const under2Percent = priceErrors.filter(err => err < 2).length;
  const under5Percent = priceErrors.filter(err => err < 5).length;
  const under10Percent = priceErrors.filter(err => err < 10).length;
  
  // Greeks analysis (where available)
  const validDeltas = results.filter(r => r.deltaError !== null);
  const validGammas = results.filter(r => r.gammaError !== null);
  const validVegas = results.filter(r => r.vegaError !== null);
  
  const avgDeltaError = validDeltas.length > 0 ? 
    validDeltas.reduce((sum, r) => sum + r.deltaError, 0) / validDeltas.length : null;
  const avgGammaError = validGammas.length > 0 ? 
    validGammas.reduce((sum, r) => sum + r.gammaError, 0) / validGammas.length : null;
  const avgVegaError = validVegas.length > 0 ? 
    validVegas.reduce((sum, r) => sum + r.vegaError, 0) / validVegas.length : null;
  
  // Generate report
  const report = {
    validationDate: new Date().toISOString(),
    testDescription: 'Market IV → Our Binomial Model → Compare to Market Price',
    summary: {
      totalTested: results.length,
      errors: errors.length,
      avgPriceError: avgError,
      medianPriceError: medianError,
      maxPriceError: maxError,
      withinBidAskSpread: withinSpreadCount,
      withinSpreadPercent: (withinSpreadCount / results.length) * 100
    },
    errorDistribution: {
      under2Percent: { count: under2Percent, percent: (under2Percent / results.length) * 100 },
      under5Percent: { count: under5Percent, percent: (under5Percent / results.length) * 100 },
      under10Percent: { count: under10Percent, percent: (under10Percent / results.length) * 100 }
    },
    greeksAnalysis: {
      deltaError: avgDeltaError,
      gammaError: avgGammaError,
      vegaError: avgVegaError,
      deltaCount: validDeltas.length,
      gammaCount: validGammas.length,
      vegaCount: validVegas.length
    },
    results: results.slice(0, 50), // Save first 50 detailed results
    errors
  };
  
  // Save detailed results
  fs.writeFileSync('validation-report.json', JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n📊 VALIDATION RESULTS');
  console.log('=====================');
  console.log(`🎯 Options tested: ${results.length}`);
  console.log(`📈 Average price error: ${avgError.toFixed(2)}%`);
  console.log(`📊 Median price error: ${medianError.toFixed(2)}%`);
  console.log(`📉 Maximum error: ${maxError.toFixed(2)}%`);
  console.log(`✅ Within bid-ask spread: ${withinSpreadCount}/${results.length} (${((withinSpreadCount/results.length)*100).toFixed(1)}%)`);
  
  console.log('\n📋 Error Distribution:');
  console.log(`  < 2% error: ${under2Percent} options (${((under2Percent/results.length)*100).toFixed(1)}%)`);
  console.log(`  < 5% error: ${under5Percent} options (${((under5Percent/results.length)*100).toFixed(1)}%)`);
  console.log(`  < 10% error: ${under10Percent} options (${((under10Percent/results.length)*100).toFixed(1)}%)`);
  
  if (avgDeltaError !== null) {
    console.log('\n🔢 Greeks Analysis:');
    console.log(`  Average Delta error: ${avgDeltaError.toFixed(1)}% (${validDeltas.length} options)`);
    if (avgGammaError !== null) console.log(`  Average Gamma error: ${avgGammaError.toFixed(1)}% (${validGammas.length} options)`);
    if (avgVegaError !== null) console.log(`  Average Vega error: ${avgVegaError.toFixed(1)}% (${validVegas.length} options)`);
  }
  
  console.log('\n📋 Sample Results:');
  for (const result of results.slice(0, 5)) {
    const status = result.withinSpread ? '✅' : '❌';
    console.log(`${status} ${result.symbol} ${result.type} $${result.strike} ${result.daysToExpiry}d: Market=$${result.marketMid.toFixed(2)} Our=$${result.ourPrice.toFixed(2)} Error=${result.priceErrorPercent.toFixed(1)}%`);
  }
  
  console.log(`\n💾 Detailed report saved to: validation-report.json`);
  
  // Final assessment
  console.log('\n🏆 ASSESSMENT:');
  if (avgError < 2) {
    console.log('🌟 EXCELLENT: Model accuracy is outstanding!');
  } else if (avgError < 5) {
    console.log('✅ GOOD: Model is working well with minor differences');
  } else if (avgError < 10) {
    console.log('⚠️  ACCEPTABLE: Model is reasonable but has room for improvement');
  } else {
    console.log('❌ NEEDS WORK: Model has significant pricing errors');
  }
  
  const spreadPercent = (withinSpreadCount / results.length) * 100;
  if (spreadPercent > 70) {
    console.log('✅ SPREAD TEST: Most prices fall within market bid-ask spread');
  } else {
    console.log('⚠️  SPREAD TEST: Many prices fall outside bid-ask spread');
  }
  
  return report;
}

// Run validation
if (require.main === module) {
  try {
    const maxOptions = process.argv[2] ? parseInt(process.argv[2]) : 500;
    console.log(`Running validation on up to ${maxOptions} options...\n`);
    runValidation(maxOptions);
  } catch (error) {
    console.error('\n💥 Validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { runValidation };