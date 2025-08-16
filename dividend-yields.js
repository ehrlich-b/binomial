// Get dividend yields for major stocks as of June 24, 2024
// This will improve our option pricing accuracy

// Approximate dividend yields for major stocks as of mid-2024
// Source: Historical dividend data and financial websites
const DIVIDEND_YIELDS_2024 = {
    // Major indices/ETFs
    'SPY': 0.0133,   // S&P 500 ETF: ~1.33%
    'QQQ': 0.0065,   // Nasdaq 100 ETF: ~0.65%
    'IWM': 0.0120,   // Russell 2000 ETF: ~1.20%
    'DIA': 0.0165,   // Dow Jones ETF: ~1.65%
    'EFA': 0.0280,   // International developed: ~2.80%
    'EEM': 0.0310,   // Emerging markets: ~3.10%
    
    // Technology stocks
    'AAPL': 0.0045,  // Apple: ~0.45%
    'MSFT': 0.0072,  // Microsoft: ~0.72%
    'GOOGL': 0.0000, // Alphabet: No dividend
    'GOOG': 0.0000,  // Alphabet Class A: No dividend
    'AMZN': 0.0000,  // Amazon: No dividend
    'META': 0.0045,  // Meta: ~0.45%
    'TSLA': 0.0000,  // Tesla: No dividend
    'NVDA': 0.0035,  // Nvidia: ~0.35%
    'NFLX': 0.0000,  // Netflix: No dividend
    
    // Financial stocks  
    'JPM': 0.0260,   // JPMorgan: ~2.60%
    'BAC': 0.0280,   // Bank of America: ~2.80%
    'WFC': 0.0290,   // Wells Fargo: ~2.90%
    'GS': 0.0260,    // Goldman Sachs: ~2.60%
    'MS': 0.0340,    // Morgan Stanley: ~3.40%
    'C': 0.0380,     // Citigroup: ~3.80%
    'BRK.B': 0.0000, // Berkshire Hathaway: No dividend
    
    // Healthcare stocks
    'JNJ': 0.0290,   // Johnson & Johnson: ~2.90%
    'PFE': 0.0580,   // Pfizer: ~5.80%
    'UNH': 0.0150,   // UnitedHealth: ~1.50%
    'MRK': 0.0280,   // Merck: ~2.80%
    'CVS': 0.0380,   // CVS Health: ~3.80%
    
    // Consumer stocks
    'KO': 0.0310,    // Coca-Cola: ~3.10%
    'PEP': 0.0280,   // PepsiCo: ~2.80%
    'WMT': 0.0230,   // Walmart: ~2.30%
    'PG': 0.0240,    // Procter & Gamble: ~2.40%
    'MCD': 0.0200,   // McDonald's: ~2.00%
    
    // Industrial stocks
    'BA': 0.0220,    // Boeing: ~2.20%
    'CAT': 0.0220,   // Caterpillar: ~2.20%
    'GE': 0.0350,    // General Electric: ~3.50%
    'MMM': 0.0590,   // 3M: ~5.90%
    
    // Energy stocks
    'XOM': 0.0340,   // ExxonMobil: ~3.40%
    'CVX': 0.0310,   // Chevron: ~3.10%
    'COP': 0.0200,   // ConocoPhillips: ~2.00%
    
    // Utilities (typically high dividend)
    'NEE': 0.0280,   // NextEra Energy: ~2.80%
    'SO': 0.0390,    // Southern Company: ~3.90%
    'DUK': 0.0380,   // Duke Energy: ~3.80%
    
    // REITs (high dividend)
    'VNO': 0.0650,   // Vornado Realty: ~6.50%
    'PLD': 0.0310,   // Prologis: ~3.10%
    'AMT': 0.0280,   // American Tower: ~2.80%
    
    // Default for unknown stocks
    '_DEFAULT': 0.0150  // Average market dividend yield ~1.5%
};

// Function to get dividend yield for a symbol
function getDividendYield(symbol) {
    // Clean up symbol (remove any suffixes)
    const cleanSymbol = symbol.split('.')[0].toUpperCase();
    
    return DIVIDEND_YIELDS_2024[cleanSymbol] || DIVIDEND_YIELDS_2024['_DEFAULT'];
}

// Function to get dividend-adjusted validation results
function validateWithDividends() {
    const { binomialOptionPrice, blackScholes } = require('./index_fixed.js');
    const { impliedVolatility } = require('./validator.js');
    const fs = require('fs');
    
    console.log('DIVIDEND-ADJUSTED VALIDATION');
    console.log('============================');
    
    // Load filtered options (reuse filter logic)
    const data = JSON.parse(fs.readFileSync('./market-data-clean.json', 'utf8'));
    const options = data.cleanOptions.filter(option => {
        const { stockPrice, strike, daysToExpiry, marketMid, type } = option;
        const moneyness = stockPrice / strike;
        const intrinsic = Math.max(type === 'call' ? stockPrice - strike : strike - stockPrice, 0);
        const timeValue = marketMid - intrinsic;
        
        return (
            daysToExpiry >= 15 && daysToExpiry <= 365 &&
            marketMid > 0.50 && timeValue > 0.10 &&
            moneyness >= 0.8 && moneyness <= 1.3 &&
            marketMid < stockPrice
        );
    });
    
    console.log(`Testing ${Math.min(50, options.length)} options with dividend adjustment...\n`);
    
    const results = [];
    let withDividendBetter = 0;
    let withoutDividendBetter = 0;
    
    for (let i = 0; i < Math.min(50, options.length); i++) {
        const option = options[i];
        const { stockPrice, strike, daysToExpiry, marketMid, type, symbol } = option;
        
        const T = daysToExpiry / 252;
        const r = 0.06;
        const q = getDividendYield(symbol);
        
        try {
            // Test with dividends
            const ivWithDiv = impliedVolatility(marketMid, stockPrice, strike, T, r, q, type, 'american');
            const priceWithDiv = binomialOptionPrice(T, stockPrice, strike, r, ivWithDiv, q, 50, type, 'american');
            const errorWithDiv = Math.abs(priceWithDiv - marketMid) / marketMid * 100;
            
            // Test without dividends
            const ivWithoutDiv = impliedVolatility(marketMid, stockPrice, strike, T, r, 0, type, 'american');
            const priceWithoutDiv = binomialOptionPrice(T, stockPrice, strike, r, ivWithoutDiv, 0, 50, type, 'american');
            const errorWithoutDiv = Math.abs(priceWithoutDiv - marketMid) / marketMid * 100;
            
            if (errorWithDiv < errorWithoutDiv) {
                withDividendBetter++;
            } else {
                withoutDividendBetter++;
            }
            
            results.push({
                symbol, type, strike, 
                dividendYield: q * 100,
                errorWithDiv, errorWithoutDiv,
                improvement: errorWithoutDiv - errorWithDiv
            });
            
            if (i < 10) {
                console.log(`${symbol} ${type.toUpperCase()} $${strike} (div: ${(q*100).toFixed(1)}%)`);
                console.log(`  With dividend:    ${errorWithDiv.toFixed(2)}% error`);
                console.log(`  Without dividend: ${errorWithoutDiv.toFixed(2)}% error`);
                console.log(`  Improvement:      ${(errorWithoutDiv - errorWithDiv).toFixed(2)}%`);
                console.log('');
            }
            
        } catch (error) {
            // Skip options with calculation errors
        }
    }
    
    if (results.length > 0) {
        const avgErrorWithDiv = results.reduce((sum, r) => sum + r.errorWithDiv, 0) / results.length;
        const avgErrorWithoutDiv = results.reduce((sum, r) => sum + r.errorWithoutDiv, 0) / results.length;
        const avgImprovement = results.reduce((sum, r) => sum + r.improvement, 0) / results.length;
        
        console.log('\n' + '='.repeat(50));
        console.log('DIVIDEND IMPACT ANALYSIS');
        console.log('='.repeat(50));
        console.log(`Options tested: ${results.length}`);
        console.log(`Average error with dividends:    ${avgErrorWithDiv.toFixed(2)}%`);
        console.log(`Average error without dividends: ${avgErrorWithoutDiv.toFixed(2)}%`);
        console.log(`Average improvement:             ${avgImprovement.toFixed(2)}%`);
        console.log(`Dividend model better:           ${withDividendBetter} cases`);
        console.log(`Zero dividend better:            ${withoutDividendBetter} cases`);
        
        // Analyze by dividend level
        const highDivResults = results.filter(r => r.dividendYield > 2.0);
        const lowDivResults = results.filter(r => r.dividendYield <= 2.0);
        
        if (highDivResults.length > 0) {
            const highDivImprovement = highDivResults.reduce((sum, r) => sum + r.improvement, 0) / highDivResults.length;
            console.log(`\nHigh dividend stocks (>2.0%): ${highDivImprovement.toFixed(2)}% avg improvement`);
        }
        
        if (lowDivResults.length > 0) {
            const lowDivImprovement = lowDivResults.reduce((sum, r) => sum + r.improvement, 0) / lowDivResults.length;
            console.log(`Low dividend stocks (≤2.0%):  ${lowDivImprovement.toFixed(2)}% avg improvement`);
        }
        
        console.log(`\nConclusion: ${avgImprovement > 0 ? 'Including dividends improves accuracy' : 'Dividends have minimal impact'}`);
    }
    
    return results;
}

// Test dividend impact
if (require.main === module) {
    validateWithDividends();
}

module.exports = { getDividendYield, validateWithDividends, DIVIDEND_YIELDS_2024 };