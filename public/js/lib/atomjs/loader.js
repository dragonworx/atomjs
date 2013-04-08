define(['atomjs/lang', 'atomjs/dom', 'atomjs/log', 'atomjs/control', 'atomjs/url'], function (lang, dom, log, Control, Url) {
	"use strict";

	var loader,
		exports,
		classId = 0,
		atom;

	function nextId() {
		classId = classId + 1;
		return classId;
	}

	loader = {
		cache: {
			templates: {},
			controllers: {},
			classes: {}
		},

		fragments: {},

		init: function (_atom, init_callback) {
			var TemplateController;

			atom = _atom;

			log.write('start', 'atom.loader.init');

			// give Control class access to private loader functionality
			Control.loader(loader);

			// create default template controller class and bind events
			TemplateController = new Control();
			TemplateController.__bind();

			// load document body by default
			dom.ready(function () {
				loader.load(dom.body, function (err, results) {
					log.write('complete', 'atom.loader.init');
					init_callback(null, results);
				});
			});
		},

		load: function (container, load_callback) {
			var controls,
				loadDepth = 0,
				asyncTasks,
				loaded = [];

			container = dom(container);

			if (container.is(':atom-control') && lang.bool(container.attr('atom-init')) === true) {
				if (typeof load_callback === 'function') {
					load_callback(null, [container]);
				}
				return;
			}

			container.removeAttr('atom-load');

			log.write('start', 'load:', container);

			lang.whilst(
				function () {
					// test
					controls = loader.findControls(container, true);
					return controls.length > 0;
				},

				function (do_while_callback) {
					asyncTasks = [];

					// safe guard against bad load conditions looping forever
					loadDepth = loadDepth + 1;
					if (loadDepth > atom.settings.loadDepthLimit) {
						throw new Error('Maximum load depth limit reached, check load conditions');
					}

					lang.each(controls, function (element) {
						// give element basic template functionality (controllers will override class type if present)
						element.attr('atom-control', 0);

						// create a task to load the element
						asyncTasks.push(function load_element (callback) {
							atom.emit(element, ':load', function (results) {
								callback(null, results);
							});
						});
					});


					// load all elements in parallel
					lang.parallel(asyncTasks, function (err, results) {
						// elements from current iteration done
						lang.each(results, function (info) {
							loaded.push(info);
						});

						// callback whilst iteration done
						do_while_callback();
					});
				},

				function (err) {
					// all loading done
					asyncTasks = [];

					log.write('complete', 'load:', loaded.length);

					// for each control loaded and authenticated, initialise and show in parallel
					lang.each(loaded, function (loadData) {
						if (lang.isUndefined(loadData.authentication)) {
							asyncTasks.push(function (callback) {
								// call init, then show async
								if (lang.bool(loadData.info.element.attr('atom-init')) === true) {
									atom.emit(loadData.info.element, ':show', function () {
										// callback authenticated, initialised and shown
										callback();
									});
								} else {
									loadData.info.element.attr('atom-init', true);
									atom.emit(loadData.info.element, ':init', function () {
										atom.emit(loadData.info.element, ':show', function () {
											// callback authenticated, initialised and shown
											callback();
										});
									});
								}
							});
						}
					});

					// run all initialisation in parallel
					lang.parallel(asyncTasks, function (err, results) {
						if (typeof load_callback === 'function') {
							load_callback(null, loaded);
						}
					});
				}
			);
		},

		isControllerCached: function (className) {
			return lang.isDefined(loader.cache.controllers[className]);
		},

		isTemplateCached: function (id) {
			return lang.isDefined(loader.cache.templates[id]);
		},

		isStyleCached: function (id) {
			return lang.isDefined(loader.cache.styles[id]);
		},

		findControls: function (container, onlyLoadable) {
			var elements = dom.find(container, ':atom-control'),
				controls = [];

			lang.each(elements, function loadControlElement (element) {
				if (onlyLoadable === true && (lang.isDefined(element.attr('atom-init')) || element.is(':atom-load(false)') || element.parents(':atom-load(false)').length > 0)) {
					return;
				}
				element[0].info = loader.getElementInfo(element);
				controls.push(element);
			});

			return controls;
		},

		loadController: function (id) {
			var func = function (callback) {
				var url = loader.idToUrl(id, 'js'),
					controllerUrl = atom.settings.siteRoot + url.relativePath();

				if (lang.hasKey(loader.cache.controllers, id)) {
					// controller has already been loaded, return cached copy
					log.write('cached', url);
					callback(null, loader.cache.controllers[id]);
				} else {
					// controller needs to be loaded
					log.write('request.controller', controllerUrl);

					require([controllerUrl], function (mod) {
						if (lang.isUndefined(mod)) {
							throw new Error('404 require(["' + controllerUrl + '"]) === undefined (check file exists)');
						}

						log.write('response.controller', controllerUrl);

						loader.cache.controllers[id] = mod;
						mod.id = id;

						callback(null, mod);
					});
				}
			};

			func.id = id;
			return func;
		},

		loadTemplate: function(id) {
			return function(callback) {
				var url = loader.idToUrl(id, 'html'),
					templateUrl = 'text!' + atom.settings.siteRoot + url.relativePath();

				if (lang.hasKey(loader.cache.templates, id)) {
					// template has already been loaded, return cached copy
					log.write('cached', url);
					callback(null, loader.cache.templates[id]);
				} else {
					log.write('request.template', templateUrl);

					require([templateUrl], function (html) {
						if (html.indexOf('atom-bootstrap="true"') > -1) {
							throw new Error('404 require(["' + templateUrl + '"]) === undefined (check file exists)');
						}

						log.write('response.template', templateUrl);

						// rename relative paths to follow site root settings
						html = html
							.replace(/(src\s*=\s*["'])(?!\/)/gi, '$1' + atom.settings.siteRoot)
							.replace(/(href\s*=\s*["'])(?!\/)/gi, '$1' + atom.settings.siteRoot);

						loader.cache.templates[id] =  html;

						callback(null, html);
					});
				}
			};
		},

		loadStyle: function(id) {
			return function(callback) {
				var url = loader.idToUrl(id, 'css'),
					styleUrl = 'text!' + atom.settings.siteRoot + url.relativePath();

				if (lang.hasKey(loader.cache.styles, id)) {
					// style has already been loaded, return cached copy
					log.write('cached', url);
					callback(null);
				} else {
					log.write('request.style', styleUrl);

					require([styleUrl], function (cssText) {
						if (cssText.indexOf('atom-bootstrap="true"') > -1) {
							throw new Error('404 require(["' + styleUrl + '"]) === undefined (check file exists)');
						}

						log.write('response.style', styleUrl);

						// rename relative paths to follow site root settings
						cssText = cssText.replace(/url\(/gi, 'url(' + (atom.settings.siteRoot + '/').replace(/\/+/g, '/'));

						loader.createStyleSheet(atom.settings.siteRoot + url.path(), cssText);

						loader.cache.styles[id] =  cssText;

						callback(null, cssText);
					});
				}
			};
		},

		createStyleSheet: function (url, cssDefinitionText) {
			var element = document.createElement('style'),
				head,
				text;

			element.setAttribute("type", "text/css");
			element.setAttribute('src', url);
			head = document.getElementsByTagName('head')[0];
			head.appendChild(element);

			if (element.styleSheet) {
				// IE set css text
				element.styleSheet.cssText = cssDefinitionText;
			} else {
				// everyone else set css text
				text = document.createTextNode(cssDefinitionText);
				element.appendChild(text);
			}
		},

		createController: function (className, modules) {
			// create a new control base and mix in classes functionality
			var control = new Control();

			log.write('create', className, 'classes:', modules.length);

			// update classes used by controller
			control.__classes = modules;
			control.__id = nextId();
			control.__className = className;

			// store controller in cache
			loader.cache.classes[className] = control;

			lang.each(modules, function (mod) {
				// iterate through controller module keys and copy to control instance
				lang.each(mod, function (propValue, propName) {
					if (lang.contains(propName, Control.allowOverrideProperties)) {
						control[propName] = propValue;
					} else {
						if (lang.isDefined(control[propName]) && lang.contains(propName, Control.rejectOverrideProperties)) {
							throw new Error(className + ' cannot override existing Controller property ' + propName);
						} else {
							// override controller base prototype
							control[propName] = propValue;
						}
					}
				});
			});

			// built-in binding
			control.__bind();

			// user custom binding
			if (lang.isDefined(control.bind)) {
				control.bind();
			}

			log.write("create", className);

			return control;
		},

		getElementIdentifiers: function (element) {
			element = $(element);

			var template = element.attr('atom-template'),
				templateController = element.attr('atom-template-controller'),
				templateStyle = element.attr('atom-template-style'),
				templateControllerStyle = element.attr('atom-template-controller-style'),
				controller = element.attr('atom-controller'),
				controllerStyle = element.attr('atom-controller-style'),
				style = element.attr('atom-style'),
				paths = {
					template: template || templateController || templateStyle || templateControllerStyle,
					controller: controller || templateController || controllerStyle || templateControllerStyle,
					style: style || templateStyle || controllerStyle || templateStyle || controllerStyle || templateControllerStyle
				},
				atom = require('atom');

			return paths;
		},

		idToUrl: function (id, extension) {
			return new Url(id.replace(/\./g, '/') + '.' + extension);
		},

		getElementInfo: function (element) {
			element = $(element);

			var info = {};

			info.ids = loader.getElementIdentifiers(element);
			info.isTemplate = lang.isDefined(info.ids.template);
			info.isController = lang.isDefined(info.ids.controller);
			info.isStyle = lang.isDefined(info.ids.style);
			info.templates = info.ids.template ? info.ids.template.split(' ') : [];
			info.controllers = info.ids.controller ? info.ids.controller.split(' ') : [];
			info.className = info.controllers.join('/');
			info.controller = loader.cache.classes[info.className];
			info.styles = info.ids.style ? info.ids.style.split(' ') : [];
			info.id = element.attr('id');
			info.style = element.attr('style');
			info.element = element;
			info.isLoaded = info.isController ? loader.isControllerCached(info.className) : lang.bool(element.attr('atom-init')) === true;

			return info;
		},

		fragment: function (fragmentId, element) {
			var fragment = loader.fragments[fragmentId];

			if (element) {
				loader.fragments[fragmentId] = loader.xmlToHtml(element).replace(/>\s+</g, '><');
				log.write('fragment', fragmentId);
				return loader.fragments[fragmentId];
			}
			if (!fragment) {
				throw new Error('fragment[' + fragmentId + '] NOT_FOUND');
			}

			return fragment;
		},

		getElementAttributes: function(element) {
			var i,
				attrs,
				attr,
				l,
				_element,
				attributes = {};

			_element = $(element);
			for (i = 0, attrs = _element[0].attributes, l = attrs.length; i < l; i = i + 1) {
				attr = attrs.item(i);
				attributes[attr.nodeName] = attr.nodeValue;
			}
			return attributes;
		},

		applyControllerSettings: function (controller, element) {
			var controllerDefaultSettings,
				elementSettings,
				settings;
			controllerDefaultSettings = controller.settings ?  $.extend(true, {}, controller.settings) : {};
			elementSettings = loader.readElementSettings(element);
			settings = $.extend(true, controllerDefaultSettings, elementSettings);
			loader.validateSettings(controller, settings);
			atom.data(element).settings = settings;
			return settings;
		},

		readElementSettings: function (element) {
			var settings = {},
				settingsWalker,
				attributes = this.getElementAttributes(element),
				attribValue,
				settingsKeys,
				key,
				l,
				i;

			lang.each(attributes, function (val, attribName) {
				if (attribName.indexOf('atom-set-') === 0) {
					try {
						attribValue = JSON.parse(attributes[attribName]);
						settingsKeys = attribName.replace(/atom-set-/, '').split('-');
						settingsWalker = settings;
						l = settingsKeys.length;
						for (i = 0; i < l - 1; i = i + 1) {
							key = settingsKeys[i];
							if (!settingsWalker[key]) {
								settingsWalker[key] = {};
							}
							settingsWalker = settingsWalker[key];
						}
						settingsWalker[settingsKeys[settingsKeys.length - 1]] = attribValue;
					} catch (e) {
						settings[attribName.replace(/atom-set-/, '')] = attributes[attribName];
					}
				}
			});
			return settings;
		},

		validateSettings: function (controller, settings) {
			var result = true;

			function validateSettingsRecursive(settings) {
				lang.each(settings, function (value, key) {
					if (lang.isUndefined(value)) {
						result = false;
						throw new Error(controller.id + ' has requires setting: ' + key);
					} else {
						if (typeof value === 'object') {
							validateSettingsRecursive(value);
						}
					}
				});
			}
			validateSettingsRecursive(settings);
			return result;
		},
		xmlToHtml: function (xml) {
			//IE
			if (window.ActiveXObject){
				return xml.xml;
			}
			// code for Mozilla, Firefox, Opera, etc.
			return (new XMLSerializer()).serializeToString(xml[0]);
		}
	};

	exports = {
		fragments: loader.fragments,
		init: loader.init,
		load: loader.load,
		getElementPath: loader.getElementPath,
		idToUrl: loader.idToUrl,
		getElementIdentifiers: loader.getElementIdentifiers,
		getElementInfo: loader.getElementInfo,
		getElementAttributes: loader.getElementAttributes,
		fragment: loader.fragment,
		readElementSettings: loader.readElementSettings,
		isControllerCached: loader.isControllerCached,
		isTemplateCached: loader.isTemplateCached,
		isStyleCached: loader.isStyleCached,
		xmlToHtml: loader.xmlToHtml
	};

	return exports;
});