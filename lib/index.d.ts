/**
 * TypeScript declarations for Binomial Options Pricing Library
 * @version 2.0.0
 */

// ===== TYPES AND INTERFACES =====

/** Option type */
export type OptionType = 'call' | 'put';

/** Exercise style */
export type ExerciseStyle = 'american' | 'european';

/** Dividend category for stock filtering */
export type DividendCategory = 'tech' | 'finance' | 'healthcare' | 'consumer' | 'industrial' | 'reit' | 'utilities' | 'energy';

/** Base option parameters */
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
  /** Dividend yield (optional, looked up if not provided) */
  dividendYield?: number;
  /** Day count convention (default: 252) */
  dayCount?: number;
  /** Exercise style (default: 'american') */
  exerciseStyle?: ExerciseStyle;
}

/** Jump diffusion parameters */
export interface JumpDiffusionParameters {
  /** Current stock price */
  stockPrice: number;
  /** Strike price */
  strikePrice: number;
  /** Time to expiration in years */
  timeToExpiry: number;
  /** Risk-free interest rate (decimal) */
  riskFreeRate: number;
  /** Volatility of continuous part (decimal) */
  volatility: number;
  /** Dividend yield (decimal) */
  dividendYield?: number;
  /** Option type */
  optionType: OptionType;
  /** Expected number of jumps per year */
  jumpIntensity?: number;
  /** Mean of log jump size */
  jumpMean?: number;
  /** Volatility of log jump size */
  jumpVolatility?: number;
  /** Maximum terms in infinite series */
  maxTerms?: number;
}

/** Monte Carlo simulation parameters */
export interface MonteCarloParameters {
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
  /** Dividend yield (decimal) */
  dividendYield?: number;
  /** Option type */
  optionType: OptionType;
  /** Number of simulations */
  simulations?: number;
  /** Use antithetic variance reduction */
  useAntithetic?: boolean;
  /** Use control variate */
  useControlVariate?: boolean;
  /** Number of time steps */
  timeSteps?: number;
  /** Random seed for reproducibility */
  seed?: number;
}

/** Extended parameters for direct function calls */
export interface BinomialParameters {
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

/** Black-Scholes parameters */
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

/** Jump-specific sensitivities */
export interface JumpSensitivities {
  /** Sensitivity to jump intensity */
  lambdaSensitivity: number;
  /** Sensitivity to jump mean */
  jumpMeanSensitivity: number;
  /** Sensitivity to jump volatility */
  jumpVolSensitivity: number;
}

/** Monte Carlo pricing results */
export interface MonteCarloResults {
  /** Estimated option price */
  price: number;
  /** Standard error of estimate */
  standardError: number;
  /** 95% confidence interval */
  confidenceInterval: {
    lower: number;
    upper: number;
    width: number;
  };
  /** Simulation statistics */
  statistics: {
    simulations: number;
    variance: number;
    useAntithetic: boolean;
    useControlVariate: boolean;
    convergenceRate: number;
    efficiency: number;
  };
}

/** Adaptive Monte Carlo results */
export interface AdaptiveMonteCarloResults extends MonteCarloResults {
  /** Whether convergence was achieved */
  converged: boolean;
  /** Total simulations run */
  totalSimulations: number;
  /** Target error threshold */
  targetError: number;
}

/** Option pricing results */
export interface PricingResults {
  /** Binomial model price */
  binomial: number;
  /** Trinomial model price */
  trinomial: number;
  /** Black-Scholes price */
  blackScholes: number;
  /** Jump diffusion price */
  jumpDiffusion: number;
  /** Monte Carlo price */
  monteCarlo: number;
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

/** Implied volatility parameters */
export interface ImpliedVolatilityParameters extends Omit<OptionParameters, 'volatility'> {
  /** Target market price */
  marketPrice: number;
}

/** Portfolio analysis results */
export interface PortfolioAnalysis {
  /** Total portfolio value */
  totalValue: number;
  /** Number of options */
  optionCount: number;
  /** Portfolio-level Greeks */
  portfolioGreeks: Greeks;
  /** Individual option analyses */
  options: OptionAnalysis[];
  /** Portfolio summary */
  summary: {
    /** Number of call options */
    callCount: number;
    /** Number of put options */
    putCount: number;
    /** Average days to expiry */
    avgDaysToExpiry: number;
    /** Average volatility */
    avgVolatility: number;
  };
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

/** Dividend statistics */
export interface DividendStats {
  /** Total number of stocks */
  totalStocks: number;
  /** Average dividend yield */
  averageYield: number;
  /** Highest dividend yield */
  maxYield: number;
  /** Lowest dividend yield */
  minYield: number;
  /** Yield by category */
  byCategory: Record<DividendCategory, { count: number; avgYield: number }>;
}

/** Optimal parameters validated from market data */
export interface OptimalParameters {
  /** Risk-free rate (validated from market data) */
  riskFreeRate: number;
  /** Day count convention */
  dayCount: number;
  /** Optimal binomial steps */
  steps: number;
  /** Default exercise style */
  exerciseStyle: ExerciseStyle;
  /** Convergence tolerance */
  tolerance: number;
  /** Maximum iterations for numerical methods */
  maxIterations: number;
}

/** Library information and metadata */
export interface LibraryInfo {
  /** Library name */
  name: string;
  /** Version number */
  version: string;
  /** Description */
  description: string;
  /** Feature list */
  features: string[];
  /** Validated parameters */
  validatedParameters: OptimalParameters;
  /** Market data validation info */
  marketDataValidation: {
    /** Validation date */
    date: string;
    /** Number of options tested */
    optionsTested: number;
    /** Average IV difference */
    avgIVDifference: string;
    /** Accuracy percentage */
    accuracy: string;
  };
}

// ===== MAIN API FUNCTIONS =====

/**
 * Quick option pricing function with sensible defaults
 */
export function priceOption(params: OptionParameters): number;

/**
 * Create an Option instance with validated parameters
 */
export function createOption(params: OptionParameters): Option;

/**
 * Calculate implied volatility from market price
 */
export function getImpliedVolatility(params: ImpliedVolatilityParameters): number;

/**
 * Get comprehensive analysis for an option
 */
export function analyzeOption(params: OptionParameters): OptionAnalysis;

/**
 * Create a portfolio of options for batch analysis
 */
export function analyzePortfolio(optionsArray: OptionParameters[]): PortfolioAnalysis;

// ===== CORE PRICING FUNCTIONS =====

/**
 * Calculate option price using the Cox-Ross-Rubinstein binomial model
 */
export function binomialPrice(params: BinomialParameters): number;

/**
 * Calculate option price using trinomial tree model
 */
export function trinomialPrice(params: BinomialParameters): number;

/**
 * Calculate trinomial Greeks using numerical differentiation
 */
export function trinomialGreeks(params: BinomialParameters): Greeks;

/**
 * Calculate option price using Jump Diffusion model
 */
export function jumpDiffusionPrice(params: JumpDiffusionParameters): number;

/**
 * Calculate Jump Diffusion Greeks using numerical differentiation
 */
export function jumpDiffusionGreeks(params: JumpDiffusionParameters): Greeks;

/**
 * Calculate jump-specific sensitivities
 */
export function jumpDiffusionJumpGreeks(params: JumpDiffusionParameters): JumpSensitivities;

/**
 * Get default jump parameters for different asset classes
 */
export function getDefaultJumpParams(assetClass?: 'equity' | 'fx' | 'commodity' | 'index'): {
  jumpIntensity: number;
  jumpMean: number;
  jumpVolatility: number;
};

/**
 * Calculate option price using Monte Carlo simulation
 */
export function monteCarloPrice(params: MonteCarloParameters): MonteCarloResults;

/**
 * Calculate Monte Carlo Greeks using finite differences
 */
export function monteCarloGreeks(params: MonteCarloParameters): Greeks;

/**
 * Adaptive Monte Carlo pricing with convergence criteria
 */
export function adaptiveMonteCarloPrice(
  params: MonteCarloParameters,
  targetError?: number,
  maxSimulations?: number,
  batchSize?: number
): AdaptiveMonteCarloResults;

/**
 * Calculate option price using Black-Scholes formula
 */
export function blackScholesPrice(params: BlackScholesParameters): number;

/**
 * Calculate Black-Scholes Greeks
 */
export function blackScholesGreeks(params: BlackScholesParameters): Greeks;

/**
 * Cumulative standard normal distribution function
 */
export function normalCDF(x: number): number;

// ===== OPTION CLASS =====

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
   */
  constructor(params: OptionParameters);

  /**
   * Calculate binomial option price
   */
  binomialPrice(steps?: number): number;

  /**
   * Calculate trinomial option price
   */
  trinomialPrice(steps?: number): number;

  /**
   * Calculate Black-Scholes option price
   */
  blackScholesPrice(): number;

  /**
   * Calculate binomial Greeks using numerical differentiation
   */
  binomialGreeks(steps?: number): Greeks;

  /**
   * Calculate trinomial Greeks using numerical differentiation
   */
  trinomialGreeks(steps?: number): Greeks;

  /**
   * Calculate Black-Scholes Greeks analytically
   */
  blackScholesGreeks(): Greeks;

  /**
   * Calculate Jump Diffusion option price
   */
  jumpDiffusionPrice(jumpParams?: Partial<JumpDiffusionParameters>, assetClass?: 'equity' | 'fx' | 'commodity' | 'index'): number;

  /**
   * Calculate Jump Diffusion Greeks
   */
  jumpDiffusionGreeks(jumpParams?: Partial<JumpDiffusionParameters>, assetClass?: 'equity' | 'fx' | 'commodity' | 'index'): Greeks;

  /**
   * Calculate jump-specific sensitivities
   */
  jumpSensitivities(jumpParams?: Partial<JumpDiffusionParameters>, assetClass?: 'equity' | 'fx' | 'commodity' | 'index'): JumpSensitivities;

  /**
   * Calculate Monte Carlo option price
   */
  monteCarloPrice(mcParams?: Partial<MonteCarloParameters>): MonteCarloResults;

  /**
   * Calculate Monte Carlo Greeks
   */
  monteCarloGreeks(mcParams?: Partial<MonteCarloParameters>): Greeks;

  /**
   * Calculate adaptive Monte Carlo price with convergence criteria
   */
  adaptiveMonteCarloPrice(targetError?: number, maxSimulations?: number, mcParams?: Partial<MonteCarloParameters>): AdaptiveMonteCarloResults;

  /**
   * Calculate intrinsic value
   */
  intrinsicValue(): number;

  /**
   * Calculate time value
   */
  timeValue(steps?: number): number;

  /**
   * Calculate moneyness ratio
   */
  moneyness(): number;

  /**
   * Check if option is in-the-money
   */
  isITM(): boolean;

  /**
   * Check if option is at-the-money
   */
  isATM(): boolean;

  /**
   * Check if option is out-of-the-money
   */
  isOTM(): boolean;

  /**
   * Get comprehensive option analysis
   */
  summary(): OptionAnalysis;

  /**
   * String representation of the option
   */
  toString(): string;
}

// ===== UTILITIES =====

/**
 * Get dividend yield for a stock symbol
 */
export function getDividendYield(symbol: string): number;

/**
 * Check if dividend data is available for a symbol
 */
export function hasDividendData(symbol: string): boolean;

/**
 * Get all available stock symbols in dividend database
 */
export function getAvailableSymbols(): string[];

/**
 * Get dividend yields by category
 */
export function getDividendsByCategory(category: DividendCategory): Array<{ symbol: string; yield: number }>;

/**
 * Get dividend yield statistics
 */
export function getDividendStats(): DividendStats;

/**
 * Calculate Greeks using numerical differentiation
 */
export function calculateGreeks(params: BinomialParameters): Greeks;

/**
 * Calculate implied volatility using Newton-Raphson method
 */
export function impliedVolatility(params: ImpliedVolatilityParameters & { marketPrice: number }): number;

/**
 * Perform sensitivity analysis across a range of underlying prices
 */
export function sensitivityAnalysis(params: OptionParameters, priceRange?: { min: number; max: number; steps: number }): SensitivityAnalysis;

// ===== CONSTANTS =====

/** Library version */
export const VERSION: string;

/** Validated optimal parameters from market data analysis */
export const OPTIMAL_PARAMETERS: OptimalParameters;

/** Library information and metadata */
export const LIBRARY_INFO: LibraryInfo;

// ===== DEFAULT EXPORT =====

declare const _default: {
  // Main API
  priceOption: typeof priceOption;
  createOption: typeof createOption;
  getImpliedVolatility: typeof getImpliedVolatility;
  analyzeOption: typeof analyzeOption;
  analyzePortfolio: typeof analyzePortfolio;
  
  // Core functions
  binomialPrice: typeof binomialPrice;
  blackScholesPrice: typeof blackScholesPrice;
  blackScholesGreeks: typeof blackScholesGreeks;
  normalCDF: typeof normalCDF;
  
  // Option class
  Option: typeof Option;
  
  // Utilities
  getDividendYield: typeof getDividendYield;
  hasDividendData: typeof hasDividendData;
  getAvailableSymbols: typeof getAvailableSymbols;
  getDividendsByCategory: typeof getDividendsByCategory;
  getDividendStats: typeof getDividendStats;
  calculateGreeks: typeof calculateGreeks;
  impliedVolatility: typeof impliedVolatility;
  sensitivityAnalysis: typeof sensitivityAnalysis;
  
  // Constants
  VERSION: typeof VERSION;
  OPTIMAL_PARAMETERS: typeof OPTIMAL_PARAMETERS;
  LIBRARY_INFO: typeof LIBRARY_INFO;
};

export default _default;