// Several basic definitions used to simplify code fragments
// Store all days and months
const adapterHelpers = require('iobroker-adapter-helpers');
const basicStates = {
	current: ['01_currentDay', '02_currentWeek', '03_currentMonth', '04_currentQuarter', '05_currentYear'],
	previous : ['01_previousDay', '02_previousWeek', '03_previousMonth', '04_previousQuarter', '05_previousYear']
};
const weekdays = JSON.parse('["07_Sunday","01_Monday","02_Tuesday","03_Wednesday","04_Thursday","05_Friday","06_Saturday"]');
const months = JSON.parse('["01_January","02_February","03_March","04_April","05_May","06_June","07_July","08_August","09_September","10_October","11_November","12_December"]');

/**
 * Rounding for regular values
 *
 * @param {number} [value] - Number to round with , separator
 */
function roundDigits(value) {
	let rounded;
	try {
		rounded = Number(value);
		rounded = Math.round(rounded * 1000) / 1000;
		if (!rounded) return value;
		return rounded;
	} catch (error) {
		rounded = value;
		return rounded;
	}
}

/**
 * Rounding for financial values
 *
 * @param {number} [value] - Number to round with . separator
 */
function roundCosts(value) {
	try {
		let rounded = Number(value);
		rounded = Math.round(rounded * 100) / 100;
		if (!rounded) return value;
		return rounded;
	} catch (error) {
		return value;
	}
}

/**
 * Load current dates (year, week, month, quarter, day)
 * @param {object} [currentDateArray] - Array of current date values
 */
function refreshDates(currentDateArray) {
	// Get current date
	const today = new Date(); // Get current date in Unix time format

	/**
	 * define proper week-number, add 0 in case of < 10
	 * @param {object} d - Current date (like initiated with new Date())
	 */
	function getWeekNumber(d) {
		// Copy date so don't modify original
		d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
		// Set to nearest Thursday: current date + 4 - current day number
		// Make Sunday's day number 7
		d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
		// Get first day of year
		const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
		// Calculate full weeks to nearest Thursday
		// @ts-ignore subtracting dates is fine
		let weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7).toString();

		if (weekNo.length === 1) {
			weekNo = '0' + weekNo;
		}
		// Return week number
		return weekNo;
	}

	// Store current used dates to memory
	const previousDateArray = {
		day: currentDateArray.day,
		week: currentDateArray.week,
		month: currentDateArray.month,
		quarter: currentDateArray.quarter,
		year: currentDateArray.year
	};

	// Write current dates to memory
	currentDateArray = {
		day: weekdays[today.getDay()],
		week : getWeekNumber(today),
		month : months[today.getMonth()],
		quarter : Math.floor((today.getMonth() + 3) / 3),
		year : (new Date().getFullYear()),
	};

	return {currentDateArray, previousDateArray};
}

/**
 * Load calculation factors from helper library and store to workable memory format
 *
 * @param {object} [pricesConfig] - All price definitions configured in adapter configuration
 *
 * @returns {object} Unit calculation factors and Price definitions in a workable array to handle further processing
 */
function definitionLoader(pricesConfig) {
	try {
		// Load energy array and store exponents related to unit
		let catArray = ['Watt', 'Watt_hour'];
		const unitStore = {};
		for (const item in catArray) {
			const unitItem = adapterHelpers.units.electricity[catArray[item]];
			for (const unitCat in unitItem) {
				unitStore[unitItem[unitCat].unit] = {
					exponent: unitItem[unitCat].exponent,
					category: catArray[item],
				};
			}
		}

		// Load  volumes array and store exponents related to unit
		catArray = ['Liter', 'Cubic_meter'];
		for (const item in catArray) {
			const unitItem = adapterHelpers.units.volume[catArray[item]];
			for (const unitCat in unitItem) {
				unitStore[unitItem[unitCat].unit] = {
					exponent: unitItem[unitCat].exponent,
					category: catArray[item],
				};
			}
		}

		// Load price definition from admin configuration
		const priceStore = {};

		for (const priceDef in pricesConfig) {
			priceStore[pricesConfig[priceDef].cat] = {
				cat: pricesConfig[priceDef].cat,
				uDes: pricesConfig[priceDef].cat,
				uPpU: pricesConfig[priceDef].uPpU,
				uPpM: pricesConfig[priceDef].uPpM,
				costType: pricesConfig[priceDef].costType,
				unitType: pricesConfig[priceDef].unitType,
			};
		}

		return {priceStore, unitStore};

	} catch (error) {
		throw new Error(`Cannot load price and unit definitions ${error}`);
	}

}

module.exports = {
	definitionLoader,
	refreshDates,
	roundCosts,
	roundDigits,
	basicStates : basicStates,
	months : months,
	weekdays : weekdays
};