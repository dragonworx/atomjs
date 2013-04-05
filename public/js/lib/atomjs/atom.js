define(['atomjs/lang', 'atomjs/dom', 'atomjs/url', 'atomjs/log', 'atomjs/loader', 'atomjs/router', 'atomjs/control'], function (lang, dom, Url, log, loader, router, Control) {
	"use strict";

	var atom,
		exports;

	atom = {
		version: '3.1.0',

		cache: {},

		settings: {
			// use requirejs config baseUrl as site root by accessing private requirejs context (may change in future but no public api available at present)
			siteRoot: requirejs.s.contexts._.config.baseUrl.replace(/\/$/, '') + '/',
			atomRoot: 'js/atomjs/',
			logEnabled: true,
			log: null,
			logLimit: 1000,
			loadDepthLimit: 10
		},

		init: function (init_callback) {
			atom.settings.atomRoot = atom.settings.siteRoot + 'js/atomjs/';

			// load global elements, then start router
			lang.series([
				/**
				 * loader
				 * @param callback
				 */
				function (callback) {
					loader.init(atom, function(err, results) {
						callback(null, results);
					});
				},
				/**
				 * router
				 * @param callback
				 */
				function (callback) {
					router.init(atom, function(err, results) {
						callback(null, results);
					});
				}
			], function(err, results) {
				// loader and router ready
				if (lang.isDefined(init_callback)) {
					init_callback({
						loaded: results[0]
					});
				}
			});
		},

		emit: function (target, eventType) {
			var args;

			target = target || dom.body;

			if (target.length === 0 || typeof eventType !== 'string') {
				throw new Error('cannot emit event ' + eventType + ' to target ' + typeof(target));
			}

			//remove target and eventType from arguments
			args = lang.array(arguments);
			args.shift();
			args.shift();

			log.write('emit', eventType, 'target:', dom(target).toJSON(), 'args:', args.length > 0 ? lang.map(args, function (val) { return typeof val === 'function' || typeof val === 'object' ? typeof(val) : val }).join(',') : 0);
			dom(target).trigger(eventType, args);
		},

		data: function (element) {
			if (lang.isUndefined(element.data('__atomjs'))) {
				element.data('__atomjs', {});
			}
			return element.data('__atomjs');
		},

		create: function (options) {
			var html,
				element;

			// create initial html
			if (options.fragment) {
				html = loader.fragment(options.fragment);
			} else {
				html = options.type || 'div';
				html = '<' + html + '></' + html + '>';
			}

			// create element
			element = dom.parse(html);

			// set attributes
			if (options.template) {
				element.attr('atom-template', options.template);
			}
			if (options.controller) {
				element.attr('atom-controller', options.controller);
			}
			if (options.style) {
				element.attr('atom-style', options.style);
			}
			if (options.model && options.model.id) {
				element.attr('atom-model-id', options.model.id);
			}
			if (options.model && options.model.type) {
				element.attr('atom-model', options.model.type);
			}
			if (options.model && options.model.key) {
				element.attr('atom-model-key', options.model.key);
			}
			if (options.settings) {
				lang.each(options.settings, function (value, key) {
					element.attr('atom-set-' + key, value);
				});
			}
			if (options.load) {
				element.attr('atom-load', options.load);
			}
			if (options.classes) {
				lang.each(options.classes.split(' '), function (className) {
					element.addClass(className);
				});
			}
			if (options.css) {
				element.css(options.css);
			}

			// add to container and load if required
			if (options.container && options.mode !== 'insert') {
				dom(options.container).append(element);
			}
			if (options.container && options.mode === 'insert') {
				dom(options.container).insert(element);
			}
			if (options.load !== false) {
				loader.load(element, options.onload);
			}
			return element;
		},

		dataBind: function (options) {
			var models = options.models || [],
				modelType = options.type || '',
				domScope = options.container || dom.body,
				modelUsages,
				model,
				fieldName,
				i,
				modelUsageIterator,
				fieldIterator;

			// define the iterator for finding usages of the model
			modelUsageIterator = function (j, modelBindElement) {
				dom.find(modelBindElement, '[atom-model-key]').each(fieldIterator);
			};

			// define the iterator for finding usages of model fields
			fieldIterator = function (k, fieldBindElement) {
				fieldBindElement = $(fieldBindElement);
				fieldName = fieldBindElement.attr('atom-model-key');
				if (lang.isUndefined(fieldBindElement[0].value)) {
					fieldBindElement.text(model[fieldName]);
				} else {
					fieldBindElement.val(model[fieldName]);
				}
			};

			// loop through each model, find it's usages in the dom scope, then find all fields within those usages and update their dom values
			i = models.length;
			while (i--) {
				model = models[i];
				if (!model.id) {
					throw new Error('Model of type "' + modelType + '" requires id key: -NOT FOUND-');
				}
				modelUsages = dom.find(domScope, '[atom-model="' + modelType + '"][atom-model-id="' + model.id + '"]');
				modelUsages.each(modelUsageIterator);
			}
		},

		on: dom.on,

		setCookie: function setCookie(name, value, expireInDays) {
			var exdate = new Date();

			exdate.setDate(exdate.getDate() + expireInDays);
			value = JSON.stringify(value) + (_.isUndefined(expireInDays)? "" : "; expires=" + exdate.toUTCString());
			value = value.replace(/[=]/g, '##EQ##').replace(/;/g, '##SC##');
			document.cookie = name + "=" + value;
			log.write('cookie', name, value);
		},

		getCookie: function getCookie(name, defaultValue) {
			var i,
				x,
				y,
				ARRcookies = document.cookie.split(';');

			for (i = 0; i < ARRcookies.length; i = i + 1) {
				x = ARRcookies[i].substr(0, ARRcookies[i].indexOf('='));
				y = ARRcookies[i].substr(ARRcookies[i].indexOf('=') + 1);
				x = x.replace(/^\s+|\s+$/g, "");
				if (x === name) {
					y = y.replace(/##EQ##/g, '=').replace(/##SC##/g, ';');
					return JSON.parse(y);
				}
			}
			return defaultValue;
		},

		clearCookie: function (name) {
			document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		}
	};

	exports = {
		version: atom.version,
		settings: atom.settings,
		init: atom.init,
		emit: atom.emit,
		data: atom.data,
		fragment: loader.fragment,
		log: log.write,
		on: atom.on,
		create: atom.create,
		dataBind: atom.dataBind,
		location: router.location,
		navigate: router.navigate,
		getCookie: atom.getCookie,
		setCookie: atom.setCookie,
		clearCookie: atom.clearCookie
	};

	window.atom = exports;

	return exports;
});