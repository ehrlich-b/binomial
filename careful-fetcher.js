/**
 * Careful Yahoo Finance fetcher - slow and methodical
 * Gets just a few real options with heavy retry/backoff
 */

const https = require('https');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchSingleSymbol(symbol, attempt = 1, maxAttempts = 5) {
  const baseDelay = 5000; // 5 seconds base
  const backoffMultiplier = 2;
  
  console.log(`[Attempt ${attempt}/${maxAttempts}] Fetching ${symbol}...`);
  
  return new Promise((resolve, reject) => {
    const url = `https://query2.finance.yahoo.com/v7/finance/options/${symbol}`;
    
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }, (res) => {
      let data = '';
      
      console.log(`  Response status: ${res.statusCode}`);
      console.log(`  Response headers:`, Object.keys(res.headers));
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`  Raw response (first 200 chars): ${data.substring(0, 200)}`);
        
        // Check if we got rate limited
        if (res.statusCode === 429 || data.includes('Too Many Requests')) {
          const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
          console.log(`  ❌ Rate limited. Will retry in ${delay/1000}s...`);
          
          if (attempt < maxAttempts) {
            setTimeout(() => {
              fetchSingleSymbol(symbol, attempt + 1, maxAttempts)
                .then(resolve)
                .catch(reject);
            }, delay);
          } else {
            reject(new Error(`Rate limited after ${maxAttempts} attempts for ${symbol}`));
          }
          return;
        }
        
        // Check for other HTTP errors
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${symbol}: ${data.substring(0, 500)}`));
          return;
        }
        
        try {
          const json = JSON.parse(data);
          
          if (!json.optionChain || !json.optionChain.result || json.optionChain.result.length === 0) {
            reject(new Error(`No option chain data in response for ${symbol}`));
            return;
          }
          
          const result = json.optionChain.result[0];
          
          if (!result.quote) {
            reject(new Error(`No quote data for ${symbol}`));
            return;
          }
          
          if (!result.options || result.options.length === 0) {
            reject(new Error(`No options data for ${symbol}`));
            return;
          }
          
          console.log(`  ✓ Successfully parsed JSON for ${symbol}`);
          resolve(result);
          
        } catch (parseError) {
          reject(new Error(`JSON parse error for ${symbol}: ${parseError.message}. Raw: ${data.substring(0, 200)}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request error for ${symbol}: ${error.message}`));
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout for ${symbol}`));
    });
  });
}

function extractCleanOptions(yahooResult, symbol, maxPerSymbol = 4) {
  const stockPrice = yahooResult.quote.regularMarketPrice;
  const cleanOptions = [];
  
  console.log(`  Stock price: $${stockPrice}`);
  
  // Process first expiration only
  const expiration = yahooResult.options[0];
  const expiryDate = new Date(expiration.expirationDate * 1000);
  const daysToExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
  
  console.log(`  Expiry: ${expiryDate.toDateString()} (${daysToExpiry} days)`);
  
  let callCount = 0;
  let putCount = 0;
  
  // Get a few ATM calls
  if (expiration.calls) {
    for (const call of expiration.calls) {
      if (callCount >= maxPerSymbol / 2) break;
      
      // Look for ATM-ish calls with good data
      const moneyness = stockPrice / call.strike;
      if (moneyness > 0.95 && moneyness < 1.05 && 
          call.impliedVolatility > 0 && 
          call.bid > 0 && 
          call.ask > 0 && 
          call.lastPrice > 0) {
        
        cleanOptions.push({
          symbol,
          type: 'call',
          strike: call.strike,
          stockPrice,
          daysToExpiry,
          expiryDate: expiryDate.toISOString(),
          bid: call.bid,
          ask: call.ask,
          lastPrice: call.lastPrice,
          yahooIV: call.impliedVolatility,
          volume: call.volume || 0,
          openInterest: call.openInterest || 0
        });
        
        callCount++;
        console.log(`    ✓ Call: $${call.strike} strike, IV=${(call.impliedVolatility*100).toFixed(1)}%, Last=$${call.lastPrice}`);
      }
    }
  }
  
  // Get a few ATM puts
  if (expiration.puts) {
    for (const put of expiration.puts) {
      if (putCount >= maxPerSymbol / 2) break;
      
      // Look for ATM-ish puts with good data
      const moneyness = stockPrice / put.strike;
      if (moneyness > 0.95 && moneyness < 1.05 && 
          put.impliedVolatility > 0 && 
          put.bid > 0 && 
          put.ask > 0 && 
          put.lastPrice > 0) {
        
        cleanOptions.push({
          symbol,
          type: 'put',
          strike: put.strike,
          stockPrice,
          daysToExpiry,
          expiryDate: expiryDate.toISOString(),
          bid: put.bid,
          ask: put.ask,
          lastPrice: put.lastPrice,
          yahooIV: put.impliedVolatility,
          volume: put.volume || 0,
          openInterest: put.openInterest || 0
        });
        
        putCount++;
        console.log(`    ✓ Put: $${put.strike} strike, IV=${(put.impliedVolatility*100).toFixed(1)}%, Last=$${put.lastPrice}`);
      }
    }
  }
  
  return cleanOptions;
}

async function fetchCleanOptionsData() {
  console.log('🐌 Careful Yahoo Finance Options Fetcher');
  console.log('========================================');
  console.log('Going VERY slowly to avoid rate limits...\n');
  
  const symbols = ['SPY', 'QQQ', 'AAPL'];
  const allCleanOptions = [];
  const errors = [];
  
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    
    try {
      console.log(`\n[${i+1}/${symbols.length}] Processing ${symbol}:`);
      
      const yahooResult = await fetchSingleSymbol(symbol);
      const cleanOptions = extractCleanOptions(yahooResult, symbol);
      
      if (cleanOptions.length > 0) {
        allCleanOptions.push(...cleanOptions);
        console.log(`  ✅ Got ${cleanOptions.length} clean options for ${symbol}`);
      } else {
        console.log(`  ⚠️ No suitable options found for ${symbol}`);
      }
      
      // Long delay between symbols
      if (i < symbols.length - 1) {
        console.log(`  💤 Waiting 10 seconds before next symbol...`);
        await sleep(10000);
      }
      
    } catch (error) {
      console.log(`  ❌ Failed to get ${symbol}: ${error.message}`);
      errors.push({ symbol, error: error.message });
    }
  }
  
  // Save results
  const results = {
    fetchTime: new Date().toISOString(),
    totalOptions: allCleanOptions.length,
    cleanOptions: allCleanOptions,
    errors
  };
  
  fs.writeFileSync('real-yahoo-options.json', JSON.stringify(results, null, 2));
  
  console.log(`\n📊 RESULTS:`);
  console.log(`✅ Successfully fetched: ${allCleanOptions.length} real options`);
  console.log(`❌ Errors: ${errors.length}`);
  console.log(`💾 Saved to: real-yahoo-options.json`);
  
  if (allCleanOptions.length > 0) {
    console.log(`\n📋 Sample of what we got:`);
    for (const opt of allCleanOptions.slice(0, 3)) {
      console.log(`${opt.symbol} ${opt.type} $${opt.strike} ${opt.daysToExpiry}d IV=${(opt.yahooIV*100).toFixed(1)}% Last=$${opt.lastPrice}`);
    }
  }
  
  return results;
}

// Run it
if (require.main === module) {
  fetchCleanOptionsData()
    .then(results => {
      if (results.totalOptions > 0) {
        console.log('\n🎉 SUCCESS! We have real Yahoo Finance options data to validate against!');
      } else {
        console.log('\n💔 No data retrieved. Yahoo Finance is blocking us completely.');
      }
    })
    .catch(error => {
      console.error('\n💥 Fetcher crashed:', error.message);
    });
}

module.exports = { fetchCleanOptionsData };