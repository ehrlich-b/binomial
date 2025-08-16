/**
 * TypeScript declarations for trinomial option pricing core module
 */

/** Option type */
export type OptionType = 'call' | 'put';

/** Exercise style */
export type ExerciseStyle = 'american' | 'european';

/** Trinomial pricing parameters */
export interface TrinomialParameters {
  /** Current stock price */
  stockPrice: number;
  /** Option strike price */
  strikePrice: number;
  /** Time to expiration in years */
  timeToExpiry: number;
  /** Risk-free interest rate (decimal) */
  riskFreeRate: number;
  /** Volatility (decimal) */
  volatility: number;
  /** Dividend yield (decimal, default: 0) */
  dividendYield?: number;
  /** Number of trinomial steps (default: 50) */
  steps?: number;
  /** Type of option */
  optionType: OptionType;
  /** Exercise style (default: 'american') */
  exerciseStyle?: ExerciseStyle;
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
 * Calculate option price using trinomial tree model
 * @param params - Trinomial pricing parameters
 * @returns Option price
 * @throws Error if parameters are invalid
 */
export function trinomialPrice(params: TrinomialParameters): number;

/**
 * Calculate trinomial Greeks using numerical differentiation
 * @param params - Trinomial pricing parameters
 * @returns Greeks object
 */
export function trinomialGreeks(params: TrinomialParameters): Greeks;