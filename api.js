(function() {

	var HOST_DOMAIN = 'api-fxpractice.oanda.com',
		API_VERSION = 'v1',
		ACCOUNT_ID,
		https = require('https'),
		http = require('http'),
		protocol = http,
		instruments,
		baseOptions = {
			host: HOST_DOMAIN,
			port: 80,
			method: 'GET',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Connection': 'Keep-Alive'
			}
		};

	//TODO: make config setting
	var DEV = false;

	if (DEV) {
		//fxsandbox
		/*{
			"username" : "sonales",
			"password" : "HomGejbad,",
			"accountId" : 3148534
		}*/
		ACCOUNT_ID = '3148534';
		HOST_DOMAIN = 'api-sandbox.oanda.com';	
	} else {
		//fxpractice
		var ACCOUNT_ID = '7668620';
		var AUTH_TOKEN = 'a635e739eb32ca6528287e7d7e7cad03-3e6811d5d0011937603dba6d6ee0965f';

		//fxtrade
		//var ACCOUNT_ID = '490624';
		//var AUTH_TOKEN = '626fdd7d465fdf9eb95c2276c2f7a2f7-40eb035ce0891811e7c3f791f47be66d';

		baseOptions.headers['Authorization'] = 'Bearer ' + AUTH_TOKEN;
		baseOptions.port = 443;
		protocol = https;
	}

	function getBaseOptions() {
		//clone object
		return JSON.parse(JSON.stringify(baseOptions));
	};

	function APIRequest(options, callback, body) {

		body = body || '';

		var fxApiReq = protocol.request(options, function(fxApiRes) {
			// console.log('STATUS: ' + fxApiRes.statusCode);
		 	// console.log('HEADERS: ' + JSON.stringify(fxApiRes.headers));

			fxApiRes.on('data', function(data) {
				var jsonData = JSON.parse(data);
				if (typeof callback === 'function') callback(jsonData);
			});
		})
		.on('error', function(e) {
			//TODO: better error reporting
			console.log('ERROR: with fxApiReq: ' + e.message);
		})
		.end(body);
	}

	var publicReturn = {
		getPrices: function(instruments, callback) {
			var options = getBaseOptions();
			options.path = '/' + API_VERSION + '/prices?instruments=' + instruments.join(',');

			APIRequest(options, callback);
		},
		getPositionForInstrument: function(instrument, callback) {
			var options = getBaseOptions();
			options.path = '/' + API_VERSION + '/accounts/' + ACCOUNT_ID + '/positions/' + instrument;

			APIRequest(options, callback);
		},
		openPosition: function(instrument, units, positionDirection, stopLoss, callback) {
			//first check for existing orders
			var options = getBaseOptions();
			options.method = 'GET';
			options.path = '/' + API_VERSION + '/accounts/' + ACCOUNT_ID + '/orders/?instrument=' + instrument;

			APIRequest(options, function(existingOrders) {

				//round to 5 decimal points
				stopLoss = stopLoss || '';
				if (stopLoss) stopLoss = stopLoss.toFixed(5);

				//if existing order, do nothing
				if (existingOrders.orders && existingOrders.orders.length === 0) {

					var body = 'Content-Type=application%2Fx-www-form-urlencoded&instrument=' + instrument + '&units=' + units + '&type=market&side=' + positionDirection + '&stopLoss=' + stopLoss;

					var options = getBaseOptions();
					options.method = 'POST';
					options.path = '/' + API_VERSION + '/accounts/' + ACCOUNT_ID + '/orders';

					APIRequest(options, callback, body);
				}
			});
		},
		closePosition: function(instrument, callback) {
			var options = getBaseOptions();
			options.method = 'DELETE';
			options.path = '/' + API_VERSION + '/accounts/' + ACCOUNT_ID + '/positions/' + instrument;
			
			APIRequest(options, callback);
		}
	};

	module.exports = function(instrumentsToUse) {
		instruments = instrumentsToUse;
		return publicReturn;
	};
})();