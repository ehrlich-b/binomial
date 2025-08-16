// Test different day count conventions with proper IV validation
// Market Reported IV vs Our Calculated IV using different day counts

const { binomialOptionPrice, blackScholes } = require('./index_fixed.js');
const { impliedVolatility } = require('./validator.js');
const { getDividendYield } = require('./dividend-yields.js');
const fs = require('fs');

function testDayCountConventions() {
    console.log('DAY COUNT CONVENTION VALIDATION');
    console.log('='.repeat(50));
    console.log('Testing: Market Reported IV vs Our Calculated IV');
    console.log('Different day count conventions for time calculation\n');
    
    // Load market data with reported IVs
    const data = JSON.parse(fs.readFileSync('./market-data-clean.json', 'utf8'));
    const options = data.cleanOptions.filter(option => {
        const { stockPrice, strike, daysToExpiry, marketMid, marketIV, type } = option;
        const moneyness = stockPrice / strike;
        const intrinsic = Math.max(type === 'call' ? stockPrice - strike : strike - stockPrice, 0);
        const timeValue = marketMid - intrinsic;
        
        return (
            marketIV && marketIV > 0 &&
            daysToExpiry >= 15 && daysToExpiry <= 365 &&
            marketMid > 0.50 && timeValue > 0.10 &&
            moneyness >= 0.8 && moneyness <= 1.3 &&
            marketMid < stockPrice
        );
    }).slice(0, 100);
    
    console.log(`Testing ${options.length} options with different day count conventions...\n`);
    
    // Day count conventions to test
    const dayCountConventions = [
        { name: 'Calendar (365)', days: 365 },
        { name: 'Trading (252)', days: 252 },
        { name: 'Business (260)', days: 260 },
        { name: '30/360', days: 360 },
        { name: 'Actual/360', days: 360 },
        { name: 'Actual/365.25', days: 365.25 } // Accounts for leap years
    ];
    
    const riskFreeRate = 0.04; // Use optimal rate from previous analysis
    const results = [];
    
    console.log('Day Count     | Avg |IV Diff| | Median | <2% | <5% | Valid Options');
    console.log('--------------|---------------|--------|-----|-----|---------------');
    
    for (const convention of dayCountConventions) {
        const ivDifferences = [];
        let validCount = 0;
        
        for (const option of options) {
            const { stockPrice, strike, daysToExpiry, marketMid, marketIV, type, symbol } = option;
            const T = daysToExpiry / convention.days; // Time using this convention
            const q = getDividendYield(symbol);
            
            try {
                // Calculate IV using our model with this day count
                const ourCalculatedIV = impliedVolatility(marketMid, stockPrice, strike, T, riskFreeRate, q, type, 'american');
                
                // Compare with market's reported IV
                const ivDiff = Math.abs(ourCalculatedIV - marketIV) * 100; // Absolute difference in percentage points
                
                ivDifferences.push(ivDiff);
                validCount++;
                
                results.push({
                    convention: convention.name,
                    symbol,
                    type,
                    strike,
                    daysToExpiry,
                    T,
                    marketIV: marketIV * 100,
                    ourIV: ourCalculatedIV * 100,
                    ivDiff
                });
                
            } catch (error) {
                // Skip options where IV calculation fails
            }
        }
        
        if (ivDifferences.length > 0) {
            const avgDiff = ivDifferences.reduce((a, b) => a + b) / ivDifferences.length;
            const medianDiff = ivDifferences.sort((a, b) => a - b)[Math.floor(ivDifferences.length / 2)];
            const under2pct = ivDifferences.filter(d => d <= 2.0).length;
            const under5pct = ivDifferences.filter(d => d <= 5.0).length;
            
            console.log(`${convention.name.padEnd(13)} | ${avgDiff.toFixed(2)}%         | ${medianDiff.toFixed(2)}%  | ${(under2pct/ivDifferences.length*100).toFixed(0)}% | ${(under5pct/ivDifferences.length*100).toFixed(0)}% | ${validCount}`);
        }
    }
    
    // Find best convention
    const conventionResults = {};
    for (const conv of dayCountConventions) {
        const convData = results.filter(r => r.convention === conv.name);
        if (convData.length > 0) {
            const avgDiff = convData.reduce((sum, r) => sum + r.ivDiff, 0) / convData.length;
            conventionResults[conv.name] = avgDiff;
        }
    }
    
    const bestConvention = Object.keys(conventionResults).reduce((a, b) => 
        conventionResults[a] < conventionResults[b] ? a : b
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('OPTIMAL DAY COUNT CONVENTION');
    console.log('='.repeat(60));
    console.log(`Best convention: ${bestConvention}`);
    console.log(`Average |IV difference|: ${conventionResults[bestConvention].toFixed(2)} percentage points`);
    
    // Show examples with best convention
    const bestData = results.filter(r => r.convention === bestConvention).slice(0, 10);
    
    console.log('\n' + '='.repeat(60));
    console.log(`EXAMPLES WITH ${bestConvention.toUpperCase()}`);
    console.log('='.repeat(60));
    console.log('Symbol Type Strike | Days | Time(yrs) | Market IV | Our IV | Diff');
    console.log('------------------|------|-----------|-----------|--------|------');
    
    for (const example of bestData) {
        const diff = example.ourIV - example.marketIV;
        console.log(`${example.symbol.padEnd(6)} ${example.type.padEnd(4)} $${example.strike.toString().padEnd(6)} | ${example.daysToExpiry.toString().padEnd(4)} | ${example.T.toFixed(4)}    | ${example.marketIV.toFixed(1)}%     | ${example.ourIV.toFixed(1)}%   | ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`);
    }
    
    // Analysis by time to expiry
    const bestResults = results.filter(r => r.convention === bestConvention);
    const shortTerm = bestResults.filter(r => r.daysToExpiry <= 30);
    const mediumTerm = bestResults.filter(r => r.daysToExpiry > 30 && r.daysToExpiry <= 90);
    const longTerm = bestResults.filter(r => r.daysToExpiry > 90);
    
    console.log('\n' + '='.repeat(60));
    console.log('ANALYSIS BY TIME TO EXPIRY');
    console.log('='.repeat(60));
    
    if (shortTerm.length > 0) {
        const shortAvg = shortTerm.reduce((sum, r) => sum + r.ivDiff, 0) / shortTerm.length;
        console.log(`Short-term (≤30 days): ${shortAvg.toFixed(2)}% avg |IV diff| (${shortTerm.length} options)`);
    }
    
    if (mediumTerm.length > 0) {
        const mediumAvg = mediumTerm.reduce((sum, r) => sum + r.ivDiff, 0) / mediumTerm.length;
        console.log(`Medium-term (31-90 days): ${mediumAvg.toFixed(2)}% avg |IV diff| (${mediumTerm.length} options)`);
    }
    
    if (longTerm.length > 0) {
        const longAvg = longTerm.reduce((sum, r) => sum + r.ivDiff, 0) / longTerm.length;
        console.log(`Long-term (>90 days): ${longAvg.toFixed(2)}% avg |IV diff| (${longTerm.length} options)`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('INTERPRETATION');
    console.log('='.repeat(60));
    console.log(`
✅ OPTIMAL DAY COUNT: ${bestConvention}

Key Findings:
- Different day counts affect time-to-expiry calculation
- Market likely uses: ${bestConvention.toLowerCase()}
- This impacts option pricing accuracy

Expected Conventions:
- Trading (252): US equity options standard
- Calendar (365): Some international markets
- Business (260): Alternative business day count
- 30/360: Bond market convention

Our Result: ${bestConvention} gives best IV agreement
This suggests the market was using ${bestConvention.toLowerCase()} for time calculations

Combined with 4.0% risk-free rate, this gives us the optimal parameters
for matching market option pricing on June 24, 2024.
    `);
    
    return { bestConvention, conventionResults, bestResults };
}

// Run the test
if (require.main === module) {
    testDayCountConventions();
}

module.exports = { testDayCountConventions };