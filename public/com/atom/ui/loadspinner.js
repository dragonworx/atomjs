define(function () {
	"use strict";

	return {
		settings: {
			src: null,
			loading: false
		},

		bind: function () {
			// catch any loading events from any children
			this.onWithin(':loading', this.onLoading);
			this.onWithin(':loaded', this.onLoaded);
		},

		onInit: function (e, callback) {
			// sent when the control is first created, add the loader to the element
			var settings = require('atom').data(e.currentTarget).settings;
			e.target.append($('<img src="' + settings.src + '" class="loader" style="display:none"/>'));
			callback();
		},

		onLoading: function (e, elementInfo) {
			// don't response to own events, or already loaded elements
			if (elementInfo.className === this.__className || elementInfo.isLoaded) {
				return;
			}

			// use the settings on the element to control a show/hide state
			var settings = require('atom').data(e.currentTarget).settings;
			if (settings.loading === false) {
				settings.loading = true;
				require('atom').log('info', 'load spinner show');
				e.currentTarget.find('.loader').show();
			}
		},

		onLoaded: function (e, elementInfo) {
			// don't response to own events
			if (elementInfo.className === this.__className) {
				return;
			}

			var settings = require('atom').data(e.currentTarget).settings;
			if (settings.loading === true) {
				require('atom').log('info', 'load spinner hide');
				e.currentTarget.find('.loader').fadeOut(300, function () {
					settings.loading = false;
				});
			}
		}
	};
});