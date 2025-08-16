/**
 * Web calculator interface using the modern BinomialOptions class
 */

function calculateOption(event) {
    event.preventDefault();
    
    try {
        // Get form values
        const stockName = document.getElementById('stockName').value;
        const spotPrice = parseFloat(document.getElementById('currentPrice').value);
        const strikePrice = parseFloat(document.getElementById('strikePrice').value);
        const riskFreeRate = parseFloat(document.getElementById('riskFreeRate').value) / 100;
        const expirationDate = document.getElementById('expirationDate').value;
        const optionType = document.getElementById('optionType').value;
        const exerciseStyle = document.getElementById('exerciseStyle').value;
        const dividendYield = parseFloat(document.getElementById('dividendYield').value) / 100;
        const volatility = parseFloat(document.getElementById('volatility').value) / 100;

        // Validate inputs
        if (!spotPrice || !strikePrice || !expirationDate) {
            throw new Error('Please fill in all required fields');
        }

        // Calculate time to expiry
        const expiry = new Date(expirationDate);
        const today = new Date();
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysToExpiry = Math.ceil((expiry - today) / msPerDay);
        
        if (daysToExpiry <= 0) {
            throw new Error('Expiration date must be in the future');
        }

        const timeToExpiry = BinomialOptions.daysToYears(daysToExpiry, 'trading');

        // Prepare parameters
        const params = {
            spotPrice,
            strikePrice,
            timeToExpiry,
            riskFreeRate,
            volatility,
            dividendYield,
            optionType,
            exerciseStyle,
            steps: 100
        };

        // Calculate option price and Greeks
        const optionPrice = BinomialOptions.price(params);
        const greeks = BinomialOptions.greeks(params);
        
        // Calculate implied volatility (reverse calculation for validation)
        let impliedVol = null;
        try {
            impliedVol = BinomialOptions.impliedVolatility(
                { ...params, volatility: undefined }, 
                optionPrice
            );
        } catch (error) {
            console.warn('Could not calculate implied volatility:', error.message);
        }

        // Display results
        displayResults({
            stockName,
            optionPrice,
            greeks,
            impliedVol,
            params,
            daysToExpiry
        });

        // Clear any previous error messages
        clearErrorMessage();

    } catch (error) {
        console.error('Calculation error:', error);
        displayError(error.message);
    }

    return false;
}

function displayResults(results) {
    const { stockName, optionPrice, greeks, impliedVol, params, daysToExpiry } = results;
    
    // Update result cards
    document.getElementById('optionValue').textContent = `$${optionPrice.toFixed(2)}`;
    document.getElementById('impliedVolatility').textContent = impliedVol ? 
        `${(impliedVol * 100).toFixed(2)}%` : 'N/A';
    document.getElementById('delta').textContent = greeks.delta.toFixed(4);
    document.getElementById('gamma').textContent = greeks.gamma.toFixed(4);
    document.getElementById('theta').textContent = greeks.theta.toFixed(2);

    // Add detailed information
    const resultsSection = document.querySelector('.mt-5');
    
    // Remove any existing detailed results
    const existingDetails = document.getElementById('detailedResults');
    if (existingDetails) {
        existingDetails.remove();
    }

    // Create detailed results section
    const detailsDiv = document.createElement('div');
    detailsDiv.id = 'detailedResults';
    detailsDiv.className = 'mt-4';
    detailsDiv.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Detailed Analysis - ${stockName} ${params.optionType.toUpperCase()}</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Option Parameters</h6>
                        <ul class="list-unstyled">
                            <li><strong>Spot Price:</strong> $${params.spotPrice}</li>
                            <li><strong>Strike Price:</strong> $${params.strikePrice}</li>
                            <li><strong>Days to Expiry:</strong> ${daysToExpiry}</li>
                            <li><strong>Time (years):</strong> ${params.timeToExpiry.toFixed(4)}</li>
                            <li><strong>Exercise Style:</strong> ${params.exerciseStyle}</li>
                            <li><strong>Risk-Free Rate:</strong> ${(params.riskFreeRate * 100).toFixed(2)}%</li>
                            <li><strong>Volatility:</strong> ${(params.volatility * 100).toFixed(2)}%</li>
                            <li><strong>Dividend Yield:</strong> ${(params.dividendYield * 100).toFixed(2)}%</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h6>The Greeks</h6>
                        <ul class="list-unstyled">
                            <li><strong>Delta:</strong> ${greeks.delta.toFixed(4)} <small class="text-muted">(price sensitivity to stock price)</small></li>
                            <li><strong>Gamma:</strong> ${greeks.gamma.toFixed(4)} <small class="text-muted">(delta sensitivity)</small></li>
                            <li><strong>Vega:</strong> ${greeks.vega.toFixed(2)} <small class="text-muted">(volatility sensitivity)</small></li>
                            <li><strong>Theta:</strong> ${greeks.theta.toFixed(2)} <small class="text-muted">(time decay per day)</small></li>
                            <li><strong>Rho:</strong> ${greeks.rho.toFixed(2)} <small class="text-muted">(interest rate sensitivity)</small></li>
                        </ul>
                        ${impliedVol ? `<p><strong>Implied Volatility:</strong> ${(impliedVol * 100).toFixed(2)}%</p>` : ''}
                    </div>
                </div>
                
                <div class="mt-3">
                    <h6>Moneyness</h6>
                    <p class="mb-1">
                        <strong>Current Moneyness:</strong> ${(params.spotPrice / params.strikePrice).toFixed(3)}
                        <span class="badge ${getMoneynessBadgeClass(params.spotPrice, params.strikePrice, params.optionType)}">${getMoneyness(params.spotPrice, params.strikePrice, params.optionType)}</span>
                    </p>
                    
                    <h6 class="mt-3">Risk Assessment</h6>
                    <div class="alert ${getRiskAlertClass(greeks)} alert-sm">
                        ${getRiskAssessment(greeks, params)}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    resultsSection.appendChild(detailsDiv);
}

function getMoneyness(spotPrice, strikePrice, optionType) {
    const ratio = spotPrice / strikePrice;
    if (optionType === 'call') {
        if (ratio > 1.02) return 'ITM';
        if (ratio < 0.98) return 'OTM';
        return 'ATM';
    } else {
        if (ratio < 0.98) return 'ITM';
        if (ratio > 1.02) return 'OTM';
        return 'ATM';
    }
}

function getMoneynessBadgeClass(spotPrice, strikePrice, optionType) {
    const moneyness = getMoneyness(spotPrice, strikePrice, optionType);
    if (moneyness === 'ITM') return 'bg-success';
    if (moneyness === 'ATM') return 'bg-warning';
    return 'bg-secondary';
}

function getRiskAlertClass(greeks) {
    const highRisk = Math.abs(greeks.theta) > 50 || Math.abs(greeks.vega) > 80;
    return highRisk ? 'alert-warning' : 'alert-info';
}

function getRiskAssessment(greeks, params) {
    const assessments = [];
    
    if (Math.abs(greeks.theta) > 50) {
        assessments.push('High time decay - option loses significant value daily');
    }
    
    if (Math.abs(greeks.vega) > 80) {
        assessments.push('High volatility sensitivity - small IV changes have large price impact');
    }
    
    if (Math.abs(greeks.delta) > 0.8) {
        assessments.push('High directional exposure - moves almost dollar-for-dollar with stock');
    }
    
    if (greeks.gamma > 0.01) {
        assessments.push('High gamma - delta changes rapidly with stock price movements');
    }
    
    if (assessments.length === 0) {
        assessments.push('Moderate risk profile - balanced exposure across Greeks');
    }
    
    return assessments.join('. ');
}

function displayError(message) {
    const resultsSection = document.querySelector('.mt-5');
    
    // Remove existing error
    const existingError = document.getElementById('errorMessage');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.id = 'errorMessage';
    errorDiv.className = 'alert alert-danger';
    errorDiv.textContent = `Error: ${message}`;
    
    resultsSection.insertBefore(errorDiv, resultsSection.firstChild);
}

function clearErrorMessage() {
    const existingError = document.getElementById('errorMessage');
    if (existingError) {
        existingError.remove();
    }
}

// Set default expiration date to 30 days from now
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const defaultExpiry = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    const expirationInput = document.getElementById('expirationDate');
    if (expirationInput) {
        expirationInput.value = defaultExpiry.toISOString().split('T')[0];
    }
});