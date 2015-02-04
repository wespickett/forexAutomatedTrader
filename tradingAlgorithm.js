(function() { 

	var POSITIONS = {
		LONG: 1,
		SHORT: 0
	},
	fs = require('fs'),
	fxAPI = require('./api.js'),
	POSITIONS_FOLDER = 'positions',
	PIPS_FOR_TAKE_PROFIT = 50,
	PIPS_FOR_STOP_LOSS = 10,
	fxAPI;

	//TODO: real data
	function loadInstrumentData(instrument, callback) {
		fxAPI.loadPositionsForInstrument(instrument, callback);
	}

	function saveInstrumentData(instrument, data, callback) {
		fs.writeFile(POSITIONS_FOLDER + '/' + instrument, JSON.stringify(data), function(err) {
			if (err) throw err;
			if (typeof callback === 'function') callback();
		});
	}

	function setPositionShort(instrumentData) {
		instrumentData.currentPosition = POSITIONS.SHORT;
		//save
	}

	function setPositionLong(instrumentData) {
		instrumentData.currentPosition = POSITIONS.LONG;
		//save
	}

	function setBuyPrice(instrumentData, buyPrice) {

	}

	var publicReturn = {
		updatePrice: function(instrument, ask, bid) {
			// loadInstrumentData(instrument, function(instrumentData) {

			// 	console.log(instrumentData);
			// 	instrumentData = instrumentData || {};

			// 	var midPoint = (ask + bid) / 2;

			// 	if (!instrumentData.currentPosition) {
			// 		instrumentData.currentPosition = POSITIONS.LONG;
			// 	}

			// 	if (!instrumentData.buyPrice) {
			// 		instrumentData.buyPrice = midPoint;
			// 	}

			// 	//saveInstrumentData(instrument, instrumentData);
			// 	var currentDelta = midPoint - instrumentData.buyPrice;

			// 	if (instrumentData.currentPosition === POSITIONS.LONG) {
			// 		if (currentDelta >= PIPS_FOR_TAKE_PROFIT) {
			// 			//take profit, stay long
			// 			setBuyPrice(instrumentData, midPoint);
			// 		} else if (currentDelta <= -PIPS_FOR_STOP_LOSS) {
			// 			//stop loss, switch to short

			// 		}
			// 	} else if (instrumentDatacurrentPosition === POSITIONS.SHORT) {
			// 		if (currentDelta <= -PIPS_FOR_TAKE_PROFIT) {
			// 			//take profit, stay short
						
			// 		} else if (currentDelta >= PIPS_FOR_STOP_LOSS) {
			// 			//stop loss, switch to long
						
			// 		}
			// 	}
			// });
		}
	};

	module.exports = function(apiObject) {
		fxAPI = apiObject;
		return publicReturn;
	};

})();
