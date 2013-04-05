define(['jquery', 'atomjs/lang', 'atomjs/url', 'atomjs/log'], function ($, lang, Url, log) {
	"use strict";

	jQuery.expr[':']['atom-control'] = function (element, stackIndex, args) {
		element = $(element);

		if (args[3]) {
			return element.attr('atom-control') === args[3] || element.is(':atom-template(' + args[3] + ')') || element.is(':atom-controller(' + args[3] + ')') || element.is(':atom-style(' + args[3] + ')');
		}

		return element.is(':atom-template') || element.is(':atom-controller') || element.is(':atom-style');
	};

	jQuery.expr[':']['atom-template'] = function (element, stackIndex, args) {
		if (args[3]) {
			return element.getAttribute('atom-template') === args[3]
				|| element.getAttribute('atom-template-controller') === args[3]
				|| element.getAttribute('atom-template-controller-style') === args[3]
				|| element.getAttribute('atom-template-style') === args[3];
		}
		return element.getAttribute('atom-template')
			|| element.getAttribute('atom-template-controller')
			|| element.getAttribute('atom-template-controller-style')
			|| element.getAttribute('atom-template-style');
	};

	jQuery.expr[':']['atom-controller'] = function (element, stackIndex, args) {
		if (args[3]) {
			return element.getAttribute('atom-controller') === args[3]
				|| element.getAttribute('atom-template-controller') === args[3]
				|| element.getAttribute('atom-template-controller-style') === args[3]
				|| element.getAttribute('atom-controller-style') === args[3];
		}
		return element.getAttribute('atom-controller')
			|| element.getAttribute('atom-template-controller')
			|| element.getAttribute('atom-template-controller-style')
			|| element.getAttribute('atom-controller-style');

	};

	jQuery.expr[':']['atom-style'] = function (element, stackIndex, args) {
		if (args[3]) {
			return element.getAttribute('atom-style') === args[3]
				|| element.getAttribute('atom-template-style') === args[3]
				|| element.getAttribute('atom-controller-style') === args[3]
				|| element.getAttribute('atom-template-controller-style') === args[3];
		}
		return element.getAttribute('atom-style')
			|| element.getAttribute('atom-template-style')
			|| element.getAttribute('atom-controller-style')
			|| element.getAttribute('atom-template-controller-style');

	};

	lang.each(['atom-id', 'atom-init', 'atom-load', 'atom-path', 'atom-route', 'atom-route-active', 'atom-route-default', 'atom-route-on', 'atom-route-end', 'atom-fragment'], function (selector) {
		jQuery.expr[':'][selector] = function (element, stackIndex, args) {
			return args[3] ? element.getAttribute(selector) === args[3] : $(element).is('[' + selector + ']');
		};
	});

	jQuery.fn.reversed = [].reverse;

	jQuery.fn.toJSON = function () {
		var self = $(this),
			str = "<" + self[0].nodeName.toLowerCase();

		if (self.attr('id')) {
			str = str + " id='" + self.attr('id') + "'";
		}

		if (self.attr('atom-route')) {
			str = str + " atom-route='" + self.attr('atom-route') + "'";
		}

		if (self.attr('atom-controller')) {
			str = str + " atom-controller='" + self.attr('atom-controller') + "'";
		}

		str = str + '>';

		return str;
	};

	function dom(element) {
		return element instanceof jQuery ? element : jQuery(element);
	}


	dom.outerHTML = function (element) {
		element = $(element);
		return element.clone().wrap('<p>').parent().html();
	};

	dom.find = function (container, selector) {
		container = $(container);

		var results = $(container).find(selector);

		if (container.is(selector)) {
			results = results.add(container);
		}

		return results;
	};

	dom.on = function (eventType, selector, callback, bubbles, silent) {
		var self = this;
		if (silent !== true) {
			log.write('bind', eventType, 'scope:', selector, bubbles === true ? 'sub' : 'local');
		}

		if (typeof callback !== 'function') {
			throw new Error('cannot bind event ' + eventType + ' to callback of type ' + typeof(callback));
		}

		dom.body.on(eventType, selector, function (e) {
			e.target = $(e.target);
			e.currentTarget = $(e.currentTarget);

			if (bubbles === true) {
				// capture event fired on sub element
				log.write('catch', eventType, 'scope:', selector, 'target:', e.target, 'currentTarget:', e.currentTarget);
				callback.apply(self, arguments);
			} else {
				// capture event when fired on element
				if (e.target[0] === e.currentTarget[0]) {
					log.write('catch', eventType, 'scope:', selector, 'target:', e.target);
					callback.apply(self, arguments);
				}
			}
		});

		return dom;
	};

	dom.toString = function (element) {
		return element.toJSON();
	};

	dom.parse = function (html) {
		return dom($.parseHTML(html)[0]);
	};

	dom.body = $(document.body);

	return dom;
});