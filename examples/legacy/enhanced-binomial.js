// Enhanced binomial option pricing with optimized parameters and input validation
// Based on validation results from June 24, 2024 market data analysis

const { getDividendYield } = require('./dividend-yields.js');

/**
 * Enhanced binomial option pricing function with proper defaults
 * @param {Object} params - Option parameters
 * @param {number} params.stockPrice - Current stock price
 * @param {number} params.strikePrice - Strike price
 * @param {number} params.daysToExpiry - Days until expiration
 * @param {number} params.volatility - Implied volatility (decimal, e.g., 0.25 for 25%)
 * @param {string} params.optionType - 'call' or 'put'
 * @param {string} [params.symbol] - Stock symbol for dividend lookup
 * @param {number} [params.riskFreeRate=0.04] - Risk-free rate (validated optimal: 4.0%)
 * @param {number} [params.dividendYield] - Dividend yield (if not provided, looked up by symbol)
 * @param {number} [params.dayCount=252] - Day count convention (validated optimal for specific cases: 360)
 * @param {number} [params.steps=50] - Number of binomial steps (validated optimal: 50)
 * @param {string} [params.exerciseStyle='american'] - 'american' or 'european'
 * @returns {Object} Pricing result with option value and parameters used
 */
function enhancedBinomialPrice(params) {
    // Input validation
    const required = ['stockPrice', 'strikePrice', 'daysToExpiry', 'volatility', 'optionType'];
    for (const param of required) {
        if (params[param] === undefined || params[param] === null) {
            throw new Error(`Required parameter missing: ${param}`);
        }
    }
    
    if (params.optionType !== 'call' && params.optionType !== 'put') {
        throw new Error(`Invalid option type: ${params.optionType}. Must be 'call' or 'put'`);
    }
    
    if (params.stockPrice <= 0 || params.strikePrice <= 0 || params.daysToExpiry <= 0) {
        throw new Error('Stock price, strike price, and days to expiry must be positive');
    }
    
    if (params.volatility <= 0 || params.volatility > 5.0) {
        throw new Error('Volatility must be positive and reasonable (≤ 500%)');
    }
    
    // Set defaults based on validation analysis
    const riskFreeRate = params.riskFreeRate ?? 0.04; // 4.0% optimal from validation
    const dayCount = params.dayCount ?? 252; // Default to standard 252 trading days
    const steps = params.steps ?? 50; // 50 steps optimal from validation
    const exerciseStyle = params.exerciseStyle ?? 'american';
    
    // Get dividend yield
    let dividendYield = params.dividendYield;
    if (dividendYield === undefined) {
        if (params.symbol) {
            dividendYield = getDividendYield(params.symbol);
        } else {
            dividendYield = 0.015; // Default 1.5% if no symbol provided
        }
    }
    
    // Calculate time to expiry
    const expirationTime = params.daysToExpiry / dayCount;
    
    // Validate calculated parameters
    if (expirationTime <= 0 || expirationTime > 10) {
        throw new Error(`Invalid expiration time: ${expirationTime} years`);
    }
    
    if (riskFreeRate < 0 || riskFreeRate > 0.2) {
        throw new Error(`Invalid risk-free rate: ${riskFreeRate}. Must be between 0-20%`);
    }
    
    if (dividendYield < 0 || dividendYield > 0.2) {
        throw new Error(`Invalid dividend yield: ${dividendYield}. Must be between 0-20%`);
    }
    
    // Call the binomial pricing function
    const optionPrice = binomialOptionPrice(
        expirationTime,
        params.stockPrice,
        params.strikePrice,
        riskFreeRate,
        params.volatility,
        dividendYield,
        steps,
        params.optionType,
        exerciseStyle
    );
    
    // Return comprehensive result
    return {
        optionPrice: Math.round(optionPrice * 100) / 100, // Round to cents
        parameters: {
            stockPrice: params.stockPrice,
            strikePrice: params.strikePrice,
            daysToExpiry: params.daysToExpiry,
            expirationTime: Math.round(expirationTime * 10000) / 10000,
            volatility: params.volatility,
            optionType: params.optionType,
            symbol: params.symbol || 'N/A',
            riskFreeRate,
            dividendYield,
            dayCount,
            steps,
            exerciseStyle
        },
        metadata: {
            calculationDate: new Date().toISOString(),
            modelVersion: '2.0-enhanced',
            validationBasis: 'June 24, 2024 market data',
            optimizedParameters: {
                riskFreeRate: '4.0% (optimal from validation)',
                dayCount: '252 (standard, 360 optimal for some cases)',
                steps: '50 (optimal performance/accuracy)',
                dividends: 'Stock-specific yields (0.30% improvement)'
            }
        }
    };
}

// Core binomial function (unchanged from index_fixed.js)
function binomialOptionPrice(
    expirationTime,
    stockPrice,
    strikePrice,
    interestRate,
    volatility,
    dividendYield,
    n,
    optionType,
    exerciseStyle = 'american'
) {
    if (optionType !== 'call' && optionType !== 'put') {
        throw new Error('Invalid option type: ' + optionType);
    }

    // Cox-Ross-Rubinstein parameters
    const dt = expirationTime / n;
    const u = Math.exp(volatility * Math.sqrt(dt));
    const d = 1 / u;
    const pu = (Math.exp((interestRate - dividendYield) * dt) - d) / (u - d);
    const pd = 1 - pu;
    const discount = Math.exp(-interestRate * dt);

    // Initialize option values at maturity
    const optionValues = new Array(n + 1);
    
    for (let i = 0; i <= n; i++) {
        const s = stockPrice * Math.pow(u, i) * Math.pow(d, n - i);
        
        if (optionType === 'call') {
            optionValues[i] = Math.max(s - strikePrice, 0);
        } else {
            optionValues[i] = Math.max(strikePrice - s, 0);
        }
    }

    // Step backwards through the tree
    for (let step = n - 1; step >= 0; step--) {
        for (let i = 0; i <= step; i++) {
            const continuationValue = discount * (pu * optionValues[i + 1] + pd * optionValues[i]);
            
            if (exerciseStyle === 'european') {
                optionValues[i] = continuationValue;
            } else { // american
                const s = stockPrice * Math.pow(u, i) * Math.pow(d, step - i);
                
                let intrinsic;
                if (optionType === 'call') {
                    intrinsic = Math.max(s - strikePrice, 0);
                } else {
                    intrinsic = Math.max(strikePrice - s, 0);
                }
                
                optionValues[i] = Math.max(continuationValue, intrinsic);
            }
        }
    }

    return optionValues[0];
}

// Example usage and testing
function runExamples() {
    console.log('ENHANCED BINOMIAL OPTION PRICING');
    console.log('='.repeat(50));
    console.log('Using validated optimal parameters from market data analysis\n');
    
    // Example 1: SPY call option (using defaults)
    console.log('Example 1: SPY Call Option (using optimized defaults)');
    try {
        const result1 = enhancedBinomialPrice({
            stockPrice: 560.61,
            strikePrice: 570,
            daysToExpiry: 30,
            volatility: 0.22,
            optionType: 'call',
            symbol: 'SPY'
        });
        
        console.log(`Price: $${result1.optionPrice}`);
        console.log(`Risk-free rate: ${(result1.parameters.riskFreeRate * 100).toFixed(1)}%`);
        console.log(`Dividend yield: ${(result1.parameters.dividendYield * 100).toFixed(2)}%`);
        console.log(`Day count: ${result1.parameters.dayCount}`);
        console.log(`Steps: ${result1.parameters.steps}`);
        
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
    
    // Example 2: Custom parameters
    console.log('\nExample 2: Custom Parameters (360-day count)');
    try {
        const result2 = enhancedBinomialPrice({
            stockPrice: 135.08,
            strikePrice: 110,
            daysToExpiry: 145,
            volatility: 0.35,
            optionType: 'put',
            symbol: 'A',
            dayCount: 360, // Use 360-day count (optimal for some cases)
            riskFreeRate: 0.04,
            steps: 100
        });
        
        console.log(`Price: $${result2.optionPrice}`);
        console.log(`Day count used: ${result2.parameters.dayCount} (custom)`);
        console.log(`Time to expiry: ${result2.parameters.expirationTime} years`);
        
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
    
    // Example 3: Error handling
    console.log('\nExample 3: Error Handling');
    try {
        enhancedBinomialPrice({
            stockPrice: 100,
            strikePrice: 105,
            daysToExpiry: 30,
            volatility: -0.1, // Invalid negative volatility
            optionType: 'call'
        });
    } catch (error) {
        console.log(`✅ Caught error: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('KEY FEATURES:');
    console.log('✅ Optimized parameters from June 24, 2024 validation');
    console.log('✅ Flexible day count convention (default: 252, optimal: 360 for some)');
    console.log('✅ Automatic dividend yield lookup by symbol');
    console.log('✅ Comprehensive input validation');
    console.log('✅ Detailed result metadata');
    console.log('✅ Backward compatible with existing code');
}

// Run examples if called directly
if (require.main === module) {
    runExamples();
}

module.exports = { 
    enhancedBinomialPrice, 
    binomialOptionPrice // Export core function for backward compatibility
};