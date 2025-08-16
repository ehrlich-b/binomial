#!/usr/bin/env node

/**
 * @fileoverview Basic usage examples for the Binomial Options Library
 * @author Binomial Options Project
 * @version 2.0.0
 */

import { 
    priceOption, 
    createOption, 
    getImpliedVolatility, 
    analyzeOption,
    analyzePortfolio,
    OPTIMAL_PARAMETERS,
    LIBRARY_INFO
} from '../lib/index.js';

console.log('🚀 Binomial Options Pricing Library Examples');
console.log('='.repeat(50));
console.log(`Version: ${LIBRARY_INFO.version}`);
console.log(`Features: ${LIBRARY_INFO.features.length} core features`);
console.log('');

// Example 1: Quick option pricing
console.log('📊 Example 1: Quick Option Pricing');
console.log('-'.repeat(30));

const quickPrice = priceOption({
    symbol: 'AAPL',
    stockPrice: 150,
    strikePrice: 155,
    daysToExpiry: 30,
    volatility: 0.25,
    optionType: 'call'
});

console.log(`AAPL Call (150/155, 30 days, 25% vol): $${quickPrice.toFixed(2)}`);
console.log('');

// Example 2: Detailed option analysis
console.log('🔍 Example 2: Detailed Option Analysis');
console.log('-'.repeat(30));

const option = createOption({
    symbol: 'MSFT',
    stockPrice: 300,
    strikePrice: 310,
    daysToExpiry: 45,
    volatility: 0.30,
    optionType: 'put'
});

const summary = option.summary();
console.log(`${summary.symbol} ${summary.optionType.toUpperCase()} ${summary.parameters.strikePrice}`);
console.log(`Binomial Price: $${summary.pricing.binomial.toFixed(2)}`);
console.log(`Black-Scholes: $${summary.pricing.blackScholes.toFixed(2)}`);
console.log(`Intrinsic: $${summary.pricing.intrinsic.toFixed(2)}`);
console.log(`Time Value: $${summary.pricing.timeValue.toFixed(2)}`);
console.log(`Delta: ${summary.greeks.delta.toFixed(4)}`);
console.log(`Gamma: ${summary.greeks.gamma.toFixed(6)}`);
console.log(`Theta: ${summary.greeks.theta.toFixed(4)}/day`);
console.log(`Vega: ${summary.greeks.vega.toFixed(4)}/%`);
console.log(`Moneyness: ${summary.characteristics.moneyness.toFixed(3)}`);
console.log('');

// Example 3: Implied volatility calculation
console.log('📈 Example 3: Implied Volatility');
console.log('-'.repeat(30));

try {
    const iv = getImpliedVolatility({
        marketPrice: 8.50,
        symbol: 'SPY',
        stockPrice: 450,
        strikePrice: 460,
        daysToExpiry: 21,
        optionType: 'call'
    });
    
    console.log(`Market Price: $8.50`);
    console.log(`Implied Volatility: ${(iv * 100).toFixed(1)}%`);
} catch (error) {
    console.log(`IV calculation failed: ${error.message}`);
}
console.log('');

// Example 4: Portfolio analysis
console.log('📋 Example 4: Portfolio Analysis');
console.log('-'.repeat(30));

const portfolio = analyzePortfolio([
    {
        symbol: 'AAPL',
        stockPrice: 150,
        strikePrice: 160,
        daysToExpiry: 30,
        volatility: 0.25,
        optionType: 'call'
    },
    {
        symbol: 'MSFT', 
        stockPrice: 300,
        strikePrice: 290,
        daysToExpiry: 45,
        volatility: 0.30,
        optionType: 'put'
    },
    {
        symbol: 'GOOGL',
        stockPrice: 2800,
        strikePrice: 2900,
        daysToExpiry: 60,
        volatility: 0.28,
        optionType: 'call'
    }
]);

console.log(`Portfolio Value: $${portfolio.totalValue.toFixed(2)}`);
console.log(`Options Count: ${portfolio.optionCount}`);
console.log(`Calls: ${portfolio.summary.callCount}, Puts: ${portfolio.summary.putCount}`);
console.log(`Portfolio Delta: ${portfolio.portfolioGreeks.delta.toFixed(4)}`);
console.log(`Portfolio Gamma: ${portfolio.portfolioGreeks.gamma.toFixed(6)}`);
console.log(`Portfolio Theta: ${portfolio.portfolioGreeks.theta.toFixed(4)}/day`);
console.log(`Portfolio Vega: ${portfolio.portfolioGreeks.vega.toFixed(4)}/%`);
console.log('');

// Example 5: Comparing exercise styles
console.log('🔄 Example 5: American vs European Exercise');
console.log('-'.repeat(30));

const americanPut = createOption({
    stockPrice: 95,
    strikePrice: 100,
    daysToExpiry: 30,
    volatility: 0.35,
    optionType: 'put',
    exerciseStyle: 'american'
});

const europeanPut = createOption({
    stockPrice: 95,
    strikePrice: 100,
    daysToExpiry: 30,
    volatility: 0.35,
    optionType: 'put',
    exerciseStyle: 'european'
});

const americanPrice = americanPut.binomialPrice();
const europeanPrice = europeanPut.binomialPrice();
const earlyExercisePremium = americanPrice - europeanPrice;

console.log(`Deep ITM Put (S=95, K=100):`);
console.log(`American Style: $${americanPrice.toFixed(2)}`);
console.log(`European Style: $${europeanPrice.toFixed(2)}`);
console.log(`Early Exercise Premium: $${earlyExercisePremium.toFixed(2)}`);
console.log('');

// Example 6: Custom parameters
console.log('⚙️  Example 6: Custom Parameters');
console.log('-'.repeat(30));

console.log('Using validated optimal parameters:');
console.log(`Risk-free rate: ${(OPTIMAL_PARAMETERS.riskFreeRate * 100).toFixed(1)}%`);
console.log(`Day count: ${OPTIMAL_PARAMETERS.dayCount} trading days`);
console.log(`Steps: ${OPTIMAL_PARAMETERS.steps}`);
console.log(`Exercise style: ${OPTIMAL_PARAMETERS.exerciseStyle}`);

const customOption = createOption({
    stockPrice: 100,
    strikePrice: 105,
    daysToExpiry: 14,
    volatility: 0.40,
    optionType: 'call',
    riskFreeRate: 0.05,  // Custom 5% rate
    dayCount: 360,       // Custom day count
    exerciseStyle: 'european'
});

console.log(`\nCustom option price: $${customOption.binomialPrice(100).toFixed(2)}`);
console.log('');

console.log('✅ All examples completed successfully!');
console.log(`\nLibrary validated with ${LIBRARY_INFO.marketDataValidation.optionsTested.toLocaleString()} real market options`);
console.log(`Accuracy: ${LIBRARY_INFO.marketDataValidation.accuracy}`);
console.log(`Market data date: ${LIBRARY_INFO.marketDataValidation.date}`);