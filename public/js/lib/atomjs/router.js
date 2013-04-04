define(['jquery', 'atomjs/lang', 'atomjs/dom', 'atomjs/log', 'atomjs/url', 'history'], function ($, lang, dom, log, Url, History) {
	"use strict";

	var router,
		exports,
		atom;

	router = {
		active: [],

		navigatePath: null,
		navigateCallback: null,

		init: function (_atom, init_callback) {
			var onComplete = function (err, results) {
					log.write('complete', 'atom.router.init');
					init_callback(null);
				};

			atom = _atom;

			log.write('start', 'atom.router.init');
			router.bindToPathClicks();
			router.bindToHistoryChange();

			router.navigate(window.location.href, null, onComplete);
		},

		bindToPathClicks: function () {
			atom.on('click', ':atom-path,:atom-path *', function (e) {
				var target = $(e.target),
					path = lang.bool(target.attr('atom-path')) === true ? null : target.attr('atom-path'),
					href = target.closest('[href]').attr('href'),
					newUrl = Url.parse(href),
					currentUrl = Url.parse(window.location.href);

				e.stopImmediatePropagation();
				e.preventDefault();

				router.navigatePath = path;

				if (newUrl.path() === currentUrl.path()) {
					router.navigate(path || newUrl.path());
				} else {
					History.pushState(null, null, href);
				}

			});
		},

		bindToHistoryChange: function () {
			History.Adapter.bind(window, 'statechange', function () {
				var state = History.getState();
				log.write('history change: ' + state.url);
				router.navigate(router.navigatePath || state.url, router.navigateTarget);
			});
		},

		getFrontRoute: function (rawUrl) {
			var siteRoot = new Url(atom.settings.siteRoot),
				url = new Url(rawUrl);

			return Url.parse(url.path().replace(siteRoot.path(), '/'));
		},

		location: function (rawUrl, callback) {
			router.navigateCallback = callback;
			History.pushState(null, null, rawUrl);
		},

		navigate: function (rawUrl, callback) {
			var frontRoute = router.getFrontRoute(rawUrl),
				index = -1,
				routeElement = dom.body,
				paths = frontRoute.paths(),
				loaded = [],
				is401 = false,
				is404 = false,
				isRouteEnd = false;

			router.navigatePath = null;
			if (lang.isUndefined(callback)) {
				callback = router.navigateCallback;
			}
			router.navigateCallback = null;

			log.write('navigate', rawUrl);

			atom.emit(null, ':navigateTo', {
				rawUrl: rawUrl,
				frontRoute: frontRoute,
				paths: paths
			});

			// hide existing paths
			lang.each(router.active, function (element, i) {
				if (element.attr('atom-route') !== paths[i]) {
					log.write('hide', element);
					element.hide();
				} else {
					log.write('keep', element);
				}
			});
			router.active = [];

			// highlight all route links
			router.activateRouteOnCss(frontRoute.path());

			lang.whilst(
				function () {
					// test
					// while not at end of path or path walk cancelled
					index = index + 1;
					return index < paths.length;
				},

				function (whilst_callback) {
					// step
					// take current path route element, emit activate (loaded ? (authenticate ? show : end path) : (load, authenticate ? show : end path))
					routeElement = routeElement.find(':atom-route(' + paths[index] + ')');

					if (routeElement.length > 0 ) {
						if (!routeElement.attr('atom-control')) {
							// give element default control behaviour if missing
							routeElement.attr('atom-control', 0);
						}

						// remove load attribute
						routeElement.removeAttr('atom-load');

						// fire navigate event on element
						atom.emit(routeElement, ':navigate', function (loadData) {
							loaded.push({route:paths[index], target:loadData});
							if (lang.bool(routeElement.attr('atom-route-end')) === true) {
								// route end
								isRouteEnd = true;
								whilst_callback(index);
							} else {
								// continue navigating
								if (loadData && lang.isDefined(loadData.authentication)) {
									// element denied authentication
									is401 = true;
									whilst_callback(index);
								} else {
									// element is ok to navigate
									routeElement.attr('atom-route-active', true);
									router.active.push(routeElement);
									whilst_callback(null);
								}
							}
						});
					} else {
						// route element cannot be found
						is404 = true;
						whilst_callback(index);
					}
				},

				function (err) {
					var asyncTasks = [],
						defaultRoute,
						onComplete,
						navigationInfo;

					onComplete = function () {
						log.write("complete", "navigate", "url:", rawUrl, err);
						// complete

						// for each control loaded and authenticated, initialise and show in parallel
						lang.each(loaded, function (loadData) {
							if (lang.isDefined(loadData) && lang.isDefined(loadData.target) && lang.isUndefined(loadData.target.authentication)) {
								asyncTasks.push(function (done_callback) {
									// call init, then show async
									if (lang.bool(loadData.target.info.element.attr('atom-init')) === true) {
										atom.emit(loadData.target.info.element, ':show', function () {
											// callback authenticated, initialised and shown
											done_callback();
										});
									} else {
										loadData.target.info.element.attr('atom-init', true);
										atom.emit(loadData.target.info.element, ':init', function () {
											atom.emit(loadData.target.info.element, ':show', function () {
												// callback authenticated, initialised and shown
												done_callback();
											});
										});
									}
								});
							}
						});

						// run all initialisation in parallel
						lang.parallel(asyncTasks, function (err2, results) {
							// highlight all route links
							router.activateRouteOnCss(frontRoute.path());

							navigationInfo = {
								rawUrl: rawUrl,
								frontRoute: frontRoute,
								paths: paths,
								index: is401 || isRouteEnd ? index : index - 1,
								loaded: loaded,
								is404: is404,
								is401: is401,
								isRouteEnd: isRouteEnd,
								params: isRouteEnd ? frontRoute.path().split('/').splice(index) : [],
								path: paths[paths.length - 1],
								authentication: is401 ? loaded[index].target.authentication : null
							};

							if (is404) {
								atom.emit(null, ':404', navigationInfo);
							} else {
								atom.emit(routeElement, ':navigated', navigationInfo);
							}

							if (typeof callback === 'function') {
								callback(err, loaded);
							}
						});
					};

					if (!is401 && !is404 && !isRouteEnd) {
						// navigation completed normally
						defaultRoute = routeElement.find(':atom-route-default(true)').eq(0);
					}

					if (defaultRoute && defaultRoute.length === 1) {
						// if navigation completed normally, look for a default route to navigate
						router.navigate(router.getElementRoute(defaultRoute), null, onComplete);
					} else {
						// otherwise complete navigation
						onComplete();
					}
				}
			);
		},

		activateRouteOnCss: function (path) {
			// highlight all route links
			var links = dom.body.find(':atom-route-on');

			lang.each(links, function (element) {
				var pattern = new RegExp(element.attr('atom-route-on'), 'i');
				if (path.match(pattern)) {
					element.addClass(element.attr('atom-class'));
				} else {
					element.removeClass(element.attr('atom-class'));
				}
			});
		},

		getElementRoute: function (_element) {
			var element = dom(_element),
				paths;
			paths = lang.map(element.parents(':atom-route'), function(e) {
				return e.attr('atom-route');
			});
			paths.reverse();
			if (element.is(':atom-route')) {
				paths.push(element.attr('atom-route'));
			}
			return paths.join('/').replace(/\/+/, '/');
		}
	};

	exports = {
		init: router.init,
		getElementRoute: router.getElementRoute,
		navigate: router.navigate,
		location: router.location
	};

	return exports;
});