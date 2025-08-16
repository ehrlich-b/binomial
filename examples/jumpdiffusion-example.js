/**
 * Jump Diffusion Model Examples
 * 
 * Demonstrates the Jump Diffusion model capabilities including:
 * - Basic option pricing with jump parameters
 * - Comparison with Black-Scholes and binomial models
 * - Asset class specific defaults
 * - Jump sensitivity analysis
 * - Risk management applications
 */

import { 
    jumpDiffusionPrice, 
    jumpDiffusionGreeks,
    jumpDiffusionJumpGreeks,
    getDefaultJumpParams,
    blackScholesPrice,
    binomialPrice
} from '../lib/index.js';

import { Option } from '../lib/index.js';

console.log('='.repeat(80));
console.log('JUMP DIFFUSION MODEL EXAMPLES');
console.log('='.repeat(80));

// Base option parameters
const baseParams = {
    stockPrice: 100,
    strikePrice: 105,
    timeToExpiry: 0.25, // 3 months
    riskFreeRate: 0.04,
    volatility: 0.25,
    dividendYield: 0.015,
    optionType: 'call'
};

console.log('\n1. BASIC JUMP DIFFUSION PRICING');
console.log('-'.repeat(50));

// Standard pricing models for comparison
const bsPrice = blackScholesPrice(baseParams);
const binPrice = binomialPrice({ ...baseParams, steps: 50, exerciseStyle: 'european' });

console.log(`Stock Price: $${baseParams.stockPrice}`);
console.log(`Strike Price: $${baseParams.strikePrice}`);
console.log(`Time to Expiry: ${baseParams.timeToExpiry} years`);
console.log(`Volatility: ${(baseParams.volatility * 100).toFixed(1)}%`);
console.log('');
console.log('MODEL COMPARISON:');
console.log(`Black-Scholes:     $${bsPrice.toFixed(3)}`);
console.log(`Binomial (50):     $${binPrice.toFixed(3)}`);

// Jump diffusion with default equity parameters
const equityDefaults = getDefaultJumpParams('equity');
const jdPrice = jumpDiffusionPrice({
    ...baseParams,
    ...equityDefaults
});

console.log(`Jump Diffusion:    $${jdPrice.toFixed(3)}`);
console.log('');
console.log('Jump Parameters (Equity Defaults):');
console.log(`  Jump Intensity: ${equityDefaults.jumpIntensity} (${(equityDefaults.jumpIntensity * 100).toFixed(0)}% per year)`);
console.log(`  Jump Mean:      ${equityDefaults.jumpMean.toFixed(3)} (${(equityDefaults.jumpMean * 100).toFixed(1)}%)`);
console.log(`  Jump Vol:       ${equityDefaults.jumpVolatility.toFixed(3)} (${(equityDefaults.jumpVolatility * 100).toFixed(1)}%)`);

console.log('\n2. ASSET CLASS COMPARISON');
console.log('-'.repeat(50));

const assetClasses = ['equity', 'fx', 'commodity', 'index'];
const assetPrices = {};

console.log('OPTION PRICES BY ASSET CLASS:');
assetClasses.forEach(assetClass => {
    const defaults = getDefaultJumpParams(assetClass);
    const price = jumpDiffusionPrice({
        ...baseParams,
        ...defaults
    });
    assetPrices[assetClass] = price;
    
    console.log(`${assetClass.toUpperCase().padEnd(12)}: $${price.toFixed(3)} (λ=${defaults.jumpIntensity}, μ=${defaults.jumpMean.toFixed(3)}, σ=${defaults.jumpVolatility.toFixed(3)})`);
});

console.log('\n3. JUMP PARAMETER SENSITIVITY');
console.log('-'.repeat(50));

// Test different jump intensities
console.log('JUMP INTENSITY SENSITIVITY:');
const jumpIntensities = [0.0, 0.05, 0.1, 0.2, 0.3];
jumpIntensities.forEach(lambda => {
    const price = jumpDiffusionPrice({
        ...baseParams,
        jumpIntensity: lambda,
        jumpMean: -0.05,
        jumpVolatility: 0.15
    });
    const premium = price - bsPrice;
    console.log(`λ = ${lambda.toFixed(2)}: $${price.toFixed(3)} (Jump Premium: ${premium >= 0 ? '+' : ''}$${premium.toFixed(3)})`);
});

console.log('\nJUMP SIZE SENSITIVITY:');
const jumpMeans = [-0.15, -0.10, -0.05, 0.00, 0.05];
jumpMeans.forEach(mu => {
    const price = jumpDiffusionPrice({
        ...baseParams,
        jumpIntensity: 0.1,
        jumpMean: mu,
        jumpVolatility: 0.15
    });
    const premium = price - bsPrice;
    console.log(`μ = ${mu.toFixed(3)}: $${price.toFixed(3)} (Jump Premium: ${premium >= 0 ? '+' : ''}$${premium.toFixed(3)})`);
});

console.log('\n4. GREEKS COMPARISON');
console.log('-'.repeat(50));

// Calculate Greeks for different models
const bsGreeks = blackScholesPrice({
    ...baseParams,
    includeGreeks: true
});

const jdGreeks = jumpDiffusionGreeks({
    ...baseParams,
    ...equityDefaults
});

console.log('GREEKS COMPARISON (Jump Diffusion vs Black-Scholes):');
console.log('                 Jump Diff    Black-Scholes   Difference');
console.log(`Delta:           ${jdGreeks.delta.toFixed(4)}       ${bsGreeks?.delta?.toFixed(4) || 'N/A'}          ${jdGreeks.delta ? (jdGreeks.delta - (bsGreeks?.delta || 0)).toFixed(4) : 'N/A'}`);
console.log(`Gamma:           ${jdGreeks.gamma.toFixed(4)}       ${bsGreeks?.gamma?.toFixed(4) || 'N/A'}          ${jdGreeks.gamma ? (jdGreeks.gamma - (bsGreeks?.gamma || 0)).toFixed(4) : 'N/A'}`);
console.log(`Theta:           ${jdGreeks.theta.toFixed(4)}       ${bsGreeks?.theta?.toFixed(4) || 'N/A'}          ${jdGreeks.theta ? (jdGreeks.theta - (bsGreeks?.theta || 0)).toFixed(4) : 'N/A'}`);
console.log(`Vega:            ${jdGreeks.vega.toFixed(4)}       ${bsGreeks?.vega?.toFixed(4) || 'N/A'}          ${jdGreeks.vega ? (jdGreeks.vega - (bsGreeks?.vega || 0)).toFixed(4) : 'N/A'}`);
console.log(`Rho:             ${jdGreeks.rho.toFixed(4)}       ${bsGreeks?.rho?.toFixed(4) || 'N/A'}          ${jdGreeks.rho ? (jdGreeks.rho - (bsGreeks?.rho || 0)).toFixed(4) : 'N/A'}`);

console.log('\n5. JUMP-SPECIFIC SENSITIVITIES');
console.log('-'.repeat(50));

const jumpSens = jumpDiffusionJumpGreeks({
    ...baseParams,
    ...equityDefaults
});

console.log('JUMP SENSITIVITIES:');
console.log(`Lambda Sensitivity: ${jumpSens.lambdaSensitivity.toFixed(4)} (price change per unit λ)`);
console.log(`Jump Mean Sensitivity: ${jumpSens.jumpMeanSensitivity.toFixed(4)} (price change per unit μ)`);
console.log(`Jump Vol Sensitivity: ${jumpSens.jumpVolSensitivity.toFixed(4)} (price change per unit σ_J)`);

console.log('\n6. OPTION CLASS INTEGRATION');
console.log('-'.repeat(50));

// Using the Option class with jump diffusion
const option = new Option({
    symbol: 'AAPL',
    stockPrice: 150,
    strikePrice: 155,
    daysToExpiry: 30,
    volatility: 0.30,
    optionType: 'call'
});

console.log(`Option: ${option.symbol} ${option.strikePrice} Call, ${option.daysToExpiry} days`);
console.log('');

// Get comprehensive pricing
const pricing = {
    binomial: option.binomialPrice(),
    blackScholes: option.blackScholesPrice(),
    trinomial: option.trinomialPrice(),
    jumpDiffusion: option.jumpDiffusionPrice(),
    jumpDiffusionFX: option.jumpDiffusionPrice({}, 'fx'),
    jumpDiffusionCommodity: option.jumpDiffusionPrice({}, 'commodity')
};

console.log('COMPREHENSIVE PRICING:');
Object.entries(pricing).forEach(([model, price]) => {
    const modelName = model.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${modelName.padEnd(20)}: $${price.toFixed(3)}`);
});

// Jump sensitivities for the option
console.log('\nJUMP SENSITIVITIES:');
const optionJumpSens = option.jumpSensitivities();
console.log(`Lambda Sensitivity: ${optionJumpSens.lambdaSensitivity.toFixed(4)}`);
console.log(`Jump Mean Sensitivity: ${optionJumpSens.jumpMeanSensitivity.toFixed(4)}`);
console.log(`Jump Vol Sensitivity: ${optionJumpSens.jumpVolSensitivity.toFixed(4)}`);

console.log('\n7. RISK MANAGEMENT EXAMPLE');
console.log('-'.repeat(50));

// Stress testing with extreme jump scenarios
console.log('STRESS TESTING - EXTREME JUMP SCENARIOS:');

const stressScenarios = [
    { name: 'Market Crash', jumpIntensity: 0.5, jumpMean: -0.20, jumpVolatility: 0.25 },
    { name: 'Volatility Spike', jumpIntensity: 0.3, jumpMean: -0.05, jumpVolatility: 0.40 },
    { name: 'Black Swan', jumpIntensity: 0.1, jumpMean: -0.50, jumpVolatility: 0.30 },
    { name: 'Bull Run', jumpIntensity: 0.2, jumpMean: 0.15, jumpVolatility: 0.20 }
];

stressScenarios.forEach(scenario => {
    const stressPrice = option.jumpDiffusionPrice(scenario);
    const normalPrice = option.jumpDiffusionPrice();
    const impact = ((stressPrice - normalPrice) / normalPrice) * 100;
    
    console.log(`${scenario.name.padEnd(15)}: $${stressPrice.toFixed(3)} (${impact >= 0 ? '+' : ''}${impact.toFixed(1)}% vs normal)`);
});

console.log('\n8. CONVERGENCE ANALYSIS');
console.log('-'.repeat(50));

// Test convergence with different number of terms
console.log('CONVERGENCE WITH SERIES TERMS:');
const maxTermsValues = [5, 10, 15, 20, 25, 30];
maxTermsValues.forEach(maxTerms => {
    const price = jumpDiffusionPrice({
        ...baseParams,
        ...equityDefaults,
        maxTerms
    });
    console.log(`${maxTerms} terms: $${price.toFixed(4)}`);
});

console.log('\n' + '='.repeat(80));
console.log('JUMP DIFFUSION ANALYSIS COMPLETE');
console.log('='.repeat(80));

console.log('\nKEY INSIGHTS:');
console.log('• Jump diffusion generally produces higher option prices due to jump risk premium');
console.log('• Negative jump means (market crashes) increase put values more than call values');
console.log('• Higher jump intensity increases option values across all strikes');
console.log('• Jump parameters should be calibrated to specific asset classes');
console.log('• Series converges quickly - 20 terms usually sufficient for accuracy');
console.log('• Jump sensitivities provide additional risk management capabilities');