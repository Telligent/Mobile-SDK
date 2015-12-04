/* Transport
 * Internal API
 *
 * Handles making requests
 *
 *  // persists credentials in storage for native use
 *	transport.load: function(url, options)
 *    async: true
 *	transport.configure: function(options)
 *    isNative
 *    domain
 *	transport.isNative()
 *	transport.isLocal(url)
 *  transport.baseUrl()
 *  transport.absolutize(url)
 *  transport.adjustUrl(url) // adjusts a local Evo URL to a proxied remote URL
 *
 */
define('transport', ['storage'], function(storage, $, global, undef) {

	var nativeClient = false,
		nativeDomain,
		baseUrl,
		basePath;

	function isAbsolute(url) {
		return url.indexOf('http') === 0;
	}

	function normalizeBase(url) {
		url = url.indexOf(baseUrl) === 0 ? url.substr(baseUrl.length) : url;
		url = url.indexOf(basePath) === 0 ? url.substr(basePath.length) : url;
		if (url.indexOf('/') == 0)
			url = url.substr(1);
		return url;
	}

	function load(url, options) {
		options = options || {};
		url = normalizeBase(url);
		var request = {
			type: 'GET',
			url: baseUrl + url,
			cache: false,
			timeout: 60000,
			async: (options.async === undef ? true : options.async)
		};
		return $.ajax(request);
	}

	function determineBasePath() {
		if (baseUrl.lastIndexOf('/') != baseUrl.length - 1)
			baseUrl = baseUrl + '/';

		basePath = baseUrl.substring(8 + baseUrl.substring(8).lastIndexOf('/',
			baseUrl.length - 10))
	}

	return {
		load: function(url, options) {
			return load(url, (options || {}));
		},
		configure: function(options) {
			nativeClient = options.isNative || nativeClient;
			nativeDomain = options.domain || nativeDomain;
			baseUrl = options.baseUrl || baseUrl;
			determineBasePath();
			$.ajaxSetup({
				crossDomain: false
			});
		},
		isNative: function() {
			return nativeClient;
		},
		isLocal: function(url) {
			var normalized = normalizeBase(url);
			return !isAbsolute(normalized) && normalized.indexOf('rsw.ashx') != 0;
		},
		baseUrl: function() {
			return baseUrl;
		},
		absolutize: function(url) {
			var normalized = normalizeBase(url);
			return !isAbsolute(normalized) ? (baseUrl + normalized) : normalized;
		},
		adjustUrl: function(localUrl) {
			return load('callback.ashx?redirect=' + encodeURIComponent(localUrl));
		},
		getExternalUrl: function(url) {
			return $.Deferred(function(d) {
				var normalized = normalizeBase(url);
				if (!isAbsolute(normalized)) {
					if (normalized.indexOf('rsw.ashx/rscf_p/') == 0) {
						load('callback.ashx?redirect=' + encodeURIComponent(normalized.substr(normalized.indexOf('~/'))))
							.done(function(data) {
								d.resolve(data);
							})
							.fail(function() {
								d.reject();
							});
					} else {
						d.resolve(null);
					}
				} else {
					d.resolve(null);
				}
			}).promise();
		}
	};

}, jQuery, window);
