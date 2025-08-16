/**
 * @fileoverview Dividend yield database for major stocks
 * @author Binomial Options Project
 * @version 2.0.0
 */

/**
 * Dividend yields for major stocks as of mid-2024
 * Sources: Company financial reports and market data
 */
const DIVIDEND_YIELDS = {
    // Major indices/ETFs
    'SPY': 0.0133,   // S&P 500 ETF
    'QQQ': 0.0065,   // Nasdaq 100 ETF
    'IWM': 0.0120,   // Russell 2000 ETF
    'DIA': 0.0165,   // Dow Jones ETF
    'EFA': 0.0280,   // International developed
    'EEM': 0.0310,   // Emerging markets
    
    // Technology
    'AAPL': 0.0045,  'MSFT': 0.0072,  'GOOGL': 0.0000,
    'GOOG': 0.0000,  'AMZN': 0.0000,  'META': 0.0045,
    'TSLA': 0.0000,  'NVDA': 0.0035,  'NFLX': 0.0000,
    'CRM': 0.0000,   'ORCL': 0.0130,  'ADBE': 0.0000,
    'INTC': 0.0049,  'CSCO': 0.0280,  'IBM': 0.0475,
    
    // Financials
    'JPM': 0.0260,   'BAC': 0.0280,   'WFC': 0.0290,
    'GS': 0.0260,    'MS': 0.0340,    'C': 0.0380,
    'BRK.B': 0.0000, 'AXP': 0.0200,   'BLK': 0.0230,
    'SCHW': 0.0190,  'USB': 0.0420,   'PNC': 0.0580,
    
    // Healthcare
    'JNJ': 0.0290,   'PFE': 0.0580,   'UNH': 0.0150,
    'MRK': 0.0280,   'CVS': 0.0380,   'ABBV': 0.0350,
    'TMO': 0.0030,   'DHR': 0.0030,   'BMY': 0.0540,
    'GILD': 0.0380,  'AMGN': 0.0280,  'VRTX': 0.0000,
    
    // Consumer
    'KO': 0.0310,    'PEP': 0.0280,   'WMT': 0.0230,
    'PG': 0.0240,    'MCD': 0.0200,   'NKE': 0.0120,
    'SBUX': 0.0230,  'TGT': 0.0280,   'HD': 0.0240,
    'LOW': 0.0180,   'COST': 0.0070,  'AMZN': 0.0000,
    
    // Industrial
    'BA': 0.0220,    'CAT': 0.0220,   'GE': 0.0350,
    'MMM': 0.0590,   'HON': 0.0200,   'UPS': 0.0380,
    'RTX': 0.0240,   'LMT': 0.0260,   'NOC': 0.0150,
    'FDX': 0.0150,   'DE': 0.0200,    'EMR': 0.0320,
    
    // Energy
    'XOM': 0.0340,   'CVX': 0.0310,   'COP': 0.0200,
    'EOG': 0.0240,   'SLB': 0.0170,   'MPC': 0.0540,
    'VLO': 0.0590,   'PSX': 0.0350,   'HES': 0.0100,
    'OXY': 0.0130,   'DVN': 0.0100,   'FANG': 0.0040,
    
    // Utilities
    'NEE': 0.0280,   'SO': 0.0390,    'DUK': 0.0380,
    'AEP': 0.0320,   'EXC': 0.0340,   'XEL': 0.0270,
    'PCG': 0.0000,   'ED': 0.0370,    'ETR': 0.0380,
    'ES': 0.0270,    'FE': 0.0370,    'AES': 0.0320,
    
    // REITs
    'VNO': 0.0650,   'PLD': 0.0310,   'AMT': 0.0280,
    'CCI': 0.0320,   'EQIX': 0.0190,  'SPG': 0.0580,
    'O': 0.0440,     'WELL': 0.0330,  'PSA': 0.0350,
    'EXR': 0.0240,   'AVB': 0.0320,   'UDR': 0.0360
};

/**
 * Default dividend yield for unknown stocks
 */
const DEFAULT_DIVIDEND_YIELD = 0.015; // 1.5%

/**
 * Get dividend yield for a stock symbol
 * @param {string} symbol - Stock symbol (case insensitive)
 * @returns {number} Annual dividend yield as decimal (e.g., 0.025 = 2.5%)
 * @example
 * getDividendYield('AAPL') // Returns 0.0045 (0.45%)
 * getDividendYield('UNKNOWN') // Returns 0.015 (1.5% default)
 */
export function getDividendYield(symbol) {
    if (!symbol || typeof symbol !== 'string') {
        return DEFAULT_DIVIDEND_YIELD;
    }
    
    // Clean symbol (remove suffixes, convert to uppercase)
    const cleanSymbol = symbol.split('.')[0].toUpperCase().trim();
    
    return DIVIDEND_YIELDS[cleanSymbol] ?? DEFAULT_DIVIDEND_YIELD;
}

/**
 * Check if a symbol has dividend data
 * @param {string} symbol - Stock symbol
 * @returns {boolean} True if dividend data is available
 */
export function hasDividendData(symbol) {
    if (!symbol || typeof symbol !== 'string') {
        return false;
    }
    
    const cleanSymbol = symbol.split('.')[0].toUpperCase().trim();
    return cleanSymbol in DIVIDEND_YIELDS;
}

/**
 * Get all available dividend symbols
 * @returns {string[]} Array of symbols with dividend data
 */
export function getAvailableSymbols() {
    return Object.keys(DIVIDEND_YIELDS).sort();
}

/**
 * Get dividend yield by sector/category
 * @param {'tech'|'finance'|'healthcare'|'consumer'|'industrial'|'energy'|'utilities'|'reits'} sector
 * @returns {Object[]} Array of {symbol, yield} objects
 */
export function getDividendsByCategory(sector) {
    const categories = {
        tech: ['AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX', 'CRM', 'ORCL', 'ADBE', 'INTC', 'CSCO', 'IBM'],
        finance: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BRK.B', 'AXP', 'BLK', 'SCHW', 'USB', 'PNC'],
        healthcare: ['JNJ', 'PFE', 'UNH', 'MRK', 'CVS', 'ABBV', 'TMO', 'DHR', 'BMY', 'GILD', 'AMGN', 'VRTX'],
        consumer: ['KO', 'PEP', 'WMT', 'PG', 'MCD', 'NKE', 'SBUX', 'TGT', 'HD', 'LOW', 'COST'],
        industrial: ['BA', 'CAT', 'GE', 'MMM', 'HON', 'UPS', 'RTX', 'LMT', 'NOC', 'FDX', 'DE', 'EMR'],
        energy: ['XOM', 'CVX', 'COP', 'EOG', 'SLB', 'MPC', 'VLO', 'PSX', 'HES', 'OXY', 'DVN', 'FANG'],
        utilities: ['NEE', 'SO', 'DUK', 'AEP', 'EXC', 'XEL', 'PCG', 'ED', 'ETR', 'ES', 'FE', 'AES'],
        reits: ['VNO', 'PLD', 'AMT', 'CCI', 'EQIX', 'SPG', 'O', 'WELL', 'PSA', 'EXR', 'AVB', 'UDR']
    };
    
    const symbols = categories[sector.toLowerCase()];
    if (!symbols) {
        throw new Error(`Unknown sector: ${sector}. Available: ${Object.keys(categories).join(', ')}`);
    }
    
    return symbols
        .filter(symbol => symbol in DIVIDEND_YIELDS)
        .map(symbol => ({
            symbol,
            yield: DIVIDEND_YIELDS[symbol]
        }))
        .sort((a, b) => b.yield - a.yield); // Sort by yield descending
}

/**
 * Get summary statistics for dividend data
 * @returns {Object} Statistics about the dividend database
 */
export function getDividendStats() {
    const yields = Object.values(DIVIDEND_YIELDS);
    const nonZeroYields = yields.filter(y => y > 0);
    
    return {
        totalSymbols: yields.length,
        symbolsWithDividends: nonZeroYields.length,
        symbolsWithoutDividends: yields.length - nonZeroYields.length,
        averageYield: nonZeroYields.reduce((sum, y) => sum + y, 0) / nonZeroYields.length,
        medianYield: nonZeroYields.sort((a, b) => a - b)[Math.floor(nonZeroYields.length / 2)],
        maxYield: Math.max(...yields),
        minYield: Math.min(...nonZeroYields),
        defaultYield: DEFAULT_DIVIDEND_YIELD
    };
}