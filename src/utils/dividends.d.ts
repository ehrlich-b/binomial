/**
 * TypeScript declarations for dividend utilities
 */

/** Dividend category for stock filtering */
export type DividendCategory = 'tech' | 'finance' | 'healthcare' | 'consumer' | 'industrial' | 'reit' | 'utilities' | 'energy';

/** Dividend yield entry */
export interface DividendYield {
  /** Stock symbol */
  symbol: string;
  /** Dividend yield (decimal) */
  yield: number;
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

/**
 * Get dividend yield for a stock symbol
 * @param symbol - Stock symbol
 * @returns Dividend yield (decimal) or 0 if not found
 */
export function getDividendYield(symbol: string): number;

/**
 * Check if dividend data is available for a symbol
 * @param symbol - Stock symbol
 * @returns True if data is available
 */
export function hasDividendData(symbol: string): boolean;

/**
 * Get all available stock symbols in dividend database
 * @returns Array of stock symbols
 */
export function getAvailableSymbols(): string[];

/**
 * Get dividend yields by category
 * @param category - Dividend category
 * @returns Array of dividend yield entries
 */
export function getDividendsByCategory(category: DividendCategory): DividendYield[];

/**
 * Get dividend yield statistics
 * @returns Statistics object
 */
export function getDividendStats(): DividendStats;