(function() { 

	var POSITIONS = {
		LONG: 'buy',
		SHORT: 'sell'
	},
	fs = require('fs'),
	fxAPI = require('./api.js'),
	POSITIONS_FOLDER = 'positions',
	PIPS_FOR_TAKE_PROFIT = 0.0040,
	PIPS_FOR_STOP_LOSS = 0.0010,
	fxAPI;

	function getInstrumentPosition(instrument, callback) {
		fxAPI.getPositionForInstrument(instrument, callback);
	}

	function loadInstrumentData(instrument, callback) {
		var path = POSITIONS_FOLDER + '/' + instrument;
		
		var readFile = function() {
			fs.readFile(path, function(err, data) {
				if (err) throw err;
				data = data.toString();
				var jsonData = {};
				if (data && typeof data === 'object') {
					JSON.parse(data.toString());
				}
				if (typeof callback === 'function') callback(jsonData);
			});
		};

		fs.exists(path, function(exists) {
			if (exists) {
				readFile();
			} else {
				saveInstrumentData(instrument, {}, readFile);
			}
		});
	}

	function saveInstrumentData(instrument, data, callback) {
		fs.writeFile(POSITIONS_FOLDER + '/' + instrument, JSON.stringify(data), function(err) {
			if (err) throw err;
			if (typeof callback === 'function') callback();
		});
	}

	function openPositionForInstrument(instrument, currentPrice, positionDirection, callback) {
		var units = '1000000'; //TODO: calculate this number
		var stopLoss = '';

		if (positionDirection === POSITIONS.LONG) {
			stopLoss = currentPrice - PIPS_FOR_STOP_LOSS;
		} else if (positionDirection === POSITIONS.SHORT) {
			stopLoss = currentPrice + PIPS_FOR_STOP_LOSS;
		} else {
			console.log('Error: positionDirection not set in openPositionForInstrument');
			return;
		}

		console.log('opening ' + instrument + '[' + positionDirection + '] @ price: ' + currentPrice + ' with stopLoss: ' + stopLoss);
		fxAPI.openPosition(instrument, units, positionDirection, stopLoss, callback);
	}

	function closePositionForInstrument(instrument, callback) {
		fxAPI.closePosition(instrument, callback);
	}

	function getTransactions(callback) {
		fxAPI.getTransactions(callback);
	}

	var publicReturn = {
		updatePrice: function(instrument, ask, bid) {
			console.log('--- 2. Get position: ' + instrument);
			getInstrumentPosition(instrument, function(instrumentData) {

				console.log(instrumentData);
				var midPoint = (ask + bid) / 2;

				function decide(instrumentData) {

					var currentDelta = midPoint - instrumentData.avgPrice;
					console.log(instrument + ' -- currentDelta: ' + currentDelta + ' position: ' + instrumentData.side);

					if (instrumentData.side === POSITIONS.LONG) {
						if (currentDelta >= PIPS_FOR_TAKE_PROFIT) {
							//take profit, stay long
							console.log('--- 3. take profit, stay long');
							closePositionForInstrument(instrument, function() {

								console.log('position closed for profit');
								//TODO: stop loss not exact since it's a market order it might not execute exactly at midPoint price
								openPositionForInstrument(instrument, midPoint, POSITIONS.LONG, function(createdPosition) {

									console.log('new position:');
									console.log(createdPosition);
									if (createdPosition.instrument && createdPosition.instrument === instrument && createdPosition.price) {
										//TODO: don't create an object to save from scratch, use existing structure
										saveInstrumentData(instrument, {side: POSITIONS.LONG, price: createdPosition.price}, function() {
											console.log('saved localInstrumentData.');
										});
									} else {
										console.log('Error creating position for ' + instrument);
									}
								});
							});
						}
					} else if (instrumentData.side === POSITIONS.SHORT) {
						if (currentDelta <= -PIPS_FOR_TAKE_PROFIT) {
							//take profit, stay short
							console.log('--- 3. take profit, stay short');
							closePositionForInstrument(instrument, function() {

								console.log('position closed for profit');
								//TODO: stop loss not exact since it's a market order it might not execute exactly at midPoint price
								openPositionForInstrument(instrument, midPoint, POSITIONS.SHORT, function(createdPosition) {

									console.log('new position:');
									console.log(createdPosition);
									if (createdPosition.instrument && createdPosition.instrument === instrument && createdPosition.price) {
										//TODO: don't create an object to save from scratch, use existing structure
										saveInstrumentData(instrument, {side: POSITIONS.SHORT, price: createdPosition.price}, function() {
											console.log('saved localInstrumentData.');
										});
									} else {
										console.log('Error creating position for ' + instrument);
									}
								});
							});
						}
					}
				}

				if (instrumentData.code && instrumentData.code === 14) {

					console.log('No position for ' + instrument);
					//No position for this instrument
					loadInstrumentData(instrument, function(localInstrumentData) {

						localInstrumentData = localInstrumentData || {};
						console.log('localInstrumentData:');
						console.log(localInstrumentData);

						if (typeof localInstrumentData.side === 'undefined') {
							localInstrumentData.side = localInstrumentData.side || POSITIONS.LONG;
						}

						if (localInstrumentData.price) {
							//TODO: better detect stoploss (can use transaction history)
							//somewhat detect if position doesn't exist from stoploss being triggered.
							//if it was triggered from stoploss, then switch direction
							if (localInstrumentData.side === POSITIONS.LONG && localInstrumentData.price - midPoint >= PIPS_FOR_STOP_LOSS) {
								localInstrumentData.side = POSITIONS.SHORT;
								console.log('stoploss happened, switch to ' + localInstrumentData.side);
							} else if (localInstrumentData.side === POSITIONS.SHORT && localInstrumentData.price - midPoint <= -PIPS_FOR_STOP_LOSS) {
								localInstrumentData.side = POSITIONS.LONG;
								console.log('stoploss happened, switch to ' + localInstrumentData.side);
							}
						}

						//TODO: stop loss not exact since it's a market order it might not execute exactly at midPoint price
						openPositionForInstrument(instrument, midPoint, localInstrumentData.side, function(createdPosition) {

							console.log('created position:');
							console.log(createdPosition);
							if (createdPosition.instrument && createdPosition.instrument === instrument && createdPosition.price) {
								localInstrumentData.price = createdPosition.price;
								saveInstrumentData(instrument, localInstrumentData, function() {
									console.log('saved localInstrumentData.');
								});
							} else {
								console.log('Error creating position for ' + instrument);
							}
						});
					});
				} else if (instrumentData.instrument && instrumentData.instrument === instrument) {
					//existing position
					decide(instrumentData);
				}
			});
		}
	};

	module.exports = function(apiObject) {
		fxAPI = apiObject;
		return publicReturn;
	};

})();
