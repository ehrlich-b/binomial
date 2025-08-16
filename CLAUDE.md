# CLAUDE.md

This file provides guidance to Claude Code when working with this **professional JavaScript options pricing library**.

## Project Overview

This is a **comprehensive options pricing library** built with modern vanilla JavaScript. It implements **5 pricing models**: Cox-Ross-Rubinstein Binomial, Trinomial Tree, Black-Scholes, Jump Diffusion (Merton), and Monte Carlo simulation for valuing American and European options. The library has been **validated against 671,360 real market options** and follows professional JavaScript project standards.

**🎯 Current Status**: Complete implementation with all advanced models, comprehensive validation, and production-ready code.

## Architecture Overview

### 📁 Project Structure

```
binomial-options/
├── lib/
│   └── index.js              # 🚀 Main library entry point
├── src/
│   ├── core/
│   │   ├── binomial.js       # Cox-Ross-Rubinstein implementation
│   │   ├── trinomial.js      # Trinomial tree implementation
│   │   ├── blackscholes.js   # Black-Scholes implementation
│   │   ├── jumpdiffusion.js  # Merton jump diffusion model
│   │   └── montecarlo.js     # Monte Carlo simulation engine
│   ├── models/
│   │   └── option.js         # Option class with full analysis
│   └── utils/
│       ├── dividends.js      # 70+ stock dividend database
│       ├── greeks.js         # Greeks & implied volatility
│       └── historical.js     # Historical volatility utilities
├── examples/
│   ├── basic-usage.js               # 📖 Usage examples
│   ├── trinomial-example.js         # Trinomial model examples
│   ├── jumpdiffusion-example.js     # Jump diffusion examples
│   ├── montecarlo-example.js        # Monte Carlo examples
│   ├── model-accuracy-assessment.js # Model comparison
│   ├── real-market-validation.js    # Market validation
│   ├── index.html                   # Web calculator
│   └── legacy/                      # Old implementations
├── tests/
│   ├── unit.test.js                 # Comprehensive unit tests (44 tests)
│   ├── test.js                      # Academic test cases
│   └── validate-real-market.js      # Real market validation
├── data/
│   ├── market-data-clean.json # 671K real options data
│   └── L2_20240624/          # Raw L2 data from historicaloptiondata.com
└── docs/                     # Documentation
```

## 🚀 Primary Usage (RECOMMENDED)

### Main Library Interface

```javascript
import { 
    // Core pricing functions
    binomialPrice, trinomialPrice, blackScholesPrice,
    jumpDiffusionPrice, monteCarloPrice,
    
    // Convenience functions
    priceOption, createOption, analyzeOption,
    getImpliedVolatility, analyzePortfolio,
    
    // Advanced features
    adaptiveMonteCarloPrice, calculateHistoricalVolatility,
    getDefaultJumpParams, OPTIMAL_PARAMETERS
} from './lib/index.js';

// Quick option pricing
const price = priceOption({
    symbol: 'AAPL',
    stockPrice: 150,
    strikePrice: 155,
    daysToExpiry: 30,
    volatility: 0.25,
    optionType: 'call'
});

// Full analysis
const option = createOption({ /* same params */ });
const summary = option.summary();
const greeks = option.binomialGreeks();
```

### Core Components

#### 1. **Core Pricing Models** - Mathematical Engines
```javascript
import { 
    binomialPrice, trinomialPrice, blackScholesPrice,
    jumpDiffusionPrice, monteCarloPrice
} from './lib/index.js';

const params = {
    stockPrice: 100,
    strikePrice: 105,
    timeToExpiry: 0.0833, // 30 days / 365
    riskFreeRate: 0.04,
    volatility: 0.25,
    dividendYield: 0.015,
    optionType: 'call'
};

// All pricing models
const binPrice = binomialPrice({ ...params, steps: 50, exerciseStyle: 'american' });
const triPrice = trinomialPrice({ ...params, steps: 50, exerciseStyle: 'american' });
const bsPrice = blackScholesPrice(params);
const jdPrice = jumpDiffusionPrice({ ...params, jumpIntensity: 2, jumpMean: -0.02, jumpVolatility: 0.08 });
const mcPrice = monteCarloPrice({ ...params, simulations: 100000 });
```

#### 2. **`src/models/option.js`** - Option Class
```javascript
import { Option } from './src/models/option.js';

const option = new Option({
    symbol: 'MSFT',
    stockPrice: 300,
    strikePrice: 310,
    daysToExpiry: 45,
    volatility: 0.30,
    optionType: 'put'
});

// All pricing methods available:
option.binomialPrice(steps)
option.trinomialPrice(steps)
option.blackScholesPrice()
option.jumpDiffusionPrice(params)
option.monteCarloPrice(params)
option.adaptiveMonteCarloPrice(targetError, maxSims)

// Greeks for all models:
option.binomialGreeks(steps)
option.trinomialGreeks(steps)
option.blackScholesGreeks()
option.jumpDiffusionGreeks(params)
option.monteCarloGreeks(params)

// Analysis methods:
option.intrinsicValue()
option.timeValue()
option.moneyness()
option.isITM() / isATM()
option.summary()  // Includes all models
```

#### 3. **`src/utils/greeks.js`** - Analysis Tools
```javascript
import { calculateGreeks, impliedVolatility } from './src/utils/greeks.js';

const greeks = calculateGreeks({
    stockPrice: 100,
    strikePrice: 105,
    timeToExpiry: 0.0833,
    riskFreeRate: 0.04,
    volatility: 0.25,
    dividendYield: 0.015,
    optionType: 'call',
    exerciseStyle: 'american'
});

const iv = impliedVolatility({
    marketPrice: 8.50,
    stockPrice: 100,
    strikePrice: 105,
    timeToExpiry: 0.0833,
    riskFreeRate: 0.04,
    dividendYield: 0.015,
    optionType: 'call'
});
```

#### 4. **`src/utils/dividends.js`** - Dividend Database
```javascript
import { getDividendYield, getDividendsByCategory } from './src/utils/dividends.js';

const appleDiv = getDividendYield('AAPL');     // 0.0045 (0.45%)
const techDivs = getDividendsByCategory('tech'); // Array of tech stocks
```

## ✅ Validated Parameters

**Use these validated optimal parameters for production:**

```javascript
import { OPTIMAL_PARAMETERS } from './lib/index.js';

// {
//   riskFreeRate: 0.04,        // 4.0% (validated June 2024)
//   dayCount: 252,             // Trading days (standard)
//   steps: 50,                 // Optimal performance/accuracy
//   exerciseStyle: 'american'  // US equity default
// }
```

**Validation Results:**
- ✅ **5.0% average IV difference** vs market (normal model variance)
- ✅ **85% within 5% IV difference**
- ✅ **0.52% self-consistency error**
- ✅ **671,360 real options tested**
- ✅ **5 pricing models validated** with comprehensive accuracy assessment
- ✅ **Trinomial model 16.4% more accurate** than binomial baseline
- ✅ **6 major market scenarios tested** (COVID crash, tech bubble, etc.)
- ✅ **95% numerical stability** across extreme parameter ranges

## 🔧 Development Guidelines

### When adding new features:

1. **Use the main library interface** (`lib/index.js`) for most development
2. **Follow ES6 module patterns** with proper imports/exports
3. **Add comprehensive JSDoc comments** for all functions
4. **Include proper error handling** with descriptive messages
5. **Test against real market data** in `data/market-data-clean.json`
6. **Maintain backward compatibility** with existing API

### File Organization:

- **Core algorithms** → `src/core/`
- **Data models** → `src/models/`  
- **Utility functions** → `src/utils/`
- **Public API** → `lib/index.js`
- **Examples** → `examples/`
- **Tests** → `tests/`
- **Market data** → `data/`

### Code Standards:

- **ES6+ modules** with import/export
- **JSDoc documentation** for all public functions
- **Descriptive error messages** with input validation
- **Consistent naming** (camelCase for functions, UPPER_CASE for constants)
- **No external dependencies** (vanilla JavaScript only)

## 🧪 Testing & Validation

```bash
# Run test suite  
npm test                                # 44 comprehensive unit tests
node tests/test.js                      # Academic examples

# Market validation
npm run validate                        # Real market data
node tests/validate-real-market.js

# Advanced model examples
node examples/basic-usage.js            # Core usage patterns
node examples/trinomial-example.js      # Trinomial model demo
node examples/jumpdiffusion-example.js  # Jump diffusion examples
node examples/montecarlo-example.js     # Monte Carlo simulation
node examples/model-accuracy-assessment.js  # Model comparison study
node examples/real-market-validation.js     # Market scenario testing

# Web interface
open examples/index.html                # Browser calculator
```

### Test Coverage:
- **44 unit tests** covering all pricing models and edge cases
- **Academic examples** from finance textbooks
- **Real market validation** (671K options)  
- **Model accuracy assessment** with comprehensive comparison
- **Greeks accuracy** tests for all models
- **Edge cases** (deep ITM, short-term, high vol, extreme volatility)
- **Performance benchmarks** and convergence analysis
- **Market stress testing** (6 major scenarios)
- **Numerical stability** across 100+ parameter combinations

## 📖 Documentation

- **README.md** - User-facing documentation with examples
- **examples/basic-usage.js** - Comprehensive usage examples
- **JSDoc comments** - Inline API documentation
- **tests/** - Validation and test cases
- **TODO.md** - Development roadmap and priorities

## 🔄 Legacy Compatibility

The `examples/legacy/` directory contains previous implementations:
- `index_fixed.js` - Original core implementation
- `enhanced-binomial.js` - Previous enhanced version
- `binomial-options.js` - Class-based implementation
- `validator.js` - Original validation tools

These are maintained for backward compatibility but **new development should use the modern API**.

## ⚙️ Configuration

### Day Count Conventions:
- **252** (default) - Trading days (US standard)
- **360** - Some market data optimal
- **365** - Calendar days
- **260** - Business days

### Exercise Styles:
- **'american'** (default) - Early exercise allowed
- **'european'** - Exercise only at expiration

### Model Selection Guide:
- **Trinomial (50 steps)** - Best accuracy/performance (RECOMMENDED)
- **Binomial (50-100 steps)** - Industry standard, reliable backup
- **Black-Scholes** - Instant, perfect for European options
- **Monte Carlo (100k sims)** - Statistical validation, complex payoffs
- **Jump Diffusion** - Market stress scenarios, enhanced realism

### Performance vs Accuracy:
- **Fast trading**: 25-50 steps (sub-millisecond)
- **Standard accuracy**: 50-100 steps (±$0.01 typical error)
- **High precision**: 200+ steps (±$0.003 typical error)

## 🚨 Important Notes

1. **Model selection matters** - Trinomial recommended for best accuracy
2. **Always validate inputs** - The library includes comprehensive validation
3. **Use symbol lookup** - Automatic dividend yield lookup for 70+ stocks
4. **Consider exercise style** - American options have early exercise premium
5. **Market data context** - 5% IV difference is normal model variance
6. **Time conventions matter** - Day count affects accuracy significantly
7. **Jump diffusion for stress** - Use for market crash/spike scenarios
8. **Monte Carlo for confidence** - Provides statistical uncertainty bounds

## 📞 Support & Development

- **Current status**: See `TODO.md` for development priorities
- **Issues**: Report bugs and feature requests  
- **Examples**: See `examples/` for comprehensive usage
- **Tests**: Run validation before deploying changes
- **Legacy code**: Available in `examples/legacy/` for reference

---

**For new development, always start with the main library interface (`lib/index.js`) and follow the modern ES6 module patterns shown in the examples.**