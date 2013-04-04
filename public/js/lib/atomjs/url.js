define(['atomjs/lang'], function (lang) {
	"use strict";

	function Url (raw, base) {
		var temp;

		if (raw instanceof Url) {
			return raw;
		}

		if (typeof raw !== 'string' && raw !== undefined) {
			throw new Error('Invalid url: ' + raw);
		}

		raw = raw || window.location.href;

		this.original = raw;

		if (lang.isDefined(base)) {
			temp = new Url(base);
			this.original = temp.fullhost() + temp.pathname() + '/' + raw;
		}
	}

	Url.stringify = function(raw, base) {
		return (new Url(raw, base)).toString();
	};

	Url.parse = function(raw, base) {
		return new Url(raw, base);
	};

	var regex = {
		leadslash: /^\//,
		trailslash: /\/$/,
		multislash: /\/+/,
		protocol: /^([a-z]+):\/\//i,
		hostname: /^(?!\/)([a-z0-9_\-]+\.)+[a-z0-9_\-]+|^[a-z]+:\/\/([a-z0-9_\-]+\.)+[a-z0-9_\-]+|localhost/i,
		port: /:([0-9]+)/,
		file: /[a-z0-9_\-]+\.[a-z0-9_\-]+/i,
		extension: /\.(.+)/i,
		query: /\?([^#]+)/,
		hash: /#(.*)$/i
	};

	window.regex = regex;

	Url.prototype = {
		/**
		 * @param {boolean=} withFormatting
		 * @returns {string|Url}
		 */
		protocol: function (withFormatting) {
			var protocol;

			if (typeof withFormatting === 'string') {
				return new Url(this.original.replace(regex.protocol, withFormatting));
			}

			protocol = this.original.match(regex.protocol);
			protocol = protocol ? protocol[1] : window.location.protocol.replace(/:/, '');

			return withFormatting ? protocol + '://' : protocol;
		},

		/**
		 * @param {boolean=} withFormatting
		 * @returns {string|Url}
		 */
		port: function (withFormatting) {
			var port;

			if (typeof withFormatting === 'number' || typeof withFormatting === 'string') {
				return new Url(this.toString().replace(regex.port, ':' + withFormatting.toString().replace(':', '')));
			}

			port = this.original.match(regex.port);
			port = port ? parseFloat(port[1]) : parseFloat(window.location.port);

			return withFormatting ? ':' + port : port;
		},

		hostname: function (replace) {
			var hostname;

			if (typeof replace === 'string') {
				hostname = this.protocol(true);
				return new Url(this.toString().replace(regex.hostname, hostname + replace));
			}

			hostname = this.original.match(regex.hostname);
			hostname = hostname ? hostname[0].replace(regex.protocol, '') : window.location.hostname;

			return hostname;
		},

		host: function () {
			return this.hostname() + this.port(true);
		},

		fullhost: function () {
			return this.protocol(true) + this.host();
		},

		path: function (replace) {
			var path;

			if (lang.isDefined(replace)) {
				if (typeof replace === 'string') {
					return new Url(this.toString().replace(this.path(), replace));
				}
			}

			path = this.original
				.replace(regex.port, '')
				.replace(regex.hostname, '')
				.replace(regex.protocol, '')
				.replace(regex.query, '')
				.replace(regex.hash, '')
				.replace(regex.leadslash, '');

			if (replace === true) {
				return path + this.query(true) + this.hash(true);
			}

			return '/' + path;
		},

		paths: function () {
			var path = this.path()
				.replace(this.file(), '')
				.replace(regex.trailslash, '');

			path = path.split('/');
			path[0] = '/';
			return path;
		},

		file: function (replace) {
			var file;

			if (lang.isDefined(replace)) {
				file = this.toString().match(this.file());

				return new Url(file
					? this.toString().replace(this.file(), replace)
					: this.toString().replace(this.pathname(), this.pathname() + '/' + replace));
			}

			file = this.path().match(regex.file);

			return file ? file[0] : null;
		},

		pathname: function (replace) {
			var dir = this.path()
				.replace(this.file(), '')
				.replace(regex.leadslash, '')
				.replace(regex.trailslash, '');

			if (lang.isDefined(replace)) {
				return new Url(this.toString().replace(dir, replace));
			}

			return '/' + dir;
		},

		/**
		 * @param {boolean=} withFormatting
		 * @returns {string}
		 */
		extension: function (withFormatting) {
			var file = this.file(),
				ext;

			if (file) {
				ext = file.match(regex.extension);
				return ext ? (withFormatting ? '.' + ext[1] : ext[1]) : null;
			}

			return null;
		},

		isDocument: function() {
			return this.file !== null;
		},

		/**
		 * @param {boolean=} withFormatting
		 * @returns {string|Url}
		 */
		query: function (withFormatting) {
			var query;

			if (typeof withFormatting === 'string') {
				query = this.original.match(regex.query);
				return new Url(query
					? this.original.replace(regex.query, withFormatting)
					: this.original.replace(this.path(), this.path() + withFormatting));
			}

			query = this.original.match(regex.query);

			return query ? (withFormatting ? '?' + query[1] : query[1]) : (withFormatting ? '' : null);
		},

		params: function() {
			var query = this.query(),
				params = {},
				values;

			if (query) {
				lang.each(query.split('&'), function(pair) {
					values = pair.split('=');
					params[values[0]] = values[1];
				});
			}

			return params;
		},

		/**
		 * @param {boolean=} withFormatting
		 * @returns {string|Url}
		 */
		hash: function (withFormatting) {
			var hash;

			if (typeof withFormatting === 'string') {
				hash = this.toString().match(regex.hash);

				return new Url(hash
					? this.toString().replace(regex.hash, withFormatting)
					: this.toString() + withFormatting);
			}

			hash = this.original.match(regex.hash);

			return hash ? (withFormatting ? '#' + hash[1] : hash[1]) : (withFormatting ? '' : null);
		},

		isRelative: function () {
			var url = this.original
				.replace(regex.protocol, '')
				.replace(regex.hostname, '')
				.replace(regex.port, '');
			return url === this.original && this.original.charAt(0) !== '/';
		},

		isAbsolute: function () {
			return !this.isRelative();
		},

		relativePath: function () {
			return this.path().replace(/^\//, '');
		},

		toIdentifier: function() {
			return this.path().replace(regex.leadslash, '').replace(regex.extension, '').replace(/\//g, '.');
		},

		equals: function (url) {
			return this.toString().toLowerCase() === url.toString().toLowerCase();
		},

		toString: function () {
			return this.protocol(true) + this.host() + this.path() + this.query(true) + this.hash(true);
		}
	};

	return Url;
});