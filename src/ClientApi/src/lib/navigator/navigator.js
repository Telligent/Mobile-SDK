/*
 * Navigator (Internal API)
 *
 * Coordinates navigation with the history stack, back button/URL modifications, and requests for new pages
 * The UI can tell the navigator to move somewhere, and the navigator makes sure it
 * occurs via a bookmarkable change in URL hash
 * Looks for any previously requested content in the history to know if this represents a directional change
 * Otherwise loads URL via the transport
 * Ultimately reports back to UI with retireved content and the effective navigation direction this represents
 * Additionally, back in the browser also end up flowing through this navigator back to the UI
 *
 * Constructor options
 *
 *   defaultUrl: '/'
 *     Default URL to request when there isn't a current one
 *   onDetermineRedirect
 *     function passed url
 *     Just used to notify client code of a redirect determination in progress
 *   onDeterminedRedirect
 *     Just used to notify client code of a redirect having been determined
 *   onLoad
 *     function passed url
 *     Implementation of requesting a URL. Returns a promise
 *   onLoadError
 *     function passed error result of requesting a URL
 *   onNavigated
 *     function passed url, content, and direction
 *     Implementation of what to do once content has been retrieved (or pulled from history)
 *   onMessage
 *     function passed message, class
 *     Implementation of what to do with an (error) message
 *   initFromStorage (default false)
 *     When true, first looks in storage for the URL to init from, ignoring the current hash
 *     Used for native and home screen app
 *   cacheDuration (default 600000 - 10 minutes)
 *
 * Methods
 *   reset()
 *     navigates to default url and clears the stack
 *   navigateTo(url, options)
 *     adjusts querystring, triggering either a load of page or pull from stack
 * 	   options:
 *       replace: is an optional boolean - when true, doesn't attempt to determine direction/animate in
 * 		 currentContentScrollTop: scroll top position of current page to persist for content
 *       refresh: refreshes any existing cache for the url
 *   navigateBack(options)
 *     adjusts querystring with previous url
 *     options:
 * 		 currentContentScrollTop: scroll top position of current page to persist for content
 *   refresh(options)
 *     refreshes current page
 *     options: extra keys/value pairs to include in the URL's query string
 *       will only be used for the next refresh request, but not stored
 *   canNavigateBack()
 *     returns whether there's a previous history item
 *   clearContent(url)
 *     clears the currently-cached content for current page or explicit url to force a refresh on next load or navigation back to it
 *   setExpiration(date, [url])
 *     sets the (custom) expirate date for a page in stack. defaults to curent if url not provided
 *   excludeFromHistory()
 *     excludes current url from stack (marking it for exclusion)
 */
define('navigator',
	['navigationStack', 'transport', 'util', 'url', 'messaging', 'environment', 'lrucache', 'storage'],
	function(NavigationStack, transport, util, url, messaging, environment, LruCache, storage, $, global, undef)
{
	var urlHashKey = '__u',
		resetValue = '__reset',
		reset = false,
		hasChildBrowser = false,
		replaceContentWithoutAnimation = false,
		directions = {
			back: 'back',
			forward: 'forward',
			none: null
		};

	function handleEvents(context) {
		// when the hash changes, possibly do something about it
		$(window).on('hashchange', function(e) {
			var navigatedToUrl = url.hashData()[urlHashKey];
			var current = context.stack.getCurrent();

			// if this represented a legitimate change to the current URL...
			if(navigatedToUrl && navigatedToUrl != resetValue &&  (!current || navigatedToUrl !== current.url)) {
				if(reset){
					reset = false;
					return;
				}
				// if can nav back to this url, then do so
				var page = context.stack.peekBack(navigatedToUrl);
				if(page != null) {
					// if the page was excluded and it's not the URL we're moving to, move back again
					if (page.exclude) {
						page = context.stack.moveBack(navigatedToUrl);
						var prevUrl = context.stack.canMoveBack();
						if (prevUrl) {
							adjustHashData(prevUrl);
						}
					// otherwise, only move once
					} else {
						page = context.stack.moveBack(navigatedToUrl);
						var previousContent = page.getContent();
						// if previous content was cleared or not existent, reload
						if(!previousContent) {
							replaceContentWithoutAnimation = false;
							loadAndShowUrlViaTransportWithDirection(context, page.url, directions.back);
						} else {
							if(context.onLoadFromCache)
								context.onLoadFromCache(page.url);
							renderContent(context, page.url, previousContent, directions.back, page.scrollTop);
						}
						return;
					}
				}
				// if instructed to replace current, just do that
				if(replaceContentWithoutAnimation) {
					replaceContentWithoutAnimation = false;
					loadAndShowUrlViaTransportWithDirection(context, navigatedToUrl, directions.none);
					return;
				}
				// otherwise, load the url - use a direction of forward if there is a current url, otherwise no direction
				var direction = (current && current.url != null && current.url != undef)
					? directions.forward
					: directions.none;
				loadAndShowUrlViaTransportWithDirection(context, navigatedToUrl, direction);
			}
		});
	}

	function adjustHashData(toUrl) {
		var data = {};
		data[urlHashKey] = toUrl;
		url.hashData(data);
	}

	function renderContent(context, url, content, direction, scrollTop) {
		// clear any content-scoped messaging subscriptions before changing content
		messaging.clear(messaging.CONTENT_SCOPE);
		context.onNavigated(url, content, direction, scrollTop);
	}

	function loadAndShowUrlViaTransportWithDirection(context, urlToLoad, direction) {
		if(urlToLoad.indexOf('#') > 0)
			urlToLoad = urlToLoad.split('#')[0];
		context.currentlyLoading = urlToLoad;
		context.onLoad(urlToLoad)
			.done(function(content){
				// avoid race conditions of parallel loading - only render the last one requested
				if(context.currentlyLoading != urlToLoad) {
					return;
				}

				if(urlToLoad.indexOf('#') > 0) {
					urlToLoad = urlToLoad.split('#')[0];
				}
				// if there were refresh params used in this previous request
				// remove them from the URL before storing it
				// as these should be temporary
				if(context.refreshParams) {
					var queryString = url.parseQuery(urlToLoad);
					for(var key in queryString) {
						// if this key in the querystring was part of the refresh params, remove it
						if(context.refreshParams[key] != undef) {
							delete queryString[key];
						}
					}
					urlToLoad = url.modify({ url: urlToLoad, query: queryString, overrideQuery: true });
				}
				if(urlToLoad.indexOf('#') > 0) {
					urlToLoad = urlToLoad.split('#')[0];
				}
				// then put its result in the stack
				var current = context.stack.getCurrent();
				if(current && current.url == urlToLoad) {
					// if this is the current URL, replace it in the stack
					context.stack.replaceCurrent(urlToLoad, content);
				} else {
					// otherwise push it onto the stack
					context.stack.push(urlToLoad, content);
				}
				current = context.stack.getCurrent();
				// and tell the UI about our successful navigation
				renderContent(context, urlToLoad, content, direction, (current ? current.scrollTop : 0));
			})
			.fail(function(ex){
				if(context.onLoadError)
					context.onLoadError(ex);
			});
	}

	function init(context) {
		// first try to look for a current url in the hash
		var currentUrl = url.hashData()[urlHashKey];
		if(currentUrl && !context.initFromStorage) {
			// if there was a current url, ajax request it
			loadAndShowUrlViaTransportWithDirection(context, currentUrl, directions.none);
		} else {
			// otherwise, try looking in the stored history stack for a current URL
			// (or if it was instructed to start from storage)
			var current = context.stack.getCurrent();
			if(current && current.url) {
				// if there's a current stored page in the stack, show it
				adjustHashData(current.url);
				var content = current.getContent();
				// if content was cleared, expired, or not existent, then reload it
				if(!content) {
					loadAndShowUrlViaTransportWithDirection(context, current.url, directions.none);
				} else {
					renderContent(context, current.url, content, directions.none, current.scrollTop);
				}
			// otherwise, if this was inited from webapp, load the default page
			} else if (environment.type == 'webapp') {
				loadAndShowUrlViaTransportWithDirection(context, context.defaultUrl, directions.none);
			// otherwise just adjust the hash as normal
			} else {
				adjustHashData(context.defaultUrl);
			}
		}

		// whenever the app resumes, force delete any expired stack caches
		messaging.subscribe('mobile.resume', 'global', context.stack.expireAll);
	}

	function loadExternalUrl(context, url) {
		// if in native, load it in child browser
		if (transport.isNative()) {
			if (context.useDeviceBrowserForExternalUrls) {
				global.open(url, '_system', '');
			} else if (!hasChildBrowser) {
				hasChildBrowser = true;
				var cb = global.open(url, '_blank', '');
				cb.addEventListener('exit', function (event) {
					hasChildBrowser = false;
				});
			}
		// homescreened web app
		} else if (environment.type == 'webapp') {
			var a = document.createElement('a');
			a.setAttribute('href', url);
			a.setAttribute('target', '_blank');

			var event = document.createEvent('HTMLEvents');
			event.initEvent('click', true, true);
			a.dispatchEvent(event);
		// otherwise, redirect
		} else {
			global.location.href = url;
		}
	}

	// gets and caches the target of a redirect
	// returns a promise
	function determineRedirect(context, url) {
		return $.Deferred(function(dfd){
			var redirectData = context.redirectCache.get(url);
			if(!redirectData || !redirectData.created || (new Date()).getTime() - redirectData.created > 4 * 60 * 1000) { // only allow items to last 4 minutes to prevent conflicts with OAuth signed redirects
				transport.load(url).done(function(data){
					if (data && data.redirectUrl) {
						url = data.redirectUrl;
					}
					if (!transport.isLocal(url)) {
						transport.getExternalUrl(url)
							.done(function(data2) {
								context.redirectCache.set(url, $.extend({}, data2 || data, { created: (new Date()).getTime() }));
								dfd.resolve(data2 || data);
							})
							.fail(function() {
								dfd.reject();
							});
					} else {
						context.redirectCache.set(url, $.extend({}, data, { created: (new Date()).getTime() }));
						dfd.resolve(data);
					}
				}).fail(function(){
					dfd.reject();
				});
			} else {
				dfd.resolve(redirectData);
			}
		}).promise();
	}

	function internalNavigateTo(context, url, options) {
		options = options || {};
		if(options.refresh) {
			context.stack.clearContent(url);
		}
		if(options.currentContentScrollTop != undef) {
			context.stack.setCurrentScrollTop(options.currentContentScrollTop);
		}
		// mobile-defined page
		if(transport.isLocal(url)) {
			replaceContentWithoutAnimation = options.replace || false;
			adjustHashData(url);
		// non-mobile defined page
		} else {
			// potentially a redirect, so try getting the redirect target
			if(url.indexOf('rsw.ashx') > 0 && url.indexOf('~') > 0) {
				if(context.onDetermineRedirect)
					context.onDetermineRedirect(url);
				determineRedirect(context, url).then(function(data){
					if(context.onDeterminedRedirect)
						context.onDeterminedRedirect(url);
					// this URL *was* a redirect target, then use that target
					if(data) {
						if (data.error) {
							if ($.telligent.evolution.user.accessing.isSystemAccount) {
								context.authenticator.login();
							} else {
								// not sure what happened, but show an error message
								$.telligent.evolution.notifications.show('Access denied', {
									type: 'error'
								})
							}
						} else if (data.redirectUrl) {
							if(options.refresh) {
								context.stack.clearContent(data.redirectUrl);
							}
							// redirect to locally-defined redirect url
							if(transport.isLocal(data.redirectUrl)) {
								replaceContentWithoutAnimation = options.replace || false;
								adjustHashData(data.redirectUrl);
							// non-mobile defined redirect url
							} else {
								loadExternalUrl(context, data.redirectUrl);
							}
						} else {
							loadExternalUrl(context, url);
						}
					// otherwise, just treat it like an external URL
					} else {
						loadExternalUrl(context, url);
					}
				});
			// an external url, so just load it
			} else {
				loadExternalUrl(context, url);
			}
		}
	}

	var Navigator = function(context) {
		context = context || {};
		context.cacheDuration = context.cacheDuration || (10 * 60 * 1000) // 10 minutes
		context.stack = new NavigationStack({
			maxDepth: (context.maxDepth || 100),
			cacheDuration: context.cacheDuration
		});
		context.defaultUrl = context.defaultUrl || '/';
		context.onLoad = context.onLoad || function() {};
		context.onNavigated = context.onNavigated || function() {};
		context.initFromStorage = context.initFromStorage || false;
		context.redirectCache = LruCache({
			size: 250,
			load: function(){
				return storage.get('_redirect_cache');
			},
			persist: function(obj) {
				storage.set('_redirect_cache', obj);
			}
		});

		handleEvents(context);
		init(context);

		return {
			navigateTo: function(url, options) {
				internalNavigateTo(context, url, options);
			},
			navigateBack: function(options) {
				options = options || {
					refresh: false
				};
				if(options.currentContentScrollTop != undef) {
					context.stack.setCurrentScrollTop(options.currentContentScrollTop);
				}
				// get the previous url
				// if there was one, just change the URL
				// the change handler will still determine that
				// it should re-use any previously-requested content
				var prevUrl = context.stack.canMoveBack();
				if(prevUrl) {
					// if should refresh when moving back, clear content of previous URL
					if(options.refresh) {
						context.stack.clearContent(prevUrl);
					}
					adjustHashData(prevUrl);
				}
			},
			refresh: function(options) {
				context.stack.setCurrentScrollTop(0);

				var currentPage = context.stack.getCurrent();
				if(!currentPage)
					return;

				var refreshUrl = options
					? url.modify({ url: currentPage.url, query: options })
					: currentPage.url;
				// keep track of what extra refresh params were added to remove them from the next url
				context.refreshParams = options;
				// reload it and re-show it with no direction
				loadAndShowUrlViaTransportWithDirection(context, refreshUrl, directions.none);
			},
			reset: function() {
				reset = true;
				// clear any content-scoped messaging subscriptions before changing content
				messaging.clear(messaging.CONTENT_SCOPE);
				context.stack.empty();
				adjustHashData(resetValue);
				adjustHashData(context.defaultUrl);
			},
			canNavigateBack: function() {
				var currentPage = context.stack.getCurrent();
				return context.stack.canMoveBack() != null
					&& currentPage
					&& context.stack.canMoveBack() != currentPage.url;
			},
			clearContent: function(url) {
				context.stack.clearContent(url);
			},
			setExpiration: function(date, url) {
				context.stack.setExpiration(date, url);
			},
			excludeFromHistory: function() {
				context.stack.exclude();
			}
		};
	};
	return Navigator;

}, jQuery, window);
