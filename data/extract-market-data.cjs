/**
 * Extract and clean real market data from L2_20240624/ CSV files
 * Prepares data for proper validation: Market IV → Our Model → Compare to Market Price
 */

const fs = require('fs');
const zlib = require('zlib');

function parseCSV(filePath) {
  let content;
  
  // Handle compressed files
  if (filePath.endsWith('.gz')) {
    console.log(`📦 Decompressing: ${filePath}`);
    const compressedData = fs.readFileSync(filePath);
    content = zlib.gunzipSync(compressedData).toString('utf8');
  } else {
    content = fs.readFileSync(filePath, 'utf8');
  }
  
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((header, i) => {
      row[header.trim()] = values[i]?.trim() || '';
    });
    return row;
  });
}

function calculateDaysToExpiry(expiryDate, dataDate) {
  const expiry = new Date(expiryDate);
  const data = new Date(dataDate.split(' ')[0]); // Remove time part
  return Math.ceil((expiry - data) / (1000 * 60 * 60 * 24));
}

function extractCleanMarketData() {
  console.log('📊 Extracting real market data from L2_20240624/');
  console.log('===============================================');
  
  // Load the CSV files (handle both compressed and uncompressed)
  const basePath = 'data/L2_20240624';
  
  // Try compressed file first, then uncompressed
  let optionsPath = `${basePath}/options_20240624.csv.gz`;
  if (!fs.existsSync(optionsPath)) {
    optionsPath = `${basePath}/options_20240624.csv`;
  }
  
  const optionsData = parseCSV(optionsPath);
  const stockData = parseCSV(`${basePath}/stockquotes_20240624.csv`);
  
  console.log(`📈 Loaded ${optionsData.length} option contracts`);
  console.log(`📊 Loaded ${stockData.length} stock quotes`);
  
  // Create stock price lookup
  const stockPrices = {};
  stockData.forEach(stock => {
    stockPrices[stock.symbol] = parseFloat(stock.close);
  });
  
  console.log(`💰 Stock symbols available: ${Object.keys(stockPrices).length}`);
  
  // Filter and clean options data
  const cleanOptions = [];
  const filters = {
    totalOptions: 0,
    hasUnderlying: 0,
    hasValidIV: 0,
    hasValidPrices: 0,
    liquidOptions: 0,
    finalClean: 0
  };
  
  for (const option of optionsData) {
    filters.totalOptions++;
    
    const symbol = option.UnderlyingSymbol;
    const stockPrice = stockPrices[symbol];
    
    // Must have underlying stock price
    if (!stockPrice) continue;
    filters.hasUnderlying++;
    
    // Parse numeric fields
    const strike = parseFloat(option.Strike);
    const last = parseFloat(option.Last);
    const bid = parseFloat(option.Bid);
    const ask = parseFloat(option.Ask);
    const iv = parseFloat(option.IV);
    const volume = parseInt(option.Volume) || 0;
    const openInterest = parseInt(option.OpenInterest) || 0;
    const delta = parseFloat(option.Delta);
    const gamma = parseFloat(option.Gamma);
    const theta = parseFloat(option.Theta);
    const vega = parseFloat(option.Vega);
    
    // Must have valid IV (this is critical for our test)
    if (!iv || iv <= 0 || iv > 5) continue; // IV between 0% and 500%
    filters.hasValidIV++;
    
    // Must have valid bid/ask prices
    if (!bid || !ask || bid <= 0 || ask <= 0 || ask <= bid) continue;
    filters.hasValidPrices++;
    
    // Filter for reasonably liquid options
    const bidAskSpread = ask - bid;
    const midPrice = (bid + ask) / 2;
    const spreadPercent = bidAskSpread / midPrice;
    
    // Skip if spread is too wide (> 50% of mid price)
    if (spreadPercent > 0.5) continue;
    filters.liquidOptions++;
    
    // Calculate days to expiry
    const daysToExpiry = calculateDaysToExpiry(option.Expiration, option.DataDate);
    
    // Skip if expiry is too close (< 1 day) or too far (> 365 days)
    if (daysToExpiry < 1 || daysToExpiry > 365) continue;
    
    // Calculate moneyness
    const moneyness = stockPrice / strike;
    
    cleanOptions.push({
      // Basic option info
      symbol,
      optionSymbol: option.OptionSymbol,
      type: option.Type.toLowerCase(),
      strike,
      stockPrice,
      daysToExpiry,
      expirationDate: option.Expiration,
      dataDate: option.DataDate,
      
      // Market prices - this is what we're trying to match
      marketBid: bid,
      marketAsk: ask,
      marketLast: last,
      marketMid: midPrice,
      
      // Market IV - this is our input to the model
      marketIV: iv,
      
      // Market Greeks - for comparison
      marketDelta: delta || null,
      marketGamma: gamma || null,
      marketTheta: theta || null,
      marketVega: vega || null,
      
      // Liquidity measures
      volume,
      openInterest,
      bidAskSpread,
      spreadPercent,
      
      // Risk measures
      moneyness,
      timeValue: daysToExpiry / 365
    });
    
    filters.finalClean++;
  }
  
  // Sort by symbol, then by strike
  cleanOptions.sort((a, b) => {
    if (a.symbol !== b.symbol) return a.symbol.localeCompare(b.symbol);
    return a.strike - b.strike;
  });
  
  // Generate summary stats
  const symbols = [...new Set(cleanOptions.map(opt => opt.symbol))];
  const callCount = cleanOptions.filter(opt => opt.type === 'call').length;
  const putCount = cleanOptions.filter(opt => opt.type === 'put').length;
  
  const avgIV = cleanOptions.reduce((sum, opt) => sum + opt.marketIV, 0) / cleanOptions.length;
  const avgDaysToExpiry = cleanOptions.reduce((sum, opt) => sum + opt.daysToExpiry, 0) / cleanOptions.length;
  const avgSpread = cleanOptions.reduce((sum, opt) => sum + opt.spreadPercent, 0) / cleanOptions.length;
  
  const results = {
    extractionDate: new Date().toISOString(),
    dataDate: '2024-06-24',
    summary: {
      totalCleanOptions: cleanOptions.length,
      uniqueSymbols: symbols.length,
      calls: callCount,
      puts: putCount,
      avgImpliedVolatility: avgIV,
      avgDaysToExpiry: Math.round(avgDaysToExpiry),
      avgBidAskSpread: avgSpread
    },
    filters,
    symbols: symbols.slice(0, 20), // First 20 symbols
    cleanOptions
  };
  
  // Save the clean data
  fs.writeFileSync('market-data-clean.json', JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n📋 EXTRACTION SUMMARY:');
  console.log(`✅ Clean options ready for validation: ${cleanOptions.length}`);
  console.log(`📊 Unique symbols: ${symbols.length}`);
  console.log(`📞 Calls: ${callCount}, Puts: ${putCount}`);
  console.log(`⏱️  Average days to expiry: ${Math.round(avgDaysToExpiry)}`);
  console.log(`📈 Average IV: ${(avgIV * 100).toFixed(1)}%`);
  console.log(`💰 Average bid-ask spread: ${(avgSpread * 100).toFixed(1)}%`);
  
  console.log('\n🔍 FILTERING RESULTS:');
  console.log(`📥 Total options in file: ${filters.totalOptions}`);
  console.log(`🏢 Had underlying stock price: ${filters.hasUnderlying}`);
  console.log(`📊 Had valid IV: ${filters.hasValidIV}`);
  console.log(`💵 Had valid bid/ask: ${filters.hasValidPrices}`);
  console.log(`💧 Reasonably liquid: ${filters.liquidOptions}`);
  console.log(`✨ Final clean options: ${filters.finalClean}`);
  
  console.log('\n📦 Sample symbols:', symbols.slice(0, 10).join(', '));
  
  // Show a few sample options
  console.log('\n📋 Sample options:');
  for (const opt of cleanOptions.slice(0, 5)) {
    console.log(`${opt.symbol} ${opt.type} $${opt.strike} ${opt.daysToExpiry}d IV=${(opt.marketIV*100).toFixed(1)}% Mid=$${opt.marketMid.toFixed(2)}`);
  }
  
  console.log(`\n💾 Saved to: market-data-clean.json`);
  
  return results;
}

// Run the extraction
if (require.main === module) {
  try {
    extractCleanMarketData();
    console.log('\n🎉 SUCCESS! Real market data extracted and ready for validation.');
  } catch (error) {
    console.error('\n💥 Extraction failed:', error.message);
    process.exit(1);
  }
}

module.exports = { extractCleanMarketData };