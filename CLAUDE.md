# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a binomial options pricing calculator that implements multiple variations of the Cox-Ross-Rubinstein binomial model for valuing American and European options. The project includes validation tools and data collection utilities for comparing theoretical prices with market prices.

## Architecture

The codebase consists of several interconnected JavaScript modules:

- **index.html**: Web interface for the options calculator
- **index.js**: Contains three different implementations of the binomial option pricing algorithm
- **index_fixed.js**: Refined implementation with both binomial and Black-Scholes models
- **validator.js**: Greeks calculation, implied volatility solver, and comprehensive option analysis
- **bulk_validator.js**: Batch validation of multiple options against market prices
- **data_collector.js**: Methods for fetching/generating options data (Yahoo Finance, synthetic data)
- **test.js**: Test suite with standard examples from academic literature

## Key Functions

### Core Pricing Functions
- `binomialOptionPrice()` in index_fixed.js: Main implementation using Cox-Ross-Rubinstein parameters
- Three experimental implementations in index.js for comparison
- `blackScholes()` in index_fixed.js: European option pricing for validation

### Analysis Tools
- `calculateGreeks()`: Delta, Gamma, Vega, Theta, Rho calculations
- `impliedVolatility()`: Bisection method IV solver
- `analyzeOption()`: Comprehensive option analysis with multiple time conventions

## Important Considerations

### Time Conventions
The code tests multiple day-count conventions as this significantly impacts pricing:
- Trading days (252): Generally gives closest match to US equity options
- Calendar days (365): Standard calendar year
- Business days (260): Alternative convention
- 30/360: Bond market convention

### Model Parameters
- American vs European exercise style supported
- Dividend yield included in all implementations
- Uses Cox-Ross-Rubinstein up/down factors: u = exp(σ√Δt), d = 1/u
- Risk-neutral probability: p = (exp((r-q)Δt) - d) / (u - d)

## Common Commands

Since this is a vanilla JavaScript project without package.json:

```bash
# Run the fixed implementation tests
node index_fixed.js

# Run the test suite
node test.js

# Run the validator
node validator.js

# Run bulk validation
node bulk_validator.js

# Generate synthetic options data
node data_collector.js
```

## Data Flow

1. **Option Input**: Parameters (S, K, T, r, σ, q) entered via web interface or programmatically
2. **Pricing**: Binomial tree construction and backward induction
3. **Validation**: Compare with market prices, calculate Greeks
4. **Analysis**: Sensitivity analysis, time convention comparison, error metrics