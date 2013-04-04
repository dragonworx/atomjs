(function() {
	"use strict";

	requirejs.config({
		// change this if running from subsite, include lead and trailing slashes
		baseUrl: '/',

		paths: {
			jquery: 'js/lib/jquery',
			history: 'js/lib/history',
			json: 'js/lib/json2',
			bootstrap: 'js/lib/bootstrap.js',
			normalize: 'js/lib/require/normalize',
			text: 'js/lib/require/text',
			css: 'js/lib/require/css',
			atomjs: 'js/lib/atomjs',
			atom: 'js/lib/atomjs/atom'
		},

		shim: {
			jquery: {
				exports: 'jQuery'
			},
			history: {
				exports: 'History'
			}
		},

		deps: [
			'json',
			'atomjs/lang',
			'atomjs/url',
			'atomjs/dom',
			'atomjs/log',
			'atomjs/loader',
			'atomjs/control',
			'atomjs/router'
		]
	});

	// fake flag to grant access to admin, would be replaced with real server-side call
	window.allowAdmin = false;

	require([ 'atom', 'atomjs/lang', 'atomjs/log', 'atomjs/dom' ], function(atom, lang, log, dom) {
		atom
			.on(':404', null, function (e, navigationInfo) {
				// catch 404 and show alert
				atom.create({
					template: 'com.example.404',
					controller: 'com.example.404',
					container: '#404',
					settings: {
						path: navigationInfo.path,
						url: navigationInfo.rawUrl
					}
				});
			});

		atom.init(function(results) {
			log.write('ready', 'init!');
		});
	});
})();

window.onerror = function(message, file, lineNo) {
	alert('Uncaught Error!\n\n' + message + '\n' + file + ':' + lineNo);
};