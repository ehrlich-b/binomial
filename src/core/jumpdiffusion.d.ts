/**
 * TypeScript declarations for Jump Diffusion pricing module
 */

export interface JumpDiffusionParameters {
  stockPrice: number;
  strikePrice: number;
  timeToExpiry: number;
  riskFreeRate: number;
  volatility: number;
  dividendYield?: number;
  optionType: 'call' | 'put';
  jumpIntensity?: number;
  jumpMean?: number;
  jumpVolatility?: number;
  maxTerms?: number;
}

export interface JumpGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface JumpSensitivities {
  lambdaSensitivity: number;
  jumpMeanSensitivity: number;
  jumpVolSensitivity: number;
}

export interface DefaultJumpParams {
  jumpIntensity: number;
  jumpMean: number;
  jumpVolatility: number;
}

export function jumpDiffusionPrice(params: JumpDiffusionParameters): number;
export function jumpDiffusionGreeks(
  params: JumpDiffusionParameters,
  deltaShift?: number,
  gammaShift?: number,
  thetaShift?: number,
  vegaShift?: number,
  rhoShift?: number
): JumpGreeks;
export function jumpDiffusionJumpGreeks(params: JumpDiffusionParameters): JumpSensitivities;
export function getDefaultJumpParams(assetClass?: 'equity' | 'fx' | 'commodity' | 'index'): DefaultJumpParams;