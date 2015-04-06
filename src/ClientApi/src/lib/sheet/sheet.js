/*
 * Sheet
 * Private API
 *
 * Provides support for sliding in and out a modal overlay over the document
 * Can be hidden via its API as well as tapping in the grayed out background
 * Can also be swiped or panned away
 *
 * var sheet = new Sheet(options)
 *   options:
 *     enablePan: true (when true, can pan down sheet)
 *     maxHeightPerent: default - 0.7
 *     parent: parent element
 *     cssClass: default - 'sheet'
 *     backgroundColor: default - '#333'
 *     backgroundOpacity: default 0.5;
 *     animationDuration: default 250;
 *     animationEasing: default 'cubic-bezier(0.160, 0.060, 0.450, 0.940)'
 *     onOpening(fn)
 *     onOpened(fn)
 *     onClosing(fn)
 *     onClosed(fn)
 *
 * sheet.show(content)
 * sheet.hide();
 */
define('sheet', ['scrollfix', 'messaging'], function(scrollfix, messaging, $, global, undef){

	function init(context) {
		if(context.inited)
			return;
		context.inited = true;

		// create a backdrop element, don't show it yet
		context.backDrop = $(document.createElement('div'))
			.css({
				backgroundColor: context.backgroundColor,
				opacity: 0.01,
				zIndex: 100,
				position: 'absolute',
				top: 0,
				left: 0,
				display: 'none',
				'-webkit-transform': 'translate3d(0,0,0)',
				'-webkit-backface-visibility': 'hidden',
				'transform': 'translate3d(0,0,0)'
			})
			.appendTo(context.parent);

		// create a sheet element, don't do anything with it yet
		context.sheet = $(document.createElement('div'))
			.css({
				zIndex: 101,
				position: 'absolute',
				left: 0,
				top: 0,
				display: 'none',
				'-webkit-transform': 'translate3d(0,0,0)',
				'-webkit-backface-visibility': 'hidden',
				'transform': 'translate3d(0,0,0)'
			})
			.appendTo(context.parent)
			.addClass(context.cssClass);

		// intercept clicks against links in the sheet
		context.sheet.on('click', 'a', function(e){
			e.preventDefault();
			var link = $(this),
				href = link.attr('href') || link.closest('[href]').attr('href');
			if(href && href.length > 1 && $.telligent && $.telligent.evolution && $.telligent.evolution.mobile) {
				$.telligent.evolution.mobile.load(href);
				return false;
			}
		})

		handleEvents(context);

		// ensure that it can't be scrolled around
		scrollfix.fix(context.backDrop);
		scrollfix.fix(context.sheet);
	}

	function setDimensions(context) {
		context.windowWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);
		context.windowHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height);
		if(context.visible) {
			context.backDrop.css({
				width: context.windowWidth,
				height: context.windowHeight
			});
			context.sheet.css({
				width: context.windowWidth,
				maxHeight: context.maxHeightPerent * context.windowHeight
			});
		} else {
			context.backDrop.css({
				width: context.windowWidth,
				height: context.windowHeight
			});
			context.sheet.css({
				width: context.windowWidth,
				maxHeight: context.maxHeightPerent * context.windowHeight
			});
		}
	}

	function positionSheet(context, revealPercent, duration) {
		duration = duration || context.animationDuration;

		var opacity = .01 + (revealPercent * context.backgroundOpacity);
		context.backDrop
			.evolutionTransform({ opacity: context.backDrop.css('opacity') })
			.evolutionTransform({ opacity: .01 + (revealPercent * context.backgroundOpacity) },
				{ duration: duration, easing: context.animationEasing });

		context.sheet//.evolutionTransform({ y: context.windowHeight, x: 0 })
			.evolutionTransform({
				y:  (context.windowHeight - revealPercent * context.sheet.outerHeight()),
				x: 0
			}, {
				duration: duration,
				easing: context.animationEasing
			});
		if(revealPercent >= 1) {
			if(context.onOpened) {
				global.clearTimeout(context.openedTimeout);
				context.openedTimeout = global.setTimeout(function(){
					context.onOpened.apply(this);
					global.clearTimeout(context.openedTimeout);
				}, duration);
			}
		} else if(revealPercent <= 0) {
			if(context.onClosed) {
				global.clearTimeout(context.closedTimeout);
				context.closedTimeout = global.setTimeout(function(){
					context.onClosed.apply(this);
					global.clearTimeout(context.closedTimeout);
				}, duration);
			}
		}
	}

	function show(context, content) {
		if(context.suppress)
			return;

		if(context.visible)
			return;
		context.visible = true;

		if(context.onOpening) {
			context.onOpening.apply(this);
		}

		// init
		init(context);
		setDimensions(context);

		// apply content
		context.sheet.empty().append(content);

		// pre-position sheet off the bottom
		context.sheet.evolutionTransform({
			y: context.windowHeight,
			x: 0
		});

		// ready for displayig
		showSelection(context.backDrop);
		showSelection(context.sheet);

		// position the ui at 100% revealed
		positionSheet(context, 1);
	}

	function hide(context, duration) {
		if(!context.visible)
			return;
		context.visible = false;
		duration = duration || context.animationDuration;

		if(context.onClosing) {
			context.onClosing.apply(this);
		}

		// position the ui at 0% revealed
		positionSheet(context, 0);
		// after the animation duration, clean up
		global.setTimeout(function(){
			if(context.visible)
				return;
			context.visible = false;
			hideSelection(context.backDrop);
			hideSelection(context.sheet);
		}, duration);
	}

	function handleEvents(context){
		// hide sheet when backdrop tapped
		context.backDrop.on('tap', function(){
			hide(context);
		});

		if(context.enablePan) {
			context.sheet.on({
				panstart: function(e) {
					context.startY = e.pageY;
					context.sheetHeight = context.sheet.outerHeight();
				},
				pan: function(e) {
					// drag the sheet in realtime if the direction is somewhat down
					var offset = e.pageY - context.startY;
					if(offset <  0 || e.direction === 'left' || e.direction === 'right')
						return;
					positionSheet(context, (context.sheetHeight - offset) / context.sheetHeight, 10);
				},
				panend: function(e) {
					var offset = e.pageY - context.startY;
					var closedPercent = (context.sheetHeight - offset) / context.sheetHeight;
					if(closedPercent <= .5) {
						// if has moved down more than half the height, close it completely
						hide(context, context.animationDuration * 3/4 );
					} else {
						// if has not moved down more than hafl the height, open it back up
						positionSheet(context, 1, context.animationDuration * 3/4 )
					}
				}
			})
		}
		context.sheet.on({
			swipedown: function(e) {
				hide(context);
			}
		})
	}

	function hideSelection(sel) {
		sel.get(0).style.display = 'none';
	}

	function showSelection(sel) {
		sel.get(0).style.display = 'block';
	}

	var Sheet = function(context) {
		// defaults
		context = context || {};
		context.enablePan = context.enablePan != undef ? context.enablePan : true;
		context.maxHeightPerent = context.maxHeightPerent || 0.7;
		context.parent = $(context.parent);
		context.cssClass = context.cssClass || 'sheet';
		context.backgroundColor = context.backgroundColor || '#333';
		context.backgroundOpacity = context.backgroundOpacity || 0.5;
		context.animationDuration = context.animationDuration || 250;
		context.animationEasing = context.animationEasing || 'cubic-bezier(0.160, 0.060, 0.450, 0.940)';

		context.visible = false;

		// re-calc dimensions on orientation change
		messaging.subscribe('mobile.orientationchange', messaging.GLOBAL_SCOPE, function(){
			global.setTimeout(function(){
				setDimensions(context);
			}, 300)
		})

		// suppress display of sheets while keyboard openened
		messaging.subscribe('mobile.keyboard.open', messaging.GLOBAL_SCOPE, function(){
			context.suppress = true;
		});
		messaging.subscribe('mobile.keyboard.close', messaging.GLOBAL_SCOPE, function(){
			context.suppress = false;
		});

		return {
			show: function(content) {
				show(context, content);
			},
			hide: function() {
				hide(context);
			}
		}
	};

	return Sheet;

}, jQuery, window)