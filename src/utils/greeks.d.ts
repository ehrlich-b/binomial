/**
 * TypeScript declarations for Greeks and implied volatility utilities
 */

/** Option type */
export type OptionType = 'call' | 'put';

/** Exercise style */
export type ExerciseStyle = 'american' | 'european';

/** Greeks calculation parameters */
export interface GreeksParameters {
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
  /** Number of binomial steps (default: 50) */
  steps?: number;
  /** Option type */
  optionType: OptionType;
  /** Exercise style (default: 'american') */
  exerciseStyle?: ExerciseStyle;
}

/** Implied volatility parameters */
export interface ImpliedVolatilityParameters {
  /** Target market price */
  marketPrice: number;
  /** Current stock price */
  stockPrice: number;
  /** Strike price */
  strikePrice: number;
  /** Time to expiration in years */
  timeToExpiry: number;
  /** Risk-free interest rate (decimal) */
  riskFreeRate: number;
  /** Dividend yield (decimal, default: 0) */
  dividendYield?: number;
  /** Option type */
  optionType: OptionType;
  /** Exercise style (default: 'american') */
  exerciseStyle?: ExerciseStyle;
  /** Convergence tolerance (default: 1e-6) */
  tolerance?: number;
  /** Maximum iterations (default: 100) */
  maxIterations?: number;
}

/** Sensitivity analysis parameters */
export interface SensitivityParameters {
  /** Option base parameters */
  option: Omit<GreeksParameters, 'stockPrice'>;
  /** Price range configuration */
  priceRange?: {
    /** Minimum price */
    min: number;
    /** Maximum price */
    max: number;
    /** Number of steps */
    steps: number;
  };
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

/** Sensitivity analysis results */
export interface SensitivityAnalysis {
  /** Range of underlying prices tested */
  priceRange: number[];
  /** Option values at each price point */
  optionValues: number[];
  /** Greeks at each price point */
  greeksAtPrices: Greeks[];
  /** Maximum profit */
  maxProfit: number;
  /** Maximum loss */
  maxLoss: number;
  /** Breakeven points */
  breakevenPoints: number[];
}

/**
 * Calculate Greeks using numerical differentiation
 * @param params - Greeks calculation parameters
 * @returns Greeks object
 */
export function calculateGreeks(params: GreeksParameters): Greeks;

/**
 * Calculate implied volatility using Newton-Raphson method
 * @param params - Implied volatility parameters
 * @returns Implied volatility (decimal)
 * @throws Error if convergence fails
 */
export function impliedVolatility(params: ImpliedVolatilityParameters): number;

/**
 * Perform sensitivity analysis across a range of underlying prices
 * @param params - Sensitivity analysis parameters
 * @returns Sensitivity analysis results
 */
export function sensitivityAnalysis(params: SensitivityParameters): SensitivityAnalysis;