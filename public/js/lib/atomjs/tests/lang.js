define(['atomjs/lang'], function (lang) {
	"use strict";

	var val, val2, val3;

	module('atom.lang', {});
	test('foundation', function () {

		// #1
		ok(lang.isUndefined(undefined) && lang.isUndefined(null) && lang.isUndefined(), 'isUndefined(undefined|null) === true');

		// #2
		val = lang.keys([1, 2, 3]);
		ok(val.length === 3 && val[0] === 0 && val[2] === 2, 'keys([1,2,3]) === ' + val);

		// #3
		val = lang.keys({'x': 1, 'y': 2}, true);
		ok(val.length === 2 && val[0] === 'x' && val[1] === 'y', 'keys({x:1,y:2}) === ' + val);

		// #4
		val = lang.indexOf('b', ['a', 'b', 'c']);
		ok(val === 1, '[a,b,c].indexOf(b) === 1');

		// #5
		val = [1, 2, 3];
		val2 = [];
		lang.each(val, function(item, index, array) {
			this.push(item + ':' + index);
			val3 = this;
		}, val2);
		ok(val2[0] === '1:0' && val2[1] === '2:1' && val2[2] === '3:2' && val3 === val2, 'each iterator over array with context === ' + val2);

		// #6
		val = {x:1, y:2, z:3};
		val2 = [];
		lang.each(val, function(item, index, array) {
			this.push(item + ':' + index);
			val3 = this;
		}, val2);
		ok(val2[0] === '1:x' && val2[1] === '2:y' && val2[2] === '3:z' && val3 === val2, 'each iterator over object with context === ' + val2);

		// #7
		val = [1, 2, 3];
		val2 = lang.map(val, function (value, key) {
			return value + 'map';
		});
		ok(val2 instanceof Array && val2[1] === '2map', 'map over array === ' + val2);

		// #8
		val = {x:1, y:2, z:3};
		val2 = lang.map(val, function (value, key) {
			return key + ':' + value;
		});
		ok(val2 instanceof Array && val2[1] === 'y:2', 'map over object === ' + val2);

		// #9
		val = ['a1', 'a2', 'a3'];
		val2 = lang.array(val);
		ok(val === val2, 'convert to array(array) === ' + val);

		// #10
		val = {x:'b1', y:'b2', z:'b3'};
		val2 = lang.array(val);
		ok(val2 instanceof Array && val2[1] === 'b2', 'convert to array(object) === ' + val2);

		// #11
		val = function (a, b, c) {
			val2 = lang.array(arguments);
			ok(val2 instanceof Array && val2[1] === 'c2', 'convert to array(arguments) === ' + val2);
		};
		val('c1', 'c2', 'c3');
	});

	module('atom.lang', {});
	asyncTest('async series', function () {
		lang.series([
			function (callback) {
				setTimeout(function () {
					callback(null, (new Date()).toLocaleTimeString());
				}, 1000);
			},
			function (callback) {
				setTimeout(function () {
					callback(null, (new Date()).toLocaleTimeString());
				}, 1000);
			},
			function (callback) {
				setTimeout(function () {
					callback(null, (new Date()).toLocaleTimeString());
				}, 1000);
			}
		], function (err, results) {
			expect(1);
			ok(results.length === 3, 'every 1 sec === ' + results.join(', '));
			start();
		});
	});

	module('atom.lang', {});
	asyncTest('async series-with-error', function () {
		lang.series([
			function (callback) {
				setTimeout(function () {
					callback(null, (new Date()).toLocaleTimeString());
				}, 100);
			},
			function (callback) {
				setTimeout(function () {
					callback('err', (new Date()).toLocaleTimeString());
				}, 100);
			},
			function (callback) {
				setTimeout(function () {
					callback(null, (new Date()).toLocaleTimeString());
				}, 100);
			}
		], function (err, results) {
			expect(1);
			ok(results.length === 1 && err === 'err', 'stop on 2nd push === ' + results.join(', ') + ' "err" === ' + err);
			start();
		});
	});

	module('atom.lang', {});
	asyncTest('async parallel', function () {
		lang.parallel([
			function (callback) {
				setTimeout(function () {
					callback(null, (new Date()).toLocaleTimeString());
				}, 1000);
			},
			function (callback) {
				setTimeout(function () {
					callback(null, (new Date()).toLocaleTimeString());
				}, 1000);
			},
			function (callback) {
				setTimeout(function () {
					callback(null, (new Date()).toLocaleTimeString());
				}, 1000);
			}
		], function (err, results) {
			expect(1);
			ok(results.length === 3, 'on same sec === ' + results.join(', '));
			start();
		});
	});

	module('atom.lang', {});
	asyncTest('async parallel-with-error', function () {
		lang.parallel([
			function (callback) {
				setTimeout(function () {
					callback(null, (new Date()).toLocaleTimeString());
				}, 1000);
			},
			function (callback) {
				setTimeout(function () {
					callback('err', (new Date()).toLocaleTimeString());
				}, 1000);
			},
			function (callback) {
				setTimeout(function () {
					callback(null, (new Date()).toLocaleTimeString());
				}, 1000);
			}
		], function (err, results) {
			expect(1);
			ok(results.length === 1 && err === 'err', 'stop on 2nd push === ' + results.join(', ') + ' "err" === ' + err);
			start();
		});
	});

	module('atom.lang', {});
	asyncTest('async whilst', function () {
		var i = 0,
			l = 3;

		lang.whilst(
			function () {
				return i < l;
			},
			function (callback) {
				setTimeout(function () {
					i = i + 1;
					callback();
				}, 100);
			},
			function (/*err*/) {
				expect(1);
				ok(i === 3, 'increment to 3 === ' + i);
				start();
			}
		);
	});

	module('atom.lang', {});
	asyncTest('async whilst-with-error', function () {
		var i = 0,
			l = 3;

		lang.whilst(
			function () {
				return i < l;
			},
			function (callback) {
				setTimeout(function () {
					i = i + 1;
					if (i === 1) {
						callback('err');
					} else {
						callback();
					}
				}, 100);
			},
			function (/*err*/) {
				expect(1);
				ok(i === 1, 'increment to 3 stop on 2nd === ' + i);
				start();
			}
		);
	});
});