/*
 * Small utility functions
 * Internal API
 *
 * // only execute calls to the throttledFunction once every 500 ms...
 * var throttledFunction = util.throttle(fn, 500);
 *
 * // debounce calls to debouncedFunction to only be called after they've stopped occurring for 500+ ms
 * var debouncedFunc = util.debounce(fn, 500);
 *
 * // wrap a function with other behavior to occur before/after it runs
 * var wrappedFunc = util.wrap(fn, {
 *   before: function() { }	,
 *   after: function() { }
 * });
 *
 * // guid
 * var guid = util.guid();
 *
 */
define('util', function(global){

	function r4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	};

	return {
		throttle: function(fn, limit) {
			var lastRanAt, timeout;
			return function() {
				var scope = this
					attemptAt = (new Date().getTime()),
					args = arguments;
				if(lastRanAt && (lastRanAt + (limit || 50)) > attemptAt) {
					global.clearTimeout(timeout);
					timeout = global.setTimeout(function(){
						lastRanAt = attemptAt;
						fn.apply(scope, args);
					}, (limit || 50));
				} else {
					lastRanAt = attemptAt;
					fn.apply(scope, args);
				}
			};
		},
		debounce: function(fn, limit) {
			var bounceTimout;
			return function(){
				var scope = this,
					args = arguments;
				clearTimeout(bounceTimout);
				bounceTimout = setTimeout(function(){
					fn.apply(scope, args);
				}, limit || 10);
			}
		},
		wrap: function(fn, options) {
			return function () {
				try {
					if (options.before) {
						options.before.apply(this, arguments);
					}
				} catch (e) { }
				var response = fn.apply(this, arguments);
				try {
					if (options.after) {
						options.after.apply(this, arguments);
					}
				} catch (e) { }
				return response;
			};
		},
		guid: function() {
			return r4() + r4() + '-' + r4() + '-' + r4() + '-' + r4() + '-' + r4() + r4() + r4();
		}
	};

}, window);