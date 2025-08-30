# 🎓 Options Education Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Interactive educational platform** for understanding options pricing, Greeks, and algorithms. Built on a robust JavaScript library with **5 validated pricing models**, this platform provides visual learning tools to demystify quantitative finance.

🌐 **Live at**: `[mywebsite.com]/options` *(coming soon)*

## 🎯 Project Vision

Transforming complex options mathematics into an **interactive learning experience** through:
- 📊 **Real-time Greeks visualizations** with 3D surface plots
- 🎲 **Algorithm animations** showing how pricing models work step-by-step  
- 📈 **Interactive playgrounds** for experimenting with strategies
- 📚 **Comprehensive tutorials** from beginner to advanced

## 🚀 Core Foundation

Built on a **production-ready pricing library** featuring:

## ✨ Library Features

- 🎯 **5 Pricing Models**: Binomial, Trinomial, Black-Scholes, Jump Diffusion, Monte Carlo
- 🏆 **Best-in-class accuracy**: Trinomial model 16.4% more accurate than binomial
- 🔍 **Complete Greeks calculation** for all models with numerical differentiation
- 💡 **Implied volatility solver** using Newton-Raphson method
- 📈 **Monte Carlo simulation** with variance reduction and adaptive sampling
- 💥 **Jump diffusion modeling** for market crashes and price gaps
- 💰 **Real dividend yield database** (70+ major stocks)
- ✅ **Extensively validated**: 671K real options + 6 market scenarios + accuracy study
- 🚀 **Zero dependencies** - pure vanilla JavaScript
- 🌐 **Universal** - works in browser and Node.js
- 📱 **Modern ES6+ modules** with proper TypeScript-style JSDoc
- 🔷 **Full TypeScript support** with comprehensive type definitions

## 🎓 Educational Platform Features (Coming Soon)

### Interactive Visualizations
- **Greeks Dashboard**: Watch delta, gamma, theta, and vega change in real-time
- **3D Surface Plots**: Visualize how Greeks vary with stock price and time
- **Payoff Diagrams**: Build and analyze multi-leg option strategies
- **Algorithm Animations**: See binomial trees and Monte Carlo paths in action

### Learning Modules  
- **Guided Tutorials**: Step-by-step lessons on options concepts
- **Algorithm Explainers**: Visual breakdowns of each pricing model
- **Practice Playground**: Experiment with parameters and see instant results
- **Strategy Builder**: Create and backtest complex options strategies

### Advanced Tools
- **Volatility Surface Explorer**: Understand implied volatility dynamics
- **Market Scenario Simulator**: Test strategies under different market conditions
- **Risk Analytics**: Portfolio-level Greeks and sensitivity analysis
- **Model Comparison**: Side-by-side accuracy and performance metrics

## 🚀 Quick Start (Library)

### Installation

```bash
npm install binomial-options
```

### Basic Usage

```javascript
import { 
  // Quick pricing functions
  priceOption, createOption, analyzeOption,
  
  // All pricing models
  binomialPrice, trinomialPrice, blackScholesPrice,
  jumpDiffusionPrice, monteCarloPrice
} from 'binomial-options';

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
console.log('Pricing Models:', summary.pricing); // All 5 models
console.log('Greeks:', summary.greeks);
console.log('Characteristics:', summary.characteristics);
console.log('Recommended Model:', summary.recommendation);
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

### TypeScript Usage

Full TypeScript support with comprehensive type definitions:

```typescript
import { 
  // Core functions
  priceOption, createOption, analyzeOption,
  
  // All pricing models
  binomialPrice, trinomialPrice, blackScholesPrice,
  jumpDiffusionPrice, monteCarloPrice,
  
  // Advanced features
  adaptiveMonteCarloPrice, getDefaultJumpParams,
  
  // Types
  type OptionParameters, type OptionAnalysis,
  type MonteCarloResults, type JumpDiffusionParameters,
  OPTIMAL_PARAMETERS
} from 'binomial-options';

// Type-safe option parameters
const params: OptionParameters = {
  symbol: 'AAPL',
  stockPrice: 150.00,
  strikePrice: 155.00,
  daysToExpiry: 30,
  volatility: 0.25,
  optionType: 'call' // Only 'call' or 'put' allowed
};

// All functions are fully typed
const price: number = priceOption(params);
const analysis: OptionAnalysis = analyzeOption(params);

// Type-safe access to validated parameters
const riskFreeRate: number = OPTIMAL_PARAMETERS.riskFreeRate;
```

## 📊 Advanced Features

### All Pricing Models

```javascript
import { 
  binomialPrice, trinomialPrice, blackScholesPrice,
  jumpDiffusionPrice, monteCarloPrice 
} from 'binomial-options';

const params = {
  stockPrice: 100,
  strikePrice: 105,
  daysToExpiry: 30,
  volatility: 0.25,
  optionType: 'call'
};

// All models for comparison
const binPrice = binomialPrice({ ...params, steps: 50 });
const triPrice = trinomialPrice({ ...params, steps: 50 }); // Most accurate
const bsPrice = blackScholesPrice(params);
const jdPrice = jumpDiffusionPrice({ ...params, jumpIntensity: 2 });
const mcResult = monteCarloPrice({ ...params, simulations: 100000 });

console.log('Trinomial (recommended):', triPrice);
console.log('Monte Carlo with CI:', mcResult.price, '±', mcResult.standardError);
```

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

// Greeks available for all models
const binGreeks = option.binomialGreeks();
const triGreeks = option.trinomialGreeks();     // Most accurate
const bsGreeks = option.blackScholesGreeks();
const mcGreeks = option.monteCarloGreeks({ simulations: 100000 });

console.log('Trinomial Greeks (recommended):', {
  delta: triGreeks.delta,    // Price sensitivity to stock price
  gamma: triGreeks.gamma,    // Delta sensitivity to stock price  
  theta: triGreeks.theta,    // Time decay (per day)
  vega: triGreeks.vega,      // Volatility sensitivity (per %)
  rho: triGreeks.rho         // Interest rate sensitivity (per %)
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

**Pricing Methods:**
- `binomialPrice(steps?)` - Binomial tree model
- `trinomialPrice(steps?)` - Trinomial tree model (most accurate)
- `blackScholesPrice()` - Black-Scholes analytical (European only)
- `jumpDiffusionPrice(params?)` - Jump diffusion with price gaps
- `monteCarloPrice(params?)` - Monte Carlo simulation
- `adaptiveMonteCarloPrice(targetError, maxSims)` - Adaptive MC

**Greeks Methods:**
- `binomialGreeks(steps?)` - Greeks via binomial model
- `trinomialGreeks(steps?)` - Greeks via trinomial model
- `blackScholesGreeks()` - Greeks via Black-Scholes
- `jumpDiffusionGreeks(params?)` - Greeks via jump diffusion
- `monteCarloGreeks(params?)` - Greeks via Monte Carlo

**Analysis Methods:**
- `intrinsicValue()` - Get intrinsic value
- `timeValue(steps?)` - Get time value
- `moneyness()` - Get moneyness ratio
- `isITM()`, `isATM()` - Check option characteristics
- `summary()` - Get comprehensive analysis with all models

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
- ✅ **Trinomial model 16.4% more accurate** than binomial baseline
- ✅ **95% numerical stability** across extreme parameter ranges
- ✅ **6 major market scenarios tested** (COVID crash, tech bubble, etc.)
- ✅ **Comprehensive model accuracy study** with production recommendations
- ✅ **Mathematically validated** against real market data

## 🏗️ Project Structure

```
binomial-options/
├── lib/
│   └── index.js          # Main library entry point
├── src/
│   ├── core/
│   │   ├── binomial.js      # Cox-Ross-Rubinstein implementation
│   │   ├── trinomial.js     # Trinomial tree implementation
│   │   ├── blackscholes.js  # Black-Scholes implementation
│   │   ├── jumpdiffusion.js # Merton jump diffusion model
│   │   └── montecarlo.js    # Monte Carlo simulation engine
│   ├── models/
│   │   └── option.js        # Option class with all models
│   └── utils/
│       ├── dividends.js     # Dividend yield database
│       ├── greeks.js        # Greeks calculation utilities
│       └── historical.js    # Historical volatility utilities
├── examples/
│   ├── basic-usage.js                # Core usage examples
│   ├── trinomial-example.js          # Trinomial model demo
│   ├── jumpdiffusion-example.js      # Jump diffusion examples
│   ├── montecarlo-example.js         # Monte Carlo examples
│   ├── model-accuracy-assessment.js  # Model comparison study
│   ├── real-market-validation.js     # Market validation
│   ├── index.html                    # Web calculator
│   └── legacy/                       # Legacy implementations
├── tests/
│   ├── unit.test.js                  # Comprehensive unit tests (44 tests)
│   ├── test.js                       # Academic test cases
│   └── validate-real-market.js       # Real market validation
├── data/
│   ├── market-data-clean.json # Real market data
│   └── L2_20240624/     # Raw L2 market data from historicaloptiondata.com
└── docs/                # Documentation
```

## 🧪 Testing

```bash
# Run comprehensive test suite
npm test                                # 44 unit tests

# Run market validation
npm run validate                        # 671K real options

# Run advanced model examples
node examples/basic-usage.js            # Core usage patterns
node examples/trinomial-example.js      # Trinomial model
node examples/jumpdiffusion-example.js  # Jump diffusion
node examples/montecarlo-example.js     # Monte Carlo
node examples/model-accuracy-assessment.js  # Model comparison
node examples/real-market-validation.js     # Market scenarios
```

The library includes:
- **44 comprehensive unit tests** covering all models and edge cases
- **Academic test cases** from finance textbooks
- **Real market validation** against 671K options + 6 market scenarios
- **Model accuracy assessment** with comprehensive comparison study
- **Greeks accuracy tests** for all pricing models
- **Edge case scenarios** and numerical stability testing

## 📖 Examples

See the [`examples/`](examples/) directory for:
- **Basic usage** - Simple pricing examples with all models
- **Advanced models** - Trinomial, Jump Diffusion, Monte Carlo demos
- **Model comparison** - Comprehensive accuracy assessment
- **Market validation** - Real market scenario testing
- **Web calculator** - Browser implementation
- **Legacy code** - Backward compatibility examples

## 🌐 Website Development

### Current Status
- ✅ **Core pricing library**: Complete with 5 validated models
- 🚧 **Web platform**: In development
- 📝 **Educational content**: Being created
- 🎨 **Visualizations**: Designing interactive components

### Technology Stack
- **Frontend**: Modern JavaScript framework (React/Vue/Svelte)
- **Visualizations**: D3.js for charts, Three.js for 3D graphics
- **Animations**: Framer Motion / GSAP
- **Styling**: Tailwind CSS + custom components
- **Backend**: Existing JavaScript pricing library

## 🤝 Contributing

We welcome contributions to both the library and educational platform!

### Library Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Educational Content
- Write tutorials or explainers
- Create interactive examples
- Design visualizations
- Improve documentation
- Share feedback and ideas

## 🎯 Roadmap

### Phase 1: Core Visualizations ⏳
- [ ] Greeks dashboard with real-time updates
- [ ] Payoff diagram builder
- [ ] Basic algorithm animations

### Phase 2: Educational Content 🔜
- [ ] Interactive tutorials
- [ ] Algorithm deep-dives
- [ ] Practice exercises

### Phase 3: Advanced Features 📅
- [ ] Live market integration
- [ ] Strategy backtesting
- [ ] Community features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### Academic Foundations
- **Cox, Ross & Rubinstein** for the binomial option pricing model
- **Black & Scholes** for the analytical option pricing formula
- **Merton** for the jump diffusion model
- **Boyle** for the trinomial tree model

### Data & Validation
- **Real market data** validation from June 24, 2024 (671K options)
- **Historical Option Data** ([historicaloptiondata.com](https://historicaloptiondata.com/sample-files/)) for L2 market data samples
- **Comprehensive accuracy study** across 6 major market scenarios

### Community
- **Open source community** for inspiration and feedback
- **Finance educators** for pedagogical insights
- **Students and practitioners** for driving the need for better educational tools

## 📞 Support

- 📚 **Documentation**: [docs/](docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/binomial-options/js-library/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/binomial-options/js-library/discussions)
- 📧 **Email**: contact@binomial-options.dev

---

**Built with ❤️ to democratize quantitative finance education**

*From complex mathematics to intuitive understanding - making options accessible to everyone*