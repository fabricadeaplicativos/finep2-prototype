var http           = require('http');
var sendMarkedHtml = require('send-marked-html');
var url            = require('url');
var path           = require('path');
 

function createMarkedHtmlServer(options) {

	var port = options.port || 3100;

	var app = http.createServer(function(req, res){
		sendMarkedHtml(req, url.parse(req.url).pathname, options)
			.pipe(res);
	}).listen(port, function () {

		console.log('Marked HTML server at http://localhost:' + port);
	});
}

// export
module.exports = createMarkedHtmlServer;