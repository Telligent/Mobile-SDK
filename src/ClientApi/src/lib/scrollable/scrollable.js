/*
 * Endless Scrolling
 * Internal API
 *
 * Supports:
 *   Showing/Hiding an indicator
 *   Debouncing of scroll bottom events to only load while not loading
 *   Tracking Page Index
 *   Canceling in-progress endless scrolls/race conditions
 *   Prefilling with max attempts
 *   Canceling pre-filling after giving up
 *   Providing illusion of extra speed by pre-showing loading indicator on swipe even though scroll events won't yet fire
 *
 * scrollable.register(name, options)
 *   options:
 *     element: function() { /* lazily returns element / }
 *     container
 *     scrollEndMessage
 *	   load: function(pageIndex, success, error)
 *	   complete: function(content)
 *	   initialPageIndex - default 0
 *	   preFillAttempts - default 5
 *     buildIndicator: function() { }  // callback called to generate indicator element
 *
 * scrollable.unregister(name)
 *
 */
define('scrollable', ['util', 'messaging'], function(util, messaging, $, global, undef) {

	var contexts = {},
		indicators = {};

	function buildScrollableLoadingIndicator(context) {
		if(!indicators[context.region]) {
			indicators[context.region] = context.buildIndicator();
			invisiblyAttachScrollableLoadingIndicator(context);
		}
	}

	function invisiblyAttachScrollableLoadingIndicator(context) {
		indicators[context.region]
			.css({ visibility: 'hidden' })
			.appendTo(context.element());
	}

	function showScrollableLoadingIndicator(context, prefilling) {
		buildScrollableLoadingIndicator(context);
		indicators[context.region]
			.appendTo(context.element())
			.css({ visibility: 'visible' });
	}

	function hideScrollableLoadingIndicator(context) {
		indicators[context.region].css({ visibility: 'hidden' });
	}

	function unRegisterScrollable(region) {
		var context = contexts[region];
		if(context) {
			context.element().off('.scrollable');
			hideScrollableLoadingIndicator(context);
			messaging.unsubscribe(contexts[region].subscription);
			delete contexts[region];
		}
	}

	function loadNextScrollablePage(context, preFilling) {
		// only allow one endless scroll load at a time for a given region
		if(context.currentlyLoading)
			return;
		context.currentlyLoading = true;
		context.pageIndex++;
		showScrollableLoadingIndicator(context, preFilling);
		context.loadCallback(
			context.pageIndex,
			// success callback
			function(content) {
				context.currentlyLoading = false;
				invisiblyAttachScrollableLoadingIndicator(context);
				// if this scroll context is still active, call the complete handler
				if(contexts[context.region] &&
					contexts[context.region].id == context.id)
				{
					context.completeCallback(content);
					// if there was content being shown,
					// potentially check to see if more should be pre-filled
					if(content && $.trim(content).length > 0) {
						// if still not filling the available height, try loading more pages
						if(context.preFillAttempts > 2 &&
							!doesCurrentHeightExceedContainer(context))
						{
							context.preFillAttempts--;
							loadNextScrollablePage(context, preFilling);
						}
					} else {
						// record that pre-filling is done for this context even if it hasn't
						// exceeded the height
						context.disable = true;
					}
				} else {
					context.pageIndex--;
				}
			},
			// error callback
			function() {
				context.pageIndex--;
				context.currentlyLoading = false;
				hideScrollableLoadingIndicator(context.region);
			})
	}

	function doesCurrentHeightExceedContainer(context) {
		context.children = context.children || context.element().children();
		var height = 0;
		for(var i = 0; i < context.children.length; i++){
			height += $(context.children[i]).outerHeight();
		}
		return height >= context.container.height();
	}

	function registerScrollable(options) {
		// unsubscribe any scroll bottom handlers and clear page index context for the region
		unRegisterScrollable(options.region);

		// set up a new endless scrolling context for the region
		var context = {
			pageIndex: options.initialPageIndex,
			subscription: null,
			currentlyLoading: false,
			loadCallback: options.load,
			region: options.region,
			completeCallback: options.complete,
			preFillAttempts: options.preFillAttempts,
			element: options.element,
			container: options.container,
			scrollEndMessage: options.scrollEndMessage,
			buildIndicator: options.buildIndicator,
			// associate id of this scrollable context to ensure it still exists
			id: util.guid()
		};
		contexts[options.region] = context;

		// handle the scroll message and load a scrollable page
		context.subscription = messaging.subscribe(context.scrollEndMessage, function(){
			if(!context.disable)
				loadNextScrollablePage(context);
		});
		// attempt to pre-fill if necessary
		if(!doesCurrentHeightExceedContainer(context)) {
			loadNextScrollablePage(context, true);
		} else {
			// pre-build the loading indicator in a hidden state
			// so that the visual space it requires is already allocated
			// only do this if not pre-filling
			buildScrollableLoadingIndicator(context);
		}
		// if there was a fast swipe, then pre-show the loader
		// since scroll events won't occur during the inertial phase
		// until the scroll completely stops.
		// so this way, the loader will already be visible in case it's
		// needed at that point to avoid the bounce
		// this helps provide an illusion of speed
		context.element().on('swipeup.scrollable', function(){
			// don't show fake loading indicator if we know we're halted...
			if(context.disable)
				return;
			showScrollableLoadingIndicator(context);
		});
	}

	var scrollable = {
		register: function(name, options) {
			options = options || {};
			options.region = name;
			registerScrollable(options);
		},
		unregister: function(name) {
			unRegisterScrollable(name);
		}
	};

	return scrollable;

}, jQuery, window);