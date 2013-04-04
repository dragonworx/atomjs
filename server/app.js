'use strict';

var express = require('express'),
	http = require('http'),
	fs = require('fs'),
	path = require('path'),
	url = require('url'),
	staticRoot = path.join(__dirname, '../', 'public'),
	siteRoot = '/',
	bootstrapPath,
    bootstrapFile,
    port = 80,
	bootstrapContents = null,
	app = express();

// command line args
process.argv.forEach(function(val, index, array) {
	var key, value;
	if (index % 2 === 0) {
		key = array[index];
		value = array[index + 1];
		if (key === '-b') {
			bootstrapPath = value;
		}
		if (key === '-p') {
			port = parseInt(value);
		}
		if (key === '-s') {
			siteRoot = '/' + value.replace(/^\//, '').replace(/\/$/, '') + '/';
		}
	}
});

// setup express
app.set('port', process.env.PORT || 3000);
app.set('case sensitive routing', true);

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.compress());
app.use(express.static(staticRoot));

// enable bootstrap
if (bootstrapPath) {
	// determine bootstrap path and read contents
	bootstrapFile = path.join(staticRoot, bootstrapPath);

	if (!fs.existsSync(bootstrapFile)) {
		throw new Error('Bootstrap file not found: ' + bootstrapFile);
	}

	// set express middle-ware, always return bootstrap
	app.use(function(req, res) {
		var regex = /(src|href|data-main)=(["'])(?!\/)(?!\.)/gi;

		// lazy initialise bootstrap content
		if (bootstrapContents === null) {
			bootstrapContents = fs.readFileSync(bootstrapFile).toString();
			// replace start of relative paths (href|src="^/) with request url path
			bootstrapContents = bootstrapContents.replace(regex, '$1=$2' + siteRoot);
		}

		// write response
		res.end(bootstrapContents);
	});

	// watch for changes and update content to avoid server restart
	fs.watchFile(bootstrapFile, function (curr, prev) {
		bootstrapContents = null;
		console.info(bootstrapPath + ' refreshed!');
	});
}


http.createServer(app).listen(port, function () {
	console.log('\n** Simple Server **');
	console.log('  -b [bootstrap relative path from static root]\n');
	console.log("localhost:\t" + port);
	console.log('public:\t\t' + staticRoot);
	console.log('bootstrap:\t' + bootstrapPath);
	console.log('siteRoot:\t' + siteRoot + '\n\n...server ready!');
});