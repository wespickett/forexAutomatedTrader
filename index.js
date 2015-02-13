var express = require('express'),
	app = express(),
	//bodyParser = require('body-parser'),
	https = require('https'),
	http = require('http'),
	fs = require('fs'),
	crypto = require('crypto'),
	fxAPI = require('./api.js')(),
	tradingAlgorithm = require('./tradingAlgorithm.js')(fxAPI);

//TODO: config variables
var DEV=false;
var WAIT_SECONDS = 60 * 1; //1 minute

var privateKey = fs.readFileSync('server.key').toString();
var certificate = fs.readFileSync('server.crt').toString();

var server;
if (DEV) {
	server = http.createServer(app);
} else {
	server = https.createServer({key: privateKey, cert: certificate}, app);
}
server.listen(8081);
server.on('connection', function(stream) {
  console.log("server connected on port 8081 :)");
});

var instruments = ['USD_CAD', 'EUR_USD'];
var marketHours = {
	'EUR_USD': {
		//closed 4pm -> 1am
		start: 6,
		end: 21
	},
	'USD_CAD': {
		//closed 7pm -> midnight
		start: 5,
		end: 24
	}
}
var runCount = 0;

function isMarketHours(instrument) {
	var now = new Date();
	
	switch(instrument) {
		case 'USD_CAD':
		case 'EUR_USD':
			return (now.getUTCHours() > marketHours[instrument].start && now.getUTCHours() < marketHours[instrument].end);
	}
}

setInterval(function() {

	runCount++;
	console.log('--- 1. Get prices [' + runCount + '][' + new Date().toISOString() + ']');
	fxAPI.getPrices(instruments, function(data) {

		if (typeof data.prices === 'undefined') {
			//data structure changed, or invalid response from the server
			//TODO: better error reporting
			console.log('ERROR: fxApiRes data structure changed, or invalid response from the server');
		} else {

			instruments.forEach(function(instrument) {

				if (!isMarketHours(instrument)) return;

				for (var i = 0; i < data.prices.length; i++) {
					if (data.prices[i].instrument === instrument) {
						var askPrice = parseFloat(data.prices[i].ask, 10);
						var bidPrice = parseFloat(data.prices[i].bid, 10);
						console.log(instrument +' -- ask: ' + askPrice + ' bid: ' + bidPrice);
						tradingAlgorithm.updatePrice(instrument, askPrice, bidPrice);
					}
				}
			});
		}
	});
}, 1000 * WAIT_SECONDS);

app.get('/', function(rootReq, rootRes) {
	rootRes.send('');
});