(function() {

	var HOST_DOMAIN = 'api-fxpractice.oanda.com';
	var API_VERSION = 'v1';

	//fxsandbox
	/*{
		"username" : "sonales",
		"password" : "HomGejbad,",
		"accountId" : 3148534
	}*/
	//var ACCOUNT_ID = '3148534';

	//fxpractice
	var ACCOUNT_ID = '7668620';
	var AUTH_TOKEN = 'a635e739eb32ca6528287e7d7e7cad03-3e6811d5d0011937603dba6d6ee0965f';

	//fxtrade
	//var ACCOUNT_ID = '490624';
	//var AUTH_TOKEN = '626fdd7d465fdf9eb95c2276c2f7a2f7-40eb035ce0891811e7c3f791f47be66d';

	var https = require('https');
	var instruments;
	var baseOptions = {
		host: HOST_DOMAIN,
		port: 443,
		method: 'GET',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Bearer ' + AUTH_TOKEN,
			'Connection': 'Keep-Alive'
		}
	};

	function getBaseOptions() {
		return JSON.parse(JSON.stringify(baseOptions));
	};

	function APIRequest(options, callback) {
		console.log(options);
		var fxApiReq = https.request(options, function(fxApiRes) {
			console.log('STATUS: ' + fxApiRes.statusCode);
		  	console.log('HEADERS: ' + JSON.stringify(fxApiRes.headers));

			fxApiRes.on('data', function(data) {
				var jsonData = JSON.parse(data);
				console.log(jsonData);
				if (typeof callback === 'function') callback(jsonData);
			});
		})
		.on('error', function(e) {
			//TODO: better error reporting
			console.log('ERROR: with fxApiReq: ' + e.message);
		})
		.end();
	}

	var publicReturn = {
		getPrices: function(instruments, callback) {
			var options = getBaseOptions();
			//options.path = '/' + API_VERSION + '/prices?instruments=' + instruments.join(',');
			options.path = '/' + API_VERSION + '/accounts/' + ACCOUNT_ID + '/positions';
			APIRequest(options, callback);
		},
		loadPositionsForInstrument: function(instrument, callback) {
			var options = getBaseOptions();
			options.path = '/' + API_VERSION + '/accounts';
			APIRequest(options, callback);
		}
	};

	module.exports = function(instrumentsToUse) {
		instruments = instrumentsToUse;
		return publicReturn;
	};
})();