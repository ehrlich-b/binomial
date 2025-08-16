# Testing Framework Documentation

## Overview

The Binomial Options Pricing Library includes a comprehensive testing framework that ensures code quality, correctness, and performance. The testing strategy uses Node.js built-in test runner for zero dependencies.

## Test Structure

### Test Files

- **`unit.test.js`** - Comprehensive unit tests (30 test cases)
- **`test.cjs`** - Legacy academic validation tests  
- **`validate-real-market.cjs`** - Real market data validation (671K options)
- **`run-unit-tests.js`** - Test runner script

### Test Categories

#### 1. Library Constants and Metadata (3 tests)
- Version validation
- Optimal parameters structure
- Library information completeness

#### 2. Core Binomial Pricing (4 tests)
- Basic call and put option pricing
- American vs European exercise styles
- Input validation and error handling

#### 3. Black-Scholes Pricing (3 tests)
- Call option pricing accuracy
- Greeks calculation validation
- Normal distribution function tests

#### 4. Option Class (4 tests)
- Constructor and property validation
- Pricing method convergence
- Moneyness calculations
- Summary method completeness

#### 5. Main API Functions (4 tests)
- `priceOption()` functionality
- `createOption()` instance creation
- `analyzeOption()` comprehensive analysis
- `analyzePortfolio()` multiple options

#### 6. Dividend Utilities (3 tests)
- Dividend yield lookup
- Symbol data availability
- Available symbols listing

#### 7. Greeks and Implied Volatility (3 tests)
- Numerical Greeks calculation
- Implied volatility function
- API-level IV calculation

#### 8. Edge Cases and Error Handling (4 tests)
- Very short time to expiry
- Extreme volatility scenarios
- Deep ITM/OTM options
- Error boundary testing

#### 9. Performance and Convergence (2 tests)
- Binomial step convergence
- Performance benchmarking

## Running Tests

### Individual Test Suites

```bash
# Run comprehensive unit tests
npm run test:unit

# Run with coverage reporting  
npm run test:coverage

# Run legacy academic tests
npm run test:legacy

# Run real market validation
npm run validate

# Run all test suites
npm run test:all
```

### Main Test Command

```bash
# Run primary test suite (unit tests)
npm test
```

## Test Coverage

The unit test suite covers:

- ✅ **Core Functions** - All major pricing and calculation functions
- ✅ **API Methods** - Complete public API surface
- ✅ **Edge Cases** - Boundary conditions and error scenarios  
- ✅ **Performance** - Basic performance and convergence validation
- ✅ **Integration** - Cross-module functionality
- ✅ **Input Validation** - Parameter checking and error handling

### Key Validation Points

1. **Mathematical Accuracy**
   - Binomial model convergence
   - Black-Scholes formula implementation
   - Greeks numerical differentiation
   - Normal distribution function

2. **Financial Logic**
   - Option moneyness calculations
   - American vs European exercise premiums
   - Time value decay
   - Intrinsic value calculations

3. **API Consistency**
   - Function signatures and return types
   - Error message clarity
   - Parameter validation
   - Default value handling

4. **Performance Standards**
   - 100 option calculations < 1000ms
   - Reasonable memory usage
   - Convergence efficiency

## Test Results Interpretation

### Success Criteria
- All unit tests pass (30/30)
- Performance benchmarks meet targets
- No memory leaks or errors
- Consistent results across runs

### Expected Tolerances
- **Pricing Accuracy**: Within 1e-6 for exact calculations
- **Convergence**: Binomial vs Black-Scholes within 5%
- **Performance**: <10ms per option pricing
- **Greeks**: Reasonable values for market scenarios

## Continuous Integration

### Pre-commit Validation
```bash
npm run test:all  # Runs all test suites
```

### Release Validation
1. Unit tests pass (30/30)
2. Legacy tests pass (academic examples)
3. Real market validation (671K options)
4. Performance benchmarks meet targets
5. TypeScript declarations validate

## Adding New Tests

### Test Structure
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Feature Category', () => {
    test('specific functionality', () => {
        // Arrange
        const input = { /* test parameters */ };
        
        // Act  
        const result = functionUnderTest(input);
        
        // Assert
        assert.ok(result > 0, 'Result should be positive');
    });
});
```

### Best Practices
1. **Descriptive Names** - Clear test and describe names
2. **Isolated Tests** - No dependencies between tests
3. **Edge Cases** - Test boundary conditions
4. **Error Scenarios** - Validate error handling
5. **Performance** - Include timing for critical functions

## Integration with Development

### Development Workflow
1. Make code changes
2. Run `npm test` for quick validation
3. Run `npm run test:all` before commits
4. Review test coverage and add tests for new features

### Debugging Failed Tests
1. Run individual test: `node --test tests/unit.test.js`
2. Add console.log statements for debugging
3. Use Node.js debugger: `node --inspect --test`
4. Check test isolation and dependencies

## Future Enhancements

### Planned Additions
- [ ] **Browser Testing** - Cross-browser compatibility
- [ ] **Memory Leak Detection** - Long-running test scenarios
- [ ] **Stress Testing** - Large dataset validation
- [ ] **Regression Testing** - Historical result validation
- [ ] **Property-Based Testing** - Randomized input validation

### Coverage Goals
- [ ] **100% Function Coverage** - All functions tested
- [ ] **Branch Coverage** - All code paths tested  
- [ ] **Integration Testing** - End-to-end workflows
- [ ] **Documentation Testing** - Example code validation

---

**Test Framework Status**: ✅ Production Ready
- 30 comprehensive unit tests
- Zero dependencies (Node.js built-in test runner)
- Performance benchmarking included
- Real market data validation
- TypeScript compatibility verified