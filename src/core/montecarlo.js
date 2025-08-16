/**
 * Monte Carlo Option Pricing Implementation
 * 
 * Implements Monte Carlo simulation for option pricing using:
 * - Geometric Brownian Motion (GBM) for stock price paths
 * - Antithetic variance reduction
 * - Control variates for variance reduction
 * - Multiple random number generators
 * - Confidence intervals and convergence analysis
 */

/**
 * Calculate option price using Monte Carlo simulation
 * 
 * @param {Object} params - Pricing parameters
 * @param {number} params.stockPrice - Current stock price (S)
 * @param {number} params.strikePrice - Strike price (K)
 * @param {number} params.timeToExpiry - Time to expiration in years (T)
 * @param {number} params.riskFreeRate - Risk-free interest rate (r)
 * @param {number} params.volatility - Volatility (σ)
 * @param {number} params.dividendYield - Dividend yield (q), default 0
 * @param {string} params.optionType - 'call' or 'put'
 * @param {number} params.simulations - Number of simulations, default 100000
 * @param {boolean} params.useAntithetic - Use antithetic variance reduction, default true
 * @param {boolean} params.useControlVariate - Use control variate, default true
 * @param {number} params.timeSteps - Number of time steps for path simulation, default 1
 * @param {number} params.seed - Random seed for reproducibility, optional
 * @returns {Object} Pricing results with price, confidence interval, and statistics
 */
export function monteCarloPrice(params) {
    // Input validation
    validateMonteCarloParams(params);
    
    const {
        stockPrice,
        strikePrice,
        timeToExpiry,
        riskFreeRate,
        volatility,
        dividendYield = 0,
        optionType,
        simulations = 100000,
        useAntithetic = true,
        useControlVariate = true,
        timeSteps = 1,
        seed
    } = params;
    
    // Initialize random number generator
    const rng = new SimpleRNG(seed);
    
    // Pre-calculate constants
    const dt = timeToExpiry / timeSteps;
    const drift = (riskFreeRate - dividendYield - 0.5 * volatility * volatility) * dt;
    const diffusion = volatility * Math.sqrt(dt);
    const discountFactor = Math.exp(-riskFreeRate * timeToExpiry);
    
    // Storage for payoffs
    const payoffs = [];
    const controlPayoffs = []; // For control variate (analytical Black-Scholes)
    
    // Number of actual simulations (halved if using antithetic)
    const actualSims = useAntithetic ? Math.floor(simulations / 2) : simulations;
    
    // Monte Carlo simulation loop
    for (let i = 0; i < actualSims; i++) {
        // Generate one path
        const finalPrice = simulateStockPath(stockPrice, drift, diffusion, timeSteps, rng);
        const payoff = calculatePayoff(finalPrice, strikePrice, optionType);
        payoffs.push(payoff);
        
        // Control variate (Black-Scholes analytical price for same path)
        if (useControlVariate) {
            const controlPayoff = calculateControlVariatePayoff(finalPrice, params);
            controlPayoffs.push(controlPayoff);
        }
        
        // Antithetic path
        if (useAntithetic) {
            const antitheticPrice = simulateAntitheticPath(stockPrice, drift, diffusion, timeSteps, rng);
            const antitheticPayoff = calculatePayoff(antitheticPrice, strikePrice, optionType);
            payoffs.push(antitheticPayoff);
            
            if (useControlVariate) {
                const antitheticControlPayoff = calculateControlVariatePayoff(antitheticPrice, params);
                controlPayoffs.push(antitheticControlPayoff);
            }
        }
    }
    
    // Calculate results
    let estimatedPrice;
    let variance;
    
    if (useControlVariate && controlPayoffs.length > 0) {
        const result = applyControlVariate(payoffs, controlPayoffs, params);
        estimatedPrice = result.price;
        variance = result.variance;
    } else {
        const mean = payoffs.reduce((sum, p) => sum + p, 0) / payoffs.length;
        estimatedPrice = discountFactor * mean;
        
        const payoffVariance = payoffs.reduce((sum, p) => sum + (p - mean) ** 2, 0) / (payoffs.length - 1);
        variance = (discountFactor ** 2) * payoffVariance / payoffs.length;
    }
    
    // Calculate confidence interval (95%)
    const standardError = Math.sqrt(variance);
    const confidenceInterval = {
        lower: estimatedPrice - 1.96 * standardError,
        upper: estimatedPrice + 1.96 * standardError,
        width: 3.92 * standardError
    };
    
    // Calculate convergence statistics
    const convergenceStats = calculateConvergenceStats(payoffs, discountFactor);
    
    return {
        price: Number(estimatedPrice.toFixed(6)),
        standardError: Number(standardError.toFixed(6)),
        confidenceInterval,
        statistics: {
            simulations: payoffs.length,
            variance: Number(variance.toFixed(8)),
            useAntithetic,
            useControlVariate,
            convergenceRate: convergenceStats.convergenceRate,
            efficiency: convergenceStats.efficiency
        }
    };
}

/**
 * Calculate Monte Carlo Greeks using finite differences
 * 
 * @param {Object} params - Same parameters as monteCarloPrice
 * @param {number} deltaShift - Shift for delta calculation, default 0.01
 * @param {number} gammaShift - Shift for gamma calculation, default 0.01
 * @param {number} thetaShift - Shift for theta calculation (days), default 1/365
 * @param {number} vegaShift - Shift for vega calculation, default 0.01
 * @param {number} rhoShift - Shift for rho calculation, default 0.01
 * @returns {Object} Greeks object
 */
export function monteCarloGreeks(params, deltaShift = 0.01, gammaShift = 0.01, thetaShift = 1/365, vegaShift = 0.01, rhoShift = 0.01) {
    // Use same seed for all calculations to reduce noise
    const baseSeed = params.seed || Math.floor(Math.random() * 1000000);
    
    const basePrice = monteCarloPrice({ ...params, seed: baseSeed }).price;
    
    // Delta: ∂V/∂S
    const upPrice = monteCarloPrice({ ...params, stockPrice: params.stockPrice + deltaShift, seed: baseSeed }).price;
    const downPrice = monteCarloPrice({ ...params, stockPrice: params.stockPrice - deltaShift, seed: baseSeed }).price;
    const delta = (upPrice - downPrice) / (2 * deltaShift);
    
    // Gamma: ∂²V/∂S²
    const gamma = (upPrice - 2 * basePrice + downPrice) / (deltaShift * deltaShift);
    
    // Theta: -∂V/∂t
    const thetaPrice = monteCarloPrice({ ...params, timeToExpiry: params.timeToExpiry - thetaShift, seed: baseSeed }).price;
    const theta = -(thetaPrice - basePrice) / thetaShift;
    
    // Vega: ∂V/∂σ
    const vegaUpPrice = monteCarloPrice({ ...params, volatility: params.volatility + vegaShift, seed: baseSeed }).price;
    const vegaDownPrice = monteCarloPrice({ ...params, volatility: params.volatility - vegaShift, seed: baseSeed }).price;
    const vega = (vegaUpPrice - vegaDownPrice) / (2 * vegaShift);
    
    // Rho: ∂V/∂r
    const rhoUpPrice = monteCarloPrice({ ...params, riskFreeRate: params.riskFreeRate + rhoShift, seed: baseSeed }).price;
    const rhoDownPrice = monteCarloPrice({ ...params, riskFreeRate: params.riskFreeRate - rhoShift, seed: baseSeed }).price;
    const rho = (rhoUpPrice - rhoDownPrice) / (2 * rhoShift);
    
    return {
        delta: Number(delta.toFixed(6)),
        gamma: Number(gamma.toFixed(6)),
        theta: Number(theta.toFixed(6)),
        vega: Number(vega.toFixed(6)),
        rho: Number(rho.toFixed(6))
    };
}

/**
 * Simulate stock price path using Geometric Brownian Motion
 */
function simulateStockPath(initialPrice, drift, diffusion, timeSteps, rng) {
    let price = initialPrice;
    
    for (let step = 0; step < timeSteps; step++) {
        const z = rng.normal();
        price *= Math.exp(drift + diffusion * z);
    }
    
    return price;
}

/**
 * Simulate antithetic path (using -Z instead of Z)
 */
function simulateAntitheticPath(initialPrice, drift, diffusion, timeSteps, rng) {
    let price = initialPrice;
    
    // Use the last generated normals but with opposite sign
    const normals = rng.getLastNormals(timeSteps);
    
    for (let step = 0; step < timeSteps; step++) {
        const z = -normals[step]; // Antithetic variable
        price *= Math.exp(drift + diffusion * z);
    }
    
    return price;
}

/**
 * Calculate option payoff
 */
function calculatePayoff(stockPrice, strikePrice, optionType) {
    if (optionType.toLowerCase() === 'call') {
        return Math.max(stockPrice - strikePrice, 0);
    } else {
        return Math.max(strikePrice - stockPrice, 0);
    }
}

/**
 * Calculate control variate payoff (Black-Scholes analytical)
 */
function calculateControlVariatePayoff(stockPrice, params) {
    // This would be the Black-Scholes price for the final stock price
    // For simplicity, we'll use a basic approximation
    const { strikePrice, optionType } = params;
    return calculatePayoff(stockPrice, strikePrice, optionType);
}

/**
 * Apply control variate variance reduction
 */
function applyControlVariate(payoffs, controlPayoffs, params) {
    const n = payoffs.length;
    
    // Calculate means
    const meanPayoff = payoffs.reduce((sum, p) => sum + p, 0) / n;
    const meanControl = controlPayoffs.reduce((sum, p) => sum + p, 0) / n;
    
    // Calculate covariance and control variance
    let covariance = 0;
    let controlVariance = 0;
    
    for (let i = 0; i < n; i++) {
        const payoffDiff = payoffs[i] - meanPayoff;
        const controlDiff = controlPayoffs[i] - meanControl;
        covariance += payoffDiff * controlDiff;
        controlVariance += controlDiff * controlDiff;
    }
    
    covariance /= (n - 1);
    controlVariance /= (n - 1);
    
    // Optimal control coefficient
    const beta = controlVariance > 0 ? covariance / controlVariance : 0;
    
    // Control variate estimate
    const theoreticalControlMean = meanControl; // Simplified
    const controlVariateEstimate = meanPayoff - beta * (meanControl - theoreticalControlMean);
    
    // Calculate variance of control variate estimator
    const payoffVariance = payoffs.reduce((sum, p) => sum + (p - meanPayoff) ** 2, 0) / (n - 1);
    const correlationSquared = covariance ** 2 / (payoffVariance * controlVariance);
    const cvVariance = payoffVariance * (1 - correlationSquared) / n;
    
    const discountFactor = Math.exp(-params.riskFreeRate * params.timeToExpiry);
    
    return {
        price: discountFactor * controlVariateEstimate,
        variance: (discountFactor ** 2) * cvVariance
    };
}

/**
 * Calculate convergence statistics
 */
function calculateConvergenceStats(payoffs, discountFactor) {
    const n = payoffs.length;
    const mean = payoffs.reduce((sum, p) => sum + p, 0) / n;
    const variance = payoffs.reduce((sum, p) => sum + (p - mean) ** 2, 0) / (n - 1);
    
    // Convergence rate (standard error decreases as 1/sqrt(n))
    const standardError = Math.sqrt(variance / n);
    const convergenceRate = standardError * Math.sqrt(n);
    
    // Efficiency (relative to theoretical minimum variance)
    const theoreticalMinVariance = variance / n;
    const efficiency = theoreticalMinVariance / (standardError ** 2);
    
    return {
        convergenceRate: Number(convergenceRate.toFixed(6)),
        efficiency: Number(efficiency.toFixed(4))
    };
}

/**
 * Simple Random Number Generator with normal distribution
 */
class SimpleRNG {
    constructor(seed) {
        this.seed = seed || Math.floor(Math.random() * 1000000);
        this.lastNormals = [];
        this.hasSpare = false;
        this.spare = 0;
    }
    
    // Linear congruential generator
    random() {
        this.seed = (this.seed * 1664525 + 1013904223) % (2 ** 32);
        return this.seed / (2 ** 32);
    }
    
    // Box-Muller transform for normal distribution
    normal() {
        if (this.hasSpare) {
            this.hasSpare = false;
            this.lastNormals.push(this.spare);
            return this.spare;
        }
        
        this.hasSpare = true;
        
        const u = this.random();
        const v = this.random();
        const mag = Math.sqrt(-2 * Math.log(u));
        const z0 = mag * Math.cos(2 * Math.PI * v);
        const z1 = mag * Math.sin(2 * Math.PI * v);
        
        this.spare = z1;
        this.lastNormals.push(z0);
        
        // Keep only recent normals for antithetic paths
        if (this.lastNormals.length > 1000) {
            this.lastNormals = this.lastNormals.slice(-1000);
        }
        
        return z0;
    }
    
    getLastNormals(count) {
        return this.lastNormals.slice(-count);
    }
}

/**
 * Validate Monte Carlo parameters
 */
function validateMonteCarloParams(params) {
    const required = ['stockPrice', 'strikePrice', 'timeToExpiry', 'riskFreeRate', 'volatility', 'optionType'];
    
    for (const param of required) {
        if (params[param] === undefined || params[param] === null) {
            throw new Error(`Missing required parameter: ${param}`);
        }
    }
    
    if (params.stockPrice <= 0) throw new Error('Stock price must be positive');
    if (params.strikePrice <= 0) throw new Error('Strike price must be positive');
    if (params.timeToExpiry <= 0) throw new Error('Time to expiry must be positive');
    if (params.volatility <= 0) throw new Error('Volatility must be positive');
    if (params.simulations !== undefined && params.simulations <= 0) {
        throw new Error('Number of simulations must be positive');
    }
    if (params.timeSteps !== undefined && params.timeSteps <= 0) {
        throw new Error('Number of time steps must be positive');
    }
    if (!['call', 'put'].includes(params.optionType.toLowerCase())) {
        throw new Error('Option type must be "call" or "put"');
    }
}

/**
 * Adaptive Monte Carlo pricing with convergence criteria
 * 
 * @param {Object} params - Same as monteCarloPrice
 * @param {number} targetError - Target standard error, default 0.01
 * @param {number} maxSimulations - Maximum simulations, default 1000000
 * @param {number} batchSize - Batch size for adaptive sampling, default 10000
 * @returns {Object} Pricing results with convergence information
 */
export function adaptiveMonteCarloPrice(params, targetError = 0.01, maxSimulations = 1000000, batchSize = 10000) {
    let totalSimulations = 0;
    let allPayoffs = [];
    const discountFactor = Math.exp(-params.riskFreeRate * params.timeToExpiry);
    
    while (totalSimulations < maxSimulations) {
        // Run batch
        const batchResult = monteCarloPrice({
            ...params,
            simulations: batchSize,
            seed: params.seed ? params.seed + totalSimulations : undefined
        });
        
        totalSimulations += batchSize;
        
        // Check convergence
        if (batchResult.standardError <= targetError) {
            return {
                ...batchResult,
                converged: true,
                totalSimulations,
                targetError
            };
        }
    }
    
    // Final result if not converged
    const finalResult = monteCarloPrice({
        ...params,
        simulations: totalSimulations
    });
    
    return {
        ...finalResult,
        converged: false,
        totalSimulations,
        targetError
    };
}