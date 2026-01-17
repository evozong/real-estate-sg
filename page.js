function toggleHomeWork(
	  tableName
	, headerName
	, headerLabel
	, setVisible = undefined) {
    let tbl = document.getElementById(tableName);
    let tblHeader = document.getElementById(headerName);

    if (setVisible == undefined) {
        setVisible = tbl.classList.contains("tblHide");
    }

    if (setVisible) {
        tbl.classList.remove("tblHide");
        tblHeader.innerText = "- " + headerLabel;
    } else {
        tbl.classList.add("tblHide");
        tblHeader.innerText = "+ " + headerLabel;
    }
}

function toggleHomeworkRental(setVisible = undefined) {
	toggleHomeWork("homeworkRental", "homeworkRentalHdr", "Rentals", setVisible);
}

function toggleHomeworkHomeInfo(setVisible = undefined) {
	toggleHomeWork("homeworkHomeInfo", "homeworkHomeInfoHdr", "Home", setVisible);
}

const genUntilYrs = 30;

// Simulation defaults
var sim = {
	home: {
		numProperties: 1
		, homeSizeSqf: 1000
		, rentalAvgPsf: 3.0
		, purchPrice: 2000000
		, downpayPct: 25
		, renoCost: 100000
		, appreciationPct: 3.0
		, sellFeePct: 4.0
	}, 
	loan: {
		interestPctAnnual: 2.0
		, loanTermYrs: 30
	}, 
	cost: {
		inflationPct: 1.0
		, hoaMonth: 500
		, insuranceAnnual: 1000
		, utilitiesMonth: 300
	}, 
	rental: {
		startAtYr: 0
		, appreciationPct: 1.0
		, rentalIncome: 5000
		, managementFeeMonth: 300
	}, 
};

function parseSimJSON(input) {
    // Accept either a JSON string or an already-parsed object
    let obj = (typeof input === "string") ? JSON.parse(input) : (input || {});
    // base on current defaults in global `sim` where available
    const base = {
        home: sim.home || {},
        loan: sim.loan || {},
        cost: sim.cost || {},
        rental: sim.rental || {}
    };

    let s = {
        home: Object.assign({}, base.home, obj.home || {}),
        loan: Object.assign({}, base.loan, obj.loan || {}),
        cost: Object.assign({}, base.cost, obj.cost || {}),
        rental: Object.assign({}, base.rental, obj.rental || {})
    };

		return s;
}

// Basic validator for sim-shaped objects
function validateSimShape(obj) {
    if (!obj || typeof obj !== "object") return false;
    const has = (o, k) => o && Object.prototype.hasOwnProperty.call(o, k);
    if (!has(obj, "home") || !has(obj, "loan") || !has(obj, "cost") || !has(obj, "rental")) return false;

    // minimal numeric checks (enough to detect grossly malformed files)
    const n = (v) => typeof v === "number" && !Number.isNaN(v);
    const h = obj.home;
    const l = obj.loan;
    const c = obj.cost;
    const r = obj.rental;

    if (!n(h.purchPrice) || !n(h.downpayPct) || !n(h.appreciationPct)) return false;
    if (!n(l.interestPctAnnual) || !n(l.loanTermYrs)) return false;
    if (!n(c.inflationPct)) return false;
    if (!n(r.rentalIncome) || !n(r.appreciationPct)) return false;

    return true;
}

// open a file selector, parse a sim json, validate and then load into the app
function openFileSelectorForSim() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";

    input.addEventListener("change", (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) {
            input.remove();
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const raw = e.target.result;
                const parsed = JSON.parse(raw);
                // merge with defaults and produce a sim-shaped object
                const candidateSim = parseSimJSON(parsed);

                if (!validateSimShape(candidateSim)) {
                    alert("Uploaded JSON is not a valid simulation shape. Please check the file.");
                    input.remove();
                    return;
                }

                // load into the app
                console.log("File parsed successfully.");
                loadSimulation(candidateSim);
            } catch (err) {
                console.error("Failed to load simulation file:", err);
                alert("Failed to parse JSON file: " + (err && err.message ? err.message : "unknown error"));
            } finally {
                input.remove();
            }
        };
        reader.onerror = () => {
            alert("Failed to read file.");
            input.remove();
        };

        reader.readAsText(file);
    });

    // add to DOM so the click works in all browsers, then click and remove later
    document.body.appendChild(input);
    input.click();
}


function loadDefaultSimulation() {
	loadSimulation(sim);
}

function loadSimulation(theSim) {
	sim = theSim;

	document.getElementById("numProperties").value = sim.home.numProperties;
	document.getElementById("homeSize").value = sim.home.homeSizeSqf;
	document.getElementById("rentalAvgPsf").value = sim.home.rentalAvgPsf;
	document.getElementById("purchPrice").value = sim.home.purchPrice;
	document.getElementById("downpayPct").value = sim.home.downpayPct;
	document.getElementById("renoCost").value = sim.home.renoCost;
	document.getElementById("homeAppreciation").value = sim.home.appreciationPct;
	document.getElementById("sellFeePct").value = sim.home.sellFeePct;

	document.getElementById("annualIR").value = sim.loan.interestPctAnnual;
	document.getElementById("loanYrs").value = sim.loan.loanTermYrs;

	document.getElementById("costInflation").value = sim.cost.inflationPct;
	document.getElementById("costHOA").value = sim.cost.hoaMonth;
	document.getElementById("costInsurance").value = sim.cost.insuranceAnnual;
	document.getElementById("costUtilities").value = sim.cost.utilitiesMonth;

	document.getElementById("rentalStartAtYr").value = sim.rental.startAtYr;
	document.getElementById("rentalAppreciation").value = sim.rental.appreciationPct;
	document.getElementById("rentalIncome").value = sim.rental.rentalIncome;
	document.getElementById("rentalMgmtCost").value = sim.rental.managementFeeMonth;

	recalculate();
}

function updateFromUI() {
	sim.home.numProperties = Number.parseInt(document.getElementById("numProperties").value);
	sim.home.homeSizeSqf = Number.parseInt(document.getElementById("homeSize").value);
	sim.home.rentalAvgPsf = Number.parseFloat(document.getElementById("rentalAvgPsf").value);
	sim.home.purchPrice = Number.parseInt(document.getElementById("purchPrice").value);
	sim.home.downpayPct = Number.parseFloat(document.getElementById("downpayPct").value);
	sim.home.renoCost = Number.parseFloat(document.getElementById("renoCost").value);
	sim.home.appreciationPct = Number.parseFloat(document.getElementById("homeAppreciation").value);
	sim.home.sellFeePct = Number.parseFloat(document.getElementById("sellFeePct").value);

	sim.home.downpayAmt = () => {
		return calcDownpayment(sim.home.purchPrice, sim.home.downpayPct);
	}
	sim.home.bsd = () => {
		return calcBuyerStampDuty(sim.home.purchPrice);
	}
	sim.home.absd = () => {
		return additionalBuyerStampDuty(sim.home.numProperties, sim.home.purchPrice);
	}
	sim.home.appreciation = () => {
		return sim.home.appreciationPct / 100.0;
	}
	sim.home.sellFee = () => {
		return sim.home.sellFeePct / 100.0;
	}
	sim.home.outOfPocket = () => {
		return sim.home.downpayAmt() + sim.home.renoCost + sim.home.bsd() + sim.home.absd();
	}

	sim.loan.interestPctAnnual = Number.parseFloat(document.getElementById("annualIR").value);
	sim.loan.loanTermYrs = Number.parseInt(document.getElementById("loanYrs").value);

	sim.loan.loanAmt = () => {
		return calcMortgageAmt(sim.home.purchPrice, sim.home.downpayPct);
	}
	sim.loan.interestMonth = () => {
		return sim.loan.interestPctAnnual / 12.0 / 100.0;
	}
	sim.loan.numPayments = () => {
		return sim.loan.loanTermYrs * 12;
	}
	sim.loan.paymentMonthly = () => {
		return calcMonthlyPayments(sim.loan.loanAmt(), sim.loan.interestMonth(), sim.loan.numPayments());
	}
	sim.loan.paymentAnnual = () => {
		return sim.loan.paymentMonthly() * 12;
	}

	sim.cost.inflationPct = Number.parseFloat(document.getElementById("costInflation").value);
	sim.cost.hoaMonth = Number.parseFloat(document.getElementById("costHOA").value);
	sim.cost.insuranceAnnual = Number.parseFloat(document.getElementById("costInsurance").value);
	sim.cost.utilitiesMonth = Number.parseFloat(document.getElementById("costUtilities").value);

	sim.cost.inflation = () => {
		return sim.cost.inflationPct / 100.0;
	}

	sim.rental.startAtYr = Number.parseInt(document.getElementById("rentalStartAtYr").value);
	sim.rental.appreciationPct = Number.parseFloat(document.getElementById("rentalAppreciation").value);
	sim.rental.rentalIncome = Number.parseFloat(document.getElementById("rentalIncome").value);
	sim.rental.managementFeeMonth = Number.parseFloat(document.getElementById("rentalMgmtCost").value);

	sim.rental.appreciation = () => {
		return sim.rental.appreciationPct / 100.0;
	}
}

function updateUI() {
	document.getElementById("downpay").value = sim.home.downpayAmt();
	document.getElementById("bsd").value = sim.home.bsd();
	document.getElementById("absd").value = sim.home.absd();
	document.getElementById("outOfPocket").value = sim.home.outOfPocket();

	document.getElementById("loanAmt").value = sim.loan.loanAmt();
	document.getElementById("monthlyIR").value = sim.loan.interestMonth();
	document.getElementById("numPaymt").value = sim.loan.numPayments();
	document.getElementById("monthlyPayment").value = sim.loan.paymentMonthly();
	document.getElementById("annualPayment").value = sim.loan.paymentAnnual();
}

function appendCell(node, label) {
	let cell = document.createElement("td");
	cell.innerText = label;
	node.appendChild(cell);
}

function createTableRow(label, values, classes=[]) {
	let node = document.createElement("tr");
	for (const cls of classes) {
		node.classList.add(cls);
	}

	let lbl = document.createElement("td");
	lbl.classList.add("bold");
	lbl.innerText = label;
	node.appendChild(lbl);

	for (const val of values) {
		appendCell(node, val);
	}

	return node;
}

function formatAsCurrencyString(lst) {
	let res = [];
	for (const itm of lst) {
		val = Math.round(itm*100) / 100;
		res.push(val.toLocaleString());
	}

	return res;
}

function renderSchedules() {
	let homeworkTableHomeInfo = document.getElementById("homeworkHomeInfo");
	homeworkTableHomeInfo.replaceChildren();

	const boldRow = ["bold"];

	let scheduleYr = [];
	for (let i=0; i<genUntilYrs; i++) { scheduleYr.push(i); }
	let rowYr = createTableRow("End of Year", scheduleYr);
	homeworkTableHomeInfo.appendChild(rowYr);

	let scheduleHomeValue = genScheduleHomeValue(sim.home.purchPrice, sim.home.appreciation(), genUntilYrs);
	scheduleHomeValue2 = formatAsCurrencyString(scheduleHomeValue);
	let rowHomeValue = createTableRow("Value of Home", scheduleHomeValue2);
	homeworkTableHomeInfo.appendChild(rowHomeValue);

	let scheduleSellFee = genScheduleSellingFee(scheduleHomeValue, sim.home.sellFee())
	let scheduleSellFee2 = formatAsCurrencyString(scheduleSellFee);
	let rowSellFee = createTableRow("Selling Fee", scheduleSellFee2);
	homeworkTableHomeInfo.appendChild(rowSellFee);

	let scheduleSellerStampDuty = genScheduleSellerStampDuty(scheduleHomeValue);
	let scheduleSellerStampDuty2 = formatAsCurrencyString(scheduleSellerStampDuty);
	let rowSellerStampDuty = createTableRow("Seller's Stamp Duty", scheduleSellerStampDuty2);
	homeworkTableHomeInfo.appendChild(rowSellerStampDuty);

	let schedulePrincipalRemaining = genSchedulePrincipalRemaining(sim.loan.loanAmt(), sim.loan.paymentMonthly(), sim.loan.interestMonth(), genUntilYrs);
	let schedulePrincipalRemaining2 = formatAsCurrencyString(schedulePrincipalRemaining);
	let rowLoanPrincipal = createTableRow("Principal remaining", schedulePrincipalRemaining2);
	homeworkTableHomeInfo.appendChild(rowLoanPrincipal);

	let scheduleNetAfterSell = genScheduleNetAfterSell(scheduleHomeValue, scheduleSellFee, scheduleSellerStampDuty, schedulePrincipalRemaining);
	let scheduleNetAfterSell2 = formatAsCurrencyString(scheduleNetAfterSell);
	let rowNetProceedsIfSold = createTableRow("Net Proceeds if Sold", scheduleNetAfterSell2, boldRow);
	homeworkTableHomeInfo.appendChild(rowNetProceedsIfSold);

	let rowFiller = createTableRow("", []);
	homeworkTableHomeInfo.appendChild(rowFiller);

	let scheduleFixedCosts = [];
	for (let i=0; i<genUntilYrs; i++) { scheduleFixedCosts.push(sim.home.outOfPocket()); }
	let scheduleDownpayment2 = formatAsCurrencyString(scheduleFixedCosts);
	let rowDownpayment = createTableRow("Fixed Cost (Downpayment)", scheduleDownpayment2, boldRow);
	homeworkTableHomeInfo.appendChild(rowDownpayment);

	let schedMortgagePaid = genScheduleMortgagePaid(sim.loan.loanTermYrs, sim.loan.paymentAnnual(), genUntilYrs);
	let schedMortgagePaid2 = formatAsCurrencyString(schedMortgagePaid);
	let rowMortgage = createTableRow("Mortgage Paid", schedMortgagePaid2);
	homeworkTableHomeInfo.appendChild(rowMortgage);

	let startRentYr = sim.home.homeSizeSqf * sim.home.rentalAvgPsf * 12;
	let schedAV = genScheduleAnnualValue(startRentYr, sim.home.appreciation(), genUntilYrs);
	let schedAV2 = formatAsCurrencyString(schedAV);
	let rowAV = createTableRow("Annual Value", schedAV2);
	homeworkTableHomeInfo.appendChild(rowAV);

	let costStdYr = sim.cost.hoaMonth * 12 + sim.cost.insuranceAnnual;
	let schedOtherCosts = genOtherCosts(costStdYr, sim.cost.inflation(), genUntilYrs);
	let schedOtherCosts2 = formatAsCurrencyString(schedOtherCosts);
	let rowOngoingCostStd = createTableRow("Other", schedOtherCosts2);
	homeworkTableHomeInfo.appendChild(rowOngoingCostStd);

	let schedOutflowStdYr = genScheduleOutflowStdYr(schedMortgagePaid, schedOtherCosts, genUntilYrs);
	let schedOutflowStdYr2 = formatAsCurrencyString(schedOutflowStdYr);
	let rowOutflowStdYr = createTableRow("Outflow/yr (Std)", schedOutflowStdYr2, boldRow);
	homeworkTableHomeInfo.appendChild(rowOutflowStdYr);

	let schedPropertyTaxOwnerOccupied = genSchedulePropertyTax(schedAV, true, genUntilYrs);
	let schedPropertyTaxOwnerOccupied2 = formatAsCurrencyString(schedPropertyTaxOwnerOccupied);
	let rowPropertyTax = createTableRow("Property Tax (Owner Occupied)", schedPropertyTaxOwnerOccupied2);
	homeworkTableHomeInfo.appendChild(rowPropertyTax);

	let costLivingYr = sim.cost.utilitiesMonth * 12;
	let schedCostLivingYr = genScheduleCostLivingYr(costLivingYr, sim.cost.inflation(), genUntilYrs);
	let schedCostLivingYr2 = formatAsCurrencyString(schedCostLivingYr);
	let rowOngoingCostLiving = createTableRow("Utilities (/yr)", schedCostLivingYr2);
	homeworkTableHomeInfo.appendChild(rowOngoingCostLiving);

	let schedOutflowLivingYr = genScheduleOutflowLivingYr(schedOutflowStdYr, schedPropertyTaxOwnerOccupied, schedCostLivingYr);
	let schedOutflowLivingYr2 = formatAsCurrencyString(schedOutflowLivingYr);
	let rowOutflowLivingYr = createTableRow("Outflow/yr (Living)", schedOutflowLivingYr2, boldRow);
	homeworkTableHomeInfo.appendChild(rowOutflowLivingYr);

	let schedOutflowLivingCum = genScheduleCumulative(schedOutflowLivingYr);
	let schedOutflowLivingCum2 = formatAsCurrencyString(schedOutflowLivingCum);
	let rowOutflowLivingCum = createTableRow("Outflow/cum (Living))", schedOutflowLivingCum2, boldRow);
	homeworkTableHomeInfo.appendChild(rowOutflowLivingCum);

	let schedPropertyTaxRental = genSchedulePropertyTax(schedAV, false, genUntilYrs);
	let schedPropertyTaxRental2 = formatAsCurrencyString(schedPropertyTaxRental);
	let rowPropertyTaxRental = createTableRow("Property Tax (Rental)", schedPropertyTaxRental2);
	homeworkTableHomeInfo.appendChild(rowPropertyTaxRental);

	let schedRentalMgmtCost = [];
	for (let i=0; i<genUntilYrs; i++) {
		schedRentalMgmtCost.push(sim.rental.managementFeeMonth * 12);
	}
	let schedRentalMgmtCost2 = formatAsCurrencyString(schedRentalMgmtCost);
	let rowMgmtCost = createTableRow("Mgmt Cost (/yr)", schedRentalMgmtCost2);
	homeworkTableHomeInfo.appendChild(rowMgmtCost);

	let schedOutflowYrRental = genSchedOutflowYrRental(schedOutflowStdYr, schedPropertyTaxRental, schedRentalMgmtCost);
	let schedOutflowYrRental2 = formatAsCurrencyString(schedOutflowYrRental);
	let rowOutflowRentalYr = createTableRow("Outflow/yr (Rental)", schedOutflowYrRental2, boldRow);
	homeworkTableHomeInfo.appendChild(rowOutflowRentalYr);

	let schedOutflowCumRental = genScheduleCumulative(schedOutflowYrRental);
	let schedOutflowCumRental2 = formatAsCurrencyString(schedOutflowCumRental);
	let rowOutflowRentalCum = createTableRow("Outflow/cum (Rental)", schedOutflowCumRental2, boldRow);
	homeworkTableHomeInfo.appendChild(rowOutflowRentalCum);

	////////////////////////////////////////////////////
	// Rental Homework
	////////////////////////////////////////////////////
	let rentalHomeworkTable = document.getElementById("homeworkRental");
	rentalHomeworkTable.replaceChildren();

	let scheduleYrRental = [...scheduleYr];
	let rowYrRental = createTableRow("End of Year", scheduleYrRental);
	rentalHomeworkTable.appendChild(rowYrRental);

	let schedRentalIncomeMth = genScheduleRentalIncomeMth(sim.rental.rentalIncome, sim.rental.appreciation(), genUntilYrs);
	let schedRentalIncomeMth2 = formatAsCurrencyString(schedRentalIncomeMth);
	let rowIncomeMonth = createTableRow("Income (/mth)", schedRentalIncomeMth2);
	rentalHomeworkTable.appendChild(rowIncomeMonth);

	let schedRentalIncomeYr = [];
	for (const val of schedRentalIncomeMth) {
		schedRentalIncomeYr.push(val * 12);
	}
	let schedRentalIncomeYr2 = formatAsCurrencyString(schedRentalIncomeYr);
	let rowIncomeYear = createTableRow("Income or Cost of Rental (/yr)", schedRentalIncomeYr2);
	rentalHomeworkTable.appendChild(rowIncomeYear);

	////////////////////////////////////////////////////
	// Comparison Strategies
	////////////////////////////////////////////////////
	let tbl = document.getElementById("stratBuyStay");
	tbl.replaceChildren();

	let scheduleYr2 = [...scheduleYr];
	let rowYr2 = createTableRow("End of Year", scheduleYr2);
	tbl.appendChild(rowYr2);

	let scheduleStrategyBuyStay_NetCashflow = genScheduleStrategyBuyStay_NetCashflow(scheduleNetAfterSell, scheduleFixedCosts, schedOutflowLivingCum);
	let scheduleStrategyBuyStay_NetCashflow2 = formatAsCurrencyString(scheduleStrategyBuyStay_NetCashflow);
	let rowStrategyBuyStay_NetCashflow = createTableRow("Net Cashflow", scheduleStrategyBuyStay_NetCashflow2);
	tbl.appendChild(rowStrategyBuyStay_NetCashflow);

	let scheduleStrategyBuyStay_EffectiveRent = genScheduleStrategyBuyStay_EffectiveRent(scheduleStrategyBuyStay_NetCashflow);
	let scheduleStrategyBuyStay_EffectiveRent2 = formatAsCurrencyString(scheduleStrategyBuyStay_EffectiveRent);
	let rowStrategyBuyStay_EffectiveRent = createTableRow("Effective Rent (/mth)", scheduleStrategyBuyStay_EffectiveRent2, boldRow);
	tbl.appendChild(rowStrategyBuyStay_EffectiveRent);

	let tbl2 = document.getElementById("stratBuyRentout");
	tbl2.replaceChildren();

	let scheduleYr3 = [...scheduleYr];
	let rowYr3 = createTableRow("End of Year", scheduleYr3);
	tbl2.appendChild(rowYr3);

	let scheduleStrategyBuyRentout_NetCashflow = genScheduleStrategyBuyRentout_NetCashflow(scheduleNetAfterSell, scheduleFixedCosts, schedOutflowCumRental, schedRentalIncomeYr);
	let scheduleStrategyBuyRentout_NetCashflow2 = formatAsCurrencyString(scheduleStrategyBuyRentout_NetCashflow);
	let rowStrategyBuyRentout_NetCashflow = createTableRow("Net Cashflow", scheduleStrategyBuyRentout_NetCashflow2);
	tbl2.appendChild(rowStrategyBuyRentout_NetCashflow);
}

function recalculate() {
	console.info("Recalculating!");
	updateFromUI();
	updateUI();

	renderSchedules();
}

