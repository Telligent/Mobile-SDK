/*
 * NavigationStack (Internal API)
 *
 * Stores history of past navigation urls and content in local storage
 * Garbage-collects history
 * Allows navigating back and in the history
 * Keeps in-memory cache of stack, but only the stack's URLs, not the content
 *
 * var stack = new NavigationStack(options)
 *   maxDepth: default 100
 *   cacheDuration: default 600000 (10 minutes)
 * methods:
 *   stack.push(url, content)
 *   stack.replaceCurrent(url, content)
 *   stack.setCurrentScrollTop(currentScrollTop)
 *   stack.getCurrent()  			returns Page instance
 *   stack.canMoveBack([toUrl]) 	returns previous url
 *   stack.moveBack([toUrl])    	returns Page instance
 *   stack.empty()
 *   stack.clearContent(url) 		if not provided, assumes current url
 *   stack.peekBack(toUrl) 			returns the previous Page without navigating to it
 *   stack.expireAll()			/	clears content of all that are past expiration if online
 *   stack.exclude() 				excludes current url from stack (marking it for exclusion)
 *   stack.setExpiration(date, [url])  sets the (custom) expirate date for a page in stack. defaults to curent if url not provided
 *
 * Page
 *   url
 *   exclude // whether it's excluded
 *   getContent() // lazily-load the persisted content
 */
define('navigationStack', ['storage', 'util', 'environment'], function(storage, util, environment, undef){

	var stackKey = '_navigation_stack',
		contentPrefixKey = '_navigation_stack_content_';

	function getStackFromStorage() {
		var stack = storage.get(stackKey);
		if(!stack) {
			stack = [];
			persistStack(stack);
		}
		return stack;
	}

	function persistStack(stack) {
		storage.set(stackKey, stack);
	}

	function getContent(id) {
		return storage.get(contentPrefixKey + id);
	}

	function setContent(id, content) {
		storage.set(contentPrefixKey + id, content);
	}

	function delContent(id) {
		storage.del(contentPrefixKey + id);
	}

	function setCurrentScrollTop(stack, scrollTop) {
		if(stack != undef && scrollTop != undef && stack.length > 0) {
			stack[0].scrollTop = scrollTop;
		}
	}

	// Type returned for current representation of place in the stack
	function Page(url, id, scrollTop, exclude, expiration) {
		this.url = url;
		this.id = id;
		this.scrollTop = scrollTop;
		this.exclude = exclude;
		this.expiration = expiration;
	}
	// Loads the place's content
	Page.prototype.getContent = function() {

		// if online and the page expires, and has already expired
		if(environment.isOnline() && this.expiration && this.expiration <= new Date().getTime()) {
			// go ahead and delete its current content to clean it up
			delContent(this.id);
			// and return no content
			return null;
		} else {
			return getContent(this.id);
		}
	};

	var NavigationStack = function(options) {
		var maxDepth = 100;
		var cacheDuration = 10 * 60 * 1000; // 60 seconds
		if(options) {
			maxDepth = options.maxDepth || maxDepth;
			cacheDuration = options.cacheDuration || cacheDuration;
		}

		// keep in-memory representation of stack of urls, but not the content
		var stack = getStackFromStorage();

		return {
			setCurrentScrollTop: function(currentScrollTop) {
				setCurrentScrollTop(stack, currentScrollTop);
				persistStack(stack);
			},
			push: function(url, content) {
				// add this new content to the stack
				var newId = util.guid();

				stack.unshift({
					url: url,
					id: newId,
					scrollTop: 0,
					exclude: false,
					expiration: new Date(new Date().getTime() + cacheDuration).getTime()
				});
				setContent(newId, content);

				// if longer than the max, remove the last one
				if(stack.length > maxDepth) {
					var last = stack.pop();
					delContent(last.id);
				}

				persistStack(stack);
			},
			replaceCurrent: function(url, content) {
				if(stack && stack.length > 0) {
					setContent(stack[0].id, content);
					stack[0].url = url;
					stack[0].expiration = new Date(new Date().getTime() + cacheDuration).getTime();

					persistStack(stack);
				}
			},
			getCurrent: function() {
				if(stack && stack.length > 0) {
					return new Page(stack[0].url, stack[0].id, stack[0].scrollTop, stack[0].exclude, stack[0].expiration);
				} else {
					return null;
				}
			},
			canMoveBack: function(toUrl) {
				// if can't move back at all, short circuit
				var canMoveBackAtAll = stack && stack.length > 1;
				if(!canMoveBackAtAll) {
					return null;
				}

				// if can move back and we don't care to where, then short circuit to first non excluded
				if(!toUrl) {
					for (var i = 1; i < stack.length; i++) {
						if (!stack[i].exclude) {
							return stack[i].url;
						}
					}
				}

				// otherwise, see if the stack contains the non-excluded URL anywhere after the current index
				var backToUrl = null;
				for(var i = 0; i < stack.length; i++) {
					if(stack[i].url == toUrl && !stack[i].exclude) {
						backToUrl = toUrl;
						break;
					}
				}

				return backToUrl;
			},
			peekBack: function(toUrl) {
				var currentUrl = null,
					index = 0;

				while(currentUrl !== toUrl && index < maxDepth && index < stack.length) {
					currentUrl = stack[index].url;
					if(currentUrl != toUrl) {
						index++;
					}
					// if not passed a toUrl, stop it after one iteration
					if(toUrl == undef) {
						toUrl = currentUrl;
					}
				}
				// sanity check
				if(!stack || !stack[index])
					return null;

				return new Page(stack[index].url, stack[index].id, stack[index].scrollTop, stack[index].exclude, stack[index].expiration);
			},
			moveBack: function(toUrl) {
				var currentUrl = null,
					index = 0;

				while(currentUrl !== toUrl && index < maxDepth && index < stack.length) {
					currentUrl = stack[index].url;
					if(currentUrl != toUrl) {
						index++;
					}
					// if not passed a toUrl, stop it after one iteration
					if(toUrl == undef) {
						toUrl = currentUrl;
					}
				}
				// sanity check
				if(!stack || !stack[index])
					return null;

				// delete all pages prior to the index, so can't move forward again
				for(var i = 0; i < index; i++) {
					delContent(stack[0].id);
					stack.shift();
				}
				persistStack(stack);

				return new Page(stack[0].url, stack[0].id, stack[0].scrollTop, stack[0].exclude, stack[0].expiration);
			},
			empty: function() {
				for(var i = 0; i < stack.length; i++) {
					delContent(stack[i].id);
				}
				storage.del(stackKey);
				stack = [];
			},
			exclude: function() {
				if (stack.length > 0) {
					stack[0].exclude = true;
					persistStack(stack);
				}
			},
			setExpiration: function(date, url) {
				if(!stack || stack.length == 0 || !date)
					return;

				// if not provided a url, set the current page's expiration
				if(!url) {
					stack[0].expiration = date.getTime();
				// otherwise, look in the stack for the url
				} else {
					for(var i = 0; i < stack.length; i++) {
						if(stack[i].url == url) {
							stack[i].expiration = date.getTime();
							break;
						}
					}
				}

				persistStack(stack);
			},
			// clears content of all that are past expiration if online
			expireAll: function() {
				if(!stack || stack.length == 0)
					return;

				// don't expire if offline
				if(!environment.isOnline())
					return;

				var now = new Date().getTime();
				for(var i = 0; i < stack.length; i++) {
					// if expired
					if(stack[i].expiration && stack[i].expiration <= now) {
						// go ahead and delete its current content to clean it up
						delContent(stack[i].id);
					}
				}
			},
			clearContent: function(url) {
				// url is explicit or current
				url = url || stack[0].url;
				for(var i = 0; i < stack.length; i++) {
					if(stack[i].url == url) {
						delContent(stack[i].id);
						break;
					}
				}
			}
		};
	};

	return NavigationStack;
});