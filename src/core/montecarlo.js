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
        if (useAntithetic) {
            // Generate paired paths
            const [pA, pB] = simulatePairedPaths(stockPrice, drift, diffusion, timeSteps, rng);
            payoffs.push(calculatePayoff(pA, strikePrice, optionType));
            payoffs.push(calculatePayoff(pB, strikePrice, optionType));
            
            // Control variate for both paths
            if (useControlVariate) {
                controlPayoffs.push(calculateControlVariatePayoff(pA, params));
                controlPayoffs.push(calculateControlVariatePayoff(pB, params));
            }
        } else {
            // Generate single path
            const finalPrice = simulateStockPath(stockPrice, drift, diffusion, timeSteps, rng);
            const payoff = calculatePayoff(finalPrice, strikePrice, optionType);
            payoffs.push(payoff);
            
            // Control variate
            if (useControlVariate) {
                const controlPayoff = calculateControlVariatePayoff(finalPrice, params);
                controlPayoffs.push(controlPayoff);
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
 * Simulate paired paths (original and antithetic) for variance reduction
 */
function simulatePairedPaths(initialPrice, drift, diffusion, timeSteps, rng) {
    let p1 = initialPrice;
    let p2 = initialPrice;
    
    for (let t = 0; t < timeSteps; t++) {
        const z = rng.normal();
        p1 *= Math.exp(drift + diffusion * z);
        p2 *= Math.exp(drift - diffusion * z); // antithetic
    }
    
    return [p1, p2];
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
 * Calculate control variate payoff (terminal stock price as control)
 */
function calculateControlVariatePayoff(stockPriceT, { stockPrice, dividendYield = 0, timeToExpiry, riskFreeRate }) {
    // Control variable C = e^{-rT} S_T, E[C] = S0 e^{-qT}
    const discountFactor = Math.exp(-riskFreeRate * timeToExpiry);
    return discountFactor * stockPriceT;
}

/**
 * Apply control variate variance reduction
 */
function applyControlVariate(payoffs, controlPayoffs, params) {
    const n = payoffs.length;
    const meanX = payoffs.reduce((a, b) => a + b, 0) / n;
    const meanC = controlPayoffs.reduce((a, b) => a + b, 0) / n;
    
    let cov = 0;
    let varC = 0;
    
    for (let i = 0; i < n; i++) {
        const dx = payoffs[i] - meanX;
        const dc = controlPayoffs[i] - meanC;
        cov += dx * dc;
        varC += dc * dc;
    }
    
    cov /= (n - 1);
    varC /= (n - 1);
    
    const beta = varC > 0 ? cov / varC : 0;
    
    // Known E[C] = S0 * e^{-qT}
    const expectedC = params.stockPrice * Math.exp(-(params.dividendYield || 0) * params.timeToExpiry);
    const adjMean = meanX - beta * (meanC - expectedC);
    
    // Variance of adjusted estimator
    const varX = payoffs.reduce((s, p) => s + (p - meanX) ** 2, 0) / (n - 1);
    const corr2 = varC > 0 && varX > 0 ? (cov * cov) / (varX * varC) : 0;
    const adjVar = (varX * (1 - Math.min(1, Math.max(0, corr2)))) / n;
    
    return {
        price: adjMean, // Already discounted in control variate calculation
        variance: adjVar
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
        
        // Clamp u away from 0 to avoid log(0)
        const u = Math.max(1e-12, this.random());
        const v = Math.max(1e-12, this.random());
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
 * Helper function to generate batch of discounted payoffs
 */
function monteBatch(params, batchSize, seed) {
    const result = monteCarloPrice({ ...params, simulations: batchSize, seed });
    // Extract actual payoffs from the batch
    // For now, simulate the batch payoffs based on the result
    const payoffs = [];
    const discountFactor = Math.exp(-params.riskFreeRate * params.timeToExpiry);
    
    // Generate batch using same logic as main function
    const rng = new SimpleRNG(seed);
    const dt = params.timeToExpiry / (params.timeSteps || 1);
    const drift = (params.riskFreeRate - (params.dividendYield || 0) - 0.5 * params.volatility * params.volatility) * dt;
    const diffusion = params.volatility * Math.sqrt(dt);
    const actualSims = params.useAntithetic ? Math.floor(batchSize / 2) : batchSize;
    
    for (let i = 0; i < actualSims; i++) {
        if (params.useAntithetic) {
            const [pA, pB] = simulatePairedPaths(params.stockPrice, drift, diffusion, params.timeSteps || 1, rng);
            payoffs.push(discountFactor * calculatePayoff(pA, params.strikePrice, params.optionType));
            payoffs.push(discountFactor * calculatePayoff(pB, params.strikePrice, params.optionType));
        } else {
            const finalPrice = simulateStockPath(params.stockPrice, drift, diffusion, params.timeSteps || 1, rng);
            payoffs.push(discountFactor * calculatePayoff(finalPrice, params.strikePrice, params.optionType));
        }
    }
    
    return payoffs;
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
    let n = 0;
    let sum = 0;
    let sumsq = 0;
    const seed0 = params.seed || Math.floor(Math.random() * 1e9);
    
    while (n < maxSimulations) {
        const batch = monteBatch(params, batchSize, seed0 + n);
        for (const x of batch) {
            n++;
            sum += x;
            sumsq += x * x;
        }
        
        const mean = sum / n;
        const varHat = Math.max(0, (sumsq / n) - mean * mean);
        const se = Math.sqrt(varHat / n);
        
        if (se <= targetError) {
            return {
                price: mean,
                standardError: se,
                confidenceInterval: {
                    lower: mean - 1.96 * se,
                    upper: mean + 1.96 * se,
                    width: 3.92 * se
                },
                statistics: {
                    simulations: n,
                    variance: varHat,
                    useAntithetic: !!params.useAntithetic,
                    useControlVariate: !!params.useControlVariate,
                    convergenceRate: se * Math.sqrt(n),
                    efficiency: varHat > 0 ? 1 / (se * se) : 0
                },
                converged: true,
                totalSimulations: n,
                targetError
            };
        }
    }
    
    const mean = sum / n;
    const varHat = Math.max(0, (sumsq / n) - mean * mean);
    const se = Math.sqrt(varHat / n);
    
    return {
        price: mean,
        standardError: se,
        confidenceInterval: {
            lower: mean - 1.96 * se,
            upper: mean + 1.96 * se,
            width: 3.92 * se
        },
        statistics: {
            simulations: n,
            variance: varHat,
            useAntithetic: !!params.useAntithetic,
            useControlVariate: !!params.useControlVariate,
            convergenceRate: se * Math.sqrt(n),
            efficiency: varHat > 0 ? 1 / (se * se) : 0
        },
        converged: false,
        totalSimulations: n,
        targetError
    };
}