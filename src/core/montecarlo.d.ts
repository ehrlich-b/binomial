/**
 * TypeScript declarations for Monte Carlo pricing module
 */

export interface MonteCarloParameters {
  stockPrice: number;
  strikePrice: number;
  timeToExpiry: number;
  riskFreeRate: number;
  volatility: number;
  dividendYield?: number;
  optionType: 'call' | 'put';
  simulations?: number;
  useAntithetic?: boolean;
  useControlVariate?: boolean;
  timeSteps?: number;
  seed?: number;
}

export interface MonteCarloResults {
  price: number;
  standardError: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    width: number;
  };
  statistics: {
    simulations: number;
    variance: number;
    useAntithetic: boolean;
    useControlVariate: boolean;
    convergenceRate: number;
    efficiency: number;
  };
}

export interface AdaptiveMonteCarloResults extends MonteCarloResults {
  converged: boolean;
  totalSimulations: number;
  targetError: number;
}

export interface MonteCarloGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export function monteCarloPrice(params: MonteCarloParameters): MonteCarloResults;
export function monteCarloGreeks(
  params: MonteCarloParameters,
  deltaShift?: number,
  gammaShift?: number,
  thetaShift?: number,
  vegaShift?: number,
  rhoShift?: number
): MonteCarloGreeks;
export function adaptiveMonteCarloPrice(
  params: MonteCarloParameters,
  targetError?: number,
  maxSimulations?: number,
  batchSize?: number
): AdaptiveMonteCarloResults;