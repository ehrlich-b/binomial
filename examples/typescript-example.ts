/**
 * TypeScript usage example for Binomial Options Pricing Library
 * This file demonstrates type-safe usage of the library in TypeScript
 */

import { 
    priceOption,
    createOption,
    analyzeOption,
    getImpliedVolatility,
    analyzePortfolio,
    type OptionParameters,
    type OptionAnalysis,
    type PortfolioAnalysis,
    OPTIMAL_PARAMETERS
} from '../lib/index.js';

// ===== BASIC USAGE WITH TYPE SAFETY =====

// Define option parameters with full type checking
const appleCallParams: OptionParameters = {
    symbol: 'AAPL',
    stockPrice: 150.00,
    strikePrice: 155.00,
    daysToExpiry: 30,
    volatility: 0.25,
    optionType: 'call'
    // riskFreeRate and dividendYield will use optimal defaults
};

// Quick pricing with type safety
const price: number = priceOption(appleCallParams);
console.log(`AAPL Call Price: $${price.toFixed(2)}`);

// ===== COMPREHENSIVE ANALYSIS =====

// Create option instance for detailed analysis
const appleCall = createOption(appleCallParams);

// All methods are now type-safe
const binomialPrice: number = appleCall.binomialPrice(100); // 100 steps
const blackScholesPrice: number = appleCall.blackScholesPrice();
const isITM: boolean = appleCall.isITM();
const greeks = appleCall.binomialGreeks(); // Type: Greeks

console.log('=== AAPL Call Analysis ===');
console.log(`Binomial Price: $${binomialPrice.toFixed(2)}`);
console.log(`Black-Scholes Price: $${blackScholesPrice.toFixed(2)}`);
console.log(`Is ITM: ${isITM}`);
console.log(`Delta: ${greeks.delta.toFixed(4)}`);
console.log(`Gamma: ${greeks.gamma.toFixed(4)}`);
console.log(`Theta: $${greeks.theta.toFixed(2)} per day`);

// ===== FULL ANALYSIS WITH TYPES =====

const analysis: OptionAnalysis = analyzeOption({
    symbol: 'MSFT',
    stockPrice: 300.00,
    strikePrice: 310.00,
    daysToExpiry: 45,
    volatility: 0.30,
    optionType: 'put'
});

console.log('\n=== MSFT Put Analysis ===');
console.log(`Price: $${analysis.pricing.binomial.toFixed(2)}`);
console.log(`Intrinsic Value: $${analysis.pricing.intrinsic.toFixed(2)}`);
console.log(`Time Value: $${analysis.pricing.timeValue.toFixed(2)}`);
console.log(`Moneyness: ${analysis.characteristics.moneyness.toFixed(3)}`);
console.log(`Greeks - Delta: ${analysis.greeks.delta.toFixed(4)}, Vega: ${analysis.greeks.vega.toFixed(4)}`);

// ===== IMPLIED VOLATILITY CALCULATION =====

const impliedVol: number = getImpliedVolatility({
    marketPrice: 8.50,
    symbol: 'SPY',
    stockPrice: 450.00,
    strikePrice: 460.00,
    daysToExpiry: 21,
    optionType: 'call'
});

console.log(`\n=== Implied Volatility ===`);
console.log(`SPY Call IV: ${(impliedVol * 100).toFixed(2)}%`);

// ===== PORTFOLIO ANALYSIS =====

const portfolioOptions: OptionParameters[] = [
    {
        symbol: 'AAPL',
        stockPrice: 150.00,
        strikePrice: 160.00,
        daysToExpiry: 30,
        volatility: 0.25,
        optionType: 'call'
    },
    {
        symbol: 'MSFT',
        stockPrice: 300.00,
        strikePrice: 290.00,
        daysToExpiry: 45,
        volatility: 0.30,
        optionType: 'put'
    },
    {
        symbol: 'NVDA',
        stockPrice: 800.00,
        strikePrice: 850.00,
        daysToExpiry: 60,
        volatility: 0.40,
        optionType: 'call'
    }
];

const portfolio: PortfolioAnalysis = analyzePortfolio(portfolioOptions);

console.log('\n=== Portfolio Analysis ===');
console.log(`Total Value: $${portfolio.totalValue.toFixed(2)}`);
console.log(`Number of Options: ${portfolio.optionCount}`);
console.log(`Portfolio Delta: ${portfolio.portfolioGreeks.delta.toFixed(4)}`);
console.log(`Portfolio Vega: ${portfolio.portfolioGreeks.vega.toFixed(2)}`);
console.log(`Call Count: ${portfolio.summary.callCount}`);
console.log(`Put Count: ${portfolio.summary.putCount}`);

// ===== TYPE-SAFE CONFIGURATION =====

// Access validated parameters with full typing
console.log('\n=== Optimal Parameters ===');
console.log(`Risk-Free Rate: ${(OPTIMAL_PARAMETERS.riskFreeRate * 100).toFixed(2)}%`);
console.log(`Optimal Steps: ${OPTIMAL_PARAMETERS.steps}`);
console.log(`Day Count: ${OPTIMAL_PARAMETERS.dayCount}`);
console.log(`Exercise Style: ${OPTIMAL_PARAMETERS.exerciseStyle}`);

// ===== ERROR HANDLING WITH TYPES =====

try {
    // This will provide compile-time type checking
    const invalidOption = createOption({
        symbol: 'TEST',
        stockPrice: 100,
        strikePrice: 105,
        daysToExpiry: 30,
        volatility: 0.25,
        optionType: 'call', // Type-safe: only 'call' or 'put' allowed
        exerciseStyle: 'american' // Type-safe: only 'american' or 'european' allowed
    });
    
    const testPrice = invalidOption.binomialPrice();
    console.log(`\nTest Option Price: $${testPrice.toFixed(2)}`);
    
} catch (error) {
    console.error('Error pricing option:', error.message);
}

// ===== ADVANCED USAGE EXAMPLES =====

// Using specific exercise style
const europeanOption = createOption({
    symbol: 'SPY',
    stockPrice: 450,
    strikePrice: 455,
    daysToExpiry: 14,
    volatility: 0.20,
    optionType: 'call',
    exerciseStyle: 'european'
});

console.log(`\n=== European vs American Pricing ===`);
console.log(`European Call: $${europeanOption.binomialPrice().toFixed(2)}`);

// Change to American style
const americanOption = createOption({
    ...appleCallParams,
    exerciseStyle: 'american'
});
console.log(`American Call: $${americanOption.binomialPrice().toFixed(2)}`);

// ===== DEMONSTRATING TYPE SAFETY =====

// These would cause TypeScript compilation errors:
// 
// const badOption = createOption({
//     optionType: 'invalid',  // Error: Type '"invalid"' is not assignable to type 'OptionType'
//     exerciseStyle: 'other'  // Error: Type '"other"' is not assignable to type 'ExerciseStyle'
// });
//
// const wrongGreeks: Greeks = appleCall.binomialPrice(); // Error: Type 'number' is not assignable to type 'Greeks'

console.log('\n✅ TypeScript example completed successfully with full type safety!');

export {
    appleCall,
    analysis,
    portfolio,
    impliedVol
};