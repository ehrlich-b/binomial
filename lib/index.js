/**
 * @fileoverview Main entry point for the Binomial Options Pricing Library
 * @author Binomial Options Project
 * @version 2.0.0
 */

// Core pricing functions
export { binomialPrice } from '../src/core/binomial.js';
export { blackScholesPrice, blackScholesGreeks, normalCDF } from '../src/core/blackscholes.js';

// Option class
export { Option } from '../src/models/option.js';

// Import for internal use
import { Option } from '../src/models/option.js';
import { impliedVolatility } from '../src/utils/greeks.js';

// Utilities
export { 
    getDividendYield, 
    hasDividendData, 
    getAvailableSymbols,
    getDividendsByCategory,
    getDividendStats
} from '../src/utils/dividends.js';

export { 
    calculateGreeks, 
    impliedVolatility, 
    sensitivityAnalysis 
} from '../src/utils/greeks.js';

/**
 * Validated optimal parameters from market data analysis
 */
export const OPTIMAL_PARAMETERS = {
    riskFreeRate: 0.04,           // 4.0% (validated from June 24, 2024 data)
    dayCount: 252,                // 252 trading days (standard)
    steps: 50,                    // Optimal performance/accuracy trade-off
    exerciseStyle: 'american',    // Default for US equity options
    tolerance: 1e-6,              // Convergence tolerance for IV
    maxIterations: 100            // Maximum iterations for numerical methods
};

/**
 * Quick option pricing function with sensible defaults
 * @param {Object} params - Option parameters
 * @param {string} [params.symbol] - Stock symbol for dividend lookup
 * @param {number} params.stockPrice - Current stock price
 * @param {number} params.strikePrice - Strike price
 * @param {number} params.daysToExpiry - Days until expiration
 * @param {number} params.volatility - Implied volatility (decimal)
 * @param {'call'|'put'} params.optionType - Option type
 * @param {number} [params.riskFreeRate] - Risk-free rate (uses optimal default)
 * @param {number} [params.dividendYield] - Dividend yield (looked up if not provided)
 * @param {number} [params.dayCount=252] - Day count convention
 * @param {number} [params.steps=50] - Binomial steps
 * @param {'american'|'european'} [params.exerciseStyle='american'] - Exercise style
 * @returns {number} Option price
 * @example
 * import { priceOption } from './lib/index.js';
 * 
 * const price = priceOption({
 *   symbol: 'AAPL',
 *   stockPrice: 150,
 *   strikePrice: 155,
 *   daysToExpiry: 30,
 *   volatility: 0.25,
 *   optionType: 'call'
 * });
 */
export function priceOption(params) {
    const option = new Option(params);
    return option.binomialPrice(params.steps);
}

/**
 * Create an Option instance with validated parameters
 * @param {Object} params - Option parameters (same as priceOption)
 * @returns {Option} Option instance
 * @example
 * import { createOption } from './lib/index.js';
 * 
 * const option = createOption({
 *   symbol: 'MSFT',
 *   stockPrice: 300,
 *   strikePrice: 310,
 *   daysToExpiry: 45,
 *   volatility: 0.30,
 *   optionType: 'put'
 * });
 * 
 * console.log('Price:', option.binomialPrice());
 * console.log('Greeks:', option.binomialGreeks());
 * console.log('Summary:', option.summary());
 */
export function createOption(params) {
    return new Option(params);
}

/**
 * Calculate implied volatility from market price
 * @param {Object} params - Parameters including marketPrice
 * @param {number} params.marketPrice - Target market price
 * @param {string} [params.symbol] - Stock symbol for dividend lookup
 * @param {number} params.stockPrice - Current stock price
 * @param {number} params.strikePrice - Strike price
 * @param {number} params.daysToExpiry - Days until expiration
 * @param {'call'|'put'} params.optionType - Option type
 * @param {number} [params.riskFreeRate] - Risk-free rate (uses optimal default)
 * @param {number} [params.dividendYield] - Dividend yield (looked up if not provided)
 * @param {number} [params.dayCount=252] - Day count convention
 * @param {'american'|'european'} [params.exerciseStyle='american'] - Exercise style
 * @returns {number} Implied volatility (decimal)
 * @example
 * import { getImpliedVolatility } from './lib/index.js';
 * 
 * const iv = getImpliedVolatility({
 *   marketPrice: 8.50,
 *   symbol: 'SPY',
 *   stockPrice: 450,
 *   strikePrice: 460,
 *   daysToExpiry: 21,
 *   optionType: 'call'
 * });
 */
export function getImpliedVolatility({ marketPrice, ...optionParams }) {
    const option = new Option(optionParams);
    return impliedVolatility({
        marketPrice,
        stockPrice: option.stockPrice,
        strikePrice: option.strikePrice,
        timeToExpiry: option.timeToExpiry,
        riskFreeRate: option.riskFreeRate,
        dividendYield: option.dividendYield,
        optionType: option.optionType,
        exerciseStyle: option.exerciseStyle
    });
}

/**
 * Get comprehensive analysis for an option
 * @param {Object} params - Option parameters (same as priceOption)
 * @returns {Object} Complete option analysis including pricing, Greeks, and characteristics
 * @example
 * import { analyzeOption } from './lib/index.js';
 * 
 * const analysis = analyzeOption({
 *   symbol: 'NVDA',
 *   stockPrice: 800,
 *   strikePrice: 850,
 *   daysToExpiry: 60,
 *   volatility: 0.40,
 *   optionType: 'call'
 * });
 * 
 * console.log(analysis);
 * // {
 * //   pricing: { binomial: 45.67, blackScholes: 44.32, ... },
 * //   greeks: { delta: 0.42, gamma: 0.003, ... },
 * //   characteristics: { moneyness: 0.94, isOTM: true, ... }
 * // }
 */
export function analyzeOption(params) {
    const option = new Option(params);
    return option.summary();
}

/**
 * Library version and metadata
 */
export const VERSION = '2.0.0';
export const LIBRARY_INFO = {
    name: 'Binomial Options Pricing Library',
    version: VERSION,
    description: 'Professional vanilla JavaScript library for options pricing using binomial and Black-Scholes models',
    features: [
        'Cox-Ross-Rubinstein binomial model',
        'Black-Scholes analytical pricing',
        'American and European exercise styles',
        'Greeks calculation via numerical differentiation',
        'Implied volatility solver',
        'Real dividend yield database (70+ stocks)',
        'Comprehensive validation with real market data',
        'Zero dependencies, runs in browser and Node.js'
    ],
    validatedParameters: OPTIMAL_PARAMETERS,
    marketDataValidation: {
        date: '2024-06-24',
        optionsTested: 671360,
        avgIVDifference: '5.0%',
        accuracy: '85% within 5% IV difference'
    }
};

/**
 * Create a portfolio of options for batch analysis
 * @param {Object[]} optionsArray - Array of option parameters
 * @returns {Object} Portfolio analysis
 * @example
 * import { analyzePortfolio } from './lib/index.js';
 * 
 * const portfolio = analyzePortfolio([
 *   { symbol: 'AAPL', stockPrice: 150, strikePrice: 160, daysToExpiry: 30, volatility: 0.25, optionType: 'call' },
 *   { symbol: 'MSFT', stockPrice: 300, strikePrice: 290, daysToExpiry: 45, volatility: 0.30, optionType: 'put' }
 * ]);
 */
export function analyzePortfolio(optionsArray) {
    const options = optionsArray.map(params => new Option(params));
    
    const analyses = options.map(option => option.summary());
    const totalValue = analyses.reduce((sum, analysis) => sum + analysis.pricing.binomial, 0);
    
    // Portfolio Greeks (sum of individual Greeks)
    const portfolioGreeks = analyses.reduce((portfolio, analysis) => {
        portfolio.delta += analysis.greeks.delta;
        portfolio.gamma += analysis.greeks.gamma;
        portfolio.theta += analysis.greeks.theta;
        portfolio.vega += analysis.greeks.vega;
        portfolio.rho += analysis.greeks.rho;
        return portfolio;
    }, { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 });
    
    return {
        totalValue,
        optionCount: options.length,
        portfolioGreeks,
        options: analyses,
        summary: {
            callCount: analyses.filter(a => a.optionType === 'call').length,
            putCount: analyses.filter(a => a.optionType === 'put').length,
            avgDaysToExpiry: analyses.reduce((sum, a) => sum + a.parameters.daysToExpiry, 0) / analyses.length,
            avgVolatility: analyses.reduce((sum, a) => sum + a.parameters.volatility, 0) / analyses.length
        }
    };
}