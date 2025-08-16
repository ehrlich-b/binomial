/**
 * Trinomial Tree Model Example
 * Demonstrates the enhanced accuracy of trinomial vs binomial pricing
 */

import { 
    createOption
} from '../lib/index.js';

console.log('🔺 Trinomial Tree Model Examples');
console.log('==================================');

// Example 1: Compare all three pricing methods
console.log('\n📊 Method Comparison for AAPL Call');
console.log('----------------------------------');

const params = {
    symbol: 'AAPL',
    stockPrice: 150,
    strikePrice: 155,
    daysToExpiry: 30,
    volatility: 0.25,
    optionType: 'call'
};

const option = createOption(params);

const binomialPrice50 = option.binomialPrice(50);
const trinomialPrice50 = option.trinomialPrice(50);
const bsPrice = option.blackScholesPrice();

console.log(`Binomial (50 steps):  $${binomialPrice50.toFixed(4)}`);
console.log(`Trinomial (50 steps): $${trinomialPrice50.toFixed(4)}`);
console.log(`Black-Scholes:        $${bsPrice.toFixed(4)}`);

const trinomialDiff = Math.abs(trinomialPrice50 - bsPrice);
const binomialDiff = Math.abs(binomialPrice50 - bsPrice);

console.log(`\nDifference from Black-Scholes:`);
console.log(`Trinomial: $${trinomialDiff.toFixed(4)} (${(trinomialDiff/bsPrice*100).toFixed(2)}%)`);
console.log(`Binomial:  $${binomialDiff.toFixed(4)} (${(binomialDiff/bsPrice*100).toFixed(2)}%)`);

// Example 2: Convergence analysis
console.log('\n📈 Convergence Analysis');
console.log('----------------------');

const steps = [10, 25, 50, 100, 200];

console.log('Steps | Binomial | Trinomial | BS Target');
console.log('------|----------|-----------|----------');

for (const step of steps) {
    const binPrice = option.binomialPrice(step);
    const triPrice = option.trinomialPrice(step);
    console.log(`${step.toString().padStart(5)} | ${binPrice.toFixed(6)} | ${triPrice.toFixed(6)} | ${bsPrice.toFixed(6)}`);
}

// Example 3: American vs European with trinomial
console.log('\n🇺🇸 American vs European Put (Deep ITM)');
console.log('---------------------------------------');

const deepItmPutParams = {
    stockPrice: 80,
    strikePrice: 100,
    daysToExpiry: 90,
    volatility: 0.30,
    optionType: 'put'
};

const americanPut = createOption({ ...deepItmPutParams, exerciseStyle: 'american' });
const europeanPut = createOption({ ...deepItmPutParams, exerciseStyle: 'european' });

const americanTrinomial = americanPut.trinomialPrice(100);
const europeanTrinomial = europeanPut.trinomialPrice(100);
const europeanBS = europeanPut.blackScholesPrice();
const intrinsic = Math.max(deepItmPutParams.strikePrice - deepItmPutParams.stockPrice, 0);

console.log(`Intrinsic Value:       $${intrinsic.toFixed(4)}`);
console.log(`European (Trinomial):  $${europeanTrinomial.toFixed(4)}`);
console.log(`European (BS):         $${europeanBS.toFixed(4)}`);
console.log(`American (Trinomial):  $${americanTrinomial.toFixed(4)}`);
console.log(`Early Exercise Value:  $${(americanTrinomial - europeanTrinomial).toFixed(4)}`);

// Example 4: Greeks comparison
console.log('\n📊 Greeks Comparison (ATM Call)');
console.log('------------------------------');

const atmParams = {
    stockPrice: 100,
    strikePrice: 100,
    daysToExpiry: 45,
    volatility: 0.20,
    optionType: 'call'
};

const atmOption = createOption(atmParams);
const trinomialGreeks = atmOption.trinomialGreeks(50);
const binomialGreeks = atmOption.binomialGreeks(50);
const bsGreeks = atmOption.blackScholesGreeks();

console.log('Greek    | Trinomial | Binomial  | Black-Scholes');
console.log('---------|-----------|-----------|-------------');
console.log(`Delta    | ${trinomialGreeks.delta.toFixed(5)}   | ${binomialGreeks.delta.toFixed(5)}   | ${bsGreeks.delta.toFixed(5)}`);
console.log(`Gamma    | ${trinomialGreeks.gamma.toFixed(5)}   | ${binomialGreeks.gamma.toFixed(5)}   | ${bsGreeks.gamma.toFixed(5)}`);
console.log(`Theta    | ${trinomialGreeks.theta.toFixed(3)}     | ${binomialGreeks.theta.toFixed(3)}     | ${bsGreeks.theta.toFixed(3)}`);
console.log(`Vega     | ${trinomialGreeks.vega.toFixed(4)}    | ${binomialGreeks.vega.toFixed(4)}    | ${bsGreeks.vega.toFixed(4)}`);
console.log(`Rho      | ${trinomialGreeks.rho.toFixed(4)}    | ${binomialGreeks.rho.toFixed(4)}    | ${bsGreeks.rho.toFixed(4)}`);

// Example 5: Complete analysis with trinomial
console.log('\n📋 Enhanced Option Summary with Trinomial');
console.log('----------------------------------------');

const summary = atmOption.summary();
console.log(`Symbol: ${summary.symbol || 'N/A'}`);
console.log(`Type: ${summary.optionType.toUpperCase()} (${summary.exerciseStyle})`);
console.log(`\nPricing Models:`);
console.log(`  Binomial:     $${summary.pricing.binomial.toFixed(4)}`);
console.log(`  Trinomial:    $${summary.pricing.trinomial.toFixed(4)}`);
console.log(`  Black-Scholes: $${summary.pricing.blackScholes.toFixed(4)}`);
console.log(`  Intrinsic:    $${summary.pricing.intrinsic.toFixed(4)}`);
console.log(`  Time Value:   $${summary.pricing.timeValue.toFixed(4)}`);

console.log(`\n✅ Trinomial model examples completed!`);
console.log(`\n💡 Key Benefits of Trinomial Model:`);
console.log(`   • Better convergence properties`);
console.log(`   • Higher accuracy for complex derivatives`);
console.log(`   • More stable numerical behavior`);
console.log(`   • Enhanced handling of volatility smile effects`);