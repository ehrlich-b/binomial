/**
 * TypeScript declarations for binomial option pricing core module
 */

/** Option type */
export type OptionType = 'call' | 'put';

/** Exercise style */
export type ExerciseStyle = 'american' | 'european';

/** Binomial pricing parameters */
export interface BinomialParameters {
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
  /** Number of binomial steps (default: 50) */
  steps?: number;
  /** Type of option */
  optionType: OptionType;
  /** Exercise style (default: 'american') */
  exerciseStyle?: ExerciseStyle;
}

/**
 * Calculate option price using the Cox-Ross-Rubinstein binomial model
 * @param params - Option pricing parameters
 * @returns Option price
 * @throws Error if parameters are invalid
 */
export function binomialPrice(params: BinomialParameters): number;