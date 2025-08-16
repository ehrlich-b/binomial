/**
 * Modern Binomial Options Pricing Calculator
 * Implements Cox-Ross-Rubinstein binomial model for American and European options
 * Works in both browser and Node.js environments
 */

class BinomialOptions {
  /**
   * Calculate option price using binomial tree
   * @param {Object} params - Option parameters
   * @param {number} params.spotPrice - Current stock price
   * @param {number} params.strikePrice - Strike price
   * @param {number} params.timeToExpiry - Time to expiry in years
   * @param {number} params.riskFreeRate - Risk-free interest rate (decimal)
   * @param {number} params.volatility - Volatility (decimal)
   * @param {number} params.dividendYield - Dividend yield (decimal, default: 0)
   * @param {number} params.steps - Number of time steps (default: 100)
   * @param {'call'|'put'} params.optionType - Option type
   * @param {'american'|'european'} params.exerciseStyle - Exercise style (default: 'american')
   * @returns {number} Option price
   */
  static price({
    spotPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    volatility,
    dividendYield = 0,
    steps = 100,
    optionType,
    exerciseStyle = 'american'
  }) {
    this._validateInputs({
      spotPrice,
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
    const riskNeutralProb = (Math.exp((riskFreeRate - dividendYield) * dt) - d) / (u - d);
    const discountFactor = Math.exp(-riskFreeRate * dt);

    // Initialize option values at maturity
    const optionValues = new Array(steps + 1);
    
    for (let i = 0; i <= steps; i++) {
      const stockPrice = spotPrice * Math.pow(u, i) * Math.pow(d, steps - i);
      optionValues[i] = this._calculatePayoff(stockPrice, strikePrice, optionType);
    }

    // Step backwards through the tree
    for (let step = steps - 1; step >= 0; step--) {
      for (let i = 0; i <= step; i++) {
        // Continuation value (discounted expected payoff)
        const continuationValue = discountFactor * (
          riskNeutralProb * optionValues[i + 1] + 
          (1 - riskNeutralProb) * optionValues[i]
        );
        
        if (exerciseStyle === 'european') {
          optionValues[i] = continuationValue;
        } else {
          // American option: compare continuation vs early exercise
          const stockPrice = spotPrice * Math.pow(u, i) * Math.pow(d, step - i);
          const intrinsicValue = this._calculatePayoff(stockPrice, strikePrice, optionType);
          optionValues[i] = Math.max(continuationValue, intrinsicValue);
        }
      }
    }

    return optionValues[0];
  }

  /**
   * Calculate Greeks using finite difference method
   * @param {Object} params - Same as price() method
   * @returns {Object} Greeks: { delta, gamma, vega, theta, rho }
   */
  static greeks(params) {
    const epsilon = 0.01;
    const basePrice = this.price(params);

    // Delta: ∂V/∂S
    const deltaUp = this.price({ ...params, spotPrice: params.spotPrice * (1 + epsilon) });
    const deltaDown = this.price({ ...params, spotPrice: params.spotPrice * (1 - epsilon) });
    const delta = (deltaUp - deltaDown) / (2 * params.spotPrice * epsilon);

    // Gamma: ∂²V/∂S²
    const gamma = (deltaUp - 2 * basePrice + deltaDown) / Math.pow(params.spotPrice * epsilon, 2);

    // Vega: ∂V/∂σ
    const vegaUp = this.price({ ...params, volatility: params.volatility + epsilon });
    const vega = (vegaUp - basePrice) / epsilon;

    // Theta: ∂V/∂T
    const thetaDown = this.price({ ...params, timeToExpiry: params.timeToExpiry * (1 - epsilon) });
    const theta = -(basePrice - thetaDown) / (params.timeToExpiry * epsilon);

    // Rho: ∂V/∂r
    const rhoUp = this.price({ ...params, riskFreeRate: params.riskFreeRate + epsilon });
    const rho = (rhoUp - basePrice) / epsilon;

    return { delta, gamma, vega, theta, rho };
  }

  /**
   * Calculate implied volatility using bisection method
   * @param {Object} params - Option parameters (without volatility)
   * @param {number} marketPrice - Market price of the option
   * @param {number} tolerance - Convergence tolerance (default: 0.0001)
   * @param {number} maxIterations - Maximum iterations (default: 100)
   * @returns {number} Implied volatility
   */
  static impliedVolatility(params, marketPrice, tolerance = 0.0001, maxIterations = 100) {
    let low = 0.01;
    let high = 3.0;
    
    for (let i = 0; i < maxIterations; i++) {
      const mid = (low + high) / 2;
      const price = this.price({ ...params, volatility: mid });
      
      if (Math.abs(price - marketPrice) < tolerance) {
        return mid;
      }
      
      if (price < marketPrice) {
        low = mid;
      } else {
        high = mid;
      }
    }
    
    return (low + high) / 2;
  }

  /**
   * Black-Scholes formula for European options (comparison/validation)
   * @param {Object} params - Option parameters
   * @returns {number} Black-Scholes price
   */
  static blackScholes({
    spotPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    volatility,
    dividendYield = 0,
    optionType
  }) {
    const d1 = (Math.log(spotPrice / strikePrice) + 
                (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiry) / 
               (volatility * Math.sqrt(timeToExpiry));
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);
    
    if (optionType === 'call') {
      return spotPrice * Math.exp(-dividendYield * timeToExpiry) * this._normalCDF(d1) - 
             strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * this._normalCDF(d2);
    } else {
      return strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * this._normalCDF(-d2) - 
             spotPrice * Math.exp(-dividendYield * timeToExpiry) * this._normalCDF(-d1);
    }
  }

  /**
   * Convert days to years using different conventions
   * @param {number} days - Days to expiration
   * @param {'calendar'|'trading'|'business'|'30/360'} convention - Day count convention
   * @returns {number} Time in years
   */
  static daysToYears(days, convention = 'trading') {
    const conventions = {
      calendar: 365,
      trading: 252,
      business: 260,
      '30/360': 360
    };
    
    return days / conventions[convention];
  }

  // Private helper methods
  static _validateInputs(params) {
    const required = ['spotPrice', 'strikePrice', 'timeToExpiry', 'riskFreeRate', 'volatility', 'optionType'];
    
    for (const param of required) {
      if (params[param] === undefined || params[param] === null) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    }

    if (params.spotPrice <= 0) throw new Error('Spot price must be positive');
    if (params.strikePrice <= 0) throw new Error('Strike price must be positive');
    if (params.timeToExpiry <= 0) throw new Error('Time to expiry must be positive');
    if (params.volatility <= 0) throw new Error('Volatility must be positive');
    if (params.steps <= 0) throw new Error('Steps must be positive');
    if (!['call', 'put'].includes(params.optionType)) {
      throw new Error('Option type must be "call" or "put"');
    }
    if (!['american', 'european'].includes(params.exerciseStyle)) {
      throw new Error('Exercise style must be "american" or "european"');
    }
  }

  static _calculatePayoff(stockPrice, strikePrice, optionType) {
    if (optionType === 'call') {
      return Math.max(stockPrice - strikePrice, 0);
    } else {
      return Math.max(strikePrice - stockPrice, 0);
    }
  }

  static _normalCDF(x) {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1.0 + sign * y);
  }
}

// Universal module pattern - works in both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  module.exports = BinomialOptions;
} else if (typeof window !== 'undefined') {
  // Browser
  window.BinomialOptions = BinomialOptions;
}