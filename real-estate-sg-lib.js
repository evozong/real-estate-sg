function calcDownpayment(homePrice, downpaymentPct) {
    console.info("calcDownpayment(" + homePrice + ", " + downpaymentPct + ")");

    let downpay = (downpaymentPct/100.0) * homePrice;
    console.info("\tdownpay = " + downpay);
    return downpay;
}
function calcMortgageAmt(homePrice, downpaymentPct) {
    console.info("calcMortgageAmt(" + homePrice + ", " + downpaymentPct + ")");

    let homeLoanAmt = (1.0 - (downpaymentPct/100.0)) * homePrice;
    console.info("\thomeLoanAmt = " + homeLoanAmt);
    return homeLoanAmt;
}

function applyBrackets(brackets, val) {
	let res = 0;

	for (let i=0; i<brackets.length & val>0; i++) {
		let bracketMax = brackets[i][0];
		let bracketRate = brackets[i][1];

		if (val > bracketMax) {
				res += bracketRate * bracketMax;
				val -= bracketMax;
		} else {
				res += bracketRate * val;
				val -= val;
		}
	}

	return res;
}

function calcBuyerStampDuty(purchasePrice, marketValue = 0) {
    console.info("calcBuyerStampInfo(" + purchasePrice + ", " + marketValue + ")");
    // Reference: https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer's-stamp-duty-(bsd)
    // Note: For residential only! Non-residential have different formula.
    // BSD is computed based on the purchase price or market value of the property, whichever is higher.

    let computeOn = Math.max(purchasePrice, marketValue);

    const brackets = [
        // bracketMax, rate
          [180000, 0.01] // First $180,000 at 1%
        , [180000, 0.02] // Next $180,000 at 2%
        , [640000, 0.03] // Next $640,000 at 3%
        , [Number.MAX_VALUE, 0.04] // All the rest at 4%
    ];

		let bsd = applyBrackets(brackets, computeOn);

    console.info("\tbsd = " + bsd);
    return bsd;
}

function additionalBuyerStampDuty(numProperties, purchasePrice, marketValue = 0) {
    console.info("calcAdditionalBuyerStampDuty(" + numProperties + ", " + purchasePrice + ", "+ marketValue + ")");
    // Reference: https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer's-stamp-duty-(absd)
    // Note: For Singaporean Citizens only! PRs, foreigners, business, trust have different rates

    if (numProperties <= 1) {
        console.info("\tabsd = 0");
        return 0.0;
    }

    let computeOn = Math.max(purchasePrice, marketValue)
    let absd = "ERR";
    if (numProperties == 2) {
        absd = 0.17 * computeOn;
    } else {
        absd = 0.25 * computeOn;
    }

    console.info("\tabsd = " + absd);
    return absd;
}

function calcMonthlyPayments(loanAmount, monthlyInterestRate, numPayments) {
  console.info("calcMonthlyPayments(" + typeof(loanAmount) + ":" + loanAmount + ", " + typeof(monthlyInterestRate) + ":" + monthlyInterestRate + ", " + typeof(numPayments) + ":" + numPayments + ")");
  // Assumes MONTHLY payments!
  // Reference: https://en.wikipedia.org/wiki/Amortization_calculator
  // A = P * (term1 / term2)
  // term1 = i * powTerm
  // term2 = powTerm - 1;
  // powTerm = (1+i)^n

  let onePlusI = 1.0 + monthlyInterestRate;
  let powTerm = Math.pow(onePlusI, numPayments);
  console.info("\tpowTerm = " + powTerm);
  
  let term1 = monthlyInterestRate * powTerm;
  let term2 = powTerm - 1;

  let payment = loanAmount * term1 / term2;
  console.info("\tPayment = " + payment);
  return payment;
}

function propertyTax(annualValue, isOwnerOccupied) {
	console.debug("propertyTax(" + annualValue + ")");
	// Ref: https://www.iras.gov.sg/taxes/property-tax/property-owners/property-tax-rates
	// Note: For owner-occupied only! Rental properties have higher property tax.

	const brackets_OwnerOccupied = [
		// bracketMax, rate
		  [8000, 0] // First 8k no tax
		, [22000, 0.04] // Next 22k at 4%
		, [10000, 0.06]
		, [15000, 0.10]
		, [15000, 0.14]
		, [15000, 0.20]
		, [15000, 0.26]
		, [Number.MAX_VALUE, 0.32] // Rest at 32%
	];
	const brackets_Rental = [
		// bracketMax, rate
		  [30000, 0.12] // First 30k at 12%
		, [15000, 0.20] // Next 15k at 20%
		, [15000, 0.28]
		, [Number.MAX_VALUE, 0.36] // Rest at 36%
	];

	let tax = applyBrackets((isOwnerOccupied ? brackets_OwnerOccupied : brackets_Rental), annualValue);

	console.debug("\tpropertyTax = " + tax);
	return tax;
}

function sellerStampDuty(yearSold, marketValue) {
	// Ref: https://www.iras.gov.sg/taxes/stamp-duty/for-property/selling-or-disposing-property/seller's-stamp-duty-(ssd)-for-residential-property

	let rate = NaN;
	switch(yearSold) {
		case 0: rate = 0.12; break;
		case 1: rate = 0.08; break;
		case 2: rate = 0.04; break;
		default: rate = 0.0; break;
	}

	return rate * marketValue;
}

function genScheduleHomeValue(purchasePrice, appreciation, genUntilYrs) {
	appreciation += 1.0;
	purchasePrice *= appreciation; // 1st year already appreciated

	let schedule = [];
	for (let i=0; i<genUntilYrs; i++) {
		schedule.push(purchasePrice);
		purchasePrice *= appreciation;
	}

	return schedule;
}

function genScheduleSellingFee(scheduleHomeValue, sellingFee) {
	let schedule = [];
	for (const val of scheduleHomeValue) {
		schedule.push(val * sellingFee);
	}

	return schedule;
}

function genScheduleSellerStampDuty(scheduleHomeValue) {
	let schedule = [];
	for (let i=0; i<scheduleHomeValue.length; i++) {
		schedule.push(sellerStampDuty(i, scheduleHomeValue[i]));
	}

	return schedule;
}

function genSchedulePrincipalRemaining(loanAmt, monthlyPayment, interestMonth, genUntilYrs) {
	console.info(loanAmt + "," + monthlyPayment +","+ interestMonth + ","+ genUntilYrs);
	let schedule = [];
	interestMonth += 1.0;

	for (let i=0; i<genUntilYrs; i++) {
		for (let mth=0; mth<12 && loanAmt>0; mth++) {
			loanAmt = (loanAmt * interestMonth) - monthlyPayment;
			if (loanAmt < 0) { loanAmt = 0; }
		}

		schedule.push(loanAmt);
	}

	return schedule;
}

function genScheduleNetAfterSell(scheduleHomeValue, scheduleSellFee, scheduleSellerStampDuty, schedulePrincipalRemaining) {
	let schedule = [];

	for (let i=0; i<scheduleHomeValue.length; i++) {
		val = scheduleHomeValue[i] - scheduleSellFee[i] - scheduleSellerStampDuty[i] - schedulePrincipalRemaining[i];
		schedule.push(val);
	}

	return schedule;
}

function genScheduleMortgagePaid(loanYrs, annualMortgage, genUntilYrs) {
	let schedule = [];
	for (let i=0; i<genUntilYrs; i++) {
		val = (i < loanYrs) ? annualMortgage : 0;
		schedule.push(val);
	}

	return schedule;
}

function genScheduleAnnualValue(avgRentYr, inflation, genUntilYrs) {
	inflation += 1.0;

	let schedule = [];
	for (let i=0; i<genUntilYrs; i++) {
		schedule.push(avgRentYr);
		avgRentYr *= inflation;
	}
	
	return schedule;
}

function genSchedulePropertyTax(schedAnnualValue, isOwnerOccupied, genUntilYrs) {
	let schedule = [];
	for (let i=0; i<genUntilYrs; i++) {
		schedule.push(propertyTax(schedAnnualValue[i], isOwnerOccupied));
	}
	
	return schedule;
}

function genOtherCosts(costStdYr, inflation, genUntilYrs) {
	inflation += 1.0;

	let schedule = [];
	for (let i=0; i<genUntilYrs; i++) {
		schedule.push(costStdYr);
		costStdYr *= inflation;
	}

	return schedule;
}

function genScheduleOutflowStdYr(schedMortgagePaid, schedOtherCosts, genUntilYrs) {
	let schedule = [];

	for (let i=0; i<genUntilYrs; i++) {
		schedule.push(schedMortgagePaid[i] + schedOtherCosts[i]);
	}

	return schedule;
}

function genScheduleCumulative(sched) {
	let schedule = [];
	let cumulative = 0;
	for (const val of sched) {
		cumulative += val;
		schedule.push(cumulative);
	}

	return schedule;
}

function genScheduleCostLivingYr(costLivingYr, inflation, genUntilYrs) {
	inflation += 1.0;

	let schedule = [];
	for (let i=0; i<genUntilYrs; i++) {
		schedule.push(costLivingYr);
		costLivingYr *= inflation;
	}

	return schedule;
}

function genScheduleOutflowLivingYr(schedOutflowStdYr, schedPropertyTaxOwnerOccupied, schedcostLivingYr) {
	let schedule = [];
	for (let i=0; i<schedOutflowStdYr.length; i++) {
		schedule.push(schedOutflowStdYr[i] + schedPropertyTaxOwnerOccupied[i] + schedcostLivingYr[i]);
	}

	return schedule;
}

function genScheduleRentalIncomeMth(rentalIncome, appreciation, genUntilYrs) {
	appreciation += 1.0;
	let schedule = [];

	for (let i=0; i<genUntilYrs; i++) {
		schedule.push(rentalIncome);
		rentalIncome *= appreciation;
	}

	return schedule;
}

function genSchedOutflowYrRental(schedOutflowStdYr, schedPropertyTaxRental, schedRentalMgmtCost) {
	let schedule = [];
	for (let i=0; i<schedOutflowStdYr.length; i++) {
		val = schedOutflowStdYr[i] + schedPropertyTaxRental[i] + schedRentalMgmtCost[i];
		schedule.push(val);
	}

	return schedule;
}

function calcRentalPerYear(rentalStartAtYr, rentalIncome, rentalMgmtCost, rentalAppreciation, genUntilYrs) {
	console.info("calcRentalPerYear(" + rentalStartAtYr + ", " + rentalIncome + ", " + rentalMgmtCost + ", " + rentalAppreciation + ", " + genUntilYrs + ")");

	let rentalPerYear = [];
	let rentalAtYear = rentalIncome;
	rentalAppreciation += 1.0;

	for (let i=0; i<genUntilYrs; i++) {
		let rentalForYear = {};
		rentalForYear['endOfYr'] = i;
		rentalForYear['incomeMonth'] = rentalAtYear;
		rentalForYear['incomeYr'] = rentalAtYear * 12;
		rentalForYear['mgmtCost'] = rentalMgmtCost * 12;
		rentalForYear['netIncomeYr'] = rentalForYear['incomeYr'] - rentalForYear['mgmtCost'];
		rentalPerYear.push(rentalForYear);

		rentalAtYear *= rentalAppreciation;
	}

	console.info("\t" + JSON.stringify(rentalPerYear, null, 2));
	return rentalPerYear;
}

function genScheduleStrategyBuyStay_NetCashflow(scheduleNetAfterSell, schedFixedCost, schedOutflowLivingCum) {
	let schedule = [];

	for (let i=0; i<scheduleNetAfterSell.length; i++) {
		let val = scheduleNetAfterSell[i] - schedFixedCost[i] - schedOutflowLivingCum[i];
		schedule.push(val);
	}

	return schedule;
}

function genScheduleStrategyBuyStay_EffectiveRent(scheduleStrategyBuyStay) {
	let schedule = [];
	
	for (let i=0; i<scheduleStrategyBuyStay.length; i++) {
		schedule.push(scheduleStrategyBuyStay[i] / (12*(i+1)));
	}

	return schedule;
}

function genScheduleStrategyBuyRentout_NetCashflow(scheduleNetAfterSell, scheduleDownpayment, schedOutflowCumRental, schedRentalIncomeYr) {
	let schedule = [];

	for (let i=0; i<scheduleNetAfterSell.length; i++) {
		let val = scheduleNetAfterSell[i] - scheduleDownpayment[i] - schedOutflowCumRental[i] + schedRentalIncomeYr[i];
		schedule.push(val);
	}

	return schedule;
}
