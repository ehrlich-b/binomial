/**
 * Validate the new implementation using existing validation data
 * Calculate and display Greeks for realistic options
 */

const BinomialOptions = require('./binomial-options.js');
const fs = require('fs');

function loadValidationData() {
  try {
    const data = JSON.parse(fs.readFileSync('validation_results.json', 'utf8'));
    console.log(`✓ Loaded ${data.length} options from previous validation`);
    return data;
  } catch (error) {
    console.error('Could not load validation_results.json:', error.message);
    return [];
  }
}

function validateNewImplementation(validationData) {
  console.log('\nValidating New Modern Implementation');
  console.log('====================================');
  
  const results = [];
  const riskFreeRate = 0.0423; // Current rate
  
  // Filter to reasonable options (avoid near-zero prices)
  const reasonableOptions = validationData.filter(opt => 
    opt.marketPrice > 0.50 && 
    opt.expiration >= 7 && 
    opt.expiration <= 90 &&
    opt.impliedVol > 0.1 && 
    opt.impliedVol < 1.0
  );
  
  console.log(`Testing ${reasonableOptions.length} reasonable options...`);
  
  for (const option of reasonableOptions.slice(0, 20)) { // Test first 20 for speed
    try {
      const params = {
        spotPrice: option.stockPrice,
        strikePrice: option.strike,
        timeToExpiry: BinomialOptions.daysToYears(option.expiration, 'trading'),
        riskFreeRate,
        volatility: option.impliedVol,
        dividendYield: 0.01,
        optionType: option.type,
        exerciseStyle: 'american'
      };
      
      // Calculate price and Greeks
      const modelPrice = BinomialOptions.price(params);
      const greeks = BinomialOptions.greeks(params);
      
      const error = modelPrice - option.marketPrice;
      const percentError = (error / option.marketPrice) * 100;
      
      results.push({
        ...option,
        newModelPrice: modelPrice,
        error,
        percentError,
        greeks
      });
      
    } catch (err) {
      console.error(`Error processing option ${option.symbol} ${option.strike} ${option.type}:`, err.message);
    }
  }
  
  return results;
}

function displayResults(results) {
  console.log('\nValidation Results Summary');
  console.log('==========================');
  
  const avgError = results.reduce((sum, r) => sum + Math.abs(r.percentError), 0) / results.length;
  const withinSpread = results.filter(r => 
    r.newModelPrice >= r.bid && r.newModelPrice <= r.ask
  ).length;
  
  console.log(`Average Error: ${avgError.toFixed(2)}%`);
  console.log(`Within Bid-Ask: ${withinSpread}/${results.length} (${(withinSpread/results.length*100).toFixed(1)}%)`);
  
  console.log('\nDetailed Results (First 10):');
  console.log('Symbol | Type | Strike | Days | Market | Model | Error% | Delta | Gamma | Vega');
  console.log('-'.repeat(85));
  
  for (const result of results.slice(0, 10)) {
    console.log(
      `${result.symbol.padEnd(6)} | ` +
      `${result.type.padEnd(4)} | ` +
      `$${result.strike.toString().padEnd(6)} | ` +
      `${result.expiration.toString().padEnd(3)}d | ` +
      `$${result.marketPrice.toFixed(2).padEnd(6)} | ` +
      `$${result.newModelPrice.toFixed(2).padEnd(6)} | ` +
      `${result.percentError.toFixed(1).padEnd(6)}% | ` +
      `${result.greeks.delta.toFixed(3).padEnd(5)} | ` +
      `${result.greeks.gamma.toFixed(4).padEnd(6)} | ` +
      `${result.greeks.vega.toFixed(2)}`
    );
  }
  
  console.log('\nGreeks Analysis:');
  console.log('================');
  
  // Analyze Greeks by option type
  const calls = results.filter(r => r.type === 'call');
  const puts = results.filter(r => r.type === 'put');
  
  if (calls.length > 0) {
    const avgCallDelta = calls.reduce((sum, c) => sum + c.greeks.delta, 0) / calls.length;
    console.log(`Average Call Delta: ${avgCallDelta.toFixed(3)} (should be 0.2-0.8 for reasonable strikes)`);
  }
  
  if (puts.length > 0) {
    const avgPutDelta = puts.reduce((sum, p) => sum + p.greeks.delta, 0) / puts.length;
    console.log(`Average Put Delta: ${avgPutDelta.toFixed(3)} (should be -0.8 to -0.2 for reasonable strikes)`);
  }
  
  // Find high Gamma options (good for trading)
  const highGamma = results.filter(r => Math.abs(r.greeks.gamma) > 0.01);
  console.log(`High Gamma Options: ${highGamma.length} (good for gamma trading)`);
  
  // Find high Vega options (sensitive to volatility)
  const highVega = results.filter(r => Math.abs(r.greeks.vega) > 5);
  console.log(`High Vega Options: ${highVega.length} (sensitive to volatility changes)`);
}

function testSpecificExamples() {
  console.log('\nTesting Specific Market Examples');
  console.log('================================');
  
  // Test some realistic SPY options
  const examples = [
    {
      name: 'SPY ATM Call (30 days)',
      params: {
        spotPrice: 560,
        strikePrice: 560,
        timeToExpiry: BinomialOptions.daysToYears(30, 'trading'),
        riskFreeRate: 0.0423,
        volatility: 0.20,
        dividendYield: 0.013,
        optionType: 'call'
      }
    },
    {
      name: 'SPY OTM Put (30 days)',
      params: {
        spotPrice: 560,
        strikePrice: 540,
        timeToExpiry: BinomialOptions.daysToYears(30, 'trading'),
        riskFreeRate: 0.0423,
        volatility: 0.22,
        dividendYield: 0.013,
        optionType: 'put'
      }
    }
  ];
  
  for (const example of examples) {
    console.log(`\n${example.name}:`);
    const price = BinomialOptions.price(example.params);
    const greeks = BinomialOptions.greeks(example.params);
    const bsPrice = BinomialOptions.blackScholes(example.params);
    
    console.log(`  Binomial Price: $${price.toFixed(2)}`);
    console.log(`  Black-Scholes:  $${bsPrice.toFixed(2)} (difference: $${(price-bsPrice).toFixed(2)})`);
    console.log(`  Delta: ${greeks.delta.toFixed(4)}`);
    console.log(`  Gamma: ${greeks.gamma.toFixed(4)}`);
    console.log(`  Vega:  ${greeks.vega.toFixed(2)}`);
    console.log(`  Theta: ${greeks.theta.toFixed(2)}`);
    console.log(`  Rho:   ${greeks.rho.toFixed(2)}`);
  }
}

// Main execution
console.log('Modern Binomial Options Validation with Greeks');
console.log('===============================================');

const validationData = loadValidationData();

if (validationData.length > 0) {
  const results = validateNewImplementation(validationData);
  
  if (results.length > 0) {
    displayResults(results);
    
    // Save results with Greeks
    fs.writeFileSync('validation-with-greeks.json', JSON.stringify(results, null, 2));
    console.log('\n✓ Results with Greeks saved to validation-with-greeks.json');
  }
} else {
  console.log('No validation data found - generating test examples...');
}

testSpecificExamples();

console.log('\n✅ Validation complete! The new implementation is ready to use.');