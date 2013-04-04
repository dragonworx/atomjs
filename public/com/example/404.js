define(function () {
	"use strict";

	return {
		bind: function (e) {
			this.on('click', this.scope('[data-dismiss=alert]'), this.onDismiss);
		},

		onInit: function (e, callback) {
			// read settings applied to element
			var settings = require('atom').data(e.target).settings;

			// replace text with navigation info
			e.target.find('strong').text('Not found: ' + settings.path);
			e.target.find('span').text(settings.url);
			callback();
		},

		onDismiss: function (e) {
			// close bootstrap alert
			e.target.closest(':atom-template').fadeOut(300, function () {
				$(this).remove();
			});
		}
	};
});