// Closed-Loop Validation Test
// Tests: Market Price → Our IV Calculation → Our Model → Should Match Market Price

const { binomialOptionPrice, blackScholes } = require('./index_fixed.js');
const { impliedVolatility } = require('./validator.js');
const fs = require('fs');

// Load the cleaned market data
function loadMarketData() {
    if (!fs.existsSync('./market-data-clean.json')) {
        console.error('market-data-clean.json not found. Run extract-market-data.js first.');
        process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync('./market-data-clean.json', 'utf8'));
    return data.cleanOptions || [];
}

// Closed-loop validation: Market Price → Our IV → Our Model → Should match Market Price
function closedLoopTest(option, riskFreeRate = 0.06, steps = 50, dayCount = 252) {
    const { stockPrice, strike, daysToExpiry, marketMid, type, symbol } = option;
    const ticker = symbol;
    const daysToExpiration = daysToExpiry;
    const marketPrice = marketMid;
    const optionType = type;
    
    // Convert days to years using specified convention
    const T = daysToExpiration / dayCount;
    const q = 0.0; // Zero dividend for now (will be improved later)
    
    // Step 1: Calculate implied volatility from market price using our model
    let impliedVol;
    try {
        impliedVol = impliedVolatility(marketPrice, stockPrice, strike, T, riskFreeRate, q, optionType, 'american');
    } catch (error) {
        return {
            ticker,
            optionType,
            strike,
            daysToExpiration,
            marketPrice,
            error: 'IV_CALCULATION_FAILED',
            details: error.message
        };
    }
    
    // Step 2: Use our calculated IV in our binomial model
    const ourPrice = binomialOptionPrice(T, stockPrice, strike, riskFreeRate, impliedVol, q, steps, optionType, 'american');
    
    // Step 3: Compare - should be nearly identical (within tolerance)
    const priceDiff = ourPrice - marketPrice;
    const pctError = Math.abs(priceDiff) / marketPrice * 100;
    
    // For comparison: Black-Scholes with same IV
    const bsPrice = blackScholes(stockPrice, strike, T, riskFreeRate, impliedVol, q, optionType);
    const bsDiff = bsPrice - marketPrice;
    const bsPctError = Math.abs(bsDiff) / marketPrice * 100;
    
    return {
        ticker,
        optionType,
        strike,
        daysToExpiration,
        marketPrice,
        stockPrice,
        impliedVol: impliedVol * 100, // Convert to percentage
        ourPrice,
        priceDiff,
        pctError,
        bsPrice,
        bsDiff,
        bsPctError,
        moneyness: stockPrice / strike // For analysis
    };
}

// Run Black-Scholes comparison to understand model differences
function runBlackScholesComparison(marketData, riskFreeRate = 0.06, dayCount = 252) {
    console.log('\n' + '='.repeat(80));
    console.log('BLACK-SCHOLES vs BINOMIAL MODEL COMPARISON');
    console.log('Using Market Implied Volatility in Both Models');
    console.log('='.repeat(80));
    
    const results = [];
    let validOptions = 0;
    let bsErrors = [];
    let binomialErrors = [];
    
    for (const option of marketData.slice(0, 100)) { // Test first 100 for speed
        const result = closedLoopTest(option, riskFreeRate, 50, dayCount);
        
        if (result.error) {
            if (validOptions < 5) { // Show first few errors for debugging
                console.log(`ERROR: ${result.ticker} ${result.optionType} $${result.strike} - ${result.error}`);
            }
            continue;
        }
        
        validOptions++;
        results.push(result);
        bsErrors.push(result.bsPctError);
        binomialErrors.push(result.pctError);
        
        // Print first few examples
        if (validOptions <= 10) {
            console.log(`\n${result.ticker} ${result.optionType.toUpperCase()} $${result.strike} (${result.daysToExpiration}d)`);
            console.log(`Market: $${result.marketPrice.toFixed(2)}, IV: ${result.impliedVol.toFixed(1)}%`);
            console.log(`Black-Scholes: $${result.bsPrice.toFixed(2)} (${result.bsPctError.toFixed(2)}% error)`);
            console.log(`Binomial:      $${result.ourPrice.toFixed(2)} (${result.pctError.toFixed(2)}% error)`);
        }
    }
    
    console.log(`\n${'='.repeat(50)}`);
    console.log('SUMMARY STATISTICS');
    console.log(`${'='.repeat(50)}`);
    console.log(`Valid Options Tested: ${validOptions}`);
    if (bsErrors.length > 0) {
        console.log(`\nBlack-Scholes Errors:`);
        console.log(`  Average: ${(bsErrors.reduce((a, b) => a + b, 0) / bsErrors.length).toFixed(2)}%`);
        console.log(`  Median:  ${bsErrors.sort((a, b) => a - b)[Math.floor(bsErrors.length / 2)].toFixed(2)}%`);
        console.log(`  Max:     ${Math.max(...bsErrors).toFixed(2)}%`);
        
        console.log(`\nBinomial Model Errors:`);
        console.log(`  Average: ${(binomialErrors.reduce((a, b) => a + b, 0) / binomialErrors.length).toFixed(2)}%`);
        console.log(`  Median:  ${binomialErrors.sort((a, b) => a - b)[Math.floor(binomialErrors.length / 2)].toFixed(2)}%`);
        console.log(`  Max:     ${Math.max(...binomialErrors).toFixed(2)}%`);
    } else {
        console.log(`\nNo valid options processed. Check data format and IV calculation.`);
    }
    
    // Error distribution
    const bsWithin1pct = bsErrors.filter(e => e <= 1.0).length;
    const binomialWithin1pct = binomialErrors.filter(e => e <= 1.0).length;
    
    console.log(`\nError Distribution:`);
    console.log(`  Black-Scholes ≤ 1%: ${(bsWithin1pct / bsErrors.length * 100).toFixed(1)}%`);
    console.log(`  Binomial ≤ 1%:      ${(binomialWithin1pct / binomialErrors.length * 100).toFixed(1)}%`);
    
    return results;
}

// Run the closed-loop validation
function runClosedLoopValidation() {
    console.log('CLOSED-LOOP VALIDATION TEST');
    console.log('===========================');
    console.log('Testing: Market Price → Our IV Calculation → Our Model → Should Match Market Price');
    
    const marketData = loadMarketData();
    console.log(`Loaded ${marketData.length} options from market data`);
    
    // Test with optimal parameters found in previous analysis
    const results = runBlackScholesComparison(marketData, 0.06, 252);
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('INTERPRETATION');
    console.log(`${'='.repeat(80)}`);
    console.log(`
Expected Results:
- Black-Scholes: Should have small errors (0-2%) for European-style options
- Binomial: Should have VERY small errors (< 0.1%) since we're using our own IV

If Binomial errors are large:
- Problem with our IV calculation method
- Problem with our binomial implementation  
- Different model assumptions (dividends, exercise style, etc.)

If Black-Scholes errors are large:
- Market uses American option pricing (early exercise premium)
- Market incorporates dividends differently
- Market uses different time/interest rate conventions

Next Steps:
1. If binomial errors > 1%: Fix our IV solver or binomial implementation
2. If BS errors > 5%: Market likely uses American pricing or different assumptions
3. Compare with dividend-adjusted models
`);
    
    return results;
}

// Main execution
if (require.main === module) {
    runClosedLoopValidation();
}

module.exports = { closedLoopTest, runClosedLoopValidation };