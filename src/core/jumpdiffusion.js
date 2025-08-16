/**
 * Jump Diffusion Option Pricing Implementation
 * 
 * Implements the Merton Jump Diffusion model for option pricing.
 * This model extends Black-Scholes by incorporating sudden price jumps
 * in addition to continuous diffusion movements.
 * 
 * The model assumes:
 * - Stock price follows a jump-diffusion process
 * - Jumps arrive according to a Poisson process
 * - Jump sizes are log-normally distributed
 * - Continuous part follows geometric Brownian motion
 */

import { normalCDF } from './blackscholes.js';

/**
 * Calculate option price using Merton's Jump Diffusion model
 * 
 * @param {Object} params - Pricing parameters
 * @param {number} params.stockPrice - Current stock price (S)
 * @param {number} params.strikePrice - Strike price (K)
 * @param {number} params.timeToExpiry - Time to expiration in years (T)
 * @param {number} params.riskFreeRate - Risk-free interest rate (r)
 * @param {number} params.volatility - Volatility of continuous part (σ)
 * @param {number} params.dividendYield - Dividend yield (q), default 0
 * @param {string} params.optionType - 'call' or 'put'
 * @param {number} params.jumpIntensity - Expected number of jumps per year (λ), default 0.1
 * @param {number} params.jumpMean - Mean of log jump size (μ_J), default -0.1
 * @param {number} params.jumpVolatility - Volatility of log jump size (σ_J), default 0.15
 * @param {number} params.maxTerms - Maximum terms in infinite series, default 20
 * @returns {number} Option price
 */
export function jumpDiffusionPrice(params) {
    // Input validation
    validateJumpDiffusionParams(params);
    
    const {
        stockPrice,
        strikePrice,
        timeToExpiry,
        riskFreeRate,
        volatility,
        dividendYield = 0,
        optionType,
        jumpIntensity = 0.1,
        jumpMean = -0.1,
        jumpVolatility = 0.15,
        maxTerms = 20
    } = params;
    
    // Pre-calculate jump parameters
    const k = Math.exp(jumpMean + 0.5 * jumpVolatility * jumpVolatility) - 1; // Expected relative jump size
    const lambda_prime = jumpIntensity * (1 + k); // Risk-adjusted jump intensity
    
    let optionPrice = 0;
    let factorial = 1;
    
    // Sum over infinite series (truncated at maxTerms)
    for (let n = 0; n < maxTerms; n++) {
        if (n > 0) {
            factorial *= n;
        }
        
        // Calculate modified parameters for n jumps
        const lambda_T = lambda_prime * timeToExpiry;
        const poissonProb = Math.exp(-lambda_T) * Math.pow(lambda_T, n) / factorial;
        
        // Modified volatility and risk-free rate for n jumps
        const sigma_n = Math.sqrt(volatility * volatility + (n * jumpVolatility * jumpVolatility) / timeToExpiry);
        const r_n = riskFreeRate - jumpIntensity * k + (n * Math.log(1 + k)) / timeToExpiry;
        
        // Calculate Black-Scholes price with modified parameters
        const bsPrice = blackScholesJumpTerm({
            stockPrice,
            strikePrice,
            timeToExpiry,
            riskFreeRate: r_n,
            volatility: sigma_n,
            dividendYield,
            optionType
        });
        
        optionPrice += poissonProb * bsPrice;
        
        // Check for convergence
        if (poissonProb < 1e-10) {
            break;
        }
    }
    
    return optionPrice;
}

/**
 * Calculate Greeks for Jump Diffusion model using numerical differentiation
 * 
 * @param {Object} params - Same parameters as jumpDiffusionPrice
 * @param {number} deltaShift - Shift size for delta calculation, default 0.01
 * @param {number} gammaShift - Shift size for gamma calculation, default 0.01
 * @param {number} thetaShift - Shift size for theta calculation (days), default 1/365
 * @param {number} vegaShift - Shift size for vega calculation, default 0.01
 * @param {number} rhoShift - Shift size for rho calculation, default 0.01
 * @returns {Object} Greeks object with delta, gamma, theta, vega, rho
 */
export function jumpDiffusionGreeks(params, deltaShift = 0.01, gammaShift = 0.01, thetaShift = 1/365, vegaShift = 0.01, rhoShift = 0.01) {
    const basePrice = jumpDiffusionPrice(params);
    
    // Delta: ∂V/∂S
    const upPrice = jumpDiffusionPrice({ ...params, stockPrice: params.stockPrice + deltaShift });
    const downPrice = jumpDiffusionPrice({ ...params, stockPrice: params.stockPrice - deltaShift });
    const delta = (upPrice - downPrice) / (2 * deltaShift);
    
    // Gamma: ∂²V/∂S²
    const gamma = (upPrice - 2 * basePrice + downPrice) / (deltaShift * deltaShift);
    
    // Theta: -∂V/∂t (negative because time decay)
    const thetaPrice = jumpDiffusionPrice({ ...params, timeToExpiry: params.timeToExpiry - thetaShift });
    const theta = -(thetaPrice - basePrice) / thetaShift;
    
    // Vega: ∂V/∂σ
    const vegaUpPrice = jumpDiffusionPrice({ ...params, volatility: params.volatility + vegaShift });
    const vegaDownPrice = jumpDiffusionPrice({ ...params, volatility: params.volatility - vegaShift });
    const vega = (vegaUpPrice - vegaDownPrice) / (2 * vegaShift);
    
    // Rho: ∂V/∂r
    const rhoUpPrice = jumpDiffusionPrice({ ...params, riskFreeRate: params.riskFreeRate + rhoShift });
    const rhoDownPrice = jumpDiffusionPrice({ ...params, riskFreeRate: params.riskFreeRate - rhoShift });
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
 * Calculate jump-specific Greeks
 * 
 * @param {Object} params - Jump diffusion parameters
 * @returns {Object} Jump Greeks: lambda sensitivity, jump mean sensitivity, jump vol sensitivity
 */
export function jumpDiffusionJumpGreeks(params) {
    const basePrice = jumpDiffusionPrice(params);
    const shift = 0.01;
    
    // Lambda sensitivity (jump intensity)
    const lambdaUp = jumpDiffusionPrice({ 
        ...params, 
        jumpIntensity: (params.jumpIntensity || 0.1) + shift 
    });
    const lambdaDown = jumpDiffusionPrice({ 
        ...params, 
        jumpIntensity: Math.max(0, (params.jumpIntensity || 0.1) - shift)
    });
    const lambdaSensitivity = (lambdaUp - lambdaDown) / (2 * shift);
    
    // Jump mean sensitivity
    const jumpMeanUp = jumpDiffusionPrice({ 
        ...params, 
        jumpMean: (params.jumpMean || -0.1) + shift 
    });
    const jumpMeanDown = jumpDiffusionPrice({ 
        ...params, 
        jumpMean: (params.jumpMean || -0.1) - shift 
    });
    const jumpMeanSensitivity = (jumpMeanUp - jumpMeanDown) / (2 * shift);
    
    // Jump volatility sensitivity
    const jumpVolUp = jumpDiffusionPrice({ 
        ...params, 
        jumpVolatility: (params.jumpVolatility || 0.15) + shift 
    });
    const jumpVolDown = jumpDiffusionPrice({ 
        ...params, 
        jumpVolatility: Math.max(0.01, (params.jumpVolatility || 0.15) - shift)
    });
    const jumpVolSensitivity = (jumpVolUp - jumpVolDown) / (2 * shift);
    
    return {
        lambdaSensitivity: Number(lambdaSensitivity.toFixed(6)),
        jumpMeanSensitivity: Number(jumpMeanSensitivity.toFixed(6)),
        jumpVolSensitivity: Number(jumpVolSensitivity.toFixed(6))
    };
}

/**
 * Black-Scholes formula used within jump diffusion calculation
 * (Internal helper function)
 */
function blackScholesJumpTerm(params) {
    const {
        stockPrice,
        strikePrice,
        timeToExpiry,
        riskFreeRate,
        volatility,
        dividendYield,
        optionType
    } = params;
    
    const sqrtT = Math.sqrt(timeToExpiry);
    const d1 = (Math.log(stockPrice / strikePrice) + (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiry) / (volatility * sqrtT);
    const d2 = d1 - volatility * sqrtT;
    
    const S_adj = stockPrice * Math.exp(-dividendYield * timeToExpiry);
    const K_adj = strikePrice * Math.exp(-riskFreeRate * timeToExpiry);
    
    if (optionType.toLowerCase() === 'call') {
        return S_adj * normalCDF(d1) - K_adj * normalCDF(d2);
    } else {
        return K_adj * normalCDF(-d2) - S_adj * normalCDF(-d1);
    }
}

/**
 * Validate jump diffusion parameters
 */
function validateJumpDiffusionParams(params) {
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
    if (params.jumpIntensity !== undefined && params.jumpIntensity < 0) {
        throw new Error('Jump intensity must be non-negative');
    }
    if (params.jumpVolatility !== undefined && params.jumpVolatility <= 0) {
        throw new Error('Jump volatility must be positive');
    }
    if (!['call', 'put'].includes(params.optionType.toLowerCase())) {
        throw new Error('Option type must be "call" or "put"');
    }
}

/**
 * Get default jump diffusion parameters based on market conditions
 * 
 * @param {string} assetClass - 'equity', 'fx', 'commodity', or 'index'
 * @returns {Object} Default jump parameters
 */
export function getDefaultJumpParams(assetClass = 'equity') {
    const defaults = {
        equity: {
            jumpIntensity: 0.1,     // ~10% chance of jump per year
            jumpMean: -0.05,        // Slight negative bias (market crashes)
            jumpVolatility: 0.15    // 15% jump volatility
        },
        fx: {
            jumpIntensity: 0.05,    // Lower jump frequency
            jumpMean: 0,            // Symmetric jumps
            jumpVolatility: 0.10    // Smaller jumps
        },
        commodity: {
            jumpIntensity: 0.15,    // Higher jump frequency
            jumpMean: 0.02,         // Slight positive bias (supply shocks)
            jumpVolatility: 0.20    // Larger jumps
        },
        index: {
            jumpIntensity: 0.08,    // Moderate frequency
            jumpMean: -0.03,        // Negative bias (index drops)
            jumpVolatility: 0.12    // Moderate jump size
        }
    };
    
    return defaults[assetClass] || defaults.equity;
}