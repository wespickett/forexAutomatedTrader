var express = require('express'),
	app = express(),
	//bodyParser = require('body-parser'),
	https = require('https'),
	http = require('http'),
	fs = require('fs'),
	crypto = require('crypto'),
	fxAPI = require('./api.js')(),
	tradingAlgorithm = require('./tradingAlgorithm.js')(fxAPI);

var DEV=false;

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

var instruments = ['USD_CAD'];
var runCount = 0;

setInterval(function() {

	runCount++;
	console.log(runCount + '--- 1. Get prices');
	fxAPI.getPrices(instruments, function(data) {

		if (typeof data.prices === 'undefined') {
			//data structure changed, or invalid response from the server
			//TODO: better error reporting
			console.log('ERROR: fxApiRes data structure changed, or invalid response from the server');
		} else {

			//TODO: loop through multiple possible returned instruments
			if (data.prices[0].instrument = instruments[0]) {
				var askPrice = parseFloat(data.prices[0].ask, 10);
				var bidPrice = parseFloat(data.prices[0].bid, 10);
				console.log('ask: ' + askPrice + ' bid: ' + bidPrice);
				tradingAlgorithm.updatePrice(data.prices[0].instrument, askPrice, bidPrice);
			}
		}
	});
}, 1000 * 60);

app.get('/', function(rootReq, rootRes) {
	rootRes.send('');
});