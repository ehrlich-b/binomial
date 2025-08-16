// Test different risk-free rates with the corrected validation methodology
// Previous analysis found 6% optimal, but that was with flawed validation

const { binomialOptionPrice, blackScholes } = require('./index_fixed.js');
const { impliedVolatility } = require('./validator.js');
const { getDividendYield } = require('./dividend-yields.js');
const fs = require('fs');

function testRiskFreeRates() {
    console.log('RISK-FREE RATE OPTIMIZATION (Corrected Validation)');
    console.log('='.repeat(55));
    console.log('Testing different rates with closed-loop validation');
    console.log('Market Price → Our IV → Our Model → Should match Market Price\n');
    
    // Load filtered options
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
    }).slice(0, 100); // Test 100 options for good statistics
    
    // Test different risk-free rates
    const riskFreeRates = [0.02, 0.025, 0.03, 0.035, 0.04, 0.045, 0.05, 0.0525, 0.055, 0.06];
    const results = [];
    
    console.log('Rate  | Avg Error | Median   | <0.1%   | <1.0%   | IV Failures');
    console.log('------|-----------|----------|---------|---------|------------');
    
    for (const rate of riskFreeRates) {
        const errors = [];
        let ivFailures = 0;
        
        for (const option of options) {
            const { stockPrice, strike, daysToExpiry, marketMid, type, symbol } = option;
            const T = daysToExpiry / 252; // Trading days
            const q = getDividendYield(symbol); // Use actual dividend yields
            
            try {
                // Closed-loop test: Market Price → Our IV → Our Model
                const iv = impliedVolatility(marketMid, stockPrice, strike, T, rate, q, type, 'american');
                const ourPrice = binomialOptionPrice(T, stockPrice, strike, rate, iv, q, 50, type, 'american');
                const error = Math.abs(ourPrice - marketMid) / marketMid * 100;
                errors.push(error);
            } catch (e) {
                ivFailures++;
            }
        }
        
        if (errors.length > 0) {
            const avgError = errors.reduce((a, b) => a + b) / errors.length;
            const medianError = errors.sort((a, b) => a - b)[Math.floor(errors.length / 2)];
            const under01pct = errors.filter(e => e <= 0.1).length;
            const under1pct = errors.filter(e => e <= 1.0).length;
            
            results.push({
                rate,
                avgError,
                medianError,
                under01pct: under01pct / errors.length * 100,
                under1pct: under1pct / errors.length * 100,
                ivFailures,
                validOptions: errors.length
            });
            
            console.log(`${(rate * 100).toFixed(1)}%  | ${avgError.toFixed(3)}%    | ${medianError.toFixed(3)}%   | ${(under01pct / errors.length * 100).toFixed(1)}%    | ${(under1pct / errors.length * 100).toFixed(1)}%    | ${ivFailures}`);
        }
    }
    
    // Find optimal rate
    const bestRate = results.reduce((best, current) => 
        current.avgError < best.avgError ? current : best
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('OPTIMAL RISK-FREE RATE ANALYSIS');
    console.log('='.repeat(60));
    console.log(`Best rate: ${(bestRate.rate * 100).toFixed(1)}% (${bestRate.avgError.toFixed(3)}% avg error)`);
    console.log(`Valid options tested: ${bestRate.validOptions}`);
    console.log(`Options with <0.1% error: ${bestRate.under01pct.toFixed(1)}%`);
    console.log(`Options with <1.0% error: ${bestRate.under1pct.toFixed(1)}%`);
    
    // Historical context for June 24, 2024
    console.log('\n' + '='.repeat(60));
    console.log('HISTORICAL CONTEXT (June 24, 2024)');
    console.log('='.repeat(60));
    console.log(`Federal Funds Rate: 5.25% - 5.50% (FOMC target range)`);
    console.log(`10-Year Treasury: ~4.25% - 4.35%`);
    console.log(`3-Month Treasury: ~5.20% - 5.30%`);
    console.log(`Market expectation: Rate cuts in 2024 (priced in)`);
    console.log('');
    console.log(`Our optimal rate: ${(bestRate.rate * 100).toFixed(1)}%`);
    
    if (bestRate.rate >= 0.05 && bestRate.rate <= 0.055) {
        console.log('✅ RESULT: Optimal rate aligns with Fed Funds/Treasury rates');
    } else if (bestRate.rate > 0.055) {
        console.log('📈 RESULT: Market pricing above risk-free rate (credit spread?)');
    } else {
        console.log('📉 RESULT: Market pricing below risk-free rate (rate cut expectations?)');
    }
    
    // Compare with previous (flawed) analysis
    console.log('\n' + '='.repeat(60));
    console.log('COMPARISON WITH PREVIOUS ANALYSIS');
    console.log('='.repeat(60));
    console.log('Previous method (using market IV): 6.0% optimal');
    console.log(`Corrected method (closed-loop):    ${(bestRate.rate * 100).toFixed(1)}% optimal`);
    console.log('');
    
    if (Math.abs(bestRate.rate - 0.06) < 0.005) {
        console.log('✅ CONSISTENT: Both methods suggest similar rates');
    } else {
        console.log('⚠️  DIFFERENT: Corrected validation suggests different rate');
        console.log('   → Previous method was biased by using market IV');
        console.log('   → New method tests our model\'s self-consistency');
    }
    
    return results;
}

// Run the test
if (require.main === module) {
    testRiskFreeRates();
}

module.exports = { testRiskFreeRates };