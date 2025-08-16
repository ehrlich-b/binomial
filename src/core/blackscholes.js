/**
 * @fileoverview Black-Scholes option pricing model for European options
 * @author Binomial Options Project
 * @version 2.0.0
 */

/**
 * Calculate European option price using Black-Scholes formula
 * @param {Object} params - Option pricing parameters
 * @param {number} params.stockPrice - Current stock price
 * @param {number} params.strikePrice - Option strike price
 * @param {number} params.timeToExpiry - Time to expiration in years
 * @param {number} params.riskFreeRate - Risk-free interest rate (decimal)
 * @param {number} params.volatility - Volatility (decimal)
 * @param {number} params.dividendYield - Dividend yield (decimal, default: 0)
 * @param {'call'|'put'} params.optionType - Type of option
 * @returns {number} Option price
 * @throws {Error} If parameters are invalid
 */
export function blackScholesPrice({
    stockPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    volatility,
    dividendYield = 0,
    optionType
}) {
    // Input validation
    if (stockPrice <= 0 || strikePrice <= 0 || timeToExpiry <= 0 || volatility <= 0) {
        throw new Error('Stock price, strike price, time to expiry, and volatility must be positive');
    }
    
    if (!['call', 'put'].includes(optionType)) {
        throw new Error("Option type must be 'call' or 'put'");
    }

    // Calculate d1 and d2
    const d1 = (Math.log(stockPrice / strikePrice) + 
                (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiry) / 
               (volatility * Math.sqrt(timeToExpiry));
    
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);
    
    // Calculate option price
    if (optionType === 'call') {
        return stockPrice * Math.exp(-dividendYield * timeToExpiry) * normalCDF(d1) - 
               strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(d2);
    } else {
        return strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(-d2) - 
               stockPrice * Math.exp(-dividendYield * timeToExpiry) * normalCDF(-d1);
    }
}

/**
 * Cumulative standard normal distribution function
 * Uses Abramowitz and Stegun approximation (accurate to ~7 decimal places)
 * @param {number} x - Input value
 * @returns {number} Cumulative probability
 */
export function normalCDF(x) {
    // Constants for approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    // Save the sign of x
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);
    
    // A&S formula 7.1.26
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1.0 + sign * y);
}

/**
 * Calculate Black-Scholes Greeks
 * @param {Object} params - Same parameters as blackScholesPrice
 * @returns {Object} Greeks values (delta, gamma, theta, vega, rho)
 */
export function blackScholesGreeks({
    stockPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    volatility,
    dividendYield = 0,
    optionType
}) {
    const d1 = (Math.log(stockPrice / strikePrice) + 
                (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiry) / 
               (volatility * Math.sqrt(timeToExpiry));
    
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);
    
    // Standard normal probability density function
    const pdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    
    const nd1 = normalCDF(d1);
    const nd2 = normalCDF(d2);
    const npdf_d1 = pdf(d1);
    
    const discountFactor = Math.exp(-dividendYield * timeToExpiry);
    const discountRate = Math.exp(-riskFreeRate * timeToExpiry);
    
    let delta, theta, rho;
    
    if (optionType === 'call') {
        delta = discountFactor * nd1;
        theta = (-stockPrice * npdf_d1 * volatility * discountFactor) / (2 * Math.sqrt(timeToExpiry))
                - riskFreeRate * strikePrice * discountRate * nd2
                + dividendYield * stockPrice * discountFactor * nd1;
        rho = strikePrice * timeToExpiry * discountRate * nd2;
    } else {
        delta = discountFactor * (nd1 - 1);
        theta = (-stockPrice * npdf_d1 * volatility * discountFactor) / (2 * Math.sqrt(timeToExpiry))
                + riskFreeRate * strikePrice * discountRate * normalCDF(-d2)
                - dividendYield * stockPrice * discountFactor * normalCDF(-d1);
        rho = -strikePrice * timeToExpiry * discountRate * normalCDF(-d2);
    }
    
    const gamma = (discountFactor * npdf_d1) / (stockPrice * volatility * Math.sqrt(timeToExpiry));
    const vega = stockPrice * discountFactor * npdf_d1 * Math.sqrt(timeToExpiry);
    
    return {
        delta: delta,
        gamma: gamma,
        theta: theta / 365, // Convert to per-day
        vega: vega / 100,   // Convert to per-percentage point
        rho: rho / 100      // Convert to per-percentage point
    };
}