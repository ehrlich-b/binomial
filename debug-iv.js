// Debug IV calculation issues
const { binomialOptionPrice, blackScholes } = require('./index_fixed.js');
const { impliedVolatility } = require('./validator.js');
const fs = require('fs');

// Load first few options for debugging
const data = JSON.parse(fs.readFileSync('./market-data-clean.json', 'utf8'));
const options = data.cleanOptions.slice(0, 5);

console.log('DEBUGGING IV CALCULATION ISSUES\n');

options.forEach((option, i) => {
    const { stockPrice, strike, daysToExpiry, marketMid, type, symbol } = option;
    const T = daysToExpiry / 252; // Trading days
    const r = 0.06;
    const q = 0.0;
    
    console.log(`\n${i+1}. ${symbol} ${type.toUpperCase()} $${strike}`);
    console.log(`   Stock: $${stockPrice}, Market: $${marketMid}, Days: ${daysToExpiry}`);
    console.log(`   Intrinsic: $${Math.max(type === 'call' ? stockPrice - strike : strike - stockPrice, 0).toFixed(2)}`);
    console.log(`   Time: ${T.toFixed(4)} years`);
    
    // Check if the market price makes sense
    const intrinsic = Math.max(type === 'call' ? stockPrice - strike : strike - stockPrice, 0);
    if (marketMid <= intrinsic) {
        console.log(`   ❌ ERROR: Market price (${marketMid}) ≤ intrinsic value (${intrinsic.toFixed(2)})`);
        return;
    }
    
    // Test our binomial pricing with a reasonable volatility
    const testVol = 0.3; // 30%
    const testPrice = binomialOptionPrice(T, stockPrice, strike, r, testVol, q, 50, type, 'american');
    console.log(`   Test price @ 30% vol: $${testPrice.toFixed(2)}`);
    
    // Try to calculate IV
    try {
        const iv = impliedVolatility(marketMid, stockPrice, strike, T, r, q, type, 'american');
        console.log(`   ✅ IV: ${(iv * 100).toFixed(1)}%`);
        
        // Verify by pricing with calculated IV
        const verifyPrice = binomialOptionPrice(T, stockPrice, strike, r, iv, q, 50, type, 'american');
        console.log(`   Verify price: $${verifyPrice.toFixed(2)} (diff: ${(verifyPrice - marketMid).toFixed(2)})`);
        
    } catch (error) {
        console.log(`   ❌ IV calculation failed: ${error.message}`);
        
        // Try manually testing volatility range
        console.log(`   Testing vol range:`);
        for (let vol = 0.01; vol <= 1.0; vol += 0.1) {
            const price = binomialOptionPrice(T, stockPrice, strike, r, vol, q, 50, type, 'american');
            console.log(`     ${(vol*100).toFixed(0)}%: $${price.toFixed(2)}`);
        }
    }
});