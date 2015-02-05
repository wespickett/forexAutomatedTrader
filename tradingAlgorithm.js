(function() { 

	var POSITIONS = {
		LONG: 'buy',
		SHORT: 'sell'
	},
	fs = require('fs'),
	fxAPI = require('./api.js'),
	POSITIONS_FOLDER = 'positions',
	PIPS_FOR_TAKE_PROFIT = 50,
	PIPS_FOR_STOP_LOSS = 10,
	fxAPI;

	function getInstrumentPosition(instrument, callback) {
		fxAPI.getPositionForInstrument(instrument, callback);
	}

	function loadInstrumentData(instrument, callback) {
		//TODO: autocreate file if doesn't exist
		fs.readFile(POSITIONS_FOLDER + '/' + instrument, function(err, data) {
			if (err) throw err;
			if (typeof callback === 'function') callback(data);
		});
	}

	function saveInstrumentData(instrument, data, callback) {
		fs.writeFile(POSITIONS_FOLDER + '/' + instrument, JSON.stringify(data), function(err) {
			if (err) throw err;
			if (typeof callback === 'function') callback();
		});
	}

	function openPositionForInstrument(instrument, positionDirection, stopLoss, callback) {
		fxAPI.openPosition(instrument, positionDirection, stopLoss, callback);
	}

	function closePositionForInstrument(instrument, positionDirection, stopLoss, callback) {
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
					console.log('currentDelta: ' + currentDelta + ' position: ' + instrumentData.side);

					if (instrumentData.side === POSITIONS.LONG) {
						if (currentDelta >= PIPS_FOR_TAKE_PROFIT) {
							//take profit, stay long
							console.log('--- 3. take profit, stay long');
							closePositionForInstrument(instrument, function() {

								console.log('position closed for profit');
								//TODO: stop loss not exact since it's a market order it might not execute exactly at midPoint price
								openPositionForInstrument(instrument, POSITIONS.LONG, midPoint - PIPS_FOR_STOP_LOSS, function(createdPosition) {

									console.log('new position: ' + createdPosition);
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
								openPositionForInstrument(instrument, POSITIONS.SHORT, midPoint - PIPS_FOR_STOP_LOSS, function(createdPosition) {

									console.log('new position: ' + createdPosition);
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
					} else {
						console.log('no action.');
					}
				}

				if (instrumentData.code && instrumentData.code === 14) {

					console.log('No position for ' + instrument);
					//No position for this instrument
					loadInstrumentData(instrument, function(localInstrumentData) {

						localInstrumentData = localInstrumentData || {};
						console.log('localInstrumentData: ' + localInstrumentData);

						if (typeof localInstrumentData.side === 'undefined') {
							localInstrumentData.side = localInstrumentData.side || POSITIONS.LONG;
						}

						if (localInstrumentData.price) {
							//somewhat detect if position doesn't exist from stoploss being triggered.
							//if it was triggered from stoploss, then switch direction
							if (localInstrumentData.price - midPoint <= PIPS_FOR_STOP_LOSS && localInstrumentData.side === POSITIONS.LONG) {
								localInstrumentData.side = POSITIONS.SHORT;
								console.log('stoploss happened, switch to ' + localInstrumentData.side);
							} else if (localInstrumentData.price - midPoint >= PIPS_FOR_STOP_LOSS && localInstrumentData.side === POSITIONS.SHORT) {
								localInstrumentData.side = POSITIONS.LONG;
								console.log('stoploss happened, switch to ' + localInstrumentData.side);
							}
						}

						//TODO: stop loss not exact since it's a market order it might not execute exactly at midPoint price
						openPositionForInstrument(instrument, localInstrumentData.side, midPoint - PIPS_FOR_STOP_LOSS, function(createdPosition) {

							console.log('created position: ' + createdPosition);
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
