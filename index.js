var express = require('express'),
	app = express(),
	//bodyParser = require('body-parser'),
	https = require('https'),
	fs = require('fs'),
	crypto = require('crypto'),
	fxAPI = require('./api.js')();
	tradingAlgorithm = require('./tradingAlgorithm.js')(fxAPI);

NODE_DEBUG='net';

var privateKey = fs.readFileSync('server.key').toString();
var certificate = fs.readFileSync('server.crt').toString();

var server = https.createServer({key: privateKey, cert: certificate}, app);
server.listen(8081);
server.on('connection', function(stream) {
  console.log("server connected on port 8081 :)");
});
//var credentials = crypto.createCredentials({key: privateKey, cert: certificate});

var instruments = ['USD_CAD'];

//app.use(bodyParser.json());

fxAPI.getPrices(instruments, function(data) {

	if (typeof data.prices === 'undefined') {
		//data structure changed, or invalid response from the server
		//TODO: better error reporting
		console.log('ERROR: fxApiRes data structure changed, or invalid response from the server');
	} else {

		//TODO: loop through multiple possible returned instruments
		if (data.prices[0].instrument = instruments[0]) {
			console.log(data.prices[0].ask);
			console.log(data.prices[0].bid);
			var askPrice = parseFloat(data.prices[0].ask, 10);
			var bidPrice = parseFloat(data.prices[0].bid, 10);
			tradingAlgorithm.updatePrice(data.prices[0].instrument, askPrice, bidPrice);
		}
	}
});

app.get('/', function(rootReq, rootRes) {
	rootRes.send('hello world');
});