# CLAUDE.md

This file provides guidance to Claude Code when working with this **professional JavaScript options pricing library**.

## Project Overview

This is a **production-ready binomial options pricing library** built with modern vanilla JavaScript. It implements the Cox-Ross-Rubinstein binomial model and Black-Scholes formula for valuing American and European options. The library has been **validated against 671,360 real market options** and follows professional JavaScript project standards.

**🎯 Current Status**: Fully restructured professional library with proper ES6 modules, comprehensive documentation, and production-ready code.

## Architecture Overview

### 📁 Project Structure

```
binomial-options/
├── lib/
│   └── index.js              # 🚀 Main library entry point
├── src/
│   ├── core/
│   │   ├── binomial.js       # Cox-Ross-Rubinstein implementation
│   │   └── blackscholes.js   # Black-Scholes implementation
│   ├── models/
│   │   └── option.js         # Option class with full analysis
│   └── utils/
│       ├── dividends.js      # 70+ stock dividend database
│       └── greeks.js         # Greeks & implied volatility
├── examples/
│   ├── basic-usage.js        # 📖 Usage examples
│   ├── index.html            # Web calculator
│   └── legacy/               # Old implementations
├── tests/
│   ├── test.js              # Academic test cases
│   └── validate-real-market.js # Real market validation
├── data/
│   ├── market-data-clean.json # 671K real options data
│   └── L2_20240624/          # Raw market data
└── docs/                     # Documentation
```

## 🚀 Primary Usage (RECOMMENDED)

### Main Library Interface

```javascript
import { 
    priceOption,           // Quick pricing
    createOption,          // Full Option instance  
    analyzeOption,         // Comprehensive analysis
    getImpliedVolatility,  // IV calculation
    analyzePortfolio,      // Portfolio analysis
    OPTIMAL_PARAMETERS     // Validated parameters
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

#### 1. **`src/core/binomial.js`** - Mathematical Engine
```javascript
import { binomialPrice } from './src/core/binomial.js';

const price = binomialPrice({
    stockPrice: 100,
    strikePrice: 105,
    timeToExpiry: 0.0833, // 30 days / 365
    riskFreeRate: 0.04,
    volatility: 0.25,
    dividendYield: 0.015,
    steps: 50,
    optionType: 'call',
    exerciseStyle: 'american'
});
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

// Methods available:
option.binomialPrice(steps)
option.blackScholesPrice()
option.binomialGreeks(steps) 
option.blackScholesGreeks()
option.intrinsicValue()
option.timeValue()
option.moneyness()
option.isITM() / isATM()
option.summary()
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
npm test                    # Academic examples
node tests/test.js

# Market validation
npm run validate           # Real market data
node tests/validate-real-market.js

# Examples
npm run example           # Full examples
node examples/basic-usage.js

# Web interface
open examples/index.html  # Browser calculator
```

### Test Coverage:
- **Academic examples** from finance textbooks
- **Real market validation** (671K options)  
- **Greeks accuracy** tests
- **Edge cases** (deep ITM, short-term, high vol)
- **Performance benchmarks**

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

### Performance vs Accuracy:
- **50 steps** (default) - Optimal balance
- **100+ steps** - Higher accuracy for short-term options
- **<50 steps** - Faster but less accurate

## 🚨 Important Notes

1. **Always validate inputs** - The library includes comprehensive validation
2. **Use symbol lookup** - Automatic dividend yield lookup for 70+ stocks
3. **Consider exercise style** - American options have early exercise premium
4. **Market data context** - 5% IV difference is normal model variance
5. **Time conventions matter** - Day count affects accuracy significantly

## 📞 Support & Development

- **Current status**: See `TODO.md` for development priorities
- **Issues**: Report bugs and feature requests  
- **Examples**: See `examples/` for comprehensive usage
- **Tests**: Run validation before deploying changes
- **Legacy code**: Available in `examples/legacy/` for reference

---

**For new development, always start with the main library interface (`lib/index.js`) and follow the modern ES6 module patterns shown in the examples.**