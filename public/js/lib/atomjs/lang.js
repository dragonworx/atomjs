define(['atomjs/lang'], function () {
	"use strict";

	var lang = {
		isUndefined: function (x) {
			return x === undefined || x === null;
		},

		isDefined: function () {
			return !lang.isUndefined.apply(this, arguments);
		},

		bool: function (val) {
			if (val === true || val === false) {
				return val;
			}
			if (lang.isUndefined(val)) {
				return false;
			}
			return val.toString().toLowerCase() === 'true';
		},

		keys: function (x, sort) {
			var a = [],
				key;

			if (x instanceof Array) {
				for (key = 0; key < x.length; key = key + 1) {
					a.push(key);
				}

				return a;
			}
			if (x instanceof Object) {
				for (key in x) {
					if (x.hasOwnProperty(key)) {
						a.push(key);
					}
				}
				return sort ? a.sort() : a;
			}
			throw new Error('(' + (typeof x) + ') is not enumerable with keys');
		},

		join: function (x, rowSep, keyPairSep) {
			var keys,
				array,
				i,
				type;

			if (x instanceof Array) {
				return x.join(rowSep);
			}

			if (x instanceof Object) {
				keys = this.keys(x).sort();
				i = 0;
				array = [];
				while (i < keys.length) {
					array.push(keys[i] + keyPairSep + x[keys[i]]);
					i = i + 1;
				}
				return array.join(rowSep);
			}

			type = typeof x;
			throw new Error('object or array expected for join, (' + type + ') given');
		},

		hasKey: function (enumerableValue, key) {
			return lang.isDefined(enumerableValue) && lang.isDefined(enumerableValue[key]);
		},

		each: function (enumerableValue, iteratorFunc, context) {
			var keys, i, l = enumerableValue.length;

			if (enumerableValue.length === 0) {
				return;
			}

			if (enumerableValue instanceof jQuery) {
				for (i = 0; i < l; i = i + 1) {
					iteratorFunc.call(context || enumerableValue, $(enumerableValue[i]), i, enumerableValue);
				}
			} else {
				keys = this.keys(enumerableValue, true);
				l = keys.length;

				for (i = 0; i < l; i = i + 1) {
					iteratorFunc.call(context || enumerableValue, enumerableValue[keys[i]], keys[i], enumerableValue);
				}
			}
		},

		map: function (enumerableValue, iteratorFunc, context) {
			var result = [];

			lang.each(enumerableValue, function (value, key) {
				result.push(iteratorFunc.call(context || enumerableValue, value, key, enumerableValue));
			});

			return result;
		},

		array: function(array) {
			var arr;
			if (array instanceof Array) {
				return array;
			}
			arr = [];
			lang.each(array, function(item) {
				arr.push(item);
			});
			return arr;
		},

		/**
		 *
		 * @param {number} value
		 * @param {Array} array
		 * @returns {number}
		 */
		indexOf: function (value, array) {
			if (!(array instanceof Array)) {
				throw new Error('indexOf cannot be performed on ' + typeof(array));
			}

			var i,
				l = array.length;

			for (i = 0; i < l; i = i + 1) {
				if (array[i] === value) {
					return i;
				}
			}

			return -1;
		},

		contains: function (value, array) {
			if (array instanceof Array) {
				return lang.indexOf(value, array) > -1;
			}
			if (array instanceof Object) {
				return lang.isDefined(array[value]);
			}
			throw new Error(typeof(array) + ' is not indexable');
		},

		series: function (tasks, callback) {
			if (tasks.length == 0) {
				callback(null);
				return;
			}

			var i = 0,
				l = tasks.length,
				results = [],
				iterator;

			iterator = function () {
				tasks[i](function (err, result) {
					if (lang.isDefined(err)) {
						callback(err, results);
						return;
					}
					results.push(result);
					i = i + 1;
					if (i < l) {
						iterator();
					} else {
						callback(null, results);
					}
				});
			};

			iterator();
		},

		parallel: function (tasks, callback) {
			if (tasks.length == 0) {
				callback(null);
				return;
			}

			var i,
				index = 0,
				l = tasks.length,
				breakErr = null,
				results = [],
				iterator = function (err, result) {
					if (lang.isDefined(err)) {
						callback(err, results);
						return;
					}
					results.push(result);

					index = index + 1;
					if (index === l) {
						callback(breakErr, results);
					}
				};

			for (i = 0; i < l; i = i + 1) {
				tasks[i](iterator);
			}
		},

		whilst: function (test, iterator, callback) {
			var doIterator = function (err) {
					if (lang.isDefined(err)) {
						callback(err);
						return;
					}
					step();
				},

				step = function () {
					if (test() === true) {
						iterator(doIterator);
					} else {
						callback(null);
					}
				};

			step();
		}
	};

	return lang;
});