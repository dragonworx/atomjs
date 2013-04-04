define(function () {
	var buffer = [],
		startTime = (new Date()).getTime(),
		exports,
		log;

	log = {
		write: function() {
			var info,
				values = [],
				value,
				i,
				l = arguments.length,
				atom = require('atom');

			if (arguments.length < 1) {
				throw new Error('log called without arguments');
			}

			for (i = 1; i < l; i = i + 1) {
				value = JSON.stringify(arguments[i]);
				if ((typeof arguments[i] === 'string') && arguments[i].match(/^[a-z0-9\-_.]+:$/i)) {
					value = value
						.replace(/^"/, '')
						.replace(/"$/, '');
				}
				values.push(value);
			}

			info = {
				time: (new Date()).getTime(),
				category: arguments[0],
				output: values
			};

			buffer.push(info);

			if (buffer.length > atom.settings.logLimit) {
				buffer.shift();
			}

			if (atom.settings.logEnabled === true && atom.settings.log === null && console && typeof console.log === "function") {
				console.log(log.formatElapsed(info.time) + ' [' + info.category + ':]', info.output.join(', ').replace(/:, /g, ': '));
			}
		},

		formatTime: function (ms) {
			var str;
			if (ms <= 1000) {
				str = ms + 'ms';
			} else if (ms >=1000 && ms <= 1000 * 60) {
				ms = ms / 1000;
				str = Math.round(ms * 100) / 100 + 's';
			} else {
				ms = ms / 1000 / 60;
				str = Math.round(ms * 100) / 100 + 'm';
			}
			return str;
		},

		formatElapsed: function (ms) {
			var elapsed = log.formatTime(ms - startTime);
			return log.pad(elapsed, 6);
		},

		pad: function(txt, l) {
			txt = txt.toString();
			while (txt.length < l) {
				txt = txt + ' ';
			}
			return txt;
		}
	};

	exports = {
		init: log.init,
		write: log.write,
		formatElapsed: log.formatElapsed
	};

	return exports;
});