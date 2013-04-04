define(['jquery', 'atomjs/lang', 'atomjs/dom', 'atomjs/log'], function (jquery, lang, dom, log) {
	"use strict";

	var atom,
		loader;

	function Control () {
		this.__classes = [];
		this.__id = 0;
	}

	Control._atom = function (_atom) {
		atom = _atom;
	};

	Control._loader = function (_loader) {
		loader = _loader;
	};

	Control.allowOverrideProperties = ['id', 'onLoad', 'onInit', 'onShow', 'onHide', 'onNavigate', 'onNavigated'];
	Control.rejectOverrideProperties = ['authenticate'];

	Control.prototype = {
		__className: 'Default Template',

		settings: {
			hide: true
		},

		__bind: function () {
			this.on(':load', this.scope(), this.onLoad, false, true);
			this.on(':init', this.scope(), this.onInit, false, true);
			this.on(':show', this.scope(), this.onShow, false, true);
			this.on(':hide', this.scope(), this.onHide, false, true);
			this.on(':navigate', this.scope(), this.onNavigate, false, true);
			this.on(':navigated', this.scope(), this.onNavigated, false, true);
		},

		className: function () {
			if (this.__id === 0) {
				return 'Default Template';
			}
			return lang.map(this.__classes,function (mod) {
				return mod.id;
			}).join('/');
		},

		scope: function (selector) {
			var scope = ':atom-control(' + this.__id + ')';

			if (lang.isDefined(selector)) {
				scope = scope + ' ' + selector;
			}

			return scope;
		},

		on: dom.on,

		onWithin: function (eventType, selector, callback) {
			return dom.on(eventType, callback ? this.scope(selector) : this.scope(), callback || selector, true);
		},

		onThis: function (eventType, callback) {
			return dom.on(eventType, this.scope(), callback);
		},

		/**
		 * @see atom#emit
		 */
		emit: function () {
			return atom.emit.apply(atom, arguments);
		},

		onLoad: function (e, load_callback) {
			var info = loader.getElementInfo(e.target),
				control,
				asyncTasks,
				self = this;

			self.emit(info.element, ':loading', info);

			lang.series([
				/**
				 * ensure all controllers defined on this control are loaded and the complex controller class is created
				 * @param callback
				 */
				function load_create_controllers (callback) {
					if (info.isController) {
						if (lang.hasKey(loader.cache.classes, info.className)) {
							// controller class has already been created and cached, return cached copy
							info.element.attr('atom-control', info.controller.__id);
							// callback with cached classes
							callback(null, loader.cache.classes[info.className]);
						} else {
							asyncTasks = [];

							// controller needs to be loaded, load all required
							lang.each(info.controllers, function (id) {
								asyncTasks.push(loader.loadController(id));
							});

							lang.parallel(asyncTasks, function (err, modules) {
								// build control class from required controller classes
								control = loader.createController(info.className, modules);
								info.element.attr('atom-control', control.__id);
								self = control;
								info.controller = control;

								// callback with newly created class
								callback(null, control);
							});
						}
					} else {
						// not a controller, callback with nothing
						callback();
					}
				},

				/**
				 * determine whether this control should proceed to load templates and styles and be activated
				 * @param callback
				 */
				function authenticate (callback) {
					if (info.isController && typeof self.authenticate === 'function') {
						log.write('authenticate.request', info.className);
						self.authenticate(info.element, function (authentication) {
							log.write('authenticate.response', info.className, lang.isDefined(authentication) ? authentication : 'none');
							info.authentication = authentication;
							// callback with authentication results
							callback(null, authentication);
						});
					} else {
						// not a controller, callback with nothing
						callback();
					}
				},

				/**
				 * load all styles and templates in parallel
				 * @param styles_templates_callback
				 */
				function load_syles_and_templates (styles_templates_callback) {
					// dont load if not authenticated
					if (lang.isDefined(info.authentication)) {
						styles_templates_callback();
						return;
					}

					lang.parallel([
						/**
						 * load all styles required by this control
						 * @param callback
						 */
							function load_styles (callback) {
							if (info.isStyle) {
								asyncTasks = [];

								// load styles
								lang.each(info.styles, function (id) {
									asyncTasks.push(loader.loadStyle(id));
								});

								lang.parallel(asyncTasks, function (err, styles) {
									info.styleSheets = styles;
									// callback with list of styles loaded
									callback(null, styles);
								});
							} else {
								// control has no style, callback with nothing
								callback();
							}
						},
						/**
						 * load all templates required by this control
						 * @param callback
						 */
							function load_templates (callback) {
							if (info.isTemplate) {
								asyncTasks = [];

								// load templates
								lang.each(info.templates, function (id) {
									asyncTasks.push(loader.loadTemplate(id));
								});

								lang.parallel(asyncTasks, function (err, templates) {
									info.html = templates;
									// callback with list of defined template html
									callback(null, templates);
								});
							} else {
								// control has not templates, callback with nothing
								callback();
							}
						}
					],
					function (err, results) {
						// styles and templates have finished loading
						styles_templates_callback();
					});
				}
			],
				/**
				 * this control has loaded, if it is authorised then finalised, initialise, and show element
				 * @param err
				 * @param results
				 */
					function (err, results) {
					var loadData = {
						info: info,
						controller: results[0],
						authentication: results[1],
						styles: results[2],
						templates: results[3]
						},
						settings = Control.prototype.settings;

					if (info.isController && lang.isDefined(info.authentication)) {
						// authentication was refused
						info.element
							.attr('atom-load', false)
							.removeAttr('atom-init');

						atom.emit(info.element, ':loaded', info);

						// callback un-authenticated
						load_callback(loadData);
					} else {
						// prepare the element if it has not been loaded already
						if (!info.element.attr('atom-init')) {
							// remove multi-attributes and replace with single attributes to match styles easier
							info.element
								.removeAttr('atom-template-controller-style')
								.removeAttr('atom-template-controller')
								.removeAttr('atom-template-style')
								.removeAttr('atom-controller-style');
							if (info.isController) {
								info.element.attr('atom-controller', info.controllers.join(' '));
							}
							if (info.isTemplate) {
								info.element.attr('atom-template', info.templates.join(' '));
								// expand template html
								info.element.html($.parseHTML(info.html.join('')));
							}
							if (info.isStyle) {
								info.element.attr('atom-style', info.styles.join(' '));
							}

							if (lang.isDefined(info.controller)) {
								settings = loader.applySettings(info.controller, info.element);
							}

							// mark as loaded
							info.element
								.attr('atom-init', false)
								.removeAttr('atom-load');

							if (settings.hide === true) {
								info.element.hide();
							}
						}

						atom.emit(info.element, ':loaded', info);

						// callback load completed
						load_callback(loadData);
					}
				});
		},

		onInit: function (e, callback) {
			callback();
		},

		onShow: function (e, callback) {
			if (e.target.css('display') === 'none') {
				log.write('show', e.target);
				e.target.hide().fadeIn(500, callback);
			} else {
				callback();
			}
		},

		onHide: function (e, callback) {
			if (e.target.css('display') !== 'none') {
				log.write('hide', e.target);
				e.target.fadeOut(500, callback);
			} else {
				callback();
			}
		},

		onNavigate: function (e, callback) {
			if (e.target.is(':atom-control')) {
				// if this is a control, load then callback
				this.onLoad(e, function (loadData) {
					callback(loadData);
				});
			} else {
				// normal element, show it
				this.onShow(e, function () {
					callback();
				});
			}
		},

		onNavigated: function (e, navigationInfo) {

		}
	};

	return Control;
});