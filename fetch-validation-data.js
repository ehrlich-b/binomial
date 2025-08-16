/**
 * Fetch real market data for validation
 * Saves data locally to avoid repeated API calls
 */

const https = require('https');
const fs = require('fs');

async function fetchYahooOptions(symbol) {
  return new Promise((resolve, reject) => {
    const url = `https://query2.finance.yahoo.com/v7/finance/options/${symbol}`;
    
    console.log(`Fetching options data for ${symbol}...`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const result = json.optionChain.result[0];
          
          if (!result || !result.options || result.options.length === 0) {
            reject(new Error(`No options data found for ${symbol}`));
            return;
          }

          const quote = result.quote;
          const allOptions = [];
          
          // Process all expiration dates
          for (const expiration of result.options) {
            const expiryDate = new Date(expiration.expirationDate * 1000);
            const daysToExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
            
            // Process calls
            if (expiration.calls) {
              for (const call of expiration.calls) {
                if (call.bid > 0 && call.ask > 0 && call.impliedVolatility > 0) {
                  allOptions.push({
                    symbol,
                    type: 'call',
                    strike: call.strike,
                    expiration: daysToExpiry,
                    expirationDate: expiryDate.toISOString(),
                    stockPrice: quote.regularMarketPrice,
                    bid: call.bid,
                    ask: call.ask,
                    lastPrice: call.lastPrice,
                    mid: (call.bid + call.ask) / 2,
                    impliedVol: call.impliedVolatility,
                    volume: call.volume || 0,
                    openInterest: call.openInterest || 0,
                    inTheMoney: call.inTheMoney
                  });
                }
              }
            }
            
            // Process puts
            if (expiration.puts) {
              for (const put of expiration.puts) {
                if (put.bid > 0 && put.ask > 0 && put.impliedVolatility > 0) {
                  allOptions.push({
                    symbol,
                    type: 'put',
                    strike: put.strike,
                    expiration: daysToExpiry,
                    expirationDate: expiryDate.toISOString(),
                    stockPrice: quote.regularMarketPrice,
                    bid: put.bid,
                    ask: put.ask,
                    lastPrice: put.lastPrice,
                    mid: (put.bid + put.ask) / 2,
                    impliedVol: put.impliedVolatility,
                    volume: put.volume || 0,
                    openInterest: put.openInterest || 0,
                    inTheMoney: put.inTheMoney
                  });
                }
              }
            }
          }

          resolve({
            symbol,
            stockPrice: quote.regularMarketPrice,
            timestamp: new Date().toISOString(),
            options: allOptions
          });
          
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function fetchMultipleSymbols(symbols, delayMs = 1000) {
  const allData = {};
  
  for (let i = 0; i < symbols.length; i++) {
    try {
      const data = await fetchYahooOptions(symbols[i]);
      allData[symbols[i]] = data;
      console.log(`✓ ${symbols[i]}: ${data.options.length} options fetched`);
      
      // Delay to avoid rate limiting
      if (i < symbols.length - 1) {
        console.log(`Waiting ${delayMs}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`✗ Failed to fetch ${symbols[i]}:`, error.message);
      allData[symbols[i]] = { error: error.message };
    }
  }
  
  return allData;
}

function saveValidationData(data, filename = 'market-validation-data.json') {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, jsonData);
  
  // Also create a summary
  const summary = {
    fetchDate: new Date().toISOString(),
    symbols: Object.keys(data),
    totalOptions: 0,
    bySymbol: {}
  };
  
  for (const [symbol, symbolData] of Object.entries(data)) {
    if (symbolData.options) {
      summary.totalOptions += symbolData.options.length;
      summary.bySymbol[symbol] = {
        stockPrice: symbolData.stockPrice,
        optionCount: symbolData.options.length,
        calls: symbolData.options.filter(o => o.type === 'call').length,
        puts: symbolData.options.filter(o => o.type === 'put').length
      };
    }
  }
  
  fs.writeFileSync('market-data-summary.json', JSON.stringify(summary, null, 2));
  
  console.log(`\n✓ Market data saved to ${filename}`);
  console.log(`✓ Summary saved to market-data-summary.json`);
  console.log(`✓ Total options: ${summary.totalOptions}`);
}

async function main() {
  console.log('Real Market Data Fetcher');
  console.log('========================\n');
  
  // Fetch data for popular symbols
  const symbols = ['SPY', 'QQQ', 'AAPL'];
  
  try {
    const marketData = await fetchMultipleSymbols(symbols, 2000); // 2 second delay
    saveValidationData(marketData);
    
    console.log('\n📊 Market data collection complete!');
    console.log('This data can now be used for offline validation testing.');
    
  } catch (error) {
    console.error('Error fetching market data:', error);
  }
}

// Export for use in other modules
module.exports = {
  fetchYahooOptions,
  fetchMultipleSymbols,
  saveValidationData
};

// Run if executed directly
if (require.main === module) {
  main();
}