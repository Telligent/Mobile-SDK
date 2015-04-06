(function($, global) {

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};

	function init(context, resized) {
		if(resized) {
			context.listWrapper.css({
				'opacity': 0
			});
			context.list.css({
				position: 'static',
				width: '100%'
			});
			context.list.find('.content-item').css({
				'width': '100%',
				'float': 'none'
			});
		}
		context.listWrapper.css({
			'opacity': 0,
			'overflow': 'hidden'
		});

		// collect list items
		// collect the full width, and make the width of each pane explicit
		var fullWidth = 0;
		context.listItems = [];
		context.list.find('.content-item').each(function(){
			var pane = $(this);
			var width = pane.width();
			context.listItems.push({
				elm: pane,
				offset: fullWidth
			});
			pane.css({
				'width': width,
				'position': 'absolute',
				'left': fullWidth + 'px',
				'top': '0px'
			});

			var offset = fullWidth,
				startX,
				moveThreshold = width / 2,
				diff;
			pane.off('swipeleft')
				.off('swiperight')
				.off('panstart')
				.off('pan')
				.off('panend')
				.on({
					swipeleft: function(e) {
						if(context.suppressPanning) return;
						if(!context.shouldHandleGestures) return;
						moveNext(context);
						startResetAutoPage(context);
						e.preventDefault();
						return false;
					},
					swiperight: function(e) {
						if(context.currentIndex > 0)
							e.preventDefault();

						if(context.suppressPanning) return;
						if(!context.shouldHandleGestures) return;
						movePrevious(context);
						startResetAutoPage(context);
						e.preventDefault();
						return false;
					},
					pointermove: function(e) {
						if(context.panning) {
							e.preventDefault();
							return false;
						}
					},
					panstart: function(e) {
						if(!(e.direction == 'left' || (e.direction == 'right' && context.currentIndex > 0))) return;
						if(!context.shouldHandleGestures) return;
						startX = e.pageX;
						context.panning = true;
						stopAutoPage(context);
					},
					pan: function(e) {
						if((e.direction == 'left' || (e.direction == 'right' && context.currentIndex > 0)))
							e.preventDefault();
						if(!context.suppressPanning && (e.direction == 'left' || (e.direction == 'right' && context.currentIndex > 0))) {
							e.preventDefault();
							if(!context.shouldHandleGestures) return;
							diff = e.pageX - startX;
							context.list.evolutionTransform({
								left: (-1 * (offset - diff))
							})
							return false;
						}
					},
					panend: function(e) {
						if(context.suppressPanning) return;
						if(!context.shouldHandleGestures) return;
						diff = e.pageX - startX;
						if(Math.abs(diff) >= moveThreshold) {
							if(diff > 0) {
								if(context.currentIndex > 0)
									movePrevious(context);
								else
									moveTo(context, context.listItems.length - 1);
							}
							else if(diff <= 0) {
								if(context.currentIndex < context.listItems.length - 1)
									moveNext(context);
								else
									moveTo(context, 0);
							}
							else {
								moveTo(context, context.currentIndex || 0);
							}
							return false;
						} else {
							moveTo(context, context.currentIndex || 0);
						}
						context.panning = false;
						startResetAutoPage(context);
					}
				});

			fullWidth = fullWidth + width;
		})

		if(!context.listItems || context.listItems.length == 0)
			return;

		context.shouldHandleGestures = context.listItems.length > 1;

		// make the wrapper
		context.list.css({
			'position': 'relative',
			'width': fullWidth
		});

		context.listWrapper.evolutionTransform({
			opacity: 1
		}, {
			duration: 200
		});

		context.suppressPanning = false;
		$.telligent.evolution.messaging.subscribe('mobile.navigation.opened', function(){
			setTimeout(function(){
				context.suppressPanning = true;
			}, 10)
		})
		$.telligent.evolution.messaging.subscribe('mobile.navigation.closed', function(){
			context.suppressPanning = false;
		})
	}

	function moveTo(context, index) {
		global.clearTimeout(context.moveDebounce);
		context.moveDebounce = global.setTimeout(function(){
			// normalize index
			if(index >= context.listItems.length)
				index = context.listItems.length - 1;
			else if(index < 0)
				index = 0;
			context.currentIndex = index;

			setTimeout(function(){
				context.list.evolutionTransform({
					left: -1 * context.listItems[index].offset
				}, {
					duration: 200
				});
			}, 1)

			context.featureLinks.removeClass('active');
			$(context.featureLinks.get(index)).addClass('active');
			context.panning = false;
		}, 25);
	}

	function moveNext(context) {
		if((context.currentIndex || 0) >= context.listItems.length - 1)
			moveTo(context, 0);
		else
			moveTo(context, (context.currentIndex || 0) + 1);
	}

	function movePrevious(context) {
		if((context.currentIndex || 0) <= 0)
			moveTo(context, context.listItems.length - 1);
		else
			moveTo(context, (context.currentIndex || 0) - 1);
	}

	function initPaging(context) {
		// forward/back
		context.next = $(context.nextId).on('click', function(e){
			e.preventDefault();
			moveNext(context);
			startResetAutoPage(context);
		});
		context.previous = $(context.previousId).on('click', function(e){
			e.preventDefault();
			movePrevious(context);
			startResetAutoPage(context);
		});

		// single item paging
		context.wrapper.on('click', '.feature-link', function(e){
			e.preventDefault();
			moveTo(context, $(this).data('featureindex'));
		});
	}

	function startResetAutoPage(context) {
		global.clearTimeout(context.autoHandle);
		if (context.automatic) {
			context.autoHandle = setTimeout(function(){
				if(!context.panning)
					moveNext(context);

				startResetAutoPage(context);
			}, context.duration);
		}
	}

	function stopAutoPage(context) {
		global.clearTimeout(context.autoHandle);
	}

	$.telligent.evolution.widgets.featuredContentList = {
		register: function(options) {
			// collect UI elements
			options.wrapper = $(options.wrapper);
			options.list = options.wrapper.find('.content-list');
			options.listWrapper = options.list.parent('.content-list-wrapper');
			options.featureLinks = options.wrapper.find('.feature-links a');
			options.lastMove = new Date();

			// init
			init(options, false);
			if(!options.listItems || options.listItems.length == 0)
				return;
			moveTo(options, 0);
			$(window).on('resized', function(){
				init(options, true);
				if(options.currentIndex)
					moveTo(options, options.currentIndex);
			});

			initPaging(options);
			startResetAutoPage(options);
		}
	};

})(jQuery, window);