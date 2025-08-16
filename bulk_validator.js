// Bulk Options Validator
// Tests hundreds of option prices against your model

const { binomialOptionPrice } = require('./index_fixed.js');
const { generateSyntheticOptionsData, loadOptionsData, fetchYahooOptionsChain, saveOptionsData } = require('./data_collector.js');

// Calculate model price and compare to market
function validateOption(option, riskFreeRate = 0.045) {
    const { stockPrice, strike, expiration, type, mid, bid, ask, impliedVol } = option;
    
    // Time to expiration
    const T = expiration / 365; // or 252 for trading days
    
    // Calculate model price using market IV
    const modelPrice = binomialOptionPrice(
        T,
        stockPrice,
        strike,
        riskFreeRate,
        impliedVol,
        0.01, // dividend yield (adjust per stock)
        100,  // steps
        type,
        'american'
    );
    
    // Market price (use mid or last)
    const marketPrice = mid || ((bid + ask) / 2);
    
    // Calculate error metrics
    const absoluteError = modelPrice - marketPrice;
    const percentError = (absoluteError / marketPrice) * 100;
    const withinSpread = (modelPrice >= bid && modelPrice <= ask);
    
    return {
        ...option,
        modelPrice,
        marketPrice,
        absoluteError,
        percentError,
        withinSpread
    };
}

// Bulk validation
function validateOptionsDataset(options, riskFreeRate = 0.045) {
    console.log(`Validating ${options.length} options...`);
    
    const results = options.map(opt => validateOption(opt, riskFreeRate));
    
    // Calculate statistics
    const stats = {
        totalOptions: results.length,
        avgAbsError: 0,
        avgPctError: 0,
        withinSpreadCount: 0,
        errorBuckets: {
            under5pct: 0,
            under10pct: 0,
            under20pct: 0,
            over20pct: 0
        },
        byType: {
            call: { count: 0, avgError: 0 },
            put: { count: 0, avgError: 0 }
        },
        byMoneyness: {
            itm: { count: 0, avgError: 0 },
            atm: { count: 0, avgError: 0 },
            otm: { count: 0, avgError: 0 }
        }
    };
    
    // Process results
    for (let result of results) {
        const absPctError = Math.abs(result.percentError);
        
        stats.avgAbsError += Math.abs(result.absoluteError);
        stats.avgPctError += absPctError;
        stats.withinSpreadCount += result.withinSpread ? 1 : 0;
        
        // Error buckets
        if (absPctError < 5) stats.errorBuckets.under5pct++;
        else if (absPctError < 10) stats.errorBuckets.under10pct++;
        else if (absPctError < 20) stats.errorBuckets.under20pct++;
        else stats.errorBuckets.over20pct++;
        
        // By type
        stats.byType[result.type].count++;
        stats.byType[result.type].avgError += absPctError;
        
        // By moneyness
        const moneyness = result.stockPrice / result.strike;
        let category;
        if (result.type === 'call') {
            category = moneyness > 1.02 ? 'itm' : moneyness < 0.98 ? 'otm' : 'atm';
        } else {
            category = moneyness < 0.98 ? 'itm' : moneyness > 1.02 ? 'otm' : 'atm';
        }
        stats.byMoneyness[category].count++;
        stats.byMoneyness[category].avgError += absPctError;
    }
    
    // Calculate averages
    stats.avgAbsError /= stats.totalOptions;
    stats.avgPctError /= stats.totalOptions;
    stats.withinSpreadPct = (stats.withinSpreadCount / stats.totalOptions) * 100;
    
    for (let type of ['call', 'put']) {
        if (stats.byType[type].count > 0) {
            stats.byType[type].avgError /= stats.byType[type].count;
        }
    }
    
    for (let category of ['itm', 'atm', 'otm']) {
        if (stats.byMoneyness[category].count > 0) {
            stats.byMoneyness[category].avgError /= stats.byMoneyness[category].count;
        }
    }
    
    return { results, stats };
}

// Find worst performers for debugging
function findWorstPerformers(results, n = 10) {
    return results
        .sort((a, b) => Math.abs(b.percentError) - Math.abs(a.percentError))
        .slice(0, n);
}

// Generate detailed report
function generateReport(validationResults) {
    const { results, stats } = validationResults;
    
    console.log('\n' + '='.repeat(70));
    console.log('BULK VALIDATION REPORT');
    console.log('='.repeat(70));
    
    console.log(`\nTotal Options Validated: ${stats.totalOptions}`);
    console.log(`Average Absolute Error: $${stats.avgAbsError.toFixed(3)}`);
    console.log(`Average Percent Error: ${stats.avgPctError.toFixed(2)}%`);
    console.log(`Within Bid-Ask Spread: ${stats.withinSpreadCount} (${stats.withinSpreadPct.toFixed(1)}%)`);
    
    console.log('\nError Distribution:');
    console.log(`  < 5% error:  ${stats.errorBuckets.under5pct} (${(stats.errorBuckets.under5pct/stats.totalOptions*100).toFixed(1)}%)`);
    console.log(`  < 10% error: ${stats.errorBuckets.under10pct} (${(stats.errorBuckets.under10pct/stats.totalOptions*100).toFixed(1)}%)`);
    console.log(`  < 20% error: ${stats.errorBuckets.under20pct} (${(stats.errorBuckets.under20pct/stats.totalOptions*100).toFixed(1)}%)`);
    console.log(`  > 20% error: ${stats.errorBuckets.over20pct} (${(stats.errorBuckets.over20pct/stats.totalOptions*100).toFixed(1)}%)`);
    
    console.log('\nBy Option Type:');
    console.log(`  Calls: ${stats.byType.call.count} options, ${stats.byType.call.avgError.toFixed(2)}% avg error`);
    console.log(`  Puts:  ${stats.byType.put.count} options, ${stats.byType.put.avgError.toFixed(2)}% avg error`);
    
    console.log('\nBy Moneyness:');
    console.log(`  ITM: ${stats.byMoneyness.itm.count} options, ${stats.byMoneyness.itm.avgError.toFixed(2)}% avg error`);
    console.log(`  ATM: ${stats.byMoneyness.atm.count} options, ${stats.byMoneyness.atm.avgError.toFixed(2)}% avg error`);
    console.log(`  OTM: ${stats.byMoneyness.otm.count} options, ${stats.byMoneyness.otm.avgError.toFixed(2)}% avg error`);
    
    // Show worst performers
    const worst = findWorstPerformers(results, 5);
    console.log('\nWorst Performers (for debugging):');
    console.log('Symbol | Type | Strike | Expiry | Market | Model | Error%');
    console.log('-'.repeat(70));
    for (let opt of worst) {
        console.log(
            `${opt.symbol.padEnd(6)} | ${opt.type.padEnd(4)} | $${opt.strike.toString().padEnd(6)} | ${opt.expiration}d | $${opt.marketPrice.toFixed(2).padEnd(6)} | $${opt.modelPrice.toFixed(2).padEnd(6)} | ${opt.percentError.toFixed(1)}%`
        );
    }
    
    return stats;
}

// Main execution
async function main() {
    console.log('Options Bulk Validator');
    console.log('======================\n');
    
    // Option 1: Generate synthetic data for testing
    console.log('Generating synthetic options data...');
    const syntheticData = generateSyntheticOptionsData('SPY', 560, 0.045, 0.013);
    console.log(`Generated ${syntheticData.length} synthetic options\n`);
    
    // Validate synthetic data
    const validation = validateOptionsDataset(syntheticData);
    generateReport(validation);
    
    // Save results
    saveOptionsData(validation.results, 'validation_results.json');
    
    console.log('\n' + '='.repeat(70));
    console.log('FETCHING REAL DATA');
    console.log('='.repeat(70));
    
    // Option 2: Fetch real data from Yahoo
    console.log('\nTo fetch real Yahoo Finance data, uncomment the following:');
    console.log('// const yahooData = await fetchYahooOptionsChain("SPY");');
    console.log('// console.log(`Fetched ${yahooData.calls.length + yahooData.puts.length} real options`);');
    console.log('// Note: May be rate limited\n');
    
    // Provide instructions for bulk real data
    console.log('For bulk real data collection:');
    console.log('1. Yahoo Finance: Loop through symbols with delays');
    console.log('2. Use Python yfinance + subprocess for better reliability');
    console.log('3. Sign up for free API keys from providers listed in data_collector.js');
    console.log('4. Download CBOE end-of-day files');
    
    // CSV export for Excel analysis
    console.log('\nExporting to CSV for Excel analysis...');
    exportToCSV(validation.results, 'validation_results.csv');
}

// Export results to CSV
function exportToCSV(results, filename) {
    const fs = require('fs');
    
    const headers = [
        'Symbol', 'Type', 'Strike', 'Expiration', 'Stock Price',
        'Market Price', 'Model Price', 'Absolute Error', 'Percent Error',
        'Within Spread', 'Implied Vol', 'Volume', 'Open Interest'
    ];
    
    let csv = headers.join(',') + '\n';
    
    for (let r of results) {
        csv += [
            r.symbol,
            r.type,
            r.strike,
            r.expiration,
            r.stockPrice,
            r.marketPrice.toFixed(2),
            r.modelPrice.toFixed(2),
            r.absoluteError.toFixed(2),
            r.percentError.toFixed(2),
            r.withinSpread ? 'Y' : 'N',
            (r.impliedVol * 100).toFixed(1),
            r.volume || 0,
            r.openInterest || 0
        ].join(',') + '\n';
    }
    
    fs.writeFileSync(filename, csv);
    console.log(`Results exported to ${filename}`);
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    validateOption,
    validateOptionsDataset,
    generateReport,
    exportToCSV
};