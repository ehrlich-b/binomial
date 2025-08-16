// Options Data Collector
// Multiple methods to get option chain data for validation

const https = require('https');
const fs = require('fs');

// Method 1: Yahoo Finance API (unofficial, but works)
async function fetchYahooOptionsChain(symbol) {
    return new Promise((resolve, reject) => {
        // Get expiration dates first
        const baseUrl = `https://query2.finance.yahoo.com/v7/finance/options/${symbol}`;
        
        https.get(baseUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const result = json.optionChain.result[0];
                    
                    if (!result) {
                        reject('No options data found');
                        return;
                    }
                    
                    const quote = result.quote;
                    const options = result.options[0]; // First expiration
                    
                    const processed = {
                        symbol: symbol,
                        stockPrice: quote.regularMarketPrice,
                        timestamp: new Date().toISOString(),
                        expirationDate: new Date(options.expirationDate * 1000).toISOString(),
                        calls: options.calls.map(processOption),
                        puts: options.puts.map(processOption)
                    };
                    
                    resolve(processed);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function processOption(opt) {
    return {
        strike: opt.strike,
        lastPrice: opt.lastPrice,
        bid: opt.bid,
        ask: opt.ask,
        volume: opt.volume,
        openInterest: opt.openInterest,
        impliedVolatility: opt.impliedVolatility,
        inTheMoney: opt.inTheMoney,
        contractSymbol: opt.contractSymbol
    };
}

// Method 2: Alpha Vantage (free tier: 25 requests/day)
async function fetchAlphaVantageOptions(symbol, apiKey) {
    return new Promise((resolve, reject) => {
        const url = `https://www.alphavantage.co/query?function=HISTORICAL_OPTIONS&symbol=${symbol}&apikey=${apiKey}`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Method 3: Polygon.io (free tier: 5 requests/minute)
async function fetchPolygonOptions(symbol, apiKey) {
    return new Promise((resolve, reject) => {
        const date = new Date().toISOString().split('T')[0];
        const url = `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${symbol}&limit=100&apiKey=${apiKey}`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Method 4: Generate synthetic test data based on Black-Scholes
function generateSyntheticOptionsData(symbol, S, r = 0.05, q = 0.01) {
    const { blackScholes } = require('./index_fixed.js');
    
    const expirations = [7, 14, 30, 45, 60, 90]; // days
    const data = [];
    
    for (let days of expirations) {
        const T = days / 365;
        
        // Generate strikes around ATM
        const strikes = [];
        for (let i = -10; i <= 10; i++) {
            strikes.push(Math.round(S * (1 + i * 0.025))); // 2.5% increments
        }
        
        for (let K of strikes) {
            // Generate random but realistic IV
            const moneyness = S / K;
            const baseIV = 0.15 + Math.abs(1 - moneyness) * 0.5; // IV smile
            const iv = baseIV + (Math.random() - 0.5) * 0.02; // Add noise
            
            // Calculate theoretical prices
            const callPrice = blackScholes(S, K, T, r, iv, q, 'call');
            const putPrice = blackScholes(S, K, T, r, iv, q, 'put');
            
            // Add bid-ask spread
            const callSpread = callPrice * 0.02;
            const putSpread = putPrice * 0.02;
            
            data.push({
                symbol,
                expiration: days,
                strike: K,
                stockPrice: S,
                type: 'call',
                bid: callPrice - callSpread,
                ask: callPrice + callSpread,
                mid: callPrice,
                impliedVol: iv,
                volume: Math.floor(Math.random() * 1000),
                openInterest: Math.floor(Math.random() * 5000)
            });
            
            data.push({
                symbol,
                expiration: days,
                strike: K,
                stockPrice: S,
                type: 'put',
                bid: putPrice - putSpread,
                ask: putPrice + putSpread,
                mid: putPrice,
                impliedVol: iv,
                volume: Math.floor(Math.random() * 1000),
                openInterest: Math.floor(Math.random() * 5000)
            });
        }
    }
    
    return data;
}

// Method 5: Scrape from free sources (be respectful of rate limits)
async function scrapeOptionsData(symbol) {
    console.log(`
    Note: Web scraping should be done respectfully and in accordance with website terms.
    Consider these alternatives:
    
    1. Yahoo Finance: Use yfinance Python library with Node.js child_process
    2. CBOE: Download daily options data CSV files
    3. IEX Cloud: Free tier with 50,000 messages/month
    4. TD Ameritrade API: Free with account
    `);
    
    // Example using public CBOE data
    const cboeUrl = `https://www.cboe.com/delayed_quotes/${symbol.toLowerCase()}/quote_table`;
    // Implementation would require parsing HTML
}

// Save data to JSON for offline analysis
function saveOptionsData(data, filename) {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Data saved to ${filename}`);
}

// Load saved data
function loadOptionsData(filename) {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

// Export functions
module.exports = {
    fetchYahooOptionsChain,
    fetchAlphaVantageOptions,
    fetchPolygonOptions,
    generateSyntheticOptionsData,
    saveOptionsData,
    loadOptionsData
};

// Demo: Generate and save synthetic data
if (require.main === module) {
    console.log('Generating synthetic options data for testing...');
    
    const tickers = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'TSLA'];
    const prices = [560, 480, 230, 430, 350];
    
    const allData = {};
    
    for (let i = 0; i < tickers.length; i++) {
        const data = generateSyntheticOptionsData(tickers[i], prices[i]);
        allData[tickers[i]] = data;
        console.log(`Generated ${data.length} options for ${tickers[i]}`);
    }
    
    saveOptionsData(allData, 'synthetic_options_data.json');
    
    console.log('\nTo fetch real Yahoo data (when online), use:');
    console.log('  const data = await fetchYahooOptionsChain("SPY");');
    
    console.log('\nFree API options:');
    console.log('1. Yahoo Finance (unofficial): No key needed, rate limited');
    console.log('2. Alpha Vantage: https://www.alphavantage.co/support/#api-key');
    console.log('3. Polygon.io: https://polygon.io/dashboard/api-keys');
    console.log('4. IEX Cloud: https://iexcloud.io/console/tokens');
    console.log('5. TD Ameritrade: https://developer.tdameritrade.com/');
}