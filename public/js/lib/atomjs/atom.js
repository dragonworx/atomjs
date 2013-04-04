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

			html = '<' + (options.type || 'div');
			if (!(options.template || options.controller || options.style)) {
				throw new Error('No template, controller or style specified to create');
			}
			html += options.template ? ' atom-template="' + options.template + '"' : '';
			html += options.controller ? ' atom-controller="' + options.controller + '"' : '';
			html += options.style ? ' atom-style="' + options.style + '"' : '';
			if (options.settings) {
				lang.each(options.settings, function (value, key) {
					html += ' atom-set-' + key + '="' + value + '"';
				});
			}
			html += '>';

			element = $.parseHTML(html);
			if (options.container) {
				$(options.container).append(element);
			}
			loader.load(element, options.callback);
			return element;
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
		},

		dataBindModelsByType: function (modelCollection, modelType, container) {
			var modelUsages,
				model,
				fieldName,
				i,
				modelUsageIterator,
				fieldIterator,
				self = this;

			// default to document.topLevelElement if no topLevelElement given
			container = container || dom.body;

			// define the iterator for finding usages of the model
			modelUsageIterator = function (j, modelBindElement) {
				dom.find(modelBindElement, '[atom-model-field]').each(fieldIterator);
			};

			// define the iterator for finding usages of model fields
			fieldIterator = function (k, fieldBindElement) {
				fieldBindElement = $(fieldBindElement);
				fieldName = fieldBindElement.attr('atom-model-field');
				if (lang.isUndefined(fieldBindElement[0].value)) {
					fieldBindElement.text(model[fieldName]);
				} else {
					fieldBindElement.val(model[fieldName]);
				}
			};

			// loop through each model, find it's usages in the dom scope, then find all fields within those usages and update their dom values
			i = modelCollection.length;
			while (i--) {
				model = modelCollection[i];
				if (!model.id) {
					throw new Error('Model of type "' + modelType + '" requires id key: -NOT FOUND-');
				}
				modelUsages = dom.find(container, '[atom-model="' + modelType + '"][atom-model-id="' + model.id + '"]');
				modelUsages.each(modelUsageIterator);
			}
		},

		modelElement: function (fragmentId, modelId) {
			var fragmentHTML = loader.fragment(fragmentId);
			return $($.parseHTML(fragmentHTML.replace(/(atom-model\s*=\s*['"]?[a-z_0-9]+['"]?)/i, '$1 atom-model-id="' + modelId + '"')));
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
		location: router.location,
		navigate: router.navigate,
		getCookie: atom.getCookie,
		setCookie: atom.setCookie,
		clearCookie: atom.clearCookie,
		dataBindModelsByType: atom.dataBindModelsByType,
		modelElement: atom.modelElement
	};

	window.atom = exports;

	return exports;
});