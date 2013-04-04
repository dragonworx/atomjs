define(function () {
	"use strict";

	return {
		bind: function () {
			this.on('click', '#signout', this.onClick);
		},

		authenticate: function (element, callback) {
			// return false to deny authentication
			setTimeout(function () {
				// async code, would be a call to a server in real life
				if (window.allowAdmin === true) {
					callback();
				} else {
					callback(false);
				}
			}, 100);
		},

		onClick: function (e) {
			window.allowAdmin = false;
			setTimeout(function () {
				// async code, would be a call to a server in real life
				require('atom').router.location('/');
			}, 100);
		},

		onNavigated: function (e, navigationInfo) {
			if (navigationInfo.is401) {
				require('atom').location('/login');
			}
		}
	};
});