/**
 * @fileoverview Greeks calculation using numerical differentiation
 * @author Binomial Options Project
 * @version 2.0.0
 */

import { binomialPrice } from '../core/binomial.js';

/**
 * Calculate option Greeks using numerical differentiation
 * @param {Object} params - Option parameters
 * @param {number} params.stockPrice - Current stock price
 * @param {number} params.strikePrice - Strike price
 * @param {number} params.timeToExpiry - Time to expiry in years
 * @param {number} params.riskFreeRate - Risk-free rate
 * @param {number} params.volatility - Volatility
 * @param {number} params.dividendYield - Dividend yield
 * @param {'call'|'put'} params.optionType - Option type
 * @param {'american'|'european'} params.exerciseStyle - Exercise style
 * @param {number} [params.steps=100] - Binomial steps
 * @param {number} [params.epsilon=0.01] - Perturbation size for numerical differentiation
 * @returns {Object} Greeks values
 */
export function calculateGreeks({
    stockPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    volatility,
    dividendYield,
    optionType,
    exerciseStyle = 'american',
    steps = 100,
    epsilon = 0.01
}) {
    // Base option price
    const basePrice = binomialPrice({
        stockPrice,
        strikePrice,
        timeToExpiry,
        riskFreeRate,
        volatility,
        dividendYield,
        steps,
        optionType,
        exerciseStyle
    });

    // Delta: ∂V/∂S
    const priceUp = binomialPrice({
        stockPrice: stockPrice * (1 + epsilon),
        strikePrice,
        timeToExpiry,
        riskFreeRate,
        volatility,
        dividendYield,
        steps,
        optionType,
        exerciseStyle
    });
    
    const priceDown = binomialPrice({
        stockPrice: stockPrice * (1 - epsilon),
        strikePrice,
        timeToExpiry,
        riskFreeRate,
        volatility,
        dividendYield,
        steps,
        optionType,
        exerciseStyle
    });
    
    const delta = (priceUp - priceDown) / (2 * stockPrice * epsilon);

    // Gamma: ∂²V/∂S²
    const gamma = (priceUp - 2 * basePrice + priceDown) / Math.pow(stockPrice * epsilon, 2);

    // Vega: ∂V/∂σ
    const vegaUp = binomialPrice({
        stockPrice,
        strikePrice,
        timeToExpiry,
        riskFreeRate,
        volatility: volatility + epsilon,
        dividendYield,
        steps,
        optionType,
        exerciseStyle
    });
    
    const vega = (vegaUp - basePrice) / epsilon;

    // Theta: ∂V/∂T (negative because time decreases)
    const timeEpsilon = Math.min(epsilon, timeToExpiry * 0.1); // Don't go negative
    const thetaDown = binomialPrice({
        stockPrice,
        strikePrice,
        timeToExpiry: timeToExpiry - timeEpsilon,
        riskFreeRate,
        volatility,
        dividendYield,
        steps,
        optionType,
        exerciseStyle
    });
    
    const theta = -(basePrice - thetaDown) / timeEpsilon;

    // Rho: ∂V/∂r
    const rhoUp = binomialPrice({
        stockPrice,
        strikePrice,
        timeToExpiry,
        riskFreeRate: riskFreeRate + epsilon,
        volatility,
        dividendYield,
        steps,
        optionType,
        exerciseStyle
    });
    
    const rho = (rhoUp - basePrice) / epsilon;

    return {
        price: basePrice,
        delta: delta,
        gamma: gamma,
        theta: theta / 365, // Convert to per-day
        vega: vega / 100,   // Convert to per-percentage point
        rho: rho / 100      // Convert to per-percentage point
    };
}

/**
 * Calculate implied volatility using bisection method
 * @param {Object} params - Parameters for IV calculation
 * @param {number} params.marketPrice - Target option price
 * @param {number} params.stockPrice - Stock price
 * @param {number} params.strikePrice - Strike price
 * @param {number} params.timeToExpiry - Time to expiry in years
 * @param {number} params.riskFreeRate - Risk-free rate
 * @param {number} params.dividendYield - Dividend yield
 * @param {'call'|'put'} params.optionType - Option type
 * @param {'american'|'european'} params.exerciseStyle - Exercise style
 * @param {number} [params.steps=100] - Binomial steps
 * @param {number} [params.tolerance=1e-6] - Convergence tolerance
 * @param {number} [params.maxIterations=100] - Maximum iterations
 * @param {number} [params.minVol=0.001] - Minimum volatility
 * @param {number} [params.maxVol=5.0] - Maximum volatility
 * @returns {number} Implied volatility
 * @throws {Error} If convergence fails
 */
export function impliedVolatility({
    marketPrice,
    stockPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    dividendYield,
    optionType,
    exerciseStyle = 'american',
    steps = 100,
    tolerance = 1e-6,
    maxIterations = 100,
    minVol = 0.001,
    maxVol = 5.0
}) {
    // Validate inputs
    if (marketPrice <= 0) {
        throw new Error('Market price must be positive');
    }
    
    const intrinsic = optionType === 'call' 
        ? Math.max(stockPrice - strikePrice, 0)
        : Math.max(strikePrice - stockPrice, 0);
        
    if (marketPrice < intrinsic) {
        throw new Error(`Market price (${marketPrice}) below intrinsic value (${intrinsic})`);
    }
    
    // Price function
    const priceFunction = (vol) => binomialPrice({
        stockPrice,
        strikePrice,
        timeToExpiry,
        riskFreeRate,
        volatility: vol,
        dividendYield,
        steps,
        optionType,
        exerciseStyle
    });
    
    // Check bounds
    const priceLow = priceFunction(minVol);
    const priceHigh = priceFunction(maxVol);
    
    if (marketPrice < priceLow) {
        return minVol; // Market price too low
    }
    
    if (marketPrice > priceHigh) {
        return maxVol; // Market price too high
    }
    
    // Bisection method
    let low = minVol;
    let high = maxVol;
    
    for (let i = 0; i < maxIterations; i++) {
        const mid = (low + high) / 2;
        const price = priceFunction(mid);
        const diff = price - marketPrice;
        
        if (Math.abs(diff) < tolerance) {
            return mid;
        }
        
        if (diff > 0) {
            high = mid;
        } else {
            low = mid;
        }
    }
    
    // Return best estimate if no convergence
    return (low + high) / 2;
}

/**
 * Calculate Greeks sensitivity analysis
 * @param {Object} baseParams - Base option parameters
 * @param {Object} [ranges] - Ranges for sensitivity analysis
 * @param {number[]} [ranges.stockPrices] - Stock price multipliers
 * @param {number[]} [ranges.volatilities] - Volatility changes
 * @param {number[]} [ranges.timeDecays] - Time decay days
 * @returns {Object} Sensitivity analysis results
 */
export function sensitivityAnalysis(baseParams, ranges = {}) {
    const {
        stockPrices = [0.95, 0.975, 1.0, 1.025, 1.05],
        volatilities = [-0.05, -0.025, 0, 0.025, 0.05],
        timeDecays = [0, 1, 7, 14, 30]
    } = ranges;
    
    const basePrice = binomialPrice(baseParams);
    const results = {
        basePrice,
        stockPriceSensitivity: [],
        volatilitySensitivity: [],
        timeDecaySensitivity: []
    };
    
    // Stock price sensitivity
    for (const multiplier of stockPrices) {
        const price = binomialPrice({
            ...baseParams,
            stockPrice: baseParams.stockPrice * multiplier
        });
        
        results.stockPriceSensitivity.push({
            stockPrice: baseParams.stockPrice * multiplier,
            multiplier,
            price,
            change: price - basePrice,
            percentChange: ((price - basePrice) / basePrice) * 100
        });
    }
    
    // Volatility sensitivity
    for (const volChange of volatilities) {
        const price = binomialPrice({
            ...baseParams,
            volatility: baseParams.volatility + volChange
        });
        
        results.volatilitySensitivity.push({
            volatility: baseParams.volatility + volChange,
            change: volChange,
            price,
            priceDiff: price - basePrice,
            percentChange: ((price - basePrice) / basePrice) * 100
        });
    }
    
    // Time decay sensitivity
    for (const days of timeDecays) {
        const newTime = Math.max(0.001, baseParams.timeToExpiry - (days / 365));
        const price = binomialPrice({
            ...baseParams,
            timeToExpiry: newTime
        });
        
        results.timeDecaySensitivity.push({
            daysDecayed: days,
            timeToExpiry: newTime,
            price,
            change: price - basePrice,
            percentChange: ((price - basePrice) / basePrice) * 100
        });
    }
    
    return results;
}