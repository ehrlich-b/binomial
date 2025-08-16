/**
 * TypeScript declarations for Black-Scholes pricing core module
 */

/** Option type */
export type OptionType = 'call' | 'put';

/** Black-Scholes pricing parameters */
export interface BlackScholesParameters {
  /** Current stock price */
  stockPrice: number;
  /** Strike price */
  strikePrice: number;
  /** Time to expiration in years */
  timeToExpiry: number;
  /** Risk-free interest rate (decimal) */
  riskFreeRate: number;
  /** Volatility (decimal) */
  volatility: number;
  /** Dividend yield (decimal, default: 0) */
  dividendYield?: number;
  /** Option type */
  optionType: OptionType;
}

/** Greeks calculation results */
export interface Greeks {
  /** Price sensitivity to underlying price */
  delta: number;
  /** Delta sensitivity to underlying price */
  gamma: number;
  /** Price sensitivity to time decay (per day) */
  theta: number;
  /** Price sensitivity to volatility */
  vega: number;
  /** Price sensitivity to interest rate */
  rho: number;
}

/**
 * Calculate option price using Black-Scholes formula
 * @param params - Black-Scholes parameters
 * @returns Option price
 */
export function blackScholesPrice(params: BlackScholesParameters): number;

/**
 * Calculate Black-Scholes Greeks analytically
 * @param params - Black-Scholes parameters
 * @returns Greeks object
 */
export function blackScholesGreeks(params: BlackScholesParameters): Greeks;

/**
 * Cumulative standard normal distribution function
 * @param x - Input value
 * @returns Cumulative probability
 */
export function normalCDF(x: number): number;