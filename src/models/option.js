/**
 * @fileoverview Option class for modeling financial options
 * @author Binomial Options Project
 * @version 2.0.0
 */

import { binomialPrice } from '../core/binomial.js';
import { blackScholesPrice, blackScholesGreeks } from '../core/blackscholes.js';
import { getDividendYield } from '../utils/dividends.js';
import { calculateGreeks } from '../utils/greeks.js';

/**
 * Represents a financial option with pricing and Greeks calculation capabilities
 */
export class Option {
    /**
     * Create an Option instance
     * @param {Object} params - Option parameters
     * @param {string} params.symbol - Stock symbol (optional, for dividend lookup)
     * @param {number} params.stockPrice - Current stock price
     * @param {number} params.strikePrice - Strike price
     * @param {number} params.daysToExpiry - Days until expiration
     * @param {number} params.volatility - Implied volatility (decimal)
     * @param {'call'|'put'} params.optionType - Option type
     * @param {number} [params.riskFreeRate] - Risk-free rate (uses optimal default)
     * @param {number} [params.dividendYield] - Dividend yield (looked up by symbol if not provided)
     * @param {number} [params.dayCount=252] - Day count convention
     * @param {'american'|'european'} [params.exerciseStyle='american'] - Exercise style
     */
    constructor({
        symbol,
        stockPrice,
        strikePrice,
        daysToExpiry,
        volatility,
        optionType,
        riskFreeRate = 0.04, // Validated optimal rate
        dividendYield,
        dayCount = 252,
        exerciseStyle = 'american'
    }) {
        this.symbol = symbol || 'UNKNOWN';
        this.stockPrice = stockPrice;
        this.strikePrice = strikePrice;
        this.daysToExpiry = daysToExpiry;
        this.volatility = volatility;
        this.optionType = optionType.toLowerCase();
        this.riskFreeRate = riskFreeRate;
        this.dayCount = dayCount;
        this.exerciseStyle = exerciseStyle.toLowerCase();
        
        // Get dividend yield
        if (dividendYield !== undefined) {
            this.dividendYield = dividendYield;
        } else if (symbol) {
            this.dividendYield = getDividendYield(symbol);
        } else {
            this.dividendYield = 0.015; // Default 1.5%
        }
        
        // Calculate time to expiry
        this.timeToExpiry = daysToExpiry / dayCount;
        
        // Validate inputs
        this._validateInputs();
    }

    /**
     * Calculate option price using binomial model
     * @param {number} [steps=50] - Number of binomial steps
     * @returns {number} Option price
     */
    binomialPrice(steps = 50) {
        return binomialPrice({
            stockPrice: this.stockPrice,
            strikePrice: this.strikePrice,
            timeToExpiry: this.timeToExpiry,
            riskFreeRate: this.riskFreeRate,
            volatility: this.volatility,
            dividendYield: this.dividendYield,
            steps: steps,
            optionType: this.optionType,
            exerciseStyle: this.exerciseStyle
        });
    }

    /**
     * Calculate option price using Black-Scholes model (European only)
     * @returns {number} Option price
     */
    blackScholesPrice() {
        return blackScholesPrice({
            stockPrice: this.stockPrice,
            strikePrice: this.strikePrice,
            timeToExpiry: this.timeToExpiry,
            riskFreeRate: this.riskFreeRate,
            volatility: this.volatility,
            dividendYield: this.dividendYield,
            optionType: this.optionType
        });
    }

    /**
     * Calculate Greeks using binomial model
     * @param {number} [steps=100] - Number of binomial steps (higher for Greeks accuracy)
     * @returns {Object} Greeks values
     */
    binomialGreeks(steps = 100) {
        return calculateGreeks({
            stockPrice: this.stockPrice,
            strikePrice: this.strikePrice,
            timeToExpiry: this.timeToExpiry,
            riskFreeRate: this.riskFreeRate,
            volatility: this.volatility,
            dividendYield: this.dividendYield,
            optionType: this.optionType,
            exerciseStyle: this.exerciseStyle,
            steps: steps
        });
    }

    /**
     * Calculate Greeks using Black-Scholes model
     * @returns {Object} Greeks values
     */
    blackScholesGreeks() {
        return blackScholesGreeks({
            stockPrice: this.stockPrice,
            strikePrice: this.strikePrice,
            timeToExpiry: this.timeToExpiry,
            riskFreeRate: this.riskFreeRate,
            volatility: this.volatility,
            dividendYield: this.dividendYield,
            optionType: this.optionType
        });
    }

    /**
     * Get intrinsic value of the option
     * @returns {number} Intrinsic value
     */
    intrinsicValue() {
        if (this.optionType === 'call') {
            return Math.max(this.stockPrice - this.strikePrice, 0);
        } else {
            return Math.max(this.strikePrice - this.stockPrice, 0);
        }
    }

    /**
     * Get time value of the option
     * @param {number} [steps=50] - Binomial steps for pricing
     * @returns {number} Time value
     */
    timeValue(steps = 50) {
        return this.binomialPrice(steps) - this.intrinsicValue();
    }

    /**
     * Get moneyness of the option
     * @returns {number} Moneyness (S/K for calls, K/S for puts)
     */
    moneyness() {
        return this.stockPrice / this.strikePrice;
    }

    /**
     * Check if option is in-the-money
     * @returns {boolean} True if ITM
     */
    isITM() {
        return this.intrinsicValue() > 0;
    }

    /**
     * Check if option is at-the-money (within 2.5%)
     * @returns {boolean} True if ATM
     */
    isATM() {
        const moneyness = this.moneyness();
        return moneyness >= 0.975 && moneyness <= 1.025;
    }

    /**
     * Get comprehensive option summary
     * @returns {Object} Complete option analysis
     */
    summary() {
        const binomialPrice = this.binomialPrice();
        const blackScholesPrice = this.blackScholesPrice();
        const greeks = this.binomialGreeks();
        
        return {
            symbol: this.symbol,
            optionType: this.optionType,
            exerciseStyle: this.exerciseStyle,
            parameters: {
                stockPrice: this.stockPrice,
                strikePrice: this.strikePrice,
                daysToExpiry: this.daysToExpiry,
                timeToExpiry: this.timeToExpiry,
                volatility: this.volatility,
                riskFreeRate: this.riskFreeRate,
                dividendYield: this.dividendYield,
                dayCount: this.dayCount
            },
            pricing: {
                binomial: binomialPrice,
                blackScholes: blackScholesPrice,
                intrinsic: this.intrinsicValue(),
                timeValue: binomialPrice - this.intrinsicValue()
            },
            characteristics: {
                moneyness: this.moneyness(),
                isITM: this.isITM(),
                isATM: this.isATM(),
                isOTM: !this.isITM() && !this.isATM()
            },
            greeks: greeks
        };
    }

    /**
     * Validate input parameters
     * @private
     */
    _validateInputs() {
        const errors = [];

        if (this.stockPrice <= 0) errors.push('Stock price must be positive');
        if (this.strikePrice <= 0) errors.push('Strike price must be positive');
        if (this.daysToExpiry <= 0) errors.push('Days to expiry must be positive');
        if (this.volatility <= 0) errors.push('Volatility must be positive');
        if (!['call', 'put'].includes(this.optionType)) {
            errors.push("Option type must be 'call' or 'put'");
        }
        if (!['american', 'european'].includes(this.exerciseStyle)) {
            errors.push("Exercise style must be 'american' or 'european'");
        }

        if (errors.length > 0) {
            throw new Error(`Invalid option parameters: ${errors.join(', ')}`);
        }
    }
}