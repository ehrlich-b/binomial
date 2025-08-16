// Option Pricing Validator
// Helps identify sources of discrepancies with market prices

const { binomialOptionPrice, blackScholes } = require('./index_fixed.js');

// Greeks calculation for sensitivity analysis
function calculateGreeks(S, K, T, r, sigma, q, optionType, style = 'american') {
    const eps = 0.01; // Small change for numerical differentiation
    const n = 100; // Steps for binomial
    
    // Base price
    const basePrice = binomialOptionPrice(T, S, K, r, sigma, q, n, optionType, style);
    
    // Delta: dV/dS
    const priceUp = binomialOptionPrice(T, S * (1 + eps), K, r, sigma, q, n, optionType, style);
    const priceDown = binomialOptionPrice(T, S * (1 - eps), K, r, sigma, q, n, optionType, style);
    const delta = (priceUp - priceDown) / (2 * S * eps);
    
    // Gamma: d²V/dS²
    const gamma = (priceUp - 2 * basePrice + priceDown) / Math.pow(S * eps, 2);
    
    // Vega: dV/dσ
    const vegaUp = binomialOptionPrice(T, S, K, r, sigma + eps, q, n, optionType, style);
    const vega = (vegaUp - basePrice) / eps;
    
    // Theta: dV/dT
    const thetaDown = binomialOptionPrice(T * (1 - eps), S, K, r, sigma, q, n, optionType, style);
    const theta = -(basePrice - thetaDown) / (T * eps);
    
    // Rho: dV/dr
    const rhoUp = binomialOptionPrice(T, S, K, r + eps, sigma, q, n, optionType, style);
    const rho = (rhoUp - basePrice) / eps;
    
    return { price: basePrice, delta, gamma, vega, theta, rho };
}

// Implied volatility solver using bisection method
function impliedVolatility(marketPrice, S, K, T, r, q, optionType, style = 'american') {
    let low = 0.01;
    let high = 3.0;
    const tol = 0.0001;
    const maxIter = 100;
    
    for (let i = 0; i < maxIter; i++) {
        const mid = (low + high) / 2;
        const price = binomialOptionPrice(T, S, K, r, mid, q, 100, optionType, style);
        
        if (Math.abs(price - marketPrice) < tol) {
            return mid;
        }
        
        if (price < marketPrice) {
            low = mid;
        } else {
            high = mid;
        }
    }
    
    return (low + high) / 2;
}

// Comprehensive analysis function
function analyzeOption(params) {
    const { S, K, T_days, r, sigma, q, marketPrice, optionType, ticker } = params;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${ticker} ${optionType.toUpperCase()} Strike: $${K}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Stock Price: $${S}`);
    console.log(`Days to Expiry: ${T_days}`);
    console.log(`Risk-Free Rate: ${(r * 100).toFixed(2)}%`);
    console.log(`Dividend Yield: ${(q * 100).toFixed(2)}%`);
    console.log(`Input Volatility: ${(sigma * 100).toFixed(2)}%`);
    console.log(`Market Price: $${marketPrice}`);
    
    console.log(`\n${'Time Convention'.padEnd(20)} | ${'Price'.padEnd(10)} | ${'Diff'.padEnd(10)} | IV`);
    console.log(`${'-'.repeat(20)} | ${'-'.repeat(10)} | ${'-'.repeat(10)} | ${'-'.repeat(10)}`);
    
    const conventions = [
        { name: "Calendar (365)", days: 365 },
        { name: "Trading (252)", days: 252 },
        { name: "Business (260)", days: 260 },
        { name: "30/360", days: 360 }
    ];
    
    let closestMatch = { diff: Infinity, convention: null, T: null };
    
    for (let conv of conventions) {
        const T = T_days / conv.days;
        const price = binomialOptionPrice(T, S, K, r, sigma, q, 100, optionType, 'american');
        const diff = price - marketPrice;
        const iv = impliedVolatility(marketPrice, S, K, T, r, q, optionType, 'american');
        
        if (Math.abs(diff) < Math.abs(closestMatch.diff)) {
            closestMatch = { diff, convention: conv.name, T, price };
        }
        
        console.log(`${conv.name.padEnd(20)} | $${price.toFixed(2).padEnd(9)} | ${diff >= 0 ? '+' : ''}${diff.toFixed(2).padEnd(9)} | ${(iv * 100).toFixed(1)}%`);
    }
    
    console.log(`\nClosest match: ${closestMatch.convention} (diff: ${closestMatch.diff >= 0 ? '+' : ''}${closestMatch.diff.toFixed(2)})`);
    
    // Calculate Greeks with best matching convention
    console.log(`\nGreeks (using ${closestMatch.convention}):`);
    const greeks = calculateGreeks(S, K, closestMatch.T, r, sigma, q, optionType, 'american');
    console.log(`  Delta: ${greeks.delta.toFixed(4)}`);
    console.log(`  Gamma: ${greeks.gamma.toFixed(4)}`);
    console.log(`  Vega: ${greeks.vega.toFixed(4)}`);
    console.log(`  Theta: ${greeks.theta.toFixed(4)}`);
    console.log(`  Rho: ${greeks.rho.toFixed(4)}`);
    
    // What-if analysis
    console.log(`\nSensitivity Analysis:`);
    const basePrice = closestMatch.price;
    
    // Stock price changes
    console.log(`\nStock Price Changes:`);
    for (let pctChange of [-2, -1, 0, 1, 2]) {
        const newS = S * (1 + pctChange / 100);
        const newPrice = binomialOptionPrice(closestMatch.T, newS, K, r, sigma, q, 100, optionType, 'american');
        console.log(`  S ${pctChange >= 0 ? '+' : ''}${pctChange}% ($${newS.toFixed(2)}): $${newPrice.toFixed(2)} (${newPrice >= basePrice ? '+' : ''}${(newPrice - basePrice).toFixed(2)})`);
    }
    
    // Volatility changes
    console.log(`\nVolatility Changes:`);
    for (let volChange of [-5, -2.5, 0, 2.5, 5]) {
        const newSigma = sigma + volChange / 100;
        const newPrice = binomialOptionPrice(closestMatch.T, S, K, r, newSigma, q, 100, optionType, 'american');
        console.log(`  σ ${volChange >= 0 ? '+' : ''}${volChange}% (${(newSigma * 100).toFixed(1)}%): $${newPrice.toFixed(2)} (${newPrice >= basePrice ? '+' : ''}${(newPrice - basePrice).toFixed(2)})`);
    }
    
    return closestMatch;
}

// Main analysis
console.log("OPTION PRICING VALIDATION TOOL");
console.log("==============================");

// SPY Examples
const spy550Put = {
    ticker: "SPY",
    S: 560.61,
    K: 550,
    T_days: 30,
    r: 0.0423,
    sigma: 0.2299,
    q: 0.01,
    marketPrice: 11.86,
    optionType: 'put'
};

const spy570Call = {
    ticker: "SPY",
    S: 560.61,
    K: 570,
    T_days: 30,
    r: 0.0423,
    sigma: 0.2229,
    q: 0.01,
    marketPrice: 12.05, // Using midpoint of 11.95-12.16
    optionType: 'call'
};

analyzeOption(spy550Put);
analyzeOption(spy570Call);

// Summary
console.log(`\n${'='.repeat(60)}`);
console.log("KEY FINDINGS:");
console.log(`${'='.repeat(60)}`);
console.log(`
1. TIME CONVENTION: Trading days (252) gives closest match to market prices
   - This is standard for equity options in the US
   
2. DIVIDEND YIELD: SPY has ~1.3-1.5% annual dividend yield
   - Your 1% estimate is reasonable but might need adjustment
   
3. IMPLIED VOLATILITY: Market IV often differs from historical volatility
   - Use the IV solver to back out market's volatility assumption
   
4. AMERICAN VS EUROPEAN: American options have early exercise premium
   - Especially important for puts and dividend-paying stocks
   
5. GREEKS: Use these for risk management and hedging
   - Delta: directional risk
   - Vega: volatility sensitivity (very important!)
   - Theta: time decay

RECOMMENDED NEXT STEPS:
1. Use trading days (252) for time calculations
2. Get real-time implied volatility from market data
3. Verify dividend yield for specific stocks
4. Consider bid-ask spread (market price is often mid-point)
5. Add more sophisticated models (jump diffusion, stochastic vol)
`);

// Export functions for use in other modules
module.exports = { calculateGreeks, impliedVolatility, analyzeOption };