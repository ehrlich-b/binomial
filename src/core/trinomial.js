/**
 * @fileoverview Trinomial tree option pricing implementation
 * @author Binomial Options Project
 * @version 2.0.0
 */

/**
 * Calculate option price using trinomial tree model
 * Provides better accuracy than binomial, especially for path-dependent options
 * @param {Object} params - Option pricing parameters
 * @param {number} params.stockPrice - Current stock price
 * @param {number} params.strikePrice - Option strike price
 * @param {number} params.timeToExpiry - Time to expiration in years
 * @param {number} params.riskFreeRate - Risk-free interest rate (decimal)
 * @param {number} params.volatility - Volatility (decimal)
 * @param {number} params.dividendYield - Dividend yield (decimal, default: 0)
 * @param {number} params.steps - Number of trinomial steps (default: 50)
 * @param {'call'|'put'} params.optionType - Type of option
 * @param {'american'|'european'} params.exerciseStyle - Exercise style (default: 'american')
 * @returns {number} Option price
 * @throws {Error} If parameters are invalid
 */
export function trinomialPrice({
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

    // Trinomial parameters
    const dt = timeToExpiry / steps;
    const nu = riskFreeRate - dividendYield - 0.5 * volatility * volatility;
    const dxu = volatility * Math.sqrt(3 * dt);
    const dxd = -dxu;
    const pu = 0.5 * ((volatility * volatility * dt + nu * nu * dt * dt) / (dxu * dxu) + nu * dt / dxu);
    const pd = 0.5 * ((volatility * volatility * dt + nu * nu * dt * dt) / (dxu * dxu) - nu * dt / dxu);
    const pm = 1 - pu - pd;
    const discount = Math.exp(-riskFreeRate * dt);

    // Validate probabilities
    if (pu < 0 || pd < 0 || pm < 0 || pu > 1 || pd > 1 || pm > 1) {
        throw new Error(`Invalid trinomial probabilities: pu=${pu.toFixed(4)}, pm=${pm.toFixed(4)}, pd=${pd.toFixed(4)}`);
    }

    // Initialize stock prices at maturity
    const stockPrices = new Array(2 * steps + 1);
    const optionValues = new Array(2 * steps + 1);

    // Calculate stock prices at final nodes
    for (let i = 0; i <= 2 * steps; i++) {
        const j = i - steps; // j ranges from -steps to +steps
        stockPrices[i] = stockPrice * Math.exp(j * dxu);
        optionValues[i] = calculateIntrinsicValue(stockPrices[i], strikePrice, optionType);
    }

    // Step backwards through the tree
    for (let step = steps - 1; step >= 0; step--) {
        const newValues = new Array(2 * step + 1);
        
        for (let i = 0; i <= 2 * step; i++) {
            const j = i - step; // Node position ranges from -step to +step
            const currentStockPrice = stockPrice * Math.exp(j * dxu);
            
            // Calculate continuation value by looking at three possible outcomes
            const downIndex = i;      // down movement
            const middleIndex = i + 1; // middle (no movement)
            const upIndex = i + 2;     // up movement
            
            const continuationValue = discount * (
                pd * optionValues[downIndex] + 
                pm * optionValues[middleIndex] + 
                pu * optionValues[upIndex]
            );

            if (exerciseStyle === 'european') {
                newValues[i] = continuationValue;
            } else {
                // American option: max of continuation vs early exercise
                const intrinsicValue = calculateIntrinsicValue(currentStockPrice, strikePrice, optionType);
                newValues[i] = Math.max(continuationValue, intrinsicValue);
            }
        }
        
        // Copy new values back
        optionValues.length = 2 * step + 1;
        for (let i = 0; i <= 2 * step; i++) {
            optionValues[i] = newValues[i];
        }
    }

    return optionValues[0];
}

/**
 * Calculate intrinsic value of an option
 * @param {number} stockPrice - Current stock price
 * @param {number} strikePrice - Strike price
 * @param {string} optionType - 'call' or 'put'
 * @returns {number} Intrinsic value
 */
function calculateIntrinsicValue(stockPrice, strikePrice, optionType) {
    if (optionType.toLowerCase() === 'call') {
        return Math.max(stockPrice - strikePrice, 0);
    } else {
        return Math.max(strikePrice - stockPrice, 0);
    }
}

/**
 * Validate input parameters for trinomial pricing
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
    if (stockPrice <= 0) {
        throw new Error('Stock price must be positive');
    }
    if (strikePrice <= 0) {
        throw new Error('Strike price must be positive');
    }
    if (timeToExpiry <= 0) {
        throw new Error('Time to expiry must be positive');
    }
    if (volatility <= 0) {
        throw new Error('Volatility must be positive');
    }
    if (dividendYield < 0) {
        throw new Error('Dividend yield cannot be negative');
    }
    if (steps <= 0 || !Number.isInteger(steps)) {
        throw new Error('Steps must be a positive integer');
    }
    if (!['call', 'put'].includes(optionType.toLowerCase())) {
        throw new Error('Option type must be "call" or "put"');
    }
    if (!['american', 'european'].includes(exerciseStyle.toLowerCase())) {
        throw new Error('Exercise style must be "american" or "european"');
    }
}

/**
 * Calculate trinomial Greeks using numerical differentiation
 * @param {Object} params - Trinomial pricing parameters
 * @returns {Object} Greeks values
 */
export function trinomialGreeks(params) {
    const h = 0.01; // Small change for numerical differentiation
    const basePrice = trinomialPrice(params);

    // Delta: ∂V/∂S
    const upPrice = trinomialPrice({ ...params, stockPrice: params.stockPrice * (1 + h) });
    const downPrice = trinomialPrice({ ...params, stockPrice: params.stockPrice * (1 - h) });
    const delta = (upPrice - downPrice) / (2 * params.stockPrice * h);

    // Gamma: ∂²V/∂S²
    const gamma = (upPrice - 2 * basePrice + downPrice) / Math.pow(params.stockPrice * h, 2);

    // Theta: ∂V/∂t (negative because time decreases)
    const timeShift = Math.min(1/365, params.timeToExpiry * 0.01); // 1 day or 1% of time
    const futurePrice = trinomialPrice({ ...params, timeToExpiry: params.timeToExpiry - timeShift });
    const theta = -(futurePrice - basePrice) / timeShift / 365; // Per day

    // Vega: ∂V/∂σ
    const volUp = trinomialPrice({ ...params, volatility: params.volatility + h });
    const volDown = trinomialPrice({ ...params, volatility: params.volatility - h });
    const vega = (volUp - volDown) / (2 * h * 100); // Per 1% volatility change

    // Rho: ∂V/∂r
    const rateUp = trinomialPrice({ ...params, riskFreeRate: params.riskFreeRate + h });
    const rateDown = trinomialPrice({ ...params, riskFreeRate: params.riskFreeRate - h });
    const rho = (rateUp - rateDown) / (2 * h * 100); // Per 1% rate change

    return {
        delta: delta,
        gamma: gamma,
        theta: theta,
        vega: vega,
        rho: rho
    };
}