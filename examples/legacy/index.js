function calculate(event) {
    event.preventDefault();
    var currentPrice = document.getElementById("currentPrice").value;
    var strikePrice = document.getElementById("strikePrice").value;
    var riskFreeRate = document.getElementById("riskFreeRate").value;
    var expiry = document.getElementById("expirationDate").value;
    var optionType = document.getElementById("optionType").value;

    return false;
}

function binomialOptionTheoreticalOptionPrice(
    expirationTime,
    stockPrice,
    strikePrice,
    interestRate,
    volatility,
    dividendYield,
    n,
    optionType // e.g. 'call' or 'put'
) {
    if (optionType !== 'call' && optionType !== 'put') {
        throw new Error('Invalid option type: ' + optionType);
    }

    var deltaT = expirationTime / n;
    var up = Math.exp(volatility * Math.sqrt(deltaT));

    // Suppose d is 1/up (typical Cox-Ross-Rubinstein approach).
    // But the code as written is using a direct formula for p0 & p1.
    var p0 = (up * Math.exp(-dividendYield * deltaT) - Math.exp(-interestRate * deltaT)) / (up * up - 1);
    var p1 = Math.exp(-interestRate * deltaT) - p0;

    var optionValues = [];

    for (var i = 0; i <= n; i++) {
        var sNode = stockPrice * Math.pow(up, 2 * i - n);
        var payoff;
        if (optionType === 'call') {
            payoff = sNode - strikePrice;         // (S-K)
        } else {
            payoff = strikePrice - sNode;         // (K-S)
        }
        optionValues[i] = Math.max(payoff, 0);
    }

    // 2) Step backward through the tree
    for (var j = n - 1; j >= 0; j--) {
        for (var i = 0; i <= j; i++) {
            // continuation value:
            var continuationVal = p0 * optionValues[i + 1] + p1 * optionValues[i];

            // immediate exercise payoff if American
            var sNode = stockPrice * Math.pow(up, 2*i - j + 1);
            var exercisePayoff;
            if (optionType === 'call') {
                exercisePayoff = sNode - strikePrice;     // (S-K)
            } else {
                exercisePayoff = strikePrice - sNode;     // (K-S)
            }

            // for American, pick the maximum of continuing vs. exercising
            optionValues[i] = Math.max(continuationVal, exercisePayoff);
        }
    }

    return optionValues[0];
}

function binomialOptionTheoreticalOptionPriceClaude(
    expirationTime,
    stockPrice,
    strikePrice,
    interestRate,
    volatility,
    dividendYield,
    n,
    optionType // e.g. 'call' or 'put'
) {
    if (optionType !== 'call' && optionType !== 'put') {
        throw new Error('Invalid option type: ' + optionType);
    }

    // Calculate parameters for the binomial model
    const deltaT = expirationTime / n;
    const discountFactor = Math.exp(-interestRate * deltaT);

    // Calculate up and down factors using Cox-Ross-Rubinstein approach
    const upFactor = Math.exp(volatility * Math.sqrt(deltaT));
    const downFactor = 1 / upFactor;

    // Calculate risk-neutral probability
    const adjustedRate = interestRate - dividendYield;
    const pUp = (Math.exp(adjustedRate * deltaT) - downFactor) / (upFactor - downFactor);
    const pDown = 1 - pUp;

    // Generate the asset price tree
    let stockPrices = new Array(n + 1);
    for (let i = 0; i <= n; i++) {
        stockPrices[i] = stockPrice * Math.pow(upFactor, n - i) * Math.pow(downFactor, i);
    }

    // Calculate option values at expiration
    let optionValues = new Array(n + 1);
    for (let i = 0; i <= n; i++) {
        if (optionType === 'call') {
            optionValues[i] = Math.max(0, stockPrices[i] - strikePrice);
        } else { // put
            optionValues[i] = Math.max(0, strikePrice - stockPrices[i]);
        }
    }

    // Work backwards through the tree to calculate option values
    for (let step = n - 1; step >= 0; step--) {
        for (let i = 0; i <= step; i++) {
            // Calculate the stock price at this node
            const price = stockPrice * Math.pow(upFactor, step - i) * Math.pow(downFactor, i);

            // Calculate the option value using risk-neutral probabilities
            const expectedOptionValue = (pUp * optionValues[i] + pDown * optionValues[i + 1]) * discountFactor;

            // For American options, compare with immediate exercise value
            if (optionType === 'call') {
                optionValues[i] = Math.max(expectedOptionValue, price - strikePrice);
            } else { // put
                optionValues[i] = Math.max(expectedOptionValue, strikePrice - price);
            }
        }
    }

    return optionValues[0];
}

function binomialOptionTheoreticalOptionPriceo1(
    expirationTime,
    stockPrice,
    strikePrice,
    interestRate,
    volatility,
    dividendYield,
    n,
    optionType // 'call' or 'put'
) {
    // 1) Validate option type
    if (optionType !== 'call' && optionType !== 'put') {
        throw new Error('Invalid option type: ' + optionType);
    }

    // 2) Basic definitions
    const dt = expirationTime / n;                     // length of each step
    const u = Math.exp(volatility * Math.sqrt(dt));    // up factor
    const d = 1 / u;                                   // down factor
    const pu = (Math.exp((interestRate - dividendYield) * dt) - d) / (u - d);  // risk-neutral prob of up
    const pd = 1 - pu;                                 // risk-neutral prob of down
    const discount = Math.exp(-interestRate * dt);     // discount factor per step

    // 3) Setup array for option values at the final step
    const optionValues = new Array(n + 1);

    // 4) Compute the option payoff at each terminal node
    for (let i = 0; i <= n; i++) {
        // Stock price at node i:  S_0 * (u^i) * (d^(n-i))
        const s = stockPrice * Math.pow(u, i) * Math.pow(d, (n - i));

        if (optionType === 'call') {
            optionValues[i] = Math.max(s - strikePrice, 0);
        } else { // put
            optionValues[i] = Math.max(strikePrice - s, 0);
        }
    }

    // 5) Step backwards through the binomial tree to time 0
    //    For each node, compute:
    //      - the "continuation value" = discounted expected payoff
    //      - the "early exercise" (intrinsic) value
    //      - For American: take max of these two
    for (let step = n - 1; step >= 0; step--) {
        for (let i = 0; i <= step; i++) {
            // Continuation value
            const continuationValue = discount * (pu * optionValues[i + 1] + pd * optionValues[i]);

            // Stock price at this node
            const s = stockPrice * Math.pow(u, i) * Math.pow(d, (step - i));

            // Intrinsic value if we exercise now
            let intrinsic;
            if (optionType === 'call') {
                intrinsic = Math.max(s - strikePrice, 0);
            } else { // put
                intrinsic = Math.max(strikePrice - s, 0);
            }

            // American option: max of continuation vs. early exercise
            optionValues[i] = Math.max(continuationValue, intrinsic);
        }
    }

    // optionValues[0] is now the theoretical price at time 0
    return optionValues[0];
}

console.log(binomialOptionTheoreticalOptionPrice((29/252.0), 560.61, 550, 0.0423, 0.2299, 0.01, 100, 'put')); // Actual = 11.86	11.81	11.87
console.log(binomialOptionTheoreticalOptionPrice((29/252.0), 560.61, 570, 0.0423, 0.2229, 0.01, 100, 'call')); // Actual = 11.95, 12.11, 12.16

console.log(binomialOptionTheoreticalOptionPriceClaude((38/365.0), 560.61, 550, 0.0423, 0.2299, 0.01, 100, 'put'));
console.log(binomialOptionTheoreticalOptionPriceClaude((38/365.0), 560.61, 570, 0.0423, 0.2229, 0.01, 100, 'call'));

console.log(binomialOptionTheoreticalOptionPriceo1((38/365.0), 560.61, 550, 0.0423, 0.2299, 0.01, 100, 'put'));
console.log(binomialOptionTheoreticalOptionPriceo1((38/365.0), 560.61, 570, 0.0423, 0.2229, 0.01, 100, 'call'));
