/*
 * LruCache (Internal API)
 *
 * Statically-sized Persistent Least-Recently-Used Cache
 * Stores items in a cache, persisted locally bounded by a max size. When max size reached,
 * deletes items least-recently-read or set.
 *
 * options:
 *   size: // 10 default
 *   load: function() // defines how to return cache object from persistence
 *   persist: function(obj) // defiens how to persist cache object
 *
 * methods:
 *
 *   size()
 *   get(key)
 *   set(key, val)
 *   del(key)
 *
 */
define('lrucache', function($, undef){

	var defaults = {
		size: 10,
		load: function() { },
		persist: function(obj) { }
	};

	var LruCache = function(options) {
		var localStorageInstance;
		var context = $.extend({}, defaults, options || {
			load: function() {
				return localStorageInstance;
			},
			persist: function(obj) {
				localStorageInstance = obj;
			}
		});

		function getCache() {
			var cache = context.load();
			if(!cache) {
				cache = {};
				context.persist(cache);
			}
			return cache;
		}

		function persistCache(cache) {
			context.persist(cache);
		}

		return {
			size: function() {
				return context.size;
			},
			get: function(key) {
				// get the current cache from storage
				var cache = getCache();

				// if in cache, update its last access time, and return its value
				if(cache[key] !== undef) {
					cache[key].lastAccess = (new Date().getTime());
					persistCache(cache);
					return cache[key].value;
				// if not in cache, just return null
				} else {
					return null;
				}
			},
			set: function(key, value) {
				// get the current cache from storage
				var cache = getCache();

				// key already in cache, so update value and last access
				if(cache[key] !== undef) {

					cache[key].lastAccess = (new Date().getTime());
					cache[key].value = value;

				// not yet cached, so clean up cache if necessary and add new item
				} else {

					// if over the max size, evict least-recently-used item
					if(Object.keys(cache).length >= context.size) {
						var oldestKey = null;
						for(var cacheKey in cache) {
							if(oldestKey == null) {
								oldestKey = cacheKey;
							} else if(cache[cacheKey].lastAccess < cache[oldestKey].lastAccess) {
								oldestKey = cacheKey;
							}
						}
						if(oldestKey !== null) {
							delete cache[oldestKey];
						}
					}

					// set the new item
					cache[key] = {
						lastAccess: (new Date().getTime()),
						value: value
					};
				}

				// persist cache
				persistCache(cache);
			},
			del: function(key) {
				// get the current cache from storage
				var cache = getCache();

				delete cache[key];

				persistCache(cache);
			}
		}
	};

	return LruCache;

}, jQuery);