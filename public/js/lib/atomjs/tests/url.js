define(['atomjs/url', 'atomjs/lang'], function (Url, lang) {
	"use strict";

	var protocol = 'http://',
		host = 'www.foo.com',
		port = ':8888',
		path = '/foo/subfoo/',
		relPath = 'fooRel/subfooRel/',
		file = 'page.html',
		ext = '.html',
		query = '?abc=123&x=1',
		hash = '#hash',
		str = [protocol, host, port, path, file, query, hash].join(''),
		rel = [protocol, host, port, path, relPath].join(''),
		url = new Url(str),
		val;

	module('atom.url', {});
	test('foundation', function() {
		var props = ['href', 'protocol', 'port', 'hostname'];

		lang.each(props, function(propName) {
			ok(lang.isDefined(window.location[propName]), 'window.location.' + propName + ' = ' + window.location[propName]);
		});
	});

	module('atom.url', {});
    test('parse ' + str, function () {
	    // #1
        ok(lang.isDefined(url) && url.toString() === str, 'new = ' + url.toString());

	    // #2
	    val = url.protocol(true);
	    ok(val === protocol, 'protocol = ' + val);

	    // #3
	    val = url.hostname();
	    ok(val === host, 'hostname = ' + val);

	    // #4
	    val = url.port(true);
	    ok(val === port, 'port = ' + val);

	    // #5
	    val = url.fullhost();
	    ok(val === protocol + host + port, 'fullhost = ' + val);

	    // #6
	    val = url.path();
	    ok(val === path + file, 'file = ' + val);

	    // #7
	    val = url.file();
	    ok(val === file, 'path = ' + val);

	    // #8
	    val = url.pathname();
	    ok(val === '/foo/subfoo', 'pathname = ' + val);

	    // #9
	    val = url.file();
	    ok(val === file, 'file = ' + val);

	    // #10
	    val = url.extension();
	    ok('.' + val === ext, 'extension = ' + val);

	    // #11
	    val = url.query(true);
	    ok(val === query, 'query = ' + val);

	    // #12
	    val = url.params();
	    ok(val['abc'] === '123' && val['x'] === '1', 'params = ' + '{' + lang.join(val, ', ', ':') + '}');

	    // #13
	    val = url.hash(true);
	    ok(val === hash, 'hash = ' + val);

	    // #14
	    val = url.toString();
	    url = new Url(relPath, val);
	    ok(url.toString() === rel, val + ' as base with relative ' + relPath + ' === "' + url.toString());

	    // #15
	    url = url.protocol('ftp://').port(9999).hostname('www.newhost.com').pathname('newpath').file('newfile').query('?newquery=1').hash('#newhash');
	    ok(url.toString() === 'ftp://www.newhost.com:9999/newpath/newfile/?newquery=1#newhash', "url = url.protocol('ftp://').port(9999).hostname('www.newhost.com').pathname('newpath').file('newfile').query('?newquery=1').hash('#newhash') = " + url.toString());
    });

	test('construct', function() {
		protocol = window.location.protocol.replace(/[:\/]+/, '') + '://';
		host = window.location.hostname;
		port = ':' + window.location.port.replace(':', '');

		// #1
		url = Url.parse();
		ok(url.toString() === window.location.href, url.toString() + ' = ' + window.location.href);

		// #2
		url = Url.parse('foo');
		ok(url.toString() === protocol + host + port + '/foo' && url.isRelative(), url.original + ' = ' + url.toString());

		// #3
		url = Url.parse('/foo');
		ok(url.toString() === protocol + host + port + '/foo' && url.isAbsolute(), url.original + ' = ' + url.toString());

		// #4
		url = Url.parse('www.foo.com' + port);
		ok(url.toString() === protocol + 'www.foo.com' + port + '/' && url.isAbsolute(), url.original + ' = ' + url.toString());
	});
});