define('url', function($, global, undef) {

	var api = {
		parseQuery: function(queryString) {
			var parts = queryString.split('?'),
				raw = (parts.length > 1 ? parts[1] : queryString).split('#')[0],
				data = {},
				pairs = raw.split('&');

			for(var i = 0;  i< pairs.length; i++) {
				var pair = pairs[i].split('=');
				if(pair.length === 2) {
					data[pair[0]] = decodeURIComponent(pair[1].replace(/\+/gi,' '));
				}
			}

			return data;
		},
		serializeQuery: function(data) {
			data = data || {};
			var pairs = [];
			for(var key in data) {
				var value = data[key];
				pairs[pairs.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
			}
			return pairs.join('&');
		},
		modify: function(options) {
			var settings = $.extend({
					url: global.location.href,
					query: null,
					hash: global.location.hash,
					protocol: global.location.protocol,
					overrideQuery: false
				}, options),
				newUrlParts = [ settings.url.split('?')[0].split('#')[0] ],
				newQuery;

			// get the current query and update it with newly-passed query
			if(typeof settings.query === 'string') {
				settings.query = api.parseQuery(settings.query);
			}
			newQuery = settings.overrideQuery
				? api.serializeQuery(settings.query)
				: api.serializeQuery($.extend(api.parseQuery(settings.url), settings.query));
			if(newQuery && newQuery.length > 0) {
				newUrlParts[newUrlParts.length] = ('?' + newQuery);
			}

			// add in new or current hash
			if(settings.hash && settings.hash.length > 0) {
				newUrlParts[newUrlParts.length] = ((settings.hash.indexOf('#') !== 0 ? '#' : '') + settings.hash);
			}
			return newUrlParts.join('');
		},
		hashData: function(data, overrideCurrent) {
			if(typeof data === 'undefined') {
				data = {};
				var urlParts = global.location.href.split("#"),
					rejoinedParts = '';
				// firefox workaround
				if(urlParts.length > 2) {
					for(var i = 0; i < urlParts.length; i++) {
						if(i > 0) {
							if(i > 1) {
								rejoinedParts += '#';
							}
							rejoinedParts += urlParts[i];
						}
					}
					urlParts = [ urlParts[0], rejoinedParts ];
				}
				if(urlParts.length === 2) {
					data = api.parseQuery(urlParts[1]);
				}
				return data;
			} else {
				if(!overrideCurrent) {
					data = $.extend(api.hashData(), data);
				}
				global.location.href = global.location.href.split('#')[0] + '#' + api.serializeQuery(data);
			}
		}
	};

	return api;

}, jQuery, window);