define(function () {
	"use strict";

	return {
		bind: function () {
			this.on('submit', this.scope('form'), this.onSubmit);
		},

		onSubmit: function (e) {
			window.allowAdmin = true;
			setTimeout(function () {
				// async code, would be replaced with call to server in real life
				require('atom').router.location('/admin');
			}, 100);
			e.preventDefault();
		}
	};
});