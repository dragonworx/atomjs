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

			Control._atom(atom);

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

		on: dom.on
	};

	exports = {
		version: atom.version,
		settings: atom.settings,
		init: atom.init,
		emit: atom.emit,
		data: atom.data,
		loader: loader,
		router: router,
		log: log.write,
		on: atom.on,
		create: atom.create,
		location: router.location,
		navigate: router.navigate
	};

	window.atom = exports;

	return exports;
});