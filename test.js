// Standard test cases for binomial option pricing
// These are well-known examples from textbooks and academic papers

// Load the implementations from index.js
const fs = require('fs');
const indexCode = fs.readFileSync('./index.js', 'utf8');
eval(indexCode);

// Test Case 1: Hull's Example (Options, Futures, and Other Derivatives)
// European Call Option
// S0 = 50, K = 52, r = 5%, σ = 30%, T = 0.25 years, n = 2 steps
// Expected value: ~2.84 (using 2-step binomial)
function testHullExample() {
    const S0 = 50;
    const K = 52;
    const r = 0.05;
    const sigma = 0.3;
    const T = 0.25;
    const q = 0; // no dividends
    const n = 2;
    
    console.log("Hull's Example (2-step European Call):");
    console.log("Expected: ~2.84");
    console.log("Implementation 1:", binomialOptionTheoreticalOptionPrice(T, S0, K, r, sigma, q, n, 'call'));
    console.log("Implementation 2:", binomialOptionTheoreticalOptionPriceClaude(T, S0, K, r, sigma, q, n, 'call'));
    console.log("Implementation 3:", binomialOptionTheoreticalOptionPriceo1(T, S0, K, r, sigma, q, n, 'call'));
    console.log("");
}

// Test Case 2: Cox-Ross-Rubinstein Paper Example
// American Put Option
// S0 = 100, K = 100, r = 6%, σ = 20%, T = 1 year, n = 3 steps
function testCRRExample() {
    const S0 = 100;
    const K = 100;
    const r = 0.06;
    const sigma = 0.2;
    const T = 1.0;
    const q = 0;
    const n = 3;
    
    console.log("CRR Paper Example (3-step American Put):");
    console.log("Expected: ~4.65");
    console.log("Implementation 1:", binomialOptionTheoreticalOptionPrice(T, S0, K, r, sigma, q, n, 'put'));
    console.log("Implementation 2:", binomialOptionTheoreticalOptionPriceClaude(T, S0, K, r, sigma, q, n, 'put'));
    console.log("Implementation 3:", binomialOptionTheoreticalOptionPriceo1(T, S0, K, r, sigma, q, n, 'put'));
    console.log("");
}

// Test Case 3: Black-Scholes Convergence Test
// As n increases, binomial should converge to Black-Scholes
// European Call: S0 = 100, K = 100, r = 5%, σ = 25%, T = 1 year
// Black-Scholes value: ~10.45
function testBlackScholesConvergence() {
    const S0 = 100;
    const K = 100;
    const r = 0.05;
    const sigma = 0.25;
    const T = 1.0;
    const q = 0;
    
    console.log("Black-Scholes Convergence Test (European Call):");
    console.log("Black-Scholes value: ~10.45");
    console.log("Steps | Impl 1 | Impl 2 | Impl 3");
    console.log("------|--------|--------|--------");
    
    for (let n of [10, 50, 100, 200]) {
        const val1 = binomialOptionTheoreticalOptionPrice(T, S0, K, r, sigma, q, n, 'call');
        const val2 = binomialOptionTheoreticalOptionPriceClaude(T, S0, K, r, sigma, q, n, 'call');
        const val3 = binomialOptionTheoreticalOptionPriceo1(T, S0, K, r, sigma, q, n, 'call');
        console.log(`${n.toString().padEnd(5)} | ${val1.toFixed(4).padEnd(6)} | ${val2.toFixed(4).padEnd(6)} | ${val3.toFixed(4)}`);
    }
    console.log("");
}

// Test your specific SPY examples with consistent parameters
function testSPYExamples() {
    console.log("SPY Option Examples (Using consistent time calculation):");
    console.log("=========================================");
    
    // Using 30 days to expiration for consistency
    const daysToExpiry = 30;
    const T_trading = daysToExpiry / 252;  // Trading days convention
    const T_calendar = daysToExpiry / 365; // Calendar days convention
    
    console.log(`Days to expiry: ${daysToExpiry}`);
    console.log(`Time (trading days): ${T_trading.toFixed(4)}`);
    console.log(`Time (calendar days): ${T_calendar.toFixed(4)}`);
    console.log("");
    
    // SPY Put: S = 560.61, K = 550, r = 4.23%, σ = 22.99%, q = 1%
    console.log("SPY $550 Put:");
    console.log("Yahoo Finance value: ~11.86");
    console.log("Using trading days (T = " + T_trading.toFixed(4) + "):");
    console.log("  Impl 1:", binomialOptionTheoreticalOptionPrice(T_trading, 560.61, 550, 0.0423, 0.2299, 0.01, 100, 'put'));
    console.log("  Impl 2:", binomialOptionTheoreticalOptionPriceClaude(T_trading, 560.61, 550, 0.0423, 0.2299, 0.01, 100, 'put'));
    console.log("  Impl 3:", binomialOptionTheoreticalOptionPriceo1(T_trading, 560.61, 550, 0.0423, 0.2299, 0.01, 100, 'put'));
    console.log("Using calendar days (T = " + T_calendar.toFixed(4) + "):");
    console.log("  Impl 1:", binomialOptionTheoreticalOptionPrice(T_calendar, 560.61, 550, 0.0423, 0.2299, 0.01, 100, 'put'));
    console.log("  Impl 2:", binomialOptionTheoreticalOptionPriceClaude(T_calendar, 560.61, 550, 0.0423, 0.2299, 0.01, 100, 'put'));
    console.log("  Impl 3:", binomialOptionTheoreticalOptionPriceo1(T_calendar, 560.61, 550, 0.0423, 0.2299, 0.01, 100, 'put'));
    console.log("");
    
    // SPY Call: S = 560.61, K = 570, r = 4.23%, σ = 22.29%, q = 1%
    console.log("SPY $570 Call:");
    console.log("Yahoo Finance value: ~11.95-12.16");
    console.log("Using trading days (T = " + T_trading.toFixed(4) + "):");
    console.log("  Impl 1:", binomialOptionTheoreticalOptionPrice(T_trading, 560.61, 570, 0.0423, 0.2229, 0.01, 100, 'call'));
    console.log("  Impl 2:", binomialOptionTheoreticalOptionPriceClaude(T_trading, 560.61, 570, 0.0423, 0.2229, 0.01, 100, 'call'));
    console.log("  Impl 3:", binomialOptionTheoreticalOptionPriceo1(T_trading, 560.61, 570, 0.0423, 0.2229, 0.01, 100, 'call'));
    console.log("Using calendar days (T = " + T_calendar.toFixed(4) + "):");
    console.log("  Impl 1:", binomialOptionTheoreticalOptionPrice(T_calendar, 560.61, 570, 0.0423, 0.2229, 0.01, 100, 'call'));
    console.log("  Impl 2:", binomialOptionTheoreticalOptionPriceClaude(T_calendar, 560.61, 570, 0.0423, 0.2229, 0.01, 100, 'call'));
    console.log("  Impl 3:", binomialOptionTheoreticalOptionPriceo1(T_calendar, 560.61, 570, 0.0423, 0.2229, 0.01, 100, 'call'));
}

// Run all tests
console.log("BINOMIAL OPTION PRICING TEST SUITE");
console.log("===================================\n");

testHullExample();
testCRRExample();
testBlackScholesConvergence();
testSPYExamples();