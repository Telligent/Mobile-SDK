/*
 * Pull to Refresh
 * Private API
 *
 * new PullToRefresh(options);
 *
 * Methods
 *   enabled(true|false)  returns currently enabled status. can also set enabled
 *   refresh()  // manually run
 *
 * options:
 *   enablePan: true (when true, can pan down the content area to refresh, not just swipe)
 *   container: refreshable container
 *   indicator: refresh indicator div
 *   content: refreshable content div
 *   overflow: extra pixels needed to pull past indicator's height to trigger refresh (default 20)
 *   revealThrottle: min milliseconds between 'reveal' callbacks (default 10)
 *   load: function called when a refresh is triggered. passed a function, which, when called, tells the refresher it's done
 *   revealStart: function called as the refresher starts being revealed
 *   reveal: function called as the refrehser is being revealed, before refreshing is triggered. passed a percentage of reveal
 *   animateClose: when true, animates the slide-up of the refreshed area after refreshing. defaults false.
 */
define('refresh', function($, undef){

	function handleEvents(context) {
		if(context.enablePan) {
			context.content.on({
				panstart: function(e) {
					if(!context.enabled)
						return;
					context.lastPanAt = 0;
					if(context.revealStart) {
						context.revealStart();
					}
				},
				panend: function(e) {
					if(!context.enabled)
						return;
					if(!context.refreshing &&
						-1 * context.container.scrollTop >= (context.indicatorHeight + context.overflow))
						startRefreshing(context);
				},
				pan: function(e) {
					if(!context.enabled)
						return;
					if(context.refreshing || e.direction === 'right' || e.direction === 'left')
						return;
					var now = (new Date().getTime()),
						revealPercent = (-1 * context.container.scrollTop) / (context.indicatorHeight + context.overflow);

					if(revealPercent > 0 && (now - context.lastPanAt >= context.revealThrottle)) {
						context.lastPanAt = now;
						context.reveal(revealPercent);
					}
				}
			});
		}
		context.content.on({
			swipedown: function() {
				if(!context.enabled)
					return;
				// swipedown fallback if panning isn't being supported in the browser
				if(!context.refreshing && context.container.scrollTop <= 10) {
					startRefreshing(context);
				}
			}
		});
	}

	function startRefreshing(context) {
		context.refreshing = true;
		context.indicator.evolutionTransform({
			x: 0,
			y: 0,
			position: 'static'
		});
		context.load(function(){
			stopRefreshing(context);
		});
	}

	function stopRefreshing(context) {
		context.refreshing = false;
		if(context.animateClose) {
			clearTimeout(context.stopRefreshingTimeout);
			context.content.evolutionTransform({
				x: 0,
				y: (-1 * context.indicatorHeight)
			}, {
				duration: 150
			});
			context.stopRefreshingTimeout = setTimeout(function(){
				context.indicator.evolutionTransform({
					x: 0,
					y: (-1 * context.indicatorHeight),
					position: 'absolute'
				});
				context.content.evolutionTransform({
					x: 0, y: 0
				}, { duration: 1 });
			}, 300);
		} else {
			context.content.evolutionTransform({
				top: (-1 * context.indicatorHeight),
				left: 0
			});
			context.indicator.evolutionTransform({
				x: 0,
				y: (-1 * context.indicatorHeight),
				position: 'absolute'
			});
			context.content.evolutionTransform({
				x: 0, y: 0
			});
		}
	}

	function measureIndicator(context) {
		var height,
			indicatorHeightInterval;
		return $.Deferred(function(d){
			height = context.indicator.outerHeight();
			if(height == 0) {
				indicatorHeightInterval = setInterval(function() {
					height = context.indicator.outerHeight();
					if(height > 0) {
						clearInterval(indicatorHeightInterval);
						d.resolve(height);
					}
				}, 10);
			} else {
				d.resolve(height);
			}
		}).promise();
	}

	function PullToRefresh (context){
		if(!context)
			return;
		context.enablePan = context.enablePan != undef ? context.enablePan : true;
		context.enabled = true;
		context.indicator = $(context.indicator || '#refresh-indicator');
		context.content = $(context.content || '#refreshable-content');
		context.container = context.container.get(0);

		measureIndicator(context).done(function(height){
			context.indicatorHeight = height;
			context.overflow = context.overflow || 10;
			context.animateClose = context.animateClose != undef? context.animateClose : true;
			context.revealThrottle = context.revealThrottle || 150;
			if(!context.load)
				context.load = function(complete){
					setTimeout(function(){
						complete()
					}, 2000);
				};
			if(!context.reveal)
				context.reveal = function(percent){ };

			context.indicator.evolutionTransform({
				x: 0,
				y: -1 * context.indicatorHeight
			});

			handleEvents(context);
		});

		return {
			enabled: function(isEnabled) {
				if(isEnabled !== undef)
					context.enabled = isEnabled;
				return context.enabled;
			},
			// manually refresh
			refresh: function() {
				if(!context.enabled)
					return;
				if(!context.refreshing) {
					startRefreshing(context);
				}
			}
		};
	}

	return PullToRefresh;

}, jQuery);
