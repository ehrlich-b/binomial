// PROPER IV VALIDATION: Market's reported IV vs our calculated IV from their price
// This measures the difference between their model and our model

const { binomialOptionPrice, blackScholes } = require('./index_fixed.js');
const { impliedVolatility } = require('./validator.js');
const { getDividendYield } = require('./dividend-yields.js');
const fs = require('fs');

function properIVValidation() {
    console.log('PROPER IV VALIDATION TEST');
    console.log('='.repeat(50));
    console.log('Market Reported IV vs Our Calculated IV');
    console.log('This measures the difference between their model and our model\n');
    
    // Load market data
    const data = JSON.parse(fs.readFileSync('./market-data-clean.json', 'utf8'));
    const options = data.cleanOptions.filter(option => {
        const { stockPrice, strike, daysToExpiry, marketMid, marketIV, type } = option;
        const moneyness = stockPrice / strike;
        const intrinsic = Math.max(type === 'call' ? stockPrice - strike : strike - stockPrice, 0);
        const timeValue = marketMid - intrinsic;
        
        return (
            marketIV && marketIV > 0 &&    // Must have reported IV
            daysToExpiry >= 15 && daysToExpiry <= 365 &&
            marketMid > 0.50 && timeValue > 0.10 &&
            moneyness >= 0.8 && moneyness <= 1.3 &&
            marketMid < stockPrice
        );
    }).slice(0, 100); // Test 100 for good statistics
    
    console.log(`Testing ${options.length} options with reported market IV...\n`);
    
    const results = [];
    let successCount = 0;
    
    // Test different risk-free rates to see which gives best IV agreement
    const riskFreeRates = [0.04, 0.045, 0.05, 0.0525, 0.055, 0.06];
    
    for (const rate of riskFreeRates) {
        console.log(`\nTesting risk-free rate: ${(rate * 100).toFixed(1)}%`);
        console.log('Symbol Type Strike | Market IV | Our IV | Diff | Days | Moneyness');
        console.log('-'.repeat(70));
        
        const ivDifferences = [];
        let validCount = 0;
        
        for (const option of options.slice(0, 20)) { // Show first 20 for each rate
            const { stockPrice, strike, daysToExpiry, marketMid, marketIV, type, symbol } = option;
            const T = daysToExpiry / 252; // Trading days
            const q = getDividendYield(symbol);
            const moneyness = stockPrice / strike;
            
            try {
                // Calculate what IV our model thinks the market price implies
                const ourCalculatedIV = impliedVolatility(marketMid, stockPrice, strike, T, rate, q, type, 'american');
                
                // Compare with market's reported IV
                const ivDiff = (ourCalculatedIV - marketIV) * 100; // Difference in percentage points
                const ivDiffPct = ivDiff / (marketIV * 100) * 100; // Percentage difference
                
                ivDifferences.push(Math.abs(ivDiff));
                validCount++;
                
                if (validCount <= 15) { // Show first 15 examples
                    console.log(`${symbol.padEnd(6)} ${type.padEnd(4)} $${strike.toString().padEnd(6)} | ${(marketIV * 100).toFixed(1)}%    | ${(ourCalculatedIV * 100).toFixed(1)}%   | ${ivDiff >= 0 ? '+' : ''}${ivDiff.toFixed(1)}% | ${daysToExpiry.toString().padEnd(3)} | ${moneyness.toFixed(2)}`);
                }
                
                results.push({
                    rate,
                    symbol,
                    type,
                    strike,
                    daysToExpiry,
                    marketIV: marketIV * 100,
                    ourIV: ourCalculatedIV * 100,
                    ivDiff,
                    ivDiffPct,
                    moneyness
                });
                
            } catch (error) {
                // Skip options where IV calculation fails
            }
        }
        
        if (ivDifferences.length > 0) {
            const avgAbsDiff = ivDifferences.reduce((a, b) => a + b) / ivDifferences.length;
            const medianDiff = ivDifferences.sort((a, b) => a - b)[Math.floor(ivDifferences.length / 2)];
            
            console.log(`\nSummary for ${(rate * 100).toFixed(1)}% rate:`);
            console.log(`  Valid options: ${validCount}`);
            console.log(`  Avg |IV difference|: ${avgAbsDiff.toFixed(1)} percentage points`);
            console.log(`  Median difference: ${medianDiff.toFixed(1)} percentage points`);
        }
    }
    
    // Find best rate (smallest average IV difference)
    const rateResults = {};
    for (const rate of riskFreeRates) {
        const rateData = results.filter(r => r.rate === rate);
        if (rateData.length > 0) {
            const avgAbsDiff = rateData.reduce((sum, r) => sum + Math.abs(r.ivDiff), 0) / rateData.length;
            rateResults[rate] = avgAbsDiff;
        }
    }
    
    const bestRate = Object.keys(rateResults).reduce((a, b) => 
        rateResults[a] < rateResults[b] ? a : b
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('OPTIMAL RISK-FREE RATE FOR IV AGREEMENT');
    console.log('='.repeat(60));
    console.log(`Best rate: ${(parseFloat(bestRate) * 100).toFixed(1)}%`);
    console.log(`Average |IV difference|: ${rateResults[bestRate].toFixed(1)} percentage points`);
    
    // Analysis by option characteristics
    const bestRateData = results.filter(r => r.rate === parseFloat(bestRate));
    
    console.log('\n' + '='.repeat(60));
    console.log('IV DIFFERENCE ANALYSIS');
    console.log('='.repeat(60));
    
    // By moneyness
    const itmOptions = bestRateData.filter(r => r.moneyness > 1.05);
    const atmOptions = bestRateData.filter(r => r.moneyness >= 0.95 && r.moneyness <= 1.05);
    const otmOptions = bestRateData.filter(r => r.moneyness < 0.95);
    
    if (itmOptions.length > 0) {
        const itmAvg = itmOptions.reduce((sum, r) => sum + Math.abs(r.ivDiff), 0) / itmOptions.length;
        console.log(`ITM options (S/K > 1.05): ${itmAvg.toFixed(1)}% avg |IV diff|`);
    }
    
    if (atmOptions.length > 0) {
        const atmAvg = atmOptions.reduce((sum, r) => sum + Math.abs(r.ivDiff), 0) / atmOptions.length;
        console.log(`ATM options (0.95 ≤ S/K ≤ 1.05): ${atmAvg.toFixed(1)}% avg |IV diff|`);
    }
    
    if (otmOptions.length > 0) {
        const otmAvg = otmOptions.reduce((sum, r) => sum + Math.abs(r.ivDiff), 0) / otmOptions.length;
        console.log(`OTM options (S/K < 0.95): ${otmAvg.toFixed(1)}% avg |IV diff|`);
    }
    
    // By option type
    const calls = bestRateData.filter(r => r.type === 'call');
    const puts = bestRateData.filter(r => r.type === 'put');
    
    if (calls.length > 0) {
        const callAvg = calls.reduce((sum, r) => sum + Math.abs(r.ivDiff), 0) / calls.length;
        console.log(`Call options: ${callAvg.toFixed(1)}% avg |IV diff|`);
    }
    
    if (puts.length > 0) {
        const putAvg = puts.reduce((sum, r) => sum + Math.abs(r.ivDiff), 0) / puts.length;
        console.log(`Put options: ${putAvg.toFixed(1)}% avg |IV diff|`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('INTERPRETATION');
    console.log('='.repeat(60));
    console.log(`
✅ THIS IS THE REAL MODEL VALIDATION!

Key Findings:
- Our model calculates IV from market prices
- Market reports their own IV calculations  
- Difference shows model disagreement, not circular validation

Expected Results:
- 0-2% difference: Models are very similar
- 2-5% difference: Some model differences (normal)
- >5% difference: Significant model differences

Possible Causes of Differences:
1. Different exercise style assumptions (American vs European)
2. Different day count conventions
3. Different dividend assumptions  
4. Different volatility smile modeling
5. Different early exercise algorithms

Our optimal rate: ${(parseFloat(bestRate) * 100).toFixed(1)}% gives best IV agreement
This suggests market was using ~${(parseFloat(bestRate) * 100).toFixed(1)}% risk-free rate on June 24, 2024
    `);
    
    return bestRateData;
}

// Run the validation
if (require.main === module) {
    properIVValidation();
}

module.exports = { properIVValidation };