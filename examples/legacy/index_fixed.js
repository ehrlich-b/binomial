// Fixed binomial option pricing implementation
// Using standard Cox-Ross-Rubinstein parameters

function binomialOptionPrice(
    expirationTime,
    stockPrice,
    strikePrice,
    interestRate,
    volatility,
    dividendYield,
    n,
    optionType, // 'call' or 'put'
    exerciseStyle = 'american' // 'american' or 'european'
) {
    if (optionType !== 'call' && optionType !== 'put') {
        throw new Error('Invalid option type: ' + optionType);
    }

    // Cox-Ross-Rubinstein parameters
    const dt = expirationTime / n;
    const u = Math.exp(volatility * Math.sqrt(dt));
    const d = 1 / u;
    const pu = (Math.exp((interestRate - dividendYield) * dt) - d) / (u - d);
    const pd = 1 - pu;
    const discount = Math.exp(-interestRate * dt);

    // Initialize option values at maturity
    const optionValues = new Array(n + 1);
    
    for (let i = 0; i <= n; i++) {
        // Stock price at maturity: S0 * u^i * d^(n-i)
        const s = stockPrice * Math.pow(u, i) * Math.pow(d, n - i);
        
        if (optionType === 'call') {
            optionValues[i] = Math.max(s - strikePrice, 0);
        } else {
            optionValues[i] = Math.max(strikePrice - s, 0);
        }
    }

    // Step backwards through the tree
    for (let step = n - 1; step >= 0; step--) {
        for (let i = 0; i <= step; i++) {
            // Continuation value
            const continuationValue = discount * (pu * optionValues[i + 1] + pd * optionValues[i]);
            
            if (exerciseStyle === 'european') {
                optionValues[i] = continuationValue;
            } else { // american
                // Stock price at this node
                const s = stockPrice * Math.pow(u, i) * Math.pow(d, step - i);
                
                // Intrinsic value
                let intrinsic;
                if (optionType === 'call') {
                    intrinsic = Math.max(s - strikePrice, 0);
                } else {
                    intrinsic = Math.max(strikePrice - s, 0);
                }
                
                // Take max of continuation vs early exercise
                optionValues[i] = Math.max(continuationValue, intrinsic);
            }
        }
    }

    return optionValues[0];
}

// Black-Scholes formula for European options (for comparison)
function blackScholes(S, K, T, r, sigma, q, optionType) {
    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    
    // Normal CDF approximation
    function normCDF(x) {
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;
        
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2.0);
        
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        
        return 0.5 * (1.0 + sign * y);
    }
    
    if (optionType === 'call') {
        return S * Math.exp(-q * T) * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
    } else {
        return K * Math.exp(-r * T) * normCDF(-d2) - S * Math.exp(-q * T) * normCDF(-d1);
    }
}

// Test with known examples
function runTests() {
    console.log("FIXED BINOMIAL OPTION PRICING TESTS");
    console.log("====================================\n");
    
    // Test 1: Hull's Example
    console.log("Test 1: Hull's Example (European Call)");
    console.log("S=50, K=52, r=5%, σ=30%, T=0.25, n=2");
    console.log("Expected: ~2.84");
    const hull = binomialOptionPrice(0.25, 50, 52, 0.05, 0.3, 0, 2, 'call', 'european');
    console.log("Result:", hull.toFixed(4));
    console.log("");
    
    // Test 2: Compare with Black-Scholes (should converge as n increases)
    console.log("Test 2: Black-Scholes Convergence (European Call)");
    console.log("S=100, K=100, r=5%, σ=25%, T=1");
    const bs = blackScholes(100, 100, 1, 0.05, 0.25, 0, 'call');
    console.log("Black-Scholes:", bs.toFixed(4));
    console.log("Binomial convergence:");
    for (let n of [10, 50, 100, 500]) {
        const val = binomialOptionPrice(1, 100, 100, 0.05, 0.25, 0, n, 'call', 'european');
        console.log(`  n=${n}: ${val.toFixed(4)}`);
    }
    console.log("");
    
    // Test 3: SPY Options
    console.log("Test 3: SPY Options (30 days to expiry)");
    const T = 30 / 365; // Using calendar days
    
    console.log("\nSPY $550 Put (American):");
    console.log("Market price: ~11.86");
    const put550 = binomialOptionPrice(T, 560.61, 550, 0.0423, 0.2299, 0.01, 100, 'put', 'american');
    console.log("Binomial (n=100):", put550.toFixed(2));
    
    console.log("\nSPY $570 Call (American):");
    console.log("Market price: ~11.95-12.16");
    const call570 = binomialOptionPrice(T, 560.61, 570, 0.0423, 0.2229, 0.01, 100, 'call', 'american');
    console.log("Binomial (n=100):", call570.toFixed(2));
    
    // Test different time conventions
    console.log("\n\nTime Convention Comparison:");
    console.log("============================");
    const days = 30;
    console.log(`Days to expiry: ${days}`);
    
    const conventions = [
        { name: "Calendar (365)", divisor: 365 },
        { name: "Trading (252)", divisor: 252 },
        { name: "Business (260)", divisor: 260 }
    ];
    
    console.log("\nSPY $550 Put:");
    for (let conv of conventions) {
        const T = days / conv.divisor;
        const val = binomialOptionPrice(T, 560.61, 550, 0.0423, 0.2299, 0.01, 100, 'put', 'american');
        console.log(`  ${conv.name}: ${val.toFixed(2)}`);
    }
    
    console.log("\nSPY $570 Call:");
    for (let conv of conventions) {
        const T = days / conv.divisor;
        const val = binomialOptionPrice(T, 560.61, 570, 0.0423, 0.2229, 0.01, 100, 'call', 'american');
        console.log(`  ${conv.name}: ${val.toFixed(2)}`);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { binomialOptionPrice, blackScholes };
}

// Run tests if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runTests();
}