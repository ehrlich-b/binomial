/**
 * Monte Carlo Simulation Examples
 * 
 * Demonstrates Monte Carlo option pricing capabilities including:
 * - Basic Monte Carlo pricing with variance reduction techniques
 * - Comparison with analytical and tree models
 * - Convergence analysis and confidence intervals
 * - Adaptive sampling with convergence criteria
 * - Greeks calculation via finite differences
 * - Performance benchmarking and efficiency analysis
 */

import { 
    monteCarloPrice, 
    monteCarloGreeks,
    adaptiveMonteCarloPrice,
    blackScholesPrice,
    binomialPrice
} from '../lib/index.js';

import { Option } from '../lib/index.js';

console.log('='.repeat(80));
console.log('MONTE CARLO SIMULATION EXAMPLES');
console.log('='.repeat(80));

// Base option parameters
const baseParams = {
    stockPrice: 100,
    strikePrice: 105,
    timeToExpiry: 0.25, // 3 months
    riskFreeRate: 0.04,
    volatility: 0.25,
    dividendYield: 0.015,
    optionType: 'call'
};

console.log('\n1. BASIC MONTE CARLO PRICING');
console.log('-'.repeat(50));

console.log(`Stock Price: $${baseParams.stockPrice}`);
console.log(`Strike Price: $${baseParams.strikePrice}`);
console.log(`Time to Expiry: ${baseParams.timeToExpiry} years`);
console.log(`Volatility: ${(baseParams.volatility * 100).toFixed(1)}%`);
console.log('');

// Standard pricing models for comparison
const bsPrice = blackScholesPrice(baseParams);
const binPrice = binomialPrice({ ...baseParams, steps: 100, exerciseStyle: 'european' });

console.log('ANALYTICAL/TREE MODEL COMPARISON:');
console.log(`Black-Scholes:     $${bsPrice.toFixed(4)}`);
console.log(`Binomial (100):    $${binPrice.toFixed(4)}`);
console.log('');

// Monte Carlo with different simulation counts
const simCounts = [10000, 50000, 100000, 500000];
console.log('MONTE CARLO CONVERGENCE:');

simCounts.forEach(sims => {
    const mcResult = monteCarloPrice({
        ...baseParams,
        simulations: sims,
        seed: 12345 // Fixed seed for reproducibility
    });
    
    const error = Math.abs(mcResult.price - bsPrice);
    const ciWidth = mcResult.confidenceInterval.width;
    
    console.log(`${sims.toLocaleString().padStart(7)} sims: $${mcResult.price.toFixed(4)} ` +
               `(±$${mcResult.standardError.toFixed(4)}, CI width: $${ciWidth.toFixed(4)}, ` +
               `error: $${error.toFixed(4)})`);
});

console.log('\n2. VARIANCE REDUCTION TECHNIQUES');
console.log('-'.repeat(50));

// Compare different variance reduction methods
const varianceTests = [
    { name: 'No Variance Reduction', useAntithetic: false, useControlVariate: false },
    { name: 'Antithetic Variables', useAntithetic: true, useControlVariate: false },
    { name: 'Control Variates', useAntithetic: false, useControlVariate: true },
    { name: 'Both Techniques', useAntithetic: true, useControlVariate: true }
];

console.log('VARIANCE REDUCTION COMPARISON (100k simulations):');
varianceTests.forEach(test => {
    const result = monteCarloPrice({
        ...baseParams,
        simulations: 100000,
        useAntithetic: test.useAntithetic,
        useControlVariate: test.useControlVariate,
        seed: 12345
    });
    
    const efficiency = 1 / (result.standardError ** 2); // Inverse variance as efficiency measure
    console.log(`${test.name.padEnd(22)}: $${result.price.toFixed(4)} ` +
               `(SE: $${result.standardError.toFixed(4)}, Eff: ${efficiency.toFixed(0)})`);
});

console.log('\n3. CONFIDENCE INTERVALS');
console.log('-'.repeat(50));

const confidenceResult = monteCarloPrice({
    ...baseParams,
    simulations: 100000,
    seed: 12345
});

console.log('95% CONFIDENCE INTERVAL ANALYSIS:');
console.log(`Estimated Price:   $${confidenceResult.price.toFixed(4)}`);
console.log(`Standard Error:    $${confidenceResult.standardError.toFixed(4)}`);
console.log(`Lower Bound:       $${confidenceResult.confidenceInterval.lower.toFixed(4)}`);
console.log(`Upper Bound:       $${confidenceResult.confidenceInterval.upper.toFixed(4)}`);
console.log(`Interval Width:    $${confidenceResult.confidenceInterval.width.toFixed(4)}`);
console.log(`True Price (BS):   $${bsPrice.toFixed(4)}`);

const inInterval = bsPrice >= confidenceResult.confidenceInterval.lower && 
                   bsPrice <= confidenceResult.confidenceInterval.upper;
console.log(`True Price in CI:  ${inInterval ? 'Yes ✓' : 'No ✗'}`);

console.log('\n4. ADAPTIVE MONTE CARLO');
console.log('-'.repeat(50));

// Test adaptive sampling with different target errors
const targetErrors = [0.01, 0.005, 0.001];

console.log('ADAPTIVE SAMPLING WITH CONVERGENCE CRITERIA:');
targetErrors.forEach(targetError => {
    const start = Date.now();
    const adaptiveResult = adaptiveMonteCarloPrice(
        { ...baseParams, seed: 12345 },
        targetError,
        1000000,
        10000
    );
    const elapsed = Date.now() - start;
    
    console.log(`Target SE: $${targetError.toFixed(3)}: ` +
               `$${adaptiveResult.price.toFixed(4)} ` +
               `(${adaptiveResult.totalSimulations.toLocaleString()} sims, ` +
               `${adaptiveResult.converged ? 'converged' : 'not converged'}, ` +
               `${elapsed}ms)`);
});

console.log('\n5. MONTE CARLO GREEKS');
console.log('-'.repeat(50));

console.log('COMPUTING GREEKS VIA FINITE DIFFERENCES:');
const greeksStart = Date.now();
const mcGreeks = monteCarloGreeks({
    ...baseParams,
    simulations: 100000,
    seed: 12345
});
const greeksElapsed = Date.now() - greeksStart;

// Compare with Black-Scholes analytical Greeks (if available)
console.log('MONTE CARLO GREEKS:');
console.log(`Delta:             ${mcGreeks.delta.toFixed(4)}`);
console.log(`Gamma:             ${mcGreeks.gamma.toFixed(4)}`);
console.log(`Theta:             ${mcGreeks.theta.toFixed(4)}`);
console.log(`Vega:              ${mcGreeks.vega.toFixed(4)}`);
console.log(`Rho:               ${mcGreeks.rho.toFixed(4)}`);
console.log(`Computation Time:  ${greeksElapsed}ms`);

console.log('\n6. OPTION CLASS INTEGRATION');
console.log('-'.repeat(50));

// Using the Option class with Monte Carlo
const option = new Option({
    symbol: 'AAPL',
    stockPrice: 150,
    strikePrice: 155,
    daysToExpiry: 30,
    volatility: 0.30,
    optionType: 'call'
});

console.log(`Option: ${option.symbol} ${option.strikePrice} Call, ${option.daysToExpiry} days`);
console.log('');

// Compare all pricing methods
const mcResult = option.monteCarloPrice({ simulations: 100000, seed: 12345 });
const adaptiveMcResult = option.adaptiveMonteCarloPrice(0.005, 500000, { seed: 12345 });

console.log('COMPREHENSIVE PRICING COMPARISON:');
const pricing = {
    'Binomial (50)': option.binomialPrice(50),
    'Trinomial (50)': option.trinomialPrice(50),
    'Black-Scholes': option.blackScholesPrice(),
    'Jump Diffusion': option.jumpDiffusionPrice(),
    'Monte Carlo': mcResult.price,
    'Adaptive MC': adaptiveMcResult.price
};

Object.entries(pricing).forEach(([method, price]) => {
    console.log(`${method.padEnd(15)}: $${price.toFixed(4)}`);
});

console.log('\nMONTE CARLO STATISTICS:');
console.log(`Standard Error:    $${mcResult.standardError.toFixed(4)}`);
console.log(`Simulations:       ${mcResult.statistics.simulations.toLocaleString()}`);
console.log(`Antithetic:        ${mcResult.statistics.useAntithetic ? 'Yes' : 'No'}`);
console.log(`Control Variate:   ${mcResult.statistics.useControlVariate ? 'Yes' : 'No'}`);
console.log(`Efficiency:        ${mcResult.statistics.efficiency.toFixed(2)}`);

console.log('\nADAPTIVE MONTE CARLO:');
console.log(`Converged:         ${adaptiveMcResult.converged ? 'Yes ✓' : 'No ✗'}`);
console.log(`Total Simulations: ${adaptiveMcResult.totalSimulations.toLocaleString()}`);
console.log(`Target Error:      $${adaptiveMcResult.targetError.toFixed(3)}`);
console.log(`Actual SE:         $${adaptiveMcResult.standardError.toFixed(4)}`);

console.log('\n7. CONVERGENCE ANALYSIS');
console.log('-'.repeat(50));

// Analyze convergence rate
console.log('CONVERGENCE RATE ANALYSIS:');
const convergenceTests = [1000, 5000, 10000, 25000, 50000, 100000];
const bsTarget = blackScholesPrice({
    stockPrice: 150,
    strikePrice: 155,
    timeToExpiry: 30/365,
    riskFreeRate: 0.04,
    volatility: 0.30,
    dividendYield: 0.0045,
    optionType: 'call'
});

console.log('Simulations    MC Price    Error       SE          Ratio');
console.log('-'.repeat(55));

let lastError = null;
convergenceTests.forEach(sims => {
    const result = monteCarloPrice({
        stockPrice: 150,
        strikePrice: 155,
        timeToExpiry: 30/365,
        riskFreeRate: 0.04,
        volatility: 0.30,
        dividendYield: 0.0045,
        optionType: 'call',
        simulations: sims,
        seed: 12345
    });
    
    const error = Math.abs(result.price - bsTarget);
    const ratio = lastError ? (lastError / error).toFixed(2) : '-';
    lastError = error;
    
    console.log(`${sims.toString().padStart(10)}     $${result.price.toFixed(3)}     ` +
               `$${error.toFixed(4)}     $${result.standardError.toFixed(4)}     ${ratio}`);
});

console.log('\n8. PERFORMANCE BENCHMARKING');
console.log('-'.repeat(50));

const performanceParams = {
    stockPrice: 100,
    strikePrice: 100,
    timeToExpiry: 0.25,
    riskFreeRate: 0.05,
    volatility: 0.20,
    optionType: 'call'
};

console.log('PERFORMANCE COMPARISON (10 runs each):');

// Benchmark different methods
const methods = [
    { name: 'MC (10k)', func: () => monteCarloPrice({ ...performanceParams, simulations: 10000 }) },
    { name: 'MC (50k)', func: () => monteCarloPrice({ ...performanceParams, simulations: 50000 }) },
    { name: 'Binomial (100)', func: () => binomialPrice({ ...performanceParams, steps: 100, exerciseStyle: 'european' }) },
    { name: 'Black-Scholes', func: () => blackScholesPrice(performanceParams) }
];

methods.forEach(method => {
    const times = [];
    let result = null;
    
    for (let i = 0; i < 10; i++) {
        const start = Date.now();
        result = method.func();
        times.push(Date.now() - start);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const price = typeof result === 'object' ? result.price : result;
    
    console.log(`${method.name.padEnd(15)}: $${price.toFixed(4)}   (${avgTime.toFixed(1)}ms avg)`);
});

console.log('\n9. MULTI-STEP PATH SIMULATION');
console.log('-'.repeat(50));

// Test path-dependent pricing with multiple time steps
console.log('PATH-DEPENDENT SIMULATION (Multi-step):');

const pathParams = {
    ...baseParams,
    simulations: 50000,
    seed: 12345
};

const timeSteps = [1, 5, 10, 50, 100];
timeSteps.forEach(steps => {
    const result = monteCarloPrice({
        ...pathParams,
        timeSteps: steps
    });
    
    console.log(`${steps.toString().padStart(3)} steps: $${result.price.toFixed(4)} ` +
               `(SE: $${result.standardError.toFixed(4)})`);
});

console.log('\n' + '='.repeat(80));
console.log('MONTE CARLO ANALYSIS COMPLETE');
console.log('='.repeat(80));

console.log('\nKEY INSIGHTS:');
console.log('• Monte Carlo converges to analytical prices with sufficient simulations');
console.log('• Antithetic variables and control variates significantly reduce variance');
console.log('• Confidence intervals provide uncertainty quantification');
console.log('• Adaptive sampling achieves target accuracy efficiently');
console.log('• Greeks via finite differences require more simulations for stability');
console.log('• Performance scales linearly with simulation count');
console.log('• Multi-step paths enable complex payoff structures');
console.log('• Standard error decreases as 1/√n where n is simulation count');