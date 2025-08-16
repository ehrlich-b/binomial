/**
 * PROPER Validation: Test if our binomial model matches market IV-to-price conversion
 * 
 * This tests whether our model produces the same price as the market when given:
 * - Market's implied volatility
 * - Same underlying parameters
 * 
 * If our model is correct, using market IV should give us market price (within bid-ask spread)
 */

const BinomialOptions = require('./binomial-options.js');

async function fetchRealYahooData(symbol, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const https = require('https');
      
      return new Promise((resolve, reject) => {
        console.log(`Fetching real ${symbol} data (attempt ${attempt + 1})...`);
        
        const url = `https://query2.finance.yahoo.com/v7/finance/options/${symbol}`;
        
        https.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              const result = json.optionChain.result[0];
              
              if (!result || !result.options) {
                throw new Error('No options data');
              }

              const stockPrice = result.quote.regularMarketPrice;
              const realOptions = [];
              
              // Process first expiration only to avoid rate limits
              const expiration = result.options[0];
              const expiryDate = new Date(expiration.expirationDate * 1000);
              const daysToExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
              
              // Process calls with valid IV and prices
              if (expiration.calls) {
                for (const call of expiration.calls) {
                  if (call.impliedVolatility > 0 && 
                      call.bid > 0 && 
                      call.ask > 0 && 
                      call.lastPrice > 0) {
                    realOptions.push({
                      symbol,
                      type: 'call',
                      strike: call.strike,
                      stockPrice,
                      daysToExpiry,
                      marketPrice: call.lastPrice,
                      bid: call.bid,
                      ask: call.ask,
                      marketIV: call.impliedVolatility,
                      volume: call.volume || 0,
                      openInterest: call.openInterest || 0
                    });
                  }
                }
              }
              
              // Process puts
              if (expiration.puts) {
                for (const put of expiration.puts) {
                  if (put.impliedVolatility > 0 && 
                      put.bid > 0 && 
                      put.ask > 0 && 
                      put.lastPrice > 0) {
                    realOptions.push({
                      symbol,
                      type: 'put',
                      strike: put.strike,
                      stockPrice,
                      daysToExpiry,
                      marketPrice: put.lastPrice,
                      bid: put.bid,
                      ask: put.ask,
                      marketIV: put.impliedVolatility,
                      volume: put.volume || 0,
                      openInterest: put.openInterest || 0
                    });
                  }
                }
              }
              
              console.log(`✓ Found ${realOptions.length} real options for ${symbol}`);
              resolve(realOptions);
              
            } catch (e) {
              reject(e);
            }
          });
        }).on('error', reject);
      });
      
    } catch (error) {
      console.warn(`Attempt ${attempt + 1} failed:`, error.message);
      if (attempt < maxRetries - 1) {
        console.log('Waiting 3 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        throw error;
      }
    }
  }
}

function validateWithMarketIV(realOptions, riskFreeRate = 0.0423) {
  console.log('\n🧪 PROPER VALIDATION: Market IV → Our Price vs Market Price');
  console.log('============================================================');
  
  const results = [];
  
  for (const option of realOptions) {
    try {
      const params = {
        spotPrice: option.stockPrice,
        strikePrice: option.strike,
        timeToExpiry: BinomialOptions.daysToYears(option.daysToExpiry, 'trading'),
        riskFreeRate,
        volatility: option.marketIV, // ← Using MARKET's implied volatility
        dividendYield: option.symbol === 'SPY' ? 0.013 : 0.005,
        optionType: option.type,
        exerciseStyle: 'american'
      };
      
      // Calculate our model price using market's IV
      const ourPrice = BinomialOptions.price(params);
      
      // Compare to actual market price
      const priceDiff = ourPrice - option.marketPrice;
      const percentError = (priceDiff / option.marketPrice) * 100;
      const withinSpread = ourPrice >= option.bid && ourPrice <= option.ask;
      
      results.push({
        ...option,
        ourPrice,
        priceDiff,
        percentError,
        withinSpread,
        params
      });
      
    } catch (error) {
      console.error(`Error with ${option.symbol} ${option.strike} ${option.type}:`, error.message);
    }
  }
  
  return results;
}

function analyzeResults(results) {
  console.log('\n📊 VALIDATION RESULTS');
  console.log('===================');
  
  const valid = results.filter(r => !isNaN(r.percentError));
  
  if (valid.length === 0) {
    console.log('❌ No valid results to analyze');
    return;
  }
  
  const avgError = valid.reduce((sum, r) => sum + Math.abs(r.percentError), 0) / valid.length;
  const withinSpread = valid.filter(r => r.withinSpread).length;
  const smallErrors = valid.filter(r => Math.abs(r.percentError) < 5).length;
  
  console.log(`Total Options: ${valid.length}`);
  console.log(`Average Absolute Error: ${avgError.toFixed(2)}%`);
  console.log(`Within Bid-Ask Spread: ${withinSpread}/${valid.length} (${(withinSpread/valid.length*100).toFixed(1)}%)`);
  console.log(`< 5% Error: ${smallErrors}/${valid.length} (${(smallErrors/valid.length*100).toFixed(1)}%)`);
  
  console.log('\n📋 Sample Results:');
  console.log('Symbol | Type | Strike | Market$ | Our$ | Diff$ | Error% | In Spread?');
  console.log('-'.repeat(75));
  
  // Show best and worst examples
  const sorted = valid.sort((a, b) => Math.abs(a.percentError) - Math.abs(b.percentError));
  const samples = [...sorted.slice(0, 5), ...sorted.slice(-3)];
  
  for (const r of samples) {
    console.log(
      `${r.symbol.padEnd(6)} | ${r.type.padEnd(4)} | $${r.strike.toString().padEnd(6)} | ` +
      `$${r.marketPrice.toFixed(2).padEnd(6)} | $${r.ourPrice.toFixed(2).padEnd(5)} | ` +
      `${r.priceDiff >= 0 ? '+' : ''}${r.priceDiff.toFixed(2).padEnd(6)} | ` +
      `${r.percentError.toFixed(1).padEnd(6)}% | ${r.withinSpread ? '✓' : '✗'}`
    );
  }
  
  // Analysis of what the errors mean
  console.log('\n🔍 WHAT THESE ERRORS MEAN:');
  console.log('===========================');
  
  if (avgError < 5) {
    console.log('✅ EXCELLENT: Our binomial model closely matches market IV-to-price conversion');
    console.log('   This means our model is correctly implementing the same pricing logic as the market');
  } else if (avgError < 10) {
    console.log('✅ GOOD: Our model is reasonably accurate with some differences');
    console.log('   Small differences could be due to:');
    console.log('   - Dividend timing differences');
    console.log('   - Different day-count conventions');
    console.log('   - Market microstructure effects');
  } else {
    console.log('⚠️  NEEDS INVESTIGATION: Larger differences suggest:');
    console.log('   - Our model parameters may need adjustment');
    console.log('   - Different time conventions (trading vs calendar days)');
    console.log('   - Interest rate or dividend assumptions');
    console.log('   - American vs European exercise differences');
  }
  
  return {
    avgError,
    withinSpreadPct: (withinSpread/valid.length*100),
    smallErrorPct: (smallErrors/valid.length*100)
  };
}

async function runProperValidation() {
  console.log('🎯 PROPER OPTIONS VALIDATION');
  console.log('============================');
  console.log('Testing: Market IV → Our Price vs Market Price\n');
  
  try {
    // Try to get real Yahoo data
    const symbols = ['SPY']; // Start with just SPY to avoid rate limits
    let allResults = [];
    
    for (const symbol of symbols) {
      try {
        const realOptions = await fetchRealYahooData(symbol);
        
        if (realOptions.length > 0) {
          const results = validateWithMarketIV(realOptions);
          allResults = allResults.concat(results);
          
          // Small delay to be respectful
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Failed to get real data for ${symbol}:`, error.message);
      }
    }
    
    if (allResults.length > 0) {
      const summary = analyzeResults(allResults);
      
      // Save results
      const fs = require('fs');
      fs.writeFileSync('proper-validation-results.json', JSON.stringify(allResults, null, 2));
      console.log('\n✓ Results saved to proper-validation-results.json');
      
      return summary;
    } else {
      console.log('❌ Could not get real market data. Using explanation instead...');
      explainValidationConcept();
    }
    
  } catch (error) {
    console.error('Validation failed:', error.message);
    explainValidationConcept();
  }
}

function explainValidationConcept() {
  console.log('\n🎓 VALIDATION CONCEPT EXPLANATION');
  console.log('=================================');
  console.log(`
WHAT WE'RE TESTING:
------------------
✅ CORRECT: Market IV → Our Model → Price vs Market Price
❌ WRONG:   Our IV → Our Model → Price vs Synthetic Price

WHY THIS MATTERS:
----------------
- The market already "solved" for implied volatility
- If we use that SAME IV, we should get the SAME price
- This tests if our binomial model matches market pricing logic

EXPECTED RESULTS:
----------------
- Small errors (< 5%): Model is working correctly
- Large errors (> 10%): Something wrong with our model parameters
- Within bid-ask spread: Perfect validation

WHAT ERRORS TELL US:
-------------------
- 2% error: Excellent - model matches market
- 8% error: Good - minor parameter differences  
- 20% error: Problem - wrong day convention, rates, or model bug
  `);
}

// Run the validation
if (require.main === module) {
  runProperValidation().catch(console.error);
}

module.exports = { validateWithMarketIV, fetchRealYahooData };