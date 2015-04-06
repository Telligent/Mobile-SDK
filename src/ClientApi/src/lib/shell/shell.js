/*
 * UI Shell
 * Private API
 *
 * var shell = new Shell(options);
 *
 * options:
 *
 *   enablePan: true
 *   doubleTapHeaderToScroll: true
 *
 *   // Elements
 *   viewport
 *   navigationWrapper
 *   gutter
 *   contentWrapper
 *   header
 *   content
 *   refreshIndicator
 *   refreshableContent
 *
 *   // Animation settings
 *   easing: 'cubic-bezinavigationOpenPercenter(0.160, 0.060, 0.450, 0.940)'
 *   navigationOpenPercent: 0.8
 *   navigationOpenDuration: 275
 *   navigationClosedOffsetPercent: .15
 *   navigationClosedZoom: 0
 *
 *   // Sheet Settings
 *   sheetMaxHeightPerent: 0.7
 *   sheetCssClass: 'sheet'
 *   sheetBackgroundColor: '#333'
 *   sheetBackgroundOpacity: 0.7
 *
 *   // Pull to Refresh Settings
 *   refreshOverflow: 10 // extra pixels needed to pull past indicator's height to trigger refresh (default 20)
 *   refreshRevealThrottle: 10 // min milliseconds between 'reveal' callbacks (default 10)
 *
 *   // Callbacks
 *
 *   onNavigationOpening(fn)
 *   onNavigationOpened(fn)
 *   onNavigationClosing(fn)
 *   onNavigationClosed(fn)
 *
 *   onSheetOpening(fn)
 *   onSheetOpened(fn)
 *   onSheetClosing(fn)
 *   onSheetClosed(fn)
 *
 *   onRefreshRevealing(fn)
 *   onRefreshing(fn)
 *
 *   onKeyboardOpening(fn)
 *   onKeyboardClosing(fn)
 *   onKeyboardOpened(fn)
 *   onKeyboardClosed(fn)
 *
 * Messages
 *   mobile.content.scrollTop
 *   mobile.content.scrollBottom
 *   mobile.navigation.scrollTop
 *   mobile.navigation.scrollBottom
 *
 * Methods
 *   navigable([navigable])			true/false, returns current
 *   refreshable([refreshable]) 	true/false, returns current
 *   navigationVisible([visible])	true/false, returns current
 *   navigationScrollTop(to)			element, y, nothing
 *   contentScrollTop(to)				element, y, nothing
 *   setContent(content, options)  accepts DOM or HTML and returns DOM
 *     options
 *       animate: fade, left, right
 *       duration: 275
 *   displayMessage(content, options)
 *     content is text or selection - when falsey, hides any current message
 *     options
 *       cssClass
 *       disappearAfter
 *   alert(message, callback)
 *     displays the provided message and executes the callback when the message has been dismissed
 *   confirm(message, callback)
 *     displays the message and executes the callback with a single boolean parameter identifying if the message was accepted positively
 *   debug(message)   // shows a debug message in a moveable debug panel
 *   displaySheet(options) // displays either a list of links/actions (with optional cancel) or arbitrary contnent
 *     options
 *       links: array of link objects
 *       content: when links aren't provided, arbitrary content can be shown. string, DOM, or jQuery selection.
 *   hideSheet()
 *   showLoading(options)
 *     options
 *       cssClass: optional css class to apply to div being shown as an overlay
 *       content: optional content to show in loading indicator
 *       opacity: optional target opacity - default: 1
 *   hideLoading()
 *   refresh()  // manually call refresh
 *   scrollable(options) // sets a region to be endlessly scrollable
 *     options:
 *       region: 'content' || 'navigation'  // required
 *       load: function(pageIndex, complete, error)    // required
 *       complete: function(content)    // required
 *       initialpageIndex: 0
 *       preFillAttempts: 5
 *   setClass: function(className) // adds a classname to the overall viewport
 *   navigationContent: function() // returns current navigation content
 *   content: function() // current content
 *   viewport: function() // returns viewport wrapper
 */

/// @name mobile.content.scrollTop
/// @category Client Message
/// @description Published when content is scrolled to the top of the content area
///
/// ### mobile.content.scrollTop Message
///
/// [Client-side message](@messaging) Published when content is scrolled to the top of the content area
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.scrollTop', function(data) {
///         // handle the event
///     });
///

/// @name mobile.content.scrollBottom
/// @category Client Message
/// @description Published when content is scrolled to the bottom of the content area
///
/// ### mobile.content.scrollBottom Message
///
/// [Client-side message](@messaging) Published when content is scrolled to the bottom of the content area
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.scrollBottom', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.scrollTop
/// @category Client Message
/// @description Published when the navigation bar's content is scrolled to the top
///
/// ### mobile.navigation.scrollTop Message
///
/// [Client-side message](@messaging) Published when the navigation bar's content is scrolled to the top
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.scrollTop', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.scrollBottom
/// @category Client Message
/// @description Published when the navigation bar's content is scrolled to the bottom
///
/// ### mobile.navigation.scrollBottom Message
///
/// [Client-side message](@messaging) Published when the navigation bar's content is scrolled to the bottom
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.scrollBottom', function(data) {
///         // handle the event
///     });
///

define('shell', ['refresh', 'scrollfix', 'util', 'actionSheet', 'sheet', 'messaging', 'environment', 'scrollable', 'messagelinkhandler', 'keyboardShim'],
	function(PullToRefresh, scrollFix, util, ActionSheet, Sheet, messaging, environment, scrollable, MessageLinkHandler, keyboardShim, $, global, undef)
{
	var messages = {
		contentScrollTop: 'mobile.content.scrollTop',
		contentScrollBottom: 'mobile.content.scrollBottom',
		navigationScrollTop: 'mobile.navigation.scrollTop',
		navigationScrollBottom: 'mobile.navigation.scrollBottom'
	}

	var Shell = function(context) {

		// local state
		var fullWidth,
			fullHeight,
			openPercent,
			openWidth,
			opened,
			fullDuration,
			openThreshold,
			easing,
			startX,
			offset,
			gutterClosedOffset,
			gutterClosedScale,
			isWindows,
			navigable = true,
			pullToRefresh,
			openedTimeout,
			closedTimeout,
			minContentHeight,
			contentTimeout,
			sheet,
			actionSheet,
			focused,
			messageTimeout,
			loadingIndicatorShown = false,
			enablePan = context.enablePan != undef ? context.enablePan : true,
			easing = context.easing || 'cubic-bezier(0.160, 0.060, 0.450, 0.940)',
			navigationOpenPercent = context.navigationOpenPercent || 0.8,
			navigationOpenDuration = context.navigationOpenDuration || 275,

			navigationClosedOffsetPercent = context.navigationClosedOffsetPercent || -0.2,//0.15,
			navigationClosedZoom = context.navigationClosedZoom || 0.00,//0.07,
			minOpacity = context.minOpacity || 1.0,//0.4,

			sheetMaxHeightPerent = context.sheetMaxHeightPerent || 0.7,
			sheetCssClass = context.sheetCssClass || 'sheet',
			sheetBackgroundColor = context.sheetBackgroundColor || '#333',
			sheetBackgroundOpacity = context.sheetBackgroundOpacity || 0.7,

			refreshOverflow = context.refreshOverflow || 10,
			refreshRevealThrottle = context.refreshRevealThrottle || 10,

			doubleTapHeaderToScroll = context.doubleTapHeaderToScroll != undef ? context.doubleTapHeaderToScroll : true,

			messageContainer,
			debugContainer,
			debugState = 'closed',
			debugInited = false,

			loadingIndicator,
			defaultAlert = global.alert,
			settingContent = false;

		// elements
		var header = $(context.header),
			viewport = $(context.viewport),
			gutter = $(context.gutter),
			content = $(context.content),
			contentWrapper = $(context.contentWrapper),
			gutterWrapper = $(context.gutterWrapper),
			gutterContentWrapper = $(context.gutterContentWrapper),
			gutterContent = $(context.gutterContent),
			refreshIndicator = $(context.refreshIndicator),
			refreshableContent = $(context.refreshableContent),
			debugContainer = $(context.debugContainer);

		function initDimensions() {
			fullWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width),
			fullHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height),
			openPercent = navigationOpenPercent,
			openWidth = fullWidth * openPercent,
			opened = false,
			fullDuration = navigationOpenDuration,
			openThreshold = fullWidth / 2,
			startX = null,
			offset = null,
			gutterClosedOffset = openWidth * navigationClosedOffsetPercent,
			gutterClosedScale = navigationClosedZoom,
			minContentHeight = ($(window).height() - header.outerHeight() + 10),
			gutterWrapper.css({ width: openWidth });
			refreshableContent.css({ minHeight: minContentHeight });

			if(!messageContainer) {
				messageContainer = $(document.createElement('div'))
					.html('something')
					.appendTo(contentWrapper)
					.evolutionTransform({
						x: 0, y: -300
					});
				scrollFix.fix(messageContainer);
			}

			if(!loadingIndicator) {
				loadingIndicator = $(document.createElement('div'))
					.css({ opacity: 0.01 })
					.appendTo(contentWrapper);
				scrollFix.fix(loadingIndicator);
			}

			// yes, this is bad.
			isWindows = navigator.userAgent.match(/IEMobile/i);
		}

		function revealGutter(percent, duration, revealEasing) {
			if(percent == 0 && context.onNavigationOpening) {
				context.onNavigationOpening();
			}
			if(!navigable)
				return;
			// windows phone is really buggy with css animation...
			if(isWindows) {
				// if closing, we unforunatley have to rely on js tweens.
				if(percent < 1 && contentWrapper.css('left') != '0px') {
					contentWrapper.animate({ left: 0 }, { duration: duration });
				} else {
					// no gutter animation on windows
					contentWrapper.evolutionTransform({
							x: openWidth * percent,
							y: 0
						},{
							duration: duration,
							easing: revealEasing
						});
					// a bug in windows phone animation makes the content wrapper
					// jump out too far to the right after the animation is done.
					// as a workaround, remove the transform after the animation is over
					// and switch to a pure css left offset
					if(percent === 1) {
						setTimeout(function(){
							contentWrapper
								.evolutionTransform({ x: 0, y: 0 }, { duration: 0 })
								.css({ left: openWidth });
						}, duration);
					}
				}
			} else {
				revealEasing = revealEasing || easing;
				contentWrapper.evolutionTransform({
						x: openWidth * percent,
						y: 0
					},{
						duration: duration,
						easing: revealEasing
					});
				gutterWrapper.evolutionTransform({
						x: (gutterClosedOffset * (1 - percent)),
						y: 0,
						scale: 1 - gutterClosedScale * (1 - percent),
						// never make it fully opaque or fully transparent as
						// this triggers webkit layout bugs
						opacity: 0.99 - ((1 - minOpacity) * (1 - percent))
					}, {
						duration: duration,
						easing: revealEasing
					});
			}
		}

		function open(duration) {
			if(!navigable)
				return;
			opened = true;

			if(context.onNavigationOpening) {
				context.onNavigationOpening();
			}
			if(context.onNavigationOpened) {
				clearTimeout(openedTimeout);
				openedTimeout = setTimeout(function(){
					if(opened)
						context.onNavigationOpened();
				}, duration + 1);
			}

			revealGutter(1.0, duration);
			scrollFix.fix(contentWrapper);
			scrollFix.unfix(gutterWrapper);
		}

		function close(duration) {
			if(!navigable)
				return;
			opened = false;

			if(context.onNavigationClosing) {
				context.onNavigationClosing();
			}
			if(context.onNavigationClosed) {
				clearTimeout(closedTimeout);
				closedTimeout = setTimeout(function(){
					if(!opened)
						context.onNavigationClosed();
				}, duration + 1);
			}

			revealGutter(0, duration);
			scrollFix.unfix(contentWrapper);
			scrollFix.fix(gutterWrapper);
		}

		function registerGutterRevealingEvents(emitter) {
			if(enablePan) {
				emitter.on({
					panstart: function(e){
						// ignore the event if working with an input
						if(e.target.nodeName == 'TEXTAREA' || e.target.nodeName == 'INPUT')
							return;
						if((!opened && e.direction == 'right') || (opened && e.direction == 'left')) {
							scrollFix.fix(contentWrapper);
							scrollFix.fix(gutterWrapper);
						}
						if(opened) {
							startX = e.pageX;
						} else {
							startX = e.pageX;
						}
					},
					pan: function(e){
						// ignore the event if working with an input
						if(e.target.nodeName == 'TEXTAREA' || e.target.nodeName == 'INPUT')
							return;
						offset = e.pageX - startX;
						if(opened)
							offset = openWidth + offset;
						if(offset <  0 || offset > openWidth || e.direction === 'up' || e.direction === 'down')
							return;
						revealGutter(offset / openWidth, 10, 'linear');
					},
					panend: util.debounce(function(e) {
						// ignore the event if working with an input
						if(e.target.nodeName == 'TEXTAREA' || e.target.nodeName == 'INPUT')
							return;
						// if this was panning in a scrolling ui-links, ignore
						var target = $(e.target);
						if(target.is('.ui-links') || target.closest('.ui-links').length > 0)
							return;

						offset = e.pageX - startX;
						if(opened)
							offset = openWidth + offset;
						if(offset <  0 || e.direction === 'up' || e.direction === 'down')
							return;
						if(offset > openThreshold) {
							var openedPercent = offset / fullWidth;
							var remainingPercent = openedPercent > .5 ? 1 - openedPercent : openedPercent;
							// adjust the easing time relative to how far it has to travel
							open(.5 * fullDuration + (remainingPercent * .5 * fullDuration))
						} else {
							var openedPercent = offset / fullWidth;
							var remainingPercent = openedPercent > .5 ? 1 - openedPercent : openedPercent;
							// adjust the easing time relative to how far it has to travel
							close(.5 * fullDuration + (remainingPercent * .5 * fullDuration));
						}
					})
				});
			}
			emitter.on({
				swiperight: function(e){
					// if this was swiping in a scrolling ui-links, ignore
					var target = $(e.target);
					if(target.is('.ui-links') || target.closest('.ui-links').length > 0)
						return;

					open(fullDuration * openPercent * .75);
				},
				swipeleft: function(e){
					close(fullDuration * openPercent * .75);
				}
			});
		}

		// workaround for Android Browser issue to allow
		// display: blocked content to still be scrollabe after being updated
		function correctContentDisplay() {
			if(environment.device == 'android') {
				refreshableContent.css({ display: 'inline' });
				setTimeout(function(){
					refreshableContent.css({ display: 'block' });
				}, 10)
			}
		}

		function setContent(content, options) {
			return $.Deferred(function(d){
				var currentContent;

				// if content setting is currently in progress (quick navigation),
				// treat this like there's no anmiation and just show immediately
				if(settingContent) {
					options.animate = false;
					clearTimeout(contentTimeout);
					refreshableContent.empty();
					currentContent = $(document.createElement('div'))
						.addClass('slideable')
						.css({ minHeight: minContentHeight })
						.appendTo(refreshableContent);
					d.resolve();
				}

				settingContent = true;
				currentContent = refreshableContent.find('.slideable:first');
				var currentContentHeight = refreshableContent.outerHeight();

				if(options && options.animate) {
					var duration = options.duration || fullDuration;
					var newContent = $(document.createElement('div'));

					switch(options.animate) {
						case 'left':
							newContent.addClass('slideable')
								.appendTo(refreshableContent)
								.html(content)
								.css({ minHeight: minContentHeight })
								.evolutionTransform({ x: fullWidth, y: -1 * currentContentHeight })
								.evolutionTransform({ x: 0, y: -1 * currentContentHeight }, {
									duration: duration,
									easing: easing,
									complete: function() {
										newContent.evolutionTransform({ x: 0, y: 0 })
										currentContent.remove();
										correctContentDisplay();
										settingContent = false;
										d.resolve();
									}
								});
							currentContent
								.evolutionTransform({ x: -1 * fullWidth, y: 0 },
									{ duration: duration, easing: easing });
							break;
						case 'right':
							newContent.addClass('slideable')
								.appendTo(refreshableContent)
								.html(content)
								.css({ minHeight: minContentHeight })
								.evolutionTransform({ x: -1 * fullWidth, y: -1 * currentContentHeight })
								.evolutionTransform({ x: 0, y: -1 * currentContentHeight }, {
									duration: duration,
									easing: easing,
									complete: function() {
										newContent.evolutionTransform({ x: 0, y: 0 })
										currentContent.remove();
										correctContentDisplay();
										settingContent = false;
										d.resolve();
									}
								});
							currentContent
								.evolutionTransform({ x: fullWidth, y: 0 },
									{ duration: duration, easing: easing });

							break;
						case 'dissolve':
						default:
							newContent.addClass('slideable')
								.appendTo(refreshableContent)
								.html(content)
								.css({ minHeight: minContentHeight, opacity: 0 })
								.evolutionTransform({ x: 0, y: -1 * currentContentHeight, opacity: 0 })
								.evolutionTransform({ x: 0, y: -1 * currentContentHeight, opacity: 1 }, {
									duration: duration / 2,
									easing: easing,
									complete: function() {
										newContent.evolutionTransform({ x: 0, y: 0, opacity: 1.0 });
										currentContent.remove();
										correctContentDisplay();
										settingContent = false;
										d.resolve();
									}
								});
							currentContent
								.evolutionTransform({ opacity: 0.01 },
									{ duration: duration / 2, easing: easing });
					}
				} else {
					// no animation
					currentContent.html(content);
					correctContentDisplay();
					settingContent = false;
					d.resolve();
				}

			}).promise();
		}

		function hideMessage() {
			messageContainer
				.evolutionTransform({ x: 0, y: -1 * messageContainer.outerHeight() },
					{ duration: fullDuration, easing: easing });
		}

		function showMessage(message, cssClass) {
			messageContainer.evolutionTransform({ x: 0, y: -300 });
			messageContainer.empty().append(message);
			if(cssClass) {
				messageContainer.removeClass().addClass(cssClass);
			}
			messageContainer
				.evolutionTransform({ x: 0, y: -1 * messageContainer.outerHeight() })
				.evolutionTransform({ x: 0, y: 0 },
					{ duration: fullDuration, easing: easing });
		}

		function alert(message, callback) {
			if (global.navigator.notification !== undefined && global.navigator.notification.alert !== undefined) {
				global.navigator.notification.alert(message, (callback === undefined ? function() { } : callback), '');
			} else {
				defaultAlert(message);
				if (callback) {
					callback();
				}
			}
		}

		function confirm(message, callback) {
			if (global.navigator.notification !== undefined && global.navigator.notification.confirm !== undefined) {
				global.navigator.notification.confirm(message, function(b) { if(callback !== undefined) { callback(b==1) } }, '');
			} else {
				var result = global.confirm(message);
				if (callback) {
					callback(result);
				}
			}
		}

		function displayMessage(message, options) {
			if(!message) {
				hideMessage();
				return;
			}
			clearTimeout(messageTimeout);
			var cssClass = null;
			if(options) {
				cssClass = options.cssClass;
				if(options.disappearAfter) {
					messageTimeout = setTimeout(function(){
						clearTimeout(messageTimeout);
						hideMessage();
					}, options.disappearAfter)
				}
			} else {
				// default to 5 second disappear
				messageTimeout = setTimeout(function(){
					clearTimeout(messageTimeout);
					hideMessage();
				}, 5000)
			}
			showMessage(message, cssClass);
		}

		function showLoadingIndicator(options) {
			if(loadingIndicatorShown)
				return;
			loadingIndicatorShown = true;
			var targetOpacity = 0.99;
			if(options) {
				if(options.cssClass) {
					loadingIndicator.addClass(options.cssClass);
				}
				if(options.content) {
					loadingIndicator.empty().append(options.content);
				}
				if(options.opacity) {
					targetOpacity = options.opacity;
				}
			}
			var headerHeight = header.outerHeight();
			var extraTopPadding = (header.data('_extra_top_padding') || 0);
			loadingIndicator.css({
				position: 'absolute',
				top: headerHeight - extraTopPadding,
				left: 0,
				bottom: 0,
				right: 0,
				display: 'block'
			});
			loadingIndicator.evolutionTransform({
				opacity: targetOpacity
			}, {
				duration: fullDuration,
				easing: easing
			});
		}

		function hideLoadingIndicator() {
			loadingIndicatorShown = false;
			loadingIndicator.evolutionTransform({ opacity: 0 }, {
				duration: fullDuration,
				easing: easing,
				complete: function() {
					loadingIndicator.css({
						opacity: 0.01,
						top: -5000,
						bottom: 'auto'
					});
				}
			});
		}

		function positionDebug(openPercent) {
			var position = (1 - openPercent) * fullHeight;
			debugContainer.evolutionTransform({ x: 0, y: position },
				{ duration: fullDuration / 2, easing: easing });
		}

		function initDebug() {
			if(debugInited)
				return;
			debugInited = true;
			debugContainer.css({ left: 0 })
				.evolutionTransform({ x: 0, y: fullHeight + 20 }, { duration: 0 });

			debugContainer.on('swipedown', function(){
				switch(debugState) {
					case 'closed':
						break;
					case 'min':
						debugState = 'closed';
						positionDebug(-2);
						debugContainer.hide();
						break;
					case 'open':
						debugState = 'min';
						positionDebug(1/4);
						break;
					case 'max':
						debugState = 'open';
						positionDebug(3/4);
						break;
				}
			});
			debugContainer.on('swipeup', function(){
				switch(debugState) {
					case 'closed':
						debugState = 'min';
						positionDebug(1/4);
						debugContainer.hide();
						break;
					case 'min':
						debugState = 'open';
						positionDebug(3/4);
						break;
					case 'open':
						debugState = 'max';
						positionDebug(1);
						break;
					case 'max':
						break;
				}
			});
		}

		function showDebugMessage(message) {
			initDebug();
			if(debugState === 'closed') {
				debugContainer.show();
				debugState = 'min';
				positionDebug(1/4);
			}
			if(global.console && global.console.log) {
				global.console.log(message);
			}
			debugContainer.prepend('<span>' + message + '</br /></span>');
		}

		function handleKeyboardRaisingEvents() {
			keyboardShim.handleVisibilityChange({
				container: content,
				onShow: function() {
					if(context.onKeyboardOpening)
						context.onKeyboardOpening();
				},
				onHide: function() {
					if(context.onKeyboardClosing)
						context.onKeyboardClosing();
				},
				onShown: function() {
					if(context.onKeyboardOpened)
						context.onKeyboardOpened();
				},
				onHidden: function() {
					if(context.onKeyboardClosed)
						context.onKeyboardClosed();
				}
			})
		}

		function blurFocusedElement() {
			if ($(document.activeElement).is('input, textarea')) {
				document.activeElement.blur();
			}
		}

		function handleKeyboardBlurringEvents() {
			// android already has os-level keyboard hiding/closing
			if(environment.device == 'android')
				return;
			gutter.on('pointerstart', blurFocusedElement);
		}

		function handleUnregisteringEvents() {
			if(!scrollable)
				return;
			// when content or navigation is loading, unregister any currently-registered
			// endless scrollable instances
			messaging.subscribe('mobile.content.loading', function(){
				scrollable.unregister('content');
			});
			messaging.subscribe('mobile.navigation.loading', function(){
				scrollable.unregister('navigation');
			});
		}

		function publishContentScrollTop() {
			messaging.publish(messages.contentScrollTop);
		}

		function publishContentScrollBottom(e) {
			if(content.get(0).scrollTop > 10)
				messaging.publish(messages.contentScrollBottom);
		}

		function publishNavigationScrollTop() {
			messaging.publish(messages.navigationScrollTop);
		}

		function publishNavigationScrollBottom(e) {
			if(gutter.get(0).scrollTop > 10)
				messaging.publish(messages.navigationScrollBottom);
		}

		function handleScrollBoundaryEvents() {
			if($.event.special.scrolltop)
				content.on('scrolltop', publishContentScrollTop);
			if($.event.special.scrollend)
				content.on('scrollend', publishContentScrollBottom);
			if($.event.special.scrolltop)
				gutter.on('scrolltop', publishNavigationScrollTop);
			if($.event.special.scrollend)
				gutter.on('scrollend', publishNavigationScrollBottom);
		}

		// prevent bouncing
		scrollFix.preventBounce(gutter);
		scrollFix.preventBounce(content);
		scrollFix.fix(debugContainer);
		scrollFix.fix(header);

		// set up initial dimensions, and re-calc on orient change
		initDimensions();
		messaging.subscribe('mobile.orientationchange', messaging.GLOBAL_SCOPE, function(){
			setTimeout(function(){
				initDimensions();
			}, 300);
		});
		initDebug();

		// handle gestures
		registerGutterRevealingEvents(contentWrapper);
		registerGutterRevealingEvents(gutterWrapper);

		pullToRefresh = new PullToRefresh({
			enablePan: enablePan,
			container: content,
			indicator: refreshIndicator,
			content: refreshableContent,
			overflow: refreshOverflow,
			revealThrottle: refreshRevealThrottle,
			revealStart: function() {
				if(context.onRefreshRevealStart)
					context.onRefreshRevealStart();
			},
			reveal: function(percent) {
				if(context.onRefreshRevealing)
					context.onRefreshRevealing(percent);
			},
			load: function(complete) {
				if(context.onRefreshing)
					context.onRefreshing(complete);
			}
		});

		sheet = new Sheet({
			enablePan: enablePan,
			parent: viewport,
			maxHeightPerent: sheetMaxHeightPerent,
			cssClass: sheetCssClass,
			backgroundColor: sheetBackgroundColor,
			backgroundOpacity: sheetBackgroundOpacity,
			animationDuration: fullDuration * 2/3,
			animationEasing: easing,
			onOpening: context.onSheetOpening,
			onOpened: context.onSheetOpened,
			onClosing: context.onSheetClosing,
			onClosed: context.onSheetClosed
		});

		actionSheet = new ActionSheet({
			sheet: sheet
		});

		handleScrollBoundaryEvents();
		handleKeyboardRaisingEvents();
		handleUnregisteringEvents();
		handleKeyboardBlurringEvents();

		global.alert = function(message) { alert(message, null); };

		$.telligent.evolution.notifications.show = function(message, options) {
			displayMessage(message, {
				disappearAfter: options.duration || 5000,
				cssClass: options.type || 'success'
			});
		};

		// double tap to scroll header
		if(doubleTapHeaderToScroll) {
			header.on('doubletap', function(){
				content.animate({
					scrollTop: 0
				}, { duration: fullDuration });
			});
		}
		// also handle statusTap taps to navigate back to the top
		// https://github.com/martinmose/cordova-statusTap/blob/0815259b749828cce12db6f2f88832bb21d36627/README.md)
		if(global.addEventListener){
			global.addEventListener('statusTap', function() {
				content.animate({
					scrollTop: 0
				}, { duration: fullDuration });
			});
		}

		return {
			navigable: function(isNavigable) {
				if(isNavigable !== undef)
					navigable  = isNavigable;
				return navigable;
			},
			refreshable: function(isRefreshable) {
				return pullToRefresh.enabled(isRefreshable);
			},
			navigationVisible: function(visible) {
				if(visible !== undef) {
					if(visible && !opened) {
						open(fullDuration * openPercent);
					} else if(!visible && opened) {
						close(fullDuration * openPercent);
					}
				}
				return opened;
			},
			navigationScrollTop: function(to) {
				if(to !== undef && isNaN(to)) {
					to = $(to).offset().top;
				}
				gutter.scrollTop(to);
				return gutter.scrollTop();
			},
			contentScrollTop: function(to) {
				if(to !== undef && isNaN(to)) {
					var headerHeight = header.outerHeight();
					var extraTopPadding = (header.data('_extra_top_padding') || 0);
					to = $(to).offset().top - (headerHeight - extraTopPadding + 10);
				}

				content.scrollTop(to);
				return content.scrollTop();
			},
			setContent: function(content, options) {
				return setContent(content, options);
			},
			displayMessage: function(message, options) {
				displayMessage(message, options);
			},
			alert: function(message, callback) {
				alert(message, callback);
			},
			confirm: function(message, callback) {
				confirm(message, callback);
			},
			debug: function(message) {
				showDebugMessage(message);
			},
			displaySheet: function(options) {
				options = options || {};
				if(options.links) {
					actionSheet.show({
						links: options.links
					});
				} else if(options.content) {
					sheet.show(options.content);
				}
			},
			hideSheet: function() {
				sheet.hide();
			},
			showLoading: function(options) {
				showLoadingIndicator(options);
			},
			hideLoading: function() {
				hideLoadingIndicator();
			},
			refresh: function() {
				pullToRefresh.refresh();
			},
			setClass: function(className) {
				context.viewport.removeClass();
				if(className)
					context.viewport.addClass(className);
			},
			navigationContent: function() {
				return gutterContent;
			},
			content: function() {
				return refreshableContent.find('.slideable:first');
			},
			contentWrapper: function() {
				return refreshableContent;
			},
			viewport: function() {
				return viewport;
			},
			scrollable: function(options) {
				if(!scrollable || !options || !options.load || !options.complete)
					return;

				var name = options.region || 'content';
				options.initialPageIndex = options.initialPageIndex || 0;
				options.preFillAttempts = options.preFillAttempts || 5;
				if(name == 'content') {
					options.container = content;
					options.element = function() {
						return refreshableContent.find('.slideable:first');
					};
					options.scrollEndMessage = messages.contentScrollBottom;
				} else {
					options.container = gutter;
					options.element = function() {
						return gutterContent;
					};
					options.scrollEndMessage = messages.navigationScrollBottom;
				}
				options.buildIndicator = function() {
					return $('<div class="scrollable-loading-indicator"><span class="icon cw"></span></div>');
				};

				scrollable.register(name, options)
			}
		};
	};

	return Shell;

}, jQuery, window);