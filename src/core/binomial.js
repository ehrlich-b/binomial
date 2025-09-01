/**
 * @fileoverview Core binomial option pricing implementation using Cox-Ross-Rubinstein model
 * @author Binomial Options Project
 * @version 2.0.0
 */

/**
 * Calculate option price using the Cox-Ross-Rubinstein binomial model
 * @param {Object} params - Option pricing parameters
 * @param {number} params.stockPrice - Current stock price
 * @param {number} params.strikePrice - Option strike price
 * @param {number} params.timeToExpiry - Time to expiration in years
 * @param {number} params.riskFreeRate - Risk-free interest rate (decimal)
 * @param {number} params.volatility - Volatility (decimal)
 * @param {number} params.dividendYield - Dividend yield (decimal, default: 0)
 * @param {number} params.steps - Number of binomial steps (default: 50)
 * @param {'call'|'put'} params.optionType - Type of option
 * @param {'american'|'european'} params.exerciseStyle - Exercise style (default: 'american')
 * @returns {number} Option price
 * @throws {Error} If parameters are invalid
 */
export function binomialPrice({
    stockPrice,
    strikePrice, 
    timeToExpiry,
    riskFreeRate,
    volatility,
    dividendYield = 0,
    steps = 50,
    optionType,
    exerciseStyle = 'american'
}) {
    // Input validation
    validateInputs({
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

    // Cox-Ross-Rubinstein parameters
    const dt = timeToExpiry / steps;
    const u = Math.exp(volatility * Math.sqrt(dt));
    const d = 1 / u;
    const p = (Math.exp((riskFreeRate - dividendYield) * dt) - d) / (u - d);
    const discount = Math.exp(-riskFreeRate * dt);

    // Validate risk-neutral probability
    if (p < 0 || p > 1) {
        throw new Error(`Invalid risk-neutral probability p=${p.toFixed(6)} with dt=${dt.toExponential()}, u=${u.toFixed(6)}, d=${d.toFixed(6)}. Check (r−q), σ, or steps.`);
    }

    // Initialize option values at maturity
    const optionValues = new Array(steps + 1);
    
    for (let i = 0; i <= steps; i++) {
        const finalPrice = stockPrice * Math.pow(u, i) * Math.pow(d, steps - i);
        optionValues[i] = calculateIntrinsicValue(finalPrice, strikePrice, optionType);
    }

    // Step backwards through the tree
    for (let step = steps - 1; step >= 0; step--) {
        for (let i = 0; i <= step; i++) {
            // Continuation value (discounted expected value)
            const continuationValue = discount * (p * optionValues[i + 1] + (1 - p) * optionValues[i]);
            
            if (exerciseStyle === 'european') {
                optionValues[i] = continuationValue;
            } else {
                // American option: max of continuation vs early exercise
                const currentPrice = stockPrice * Math.pow(u, i) * Math.pow(d, step - i);
                const intrinsicValue = calculateIntrinsicValue(currentPrice, strikePrice, optionType);
                optionValues[i] = Math.max(continuationValue, intrinsicValue);
            }
        }
    }

    return optionValues[0];
}

/**
 * Calculate intrinsic value of an option
 * @param {number} stockPrice - Current stock price
 * @param {number} strikePrice - Strike price
 * @param {'call'|'put'} optionType - Option type
 * @returns {number} Intrinsic value
 */
function calculateIntrinsicValue(stockPrice, strikePrice, optionType) {
    if (optionType === 'call') {
        return Math.max(stockPrice - strikePrice, 0);
    } else {
        return Math.max(strikePrice - stockPrice, 0);
    }
}

/**
 * Validate input parameters
 * @param {Object} params - Parameters to validate
 * @throws {Error} If any parameter is invalid
 */
function validateInputs({
    stockPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    volatility,
    dividendYield,
    steps,
    optionType,
    exerciseStyle
}) {
    const errors = [];

    if (typeof stockPrice !== 'number' || stockPrice <= 0) {
        errors.push('Stock price must be a positive number');
    }
    
    if (typeof strikePrice !== 'number' || strikePrice <= 0) {
        errors.push('Strike price must be a positive number');
    }
    
    if (typeof timeToExpiry !== 'number' || timeToExpiry <= 0 || timeToExpiry > 10) {
        errors.push('Time to expiry must be between 0 and 10 years');
    }
    
    if (typeof riskFreeRate !== 'number' || riskFreeRate < 0 || riskFreeRate > 1) {
        errors.push('Risk-free rate must be between 0 and 100%');
    }
    
    if (typeof volatility !== 'number' || volatility <= 0 || volatility > 5) {
        errors.push('Volatility must be between 0 and 500%');
    }
    
    if (typeof dividendYield !== 'number' || dividendYield < 0 || dividendYield > 1) {
        errors.push('Dividend yield must be between 0 and 100%');
    }
    
    if (!Number.isInteger(steps) || steps < 1 || steps > 1000) {
        errors.push('Steps must be an integer between 1 and 1000');
    }
    
    if (!['call', 'put'].includes(optionType)) {
        errors.push("Option type must be 'call' or 'put'");
    }
    
    if (!['american', 'european'].includes(exerciseStyle)) {
        errors.push("Exercise style must be 'american' or 'european'");
    }

    if (errors.length > 0) {
        throw new Error(`Invalid parameters: ${errors.join(', ')}`);
    }
}