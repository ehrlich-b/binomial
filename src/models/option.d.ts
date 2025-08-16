/**
 * TypeScript declarations for Option class
 */

/** Option type */
export type OptionType = 'call' | 'put';

/** Exercise style */
export type ExerciseStyle = 'american' | 'european';

/** Option constructor parameters */
export interface OptionParameters {
  /** Stock symbol (optional, for dividend lookup) */
  symbol?: string;
  /** Current stock price */
  stockPrice: number;
  /** Strike price */
  strikePrice: number;
  /** Days until expiration */
  daysToExpiry: number;
  /** Implied volatility (decimal) */
  volatility: number;
  /** Option type */
  optionType: OptionType;
  /** Risk-free rate (optional, uses optimal default) */
  riskFreeRate?: number;
  /** Dividend yield (optional, looked up by symbol if not provided) */
  dividendYield?: number;
  /** Day count convention (default: 252) */
  dayCount?: number;
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

/** Option pricing results */
export interface PricingResults {
  /** Binomial model price */
  binomial: number;
  /** Black-Scholes price */
  blackScholes: number;
  /** Intrinsic value */
  intrinsic: number;
  /** Time value */
  timeValue: number;
}

/** Option characteristics */
export interface OptionCharacteristics {
  /** Moneyness ratio (stock/strike or strike/stock) */
  moneyness: number;
  /** Is in-the-money */
  isITM: boolean;
  /** Is at-the-money */
  isATM: boolean;
  /** Is out-of-the-money */
  isOTM: boolean;
  /** Moneyness description */
  description: string;
}

/** Complete option analysis */
export interface OptionAnalysis {
  /** Option parameters */
  parameters: OptionParameters & { timeToExpiry: number };
  /** Pricing results */
  pricing: PricingResults;
  /** Greeks */
  greeks: Greeks;
  /** Option characteristics */
  characteristics: OptionCharacteristics;
  /** Option type */
  optionType: OptionType;
  /** Summary string */
  summary: string;
}

/**
 * Option class for modeling financial options
 */
export class Option {
  /** Stock symbol */
  readonly symbol: string;
  /** Current stock price */
  readonly stockPrice: number;
  /** Strike price */
  readonly strikePrice: number;
  /** Days to expiry */
  readonly daysToExpiry: number;
  /** Time to expiry in years */
  readonly timeToExpiry: number;
  /** Volatility */
  readonly volatility: number;
  /** Option type */
  readonly optionType: OptionType;
  /** Risk-free rate */
  readonly riskFreeRate: number;
  /** Dividend yield */
  readonly dividendYield: number;
  /** Day count convention */
  readonly dayCount: number;
  /** Exercise style */
  readonly exerciseStyle: ExerciseStyle;

  /**
   * Create an Option instance
   * @param params - Option parameters
   */
  constructor(params: OptionParameters);

  /**
   * Calculate binomial option price
   * @param steps - Number of binomial steps (default: 50)
   * @returns Option price
   */
  binomialPrice(steps?: number): number;

  /**
   * Calculate Black-Scholes option price
   * @returns Option price
   */
  blackScholesPrice(): number;

  /**
   * Calculate binomial Greeks using numerical differentiation
   * @param steps - Number of binomial steps (default: 50)
   * @returns Greeks object
   */
  binomialGreeks(steps?: number): Greeks;

  /**
   * Calculate Black-Scholes Greeks analytically
   * @returns Greeks object
   */
  blackScholesGreeks(): Greeks;

  /**
   * Calculate intrinsic value
   * @returns Intrinsic value
   */
  intrinsicValue(): number;

  /**
   * Calculate time value
   * @param steps - Number of binomial steps (default: 50)
   * @returns Time value
   */
  timeValue(steps?: number): number;

  /**
   * Calculate moneyness ratio
   * @returns Moneyness ratio
   */
  moneyness(): number;

  /**
   * Check if option is in-the-money
   * @returns True if ITM
   */
  isITM(): boolean;

  /**
   * Check if option is at-the-money
   * @returns True if ATM
   */
  isATM(): boolean;

  /**
   * Check if option is out-of-the-money
   * @returns True if OTM
   */
  isOTM(): boolean;

  /**
   * Get comprehensive option analysis
   * @returns Complete analysis object
   */
  summary(): OptionAnalysis;

  /**
   * String representation of the option
   * @returns String description
   */
  toString(): string;
}