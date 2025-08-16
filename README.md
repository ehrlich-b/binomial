# 🎯 Binomial Options Pricing Library

[![npm version](https://badge.fury.io/js/binomial-options.svg)](https://www.npmjs.com/package/binomial-options)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/binomial-options/js-library/workflows/Node.js%20CI/badge.svg)](https://github.com/binomial-options/js-library/actions)

Professional vanilla JavaScript library for options pricing using **binomial** and **Black-Scholes** models. Zero dependencies, runs in browser and Node.js, with **validated accuracy** against real market data.

## ✨ Features

- 🎯 **Cox-Ross-Rubinstein binomial model** for American & European options
- 📊 **Black-Scholes analytical pricing** for European options  
- 🔍 **Greeks calculation** via numerical differentiation
- 💡 **Implied volatility solver** using bisection method
- 💰 **Real dividend yield database** (70+ major stocks)
- ✅ **Validated against 671K real market options** (5.0% avg IV difference)
- 🚀 **Zero dependencies** - pure vanilla JavaScript
- 🌐 **Universal** - works in browser and Node.js
- 📱 **Modern ES6+ modules** with proper TypeScript-style JSDoc

## 🚀 Quick Start

### Installation

```bash
npm install binomial-options
```

### Basic Usage

```javascript
import { priceOption, createOption, analyzeOption } from 'binomial-options';

// Quick option pricing
const price = priceOption({
  symbol: 'AAPL',
  stockPrice: 150,
  strikePrice: 155,
  daysToExpiry: 30,
  volatility: 0.25,
  optionType: 'call'
});
console.log(`Option price: $${price.toFixed(2)}`);

// Detailed analysis
const option = createOption({
  symbol: 'MSFT',
  stockPrice: 300,
  strikePrice: 310,
  daysToExpiry: 45,
  volatility: 0.30,
  optionType: 'put'
});

const summary = option.summary();
console.log('Price:', summary.pricing.binomial);
console.log('Greeks:', summary.greeks);
console.log('Characteristics:', summary.characteristics);
```

### Browser Usage

```html
<script type="module">
  import { priceOption } from './lib/index.js';
  
  const price = priceOption({
    stockPrice: 100,
    strikePrice: 105,
    daysToExpiry: 30,
    volatility: 0.25,
    optionType: 'call'
  });
  
  document.getElementById('price').textContent = `$${price.toFixed(2)}`;
</script>
```

## 📊 Advanced Features

### Greeks Calculation

```javascript
import { createOption } from 'binomial-options';

const option = createOption({
  stockPrice: 100,
  strikePrice: 105,
  daysToExpiry: 30,
  volatility: 0.25,
  optionType: 'call'
});

const greeks = option.binomialGreeks();
console.log({
  delta: greeks.delta,    // Price sensitivity to stock price
  gamma: greeks.gamma,    // Delta sensitivity to stock price  
  theta: greeks.theta,    // Time decay (per day)
  vega: greeks.vega,      // Volatility sensitivity (per %)
  rho: greeks.rho         // Interest rate sensitivity (per %)
});
```

### Implied Volatility

```javascript
import { getImpliedVolatility } from 'binomial-options';

const iv = getImpliedVolatility({
  marketPrice: 8.50,
  symbol: 'SPY',
  stockPrice: 450,
  strikePrice: 460,
  daysToExpiry: 21,
  optionType: 'call'
});

console.log(`Implied Volatility: ${(iv * 100).toFixed(1)}%`);
```

### Portfolio Analysis

```javascript
import { analyzePortfolio } from 'binomial-options';

const portfolio = analyzePortfolio([
  { symbol: 'AAPL', stockPrice: 150, strikePrice: 160, daysToExpiry: 30, volatility: 0.25, optionType: 'call' },
  { symbol: 'MSFT', stockPrice: 300, strikePrice: 290, daysToExpiry: 45, volatility: 0.30, optionType: 'put' }
]);

console.log(`Portfolio Value: $${portfolio.totalValue.toFixed(2)}`);
console.log(`Portfolio Delta: ${portfolio.portfolioGreeks.delta.toFixed(4)}`);
```

## 🔧 API Reference

### Core Functions

#### `priceOption(params)`
Quick option pricing with sensible defaults.

**Parameters:**
- `symbol` (string, optional) - Stock symbol for dividend lookup
- `stockPrice` (number) - Current stock price
- `strikePrice` (number) - Option strike price  
- `daysToExpiry` (number) - Days until expiration
- `volatility` (number) - Implied volatility (decimal, e.g., 0.25 = 25%)
- `optionType` ('call' | 'put') - Option type
- `riskFreeRate` (number, optional) - Risk-free rate (default: 0.04)
- `dividendYield` (number, optional) - Dividend yield (looked up by symbol if not provided)
- `dayCount` (number, optional) - Day count convention (default: 252)
- `steps` (number, optional) - Binomial steps (default: 50)
- `exerciseStyle` ('american' | 'european', optional) - Exercise style (default: 'american')

**Returns:** `number` - Option price

#### `createOption(params)`
Create an Option instance for advanced analysis.

**Returns:** `Option` - Option instance with methods:
- `binomialPrice(steps?)` - Calculate price using binomial model
- `blackScholesPrice()` - Calculate price using Black-Scholes (European only)
- `binomialGreeks(steps?)` - Calculate Greeks using binomial model
- `blackScholesGreeks()` - Calculate Greeks using Black-Scholes  
- `intrinsicValue()` - Get intrinsic value
- `timeValue(steps?)` - Get time value
- `moneyness()` - Get moneyness ratio
- `isITM()`, `isATM()` - Check option characteristics
- `summary()` - Get comprehensive analysis

#### `getImpliedVolatility(params)`
Calculate implied volatility from market price.

**Additional Parameters:**
- `marketPrice` (number) - Target market price

**Returns:** `number` - Implied volatility (decimal)

#### `analyzeOption(params)`
Get comprehensive option analysis.

**Returns:** `Object` - Complete analysis including pricing, Greeks, and characteristics

#### `analyzePortfolio(optionsArray)`
Analyze a portfolio of options.

**Parameters:**
- `optionsArray` (Array) - Array of option parameter objects

**Returns:** `Object` - Portfolio analysis with total value and portfolio Greeks

### Utilities

#### `getDividendYield(symbol)`
Get dividend yield for a stock symbol.

#### `calculateGreeks(params)`
Calculate Greeks using numerical differentiation.

#### `impliedVolatility(params)`
Calculate implied volatility using bisection method.

## 📈 Validated Parameters

The library includes **validated optimal parameters** from analysis of **671,360 real market options** from June 24, 2024:

```javascript
import { OPTIMAL_PARAMETERS } from 'binomial-options';

console.log(OPTIMAL_PARAMETERS);
// {
//   riskFreeRate: 0.04,        // 4.0% (validated optimal)
//   dayCount: 252,             // Trading days (standard)
//   steps: 50,                 // Optimal performance/accuracy
//   exerciseStyle: 'american'  // US equity options default
// }
```

**Validation Results:**
- ✅ **5.0% average IV difference** vs market (expected model variance)
- ✅ **85% of options within 5% IV difference**  
- ✅ **0.52% error in self-consistency tests**
- ✅ **Mathematically validated** against real market data

## 🏗️ Project Structure

```
binomial-options/
├── lib/
│   └── index.js          # Main library entry point
├── src/
│   ├── core/
│   │   ├── binomial.js   # Cox-Ross-Rubinstein implementation
│   │   └── blackscholes.js # Black-Scholes implementation
│   ├── models/
│   │   └── option.js     # Option class
│   └── utils/
│       ├── dividends.js  # Dividend yield database
│       └── greeks.js     # Greeks calculation utilities
├── examples/
│   ├── basic-usage.js    # Usage examples
│   ├── index.html        # Web calculator
│   └── legacy/           # Legacy implementations
├── tests/
│   ├── test.js          # Test suite
│   └── validate-real-market.js # Market validation
├── data/
│   ├── market-data-clean.json # Real market data
│   └── L2_20240624/     # Raw market data files
└── docs/                # Documentation
```

## 🧪 Testing

```bash
# Run test suite
npm test

# Run market validation
npm run validate

# Run examples
npm run example
```

The library includes:
- **Academic test cases** from finance textbooks
- **Real market validation** against 671K options
- **Greeks accuracy tests**
- **Edge case scenarios**

## 📖 Examples

See the [`examples/`](examples/) directory for:
- **Basic usage** - Simple pricing examples
- **Advanced analysis** - Greeks, implied volatility, portfolios
- **Web calculator** - Browser implementation
- **Legacy code** - Backward compatibility examples

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cox, Ross & Rubinstein** for the binomial option pricing model
- **Black & Scholes** for the analytical option pricing formula
- **Real market data** validation from June 24, 2024
- **Open source community** for inspiration and feedback

## 📞 Support

- 📚 **Documentation**: [docs/](docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/binomial-options/js-library/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/binomial-options/js-library/discussions)
- 📧 **Email**: contact@binomial-options.dev

---

**Built with ❤️ for the quantitative finance community**