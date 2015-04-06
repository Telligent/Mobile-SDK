/* Controller (Internal API)
 *
 * Coordinates navigation, UI, transport, and authentication
 * Exposes an API which is ultimately exposed as the Public Mobile API by the API module
 *
 * Additionally, triggers messages
 *
 * var controller = new Controller(options)
 *
 * Options:
 *
 *	 allowAnonymous: false,
 *	 isHttpAuth: false,
 *
 *   // navigation settings
 *   defaultContentUrl: 'default',
 *   navigationContentUrl: 'navigation',
 *
 *   // shell settings
 *   enableRefreshButton: true
 *   enablePan: true
 *   enableSoftBackButton: true
 *   doubleTapHeaderToScroll: true
 *	 focusInputsOnLabelTap: false,
 *
 *   // loading overlay settings
 *   loadingCssClass: 'loading',
 *   loadingContent: '<span class="icon cw"></span>',
 *   loadingOpacity: 0.7,
 *
 *   // animation settings
 *   easing: 'cubic-bezinavigationOpenPercenter(0.160, 0.060, 0.450, 0.940)',
 *   navigationOpenPercent: 0.8,
 *   navigationOpenDuration: 275,
 *   navigationClosedOffsetPercent: -.02
 *   navigationClosedZoom: 0
 *
 *   // Sheet Settings
 *   sheetMaxHeightPerent: 0.7
 *   sheetCssClass: 'sheet'
 *   sheetBackgroundColor: '#333'
 *   sheetBackgroundOpacity: 0.7
 *
 *   // pull to refresh options
 *   refreshOverflow: 10 // extra pixels needed to pull past indicator's height to trigger refresh (default 20)
 *   refreshRevealThrottle: 10 // min milliseconds between 'reveal' callbacks (default 10)
 *
 *   // how long to leave page content in the cache (doesn't affect how long history is cached)
 *   // also reflects the maximum amount of time between pause and resume where the app does not refresh upon resuming (to support fast switching back and forth)
 *   cacheDuration: 10 * 60 * 1000 // 10 minutes
 *
 * 	 telephonePattern: null
 *
 * Methods:
 *   refreshable: function(isRefreshable)
 *   navigable: function(isNavigable)
 *   load: function(url, options)
 *   refresh: function()
 *   back: function(refresh)
 *   navigationVisible: function(isVisible)
 *   navigationScrollTop: function(to)
 *   contentScrollTop: function(to)
 *   displayMessage: function()
 *   alert()
 *   confirm()
 *   setHeaderButton: function(buttonElement)
 *   setHeaderContent: function(buttonElement)
 *   refreshNavigation: function()
 *   setClass: function(className)
 *   debug: function(message)
 *   reset: function(shouldReload) // when shouldReload is defined and true, also performs a window.location.reload
 *   addRefreshParameter: function(key, value)
 *   displaySheet(options) // displays either a list of links/actions (with optional cancel) or arbitrary contnent
 *     options
 *       links: array of link objects
 *       content: when links aren't provided, arbitrary content can be shown. string, DOM, or jQuery selection.
 *   hideSheet()
 *   alert(message, callback)
 *     displays the provided message and executes the callback when the message has been dismissed
 *   confirm(message, callback)
 *     displays the message and executes the callback with a single boolean parameter identifying if the message was accepted positively
 *   scrollable(options) // sets a region to be endlessly scrollable
 *     options:
 *       region: 'content' || 'navigation'  // required
 *       load: function(pageIndex, complete, error)    // required
 *       complete: function(content)    // required
 *       initialpageIndex: 0
 *       preFillAttempts: 5
 *   clearContent(url)
 *     clears the currently-cached content for a url (or current page when not provided) to force a refresh on next load or navigation back to it
 *   excludeFromHistory()
 *   setExpiration(data, url)
 *   showLoading(promise)
 *     Shows the loading indicator. If passed an optional promise parameter, shows the loading indicator until the promise resolves or rejects, then automatically hiding it. Returns the
 *   hideLoading()
 *   excludeFromHistory()
 *   setExpiration(date, url)
 *   detectData
 *
 * Messages:
 *   mobile.content.refreshing
 *   mobile.content.refreshed
 *   mobile.content.loading   data: url
 *   mobile.content.loaded 		   data: url
 *   mobile.content.rendered 		   data: url
 *   mobile.navigation.loading
 *   mobile.navigation.loaded
 *   mobile.navigation.opening
 *   mobile.navigation.opened
 *   mobile.navigation.closing
 *   mobile.navigation.closed
 *   mobile.navigation.rendered 		   data: url
 *   mobile.sheet.opening
 *   mobile.sheet.opened
 *   mobile.sheet.closing
 *   mobile.sheet.closed
 *   mobile.keyboard.open
 *   mobile.keyboard.close
 *   mobile.orientationchange
 *   mobile.online
 *   mobile.offline
 *   mobile.start
 *   mobile.pause
 *   mobile.resume
 */

/// @name mobile
/// @category JavaScript API Module
/// @description Mobile shell API methods
///
/// ### jQuery.telligent.evolution.mobile
///
/// This module provides methods for interacting with the mobile shell.
///
/// ### Methods
///
/// #### addRefreshParameter
///
/// Adds a parameter(s) to the query string for the next call to `refresh()`. Added parameters are not persisted in the stack nor retained after the refresh, though they can be read out of the querystring by the widget (either in Velocity or JavaScript) and re-applied. Combined with calls to `refresh()`, this can be useful for implementing filters within a widget.
///
///     $.telligent.evolution.mobile.addRefreshParameter(key, value)
///
/// #### alert
///
/// Displays the provided message and executes the callback when the message has been dismissed
///
///     $.telligent.evolution.mobile.alert(message, callback)
///
/// #### back
///
/// Navigates back in the navigation stack.
///
///     $.telligent.evolution.mobile.back()
///     $.telligent.evolution.mobile.back(refresh) // clears cache of previous URL forcing its refresh
///
/// #### clearContent
///
/// Clears the currently-cached content for a url (or current page if not provided). This is useful to force a refresh of its content on next load or navigation back to it.
///
///     // Clear current page's content
///     $.telligent.evolution.mobile.clearContent()
///
///     // Clear explicit page's content
///     $.telligent.evolution.mobile.clearContent(url)
///
/// #### confirm
///
/// Displays the message and executes the callback with a single boolean parameter identifying if the message was accepted positively
///
///     $.telligent.evolution.mobile.confirm(message, callback)
///
/// #### contentScrollTop
///
/// Scrolls the content to an offset or element, and returns current scroll position.
///
///     // scroll to an element
///     $.telligent.evolution.mobile.contentScrollTop(element)
///
///     // scroll to a position
///     $.telligent.evolution.mobile.contentScrollTop(yOffset)
///
///     // get the current content scroll position
///     var currentContentScrollTop = $.telligent.evolution.mobile.contentScrollTop()
///
/// #### debug
///
/// Displays a message in a semi-transparent fixed overlay for debugging.
///
///     $.telligent.evolution.mobile.debug(message)
///
/// #### displayMessage
///
/// Displays a non-modal message.
///
///     $.telligent.evolution.mobile.displayMessage(message, options)
///
/// *options*
///
///  * `cssClass`: CSS Class to apply to the message. Can be 'info', 'warning', or any other class name.
///  * `disappearAfter`: Milliseconds after which the message disappears. Default: 5000
///
/// #### displaySheet
///
/// Displays an overlay of either links or arbitrary content.
///
/// *options*
///
///  * `links`: When provided, an array of anchor elements rendered as a list.
///  * `content`: When links are not provided, arbitrary content (HTML fragment, DOM element, or jQuery selection) can be provided
///
/// #### hideLoading
///
/// Hides the loading animation
///
///     $.telligent.evolution.mobile.hideLoading()
///
/// #### excludeFromHistory
///
/// Excludes the current content from the navigation history
///
///     $.telligent.evolution.mobile.excludeFromHistory()
///
/// #### hideSheet
///
/// Hides the overlay sheet if visible.
///
///     $.telligent.evolution.mobile.hideSheet()
///
/// #### init
///
/// Initiates the mobile shell. This is to only be called once. By default, the shell is initiated from a script resource..
///
///     $.telligent.evolution.mobile.init(options)
///
/// *options*
///
/// *navigation*
///
///  * `defaultContentUrl`: Default content page to load when starting *default*: `'default'`
///  * `navigationContentUrl`: Navigation page *default*: `'navigation'`
///  * `cacheDuration`: Client-side cache duration *default*: `600000`
///
/// *shell*
///
///  * `enableRefreshButton`: Whether the explicit refresh button should be enabled in addition to pull-to-refresh. *default*: `($.telligent.evolution.mobile.environment.device != 'ios')`
///  * `enablePan`: Whether panning should be enabled *default*: `($.telligent.evolution.mobile.environment.device == 'ios')`
///  * `enableSoftBackButton`: Whether a soft back button should be enabled *default*: `($.telligent.evolution.mobile.environment.device == 'ios' && $.telligent.evolution.mobile.environment.type != 'browser')`
///  * `doubleTapHeaderToScroll`: Whether double tapping the header should scroll to the top *default*: `true`
///  * `focusInputsOnLabelTap`: Whether tapping a label should focus on its input *default*: `false`
///  * `telephonePattern`: Regular Expression used when matching telephone numbers in text *default*:  `"(?:(?:\\(?(?:00|\\+)?(?:[1-4]\\d\\d|[1-9]\\d?)\\)?)?[\\-\\.\\s\\\\\\/]?)?(?:(?:\\(?\\d{3,}\\)?[\\-\\.\\s\\\\\\/]?){2,})"`
///
/// *loading overlay*
///
///  * `loadingCssClass`: CSS class applied to loading indicator *default*: `'loading'`
///  * `loadingContent`: Content shown within loading indicator *default*: `'<span class="icon cw"></span>'`
///  * `loadingOpacity`: Opacity of loading indicator *default*: `0.7`
///
/// *animation*
///
///  * `easing`: Default global animation easing *default*: `'cubic-bezier(0.160, 0.060, 0.450, 0.940)'`
///  * `navigationOpenPercent`: Window percentage to open the navigation by default *default*: `0.8`
///  * `navigationOpenDuration`: Navigation animation duration *default*: `275`
///  * `navigationClosedOffsetPercent`: Navigation position offset when closed *default*: `0.1`
///  * `navigationClosedZoom`: Navigation zoom transform when closed *default*: `0.05`
///
/// *sheet*
///
///  * `sheetMaxHeightPerent`: Max sheet height as a percentage of the window *default*: `0.7`
///  * `sheetCssClass`: Sheet CSS class *default*: `'sheet'`
///  * `sheetBackgroundColor`: Sheet background color *default*: `'#333'`
///  * `sheetBackgroundOpacity`: Sheet opacity *default*: `0.7`
///
/// #### load
///
/// Loads a URL. Persists URL and its contents in the stack. If the URL being loaded already exists in the stack, navigates back to it. Persists current content's scroll position. Optionally supports refreshing a URL before loading it.
///
///     $.telligent.evolution.mobile.load(url)
///     $.telligent.evolution.mobile.load(url, options)
///
/// *options*
///
///  * `refresh`: When true, does not load from cache. *default: false*
///
/// #### navigable
///
/// Returns and/or sets whether the navigation menu can currently be opened via swiping or panning.
///
///     $.telligent.evolution.mobile.navigable(isNavigable)
///
/// #### navigationScrollTop
///
/// Scrolls the navigation to an offset or element, and returns current scroll position.
///
///     // scroll to an element
///     $.telligent.evolution.mobile.navigationScrollTop(element)
///
///     // scroll to a position
///     $.telligent.evolution.mobile.navigationScrollTop(yOffset)
///
///     // get the current navigation scroll position
///     var currentContentScrollTop = $.telligent.evolution.mobile.navigationScrollTop()
///
/// #### navigationVisible
///
/// Returns and/or sets whether the navigation menu is currently visible.
///
///     var isVisible = $.telligent.evolution.mobile.navigationVisible()
///     $.telligent.evolution.mobile.navigationVisible(shouldBeVisible)
///
/// #### refresh
///
/// Refreshes the current content URL.
///
///     $.telligent.evolution.mobile.refresh()
///
/// #### refreshable
///
/// Returns and/or sets whether pull-to-refresh is currently enabled. This is reset to true when content is loaded or refreshed.
///
///     var isRefreshable = $.telligent.evolution.mobile.refreshable();
///     $.telligent.evolution.mobile.refreshable(shouldBeRefreshable);
///
/// #### refreshNavigation
///
/// Refreshes the navigation page
///
///     $.telligent.evolution.mobile.refreshNavigation()
///
/// #### reset
///
/// Clears the history stack, refreshes the navigation page, and loads the default content URL. When `reload` is true, also performs a complete `window.location.reload()`
///
///     $.telligent.evolution.mobile.reset(reload);
///
/// #### scrollable
///
/// Sets a region to be endlessly scrollable. Handles scroll events, page indexes, pre-filling, scroll indicators, and context clearing on navigation or refreshing
///
///     $.telligent.evolution.mobile.scrollable(options)
///
/// *options*
///
///   * `region`: 'content' or 'navigation' *required*
///   * `load`: callback to load a page. Passed page index to load, and `complete` and `error` callbacks. Either `complete` or `error` must be called. `Complete` should be passed the new page of content.
///   * `complete`: callback to render a new page. Passed content successfully loaded from `load`. Only called when the scrollable region is still in context of the currently-loaded page
///   * `initialpageIndex`: 0 *optional*
///   * `preFillAttempts`: 5 *optional* Attempts, after which, the initial rendering of a scrollable should quit attempting to fill the visible vertical space
///
/// #### setClass
///
/// Applies a class name to the entire shell for as long as the current content is loaded
///
///     $.telligent.evolution.mobile.setClass('class')
///
/// #### setExpiration
///
/// Sets a custom expiration for the cache of the current (or explicitly provided) URL
///
///     // set the current page's cache to expire at the provided date
///     $.telligent.evolution.mobile.setExpiration(date);
///
///     // set the provided URL's cache to expire at the provided date
///     $.telligent.evolution.mobile.setExpiration(date, url);
///
/// #### setHeaderButton
///
/// Sets a widget-defined element to render in the top right of the header area. The element is removed upon the next load or refresh of content. There is no restriction on the behavior of this element. It can have its own event handlers bound to it.
///
///     $.telligent.evolution.mobile.setHeaderButton(buttonElement)
///
/// #### setHeaderContent
///
/// Sets a widget-defined element to render in the top center of the header area. The element is not removed upon the next load or refresh of content. There is no restriction on the behavior of this element. It can have its own event handlers bound to it.
///
///     $.telligent.evolution.mobile.setHeaderContent(content)
///
/// #### showLoading
///
/// Shows the loading animation over the content. If passed an optional `promise` argument, then only shows the animation while the promise is pending, hiding it upon resolution or rejection. Returns the same promise when a promise is passed.
///
///     $.telligent.evolution.mobile.showLoading()
///     // when passed a promise, hides the indicator as soon as the promise completes
///     promise = $.telligent.evolution.mobile.showLoading(promise);
///

/// @name mobile.content.refreshing
/// @category Client Message
/// @description Published before content refreshes
///
/// ### mobile.content.refreshing Message
///
/// [Client-side message](@messaging) published before content refreshes
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.refreshing', function(data) {
///         // handle the event
///     });
///

/// @name mobile.content.refreshed
/// @category Client Message
/// @description Published after content refreshes
///
/// ### mobile.content.refreshed Message
///
/// [Client-side message](@messaging) published after content refreshes
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.refreshed', function(data) {
///         // handle the event
///     });
///

/// @name mobile.content.loading
/// @category Client Message
/// @description Published before content loads, either from navigation or refreshing
///
/// ### mobile.content.loading Message
///
/// [Client-side message](@messaging) Published before content loads, either from navigation or refreshing
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.loading', function(data) {
///         // handle the event
///     });
///

/// @name mobile.content.loaded
/// @category Client Message
/// @description Published after content loads, either from navigation or refreshing
///
/// ### mobile.content.loaded Message
///
/// [Client-side message](@messaging) Published after content loads, either from navigation or refreshing
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.loaded', function(data) {
///         // handle the event
///     });
///

/// @name mobile.content.rendered
/// @category Client Message
/// @description Published after content is rendered, either from navigation or refreshing.
///
/// ### mobile.content.rendered Message
///
/// [Client-side message](@messaging) published after content is rendered, either from navigation or refreshing. This occurs after [mobile.content.loaded](@mobile.content.loaded) and any animation involved in exposing the content.
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.rendered', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.loading
/// @category Client Message
/// @description Published when the navigation bar's content is loading
///
/// ### mobile.navigation.loading Message
///
/// [Client-side message](@messaging) Published when the navigation bar's content is loading
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.loading', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.loaded
/// @category Client Message
/// @description Published when the navigation bar's content has completed loading
///
/// ### mobile.navigation.loaded Message
///
/// [Client-side message](@messaging) Published when the navigation bar's content has completed loading
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.loaded', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.rendered
/// @category Client Message
/// @description Published when the navigation bar's content has completed rendering
///
/// ### mobile.navigation.rendered Message
///
/// [Client-side message](@messaging) Published when the navigation bar's content has rendered
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.rendered', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.opening
/// @category Client Message
/// @description Published when the navigation bar is opening
///
/// ### mobile.navigation.opening Message
///
/// [Client-side message](@messaging) Published when the navigation bar is opening
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.opening', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.opened
/// @category Client Message
/// @description Published when the navigation bar has finished opening
///
/// ### mobile.navigation.opened Message
///
/// [Client-side message](@messaging) Published when the navigation bar has finished opening
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.opened', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.closing
/// @category Client Message
/// @description Published when the navigation bar is closing
///
/// ### mobile.navigation.closing Message
///
/// [Client-side message](@messaging) Published when the navigation bar is closing
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.closing', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.closed
/// @category Client Message
/// @description Published when the navigation bar has finished closing
///
/// ### mobile.navigation.closed Message
///
/// [Client-side message](@messaging) Published when the navigation bar has finished closing
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.closed', function(data) {
///         // handle the event
///     });
///

/// @name mobile.sheet.opening
/// @category Client Message
/// @description Published when a sheet is opening
///
/// ### mobile.sheet.opening Message
///
/// [Client-side message](@messaging) Published when a sheet is opening
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.sheet.opening', function(data) {
///         // handle the event
///     });
///

/// @name mobile.sheet.opened
/// @category Client Message
/// @description Published when a sheet has completed opening
///
/// ### mobile.sheet.opened Message
///
/// [Client-side message](@messaging) Published when a sheet has completed opening
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.sheet.opened', function(data) {
///         // handle the event
///     });
///

/// @name mobile.sheet.closing
/// @category Client Message
/// @description Published when a sheet is closing
///
/// ### mobile.sheet.closing Message
///
/// [Client-side message](@messaging) Published when a sheet is closing
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.sheet.closing', function(data) {
///         // handle the event
///     });
///

/// @name mobile.sheet.closed
/// @category Client Message
/// @description Published when a sheet has completed closing
///
/// ### mobile.sheet.closed Message
///
/// [Client-side message](@messaging) Published when a sheet has completed closing
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.sheet.closed', function(data) {
///         // handle the event
///     });
///

/// @name mobile.keyboard.open
/// @category Client Message
/// @description Published when the keyboard has opened
///
/// ### mobile.keyboard.open Message
///
/// [Client-side message](@messaging) Published when the keyboard has opened
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.keyboard.open', function(data) {
///         // handle the event
///     });
///

/// @name mobile.keyboard.close
/// @category Client Message
/// @description Published when the keyboard has closed
///
/// ### mobile.keyboard.close Message
///
/// [Client-side message](@messaging) Published when the keyboard has closed
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.keyboard.close', function(data) {
///         // handle the event
///     });
///

/// @name mobile.orientationchange
/// @category Client Message
/// @description Cross-platform message published when the orientation of the device has changed
///
/// ### mobile.orientationchange Message
///
/// [Client-side message](@messaging) Cross-platform message published when the orientation of the device has changed
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.orientationchange', function(data) {
///         // handle the event
///     });
///

/// @name mobile.online
/// @category Client Message
/// @description Cross-platform message published when the device's state switches to online
///
/// ### mobile.online Message
///
/// [Client-side message](@messaging) Cross-platform message published when the device's state switches to online
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.online', function(data) {
///         // handle the event
///     });
///

/// @name mobile.offline
/// @category Client Message
/// @description Cross-platform message published when the device's state switches to offline
///
/// ### mobile.offline Message
///
/// [Client-side message](@messaging) Cross-platform message published when the device's state switches to offline
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.offline', function(data) {
///         // handle the event
///     });
///

/// @name mobile.start
/// @category Client Message
/// @description Cross-platform message published when the app is launched
///
/// ### mobile.start Message
///
/// [Client-side message](@messaging) Cross-platform message published when the app is started on the device
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.start', function(data) {
///         // handle the event
///     });
///

/// @name mobile.pause
/// @category Client Message
/// @description Cross-platform message published when the app's state is paused by the device
///
/// ### mobile.pause Message
///
/// [Client-side message](@messaging) Cross-platform message published when the app's state is paused by the device
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.pause', function(data) {
///         // handle the event
///     });
///

/// @name mobile.resume
/// @category Client Message
/// @description Cross-platform message published when the app's state is resumed by the device
///
/// ### mobile.resume Message
///
/// [Client-side message](@messaging) Cross-platform message published when the app's state is resumed by the device
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.resume', function(data) {
///         // handle the event
///     });
///

define('controller', ['shell', 'transport', 'navigator', 'authentication', 'uilinks', 'messaging', 'environment', 'storage', 'postlisthandler', 'dataDetector', 'scrollfix'],
	function(Shell, transport, Navigator, Authenticator, uilinks, messaging, environment, storage, PostListHandler, DataDetector, scrollfix, $, global, undef)
{
	var messages = {
		contentRefreshing: 'mobile.content.refreshing',
		contentRefreshed: 'mobile.content.refreshed',
		contentLoading: 'mobile.content.loading',
		contentLoaded: 'mobile.content.loaded',
		contentRendered: 'mobile.content.rendered',
		navigationLoading: 'mobile.navigation.loading',
		navigationLoaded: 'mobile.navigation.loaded',
		navigationOpening: 'mobile.navigation.opening',
		navigationOpened: 'mobile.navigation.opened',
		navigationClosing: 'mobile.navigation.closing',
		navigationClosed: 'mobile.navigation.closed',
		navigationRendered: 'mobile.navigation.rendered',
		sheetOpening: 'mobile.sheet.opening',
		sheetOpened: 'mobile.sheet.opened',
		sheetClosing: 'mobile.sheet.closing',
		sheetClosed: 'mobile.sheet.closed',
		orientationChange: 'mobile.orientationchange',
		keyboardOpen: 'mobile.keyboard.open',
		keyboardClose: 'mobile.keyboard.close',
		keyboardOpened: 'mobile.keyboard.opened',
		keyboardClosed: 'mobile.keyboard.closed',
		online: 'mobile.online',
		offline: 'mobile.offline',
		start: 'mobile.start',
		pause: 'mobile.pause',
		resume: 'mobile.resume'
	};

	function captureElements(context) {
		context.gutterContent = $('#gutter-content');
		context.refreshIndicator = $('#refresh-indicator');
		context.refreshableContent = $('#refreshable-content');
		context.header = $('#header');
		context.content = $('#content');
		context.window = $(window);
		context.viewport = $('#viewport');
	}

	function showLoading(context) {
		context.shell.showLoading({
			cssClass: context.loadingCssClass,
			content: context.loadingContent,
			opacity: context.loadingOpacity
		});
	}

	function hideLoading(context) {
		context.postListHandler.clearHighlights();
		context.shell.hideLoading();
	}

	function buildShell(context) {
		context.refreshIndicatorPull = context.refreshIndicatorPull ||
			$('<span class="icon pull down-circled"></span>')
				.hide()
				.appendTo(context.refreshIndicator);
		context.refreshIndicatorPullVisible = false;
		context.refreshIndicatorRelease = context.refreshIndicatorRelease ||
			$('<span class="icon release cw"></span>')
				.hide()
				.appendTo(context.refreshIndicator);
		context.refreshIndicatorReleaseVisible = false;

		context.shell = new Shell({
			// animation settings
			easing: context.easing,
			navigationOpenPercent: context.navigationOpenPercent,
			navigationOpenDuration: context.navigationOpenDuration,
			navigationClosedOffsetPercent: context.navigationClosedOffsetPercent,
			navigationClosedZoom: context.navigationClosedZoom,
			// Sheet Settings
			sheetMaxHeightPerent: context.sheetMaxHeightPerent,
			sheetCssClass: context.sheetCssClass,
			sheetBackgroundColor: context.sheetBackgroundColor,
			sheetBackgroundOpacity: context.sheetBackgroundOpacity,
			// refresh settings
			refreshOverflow: context.refreshOverflow,
			refreshRevealThrottle: context.refreshRevealThrottle,

			doubleTapHeaderToScroll: context.doubleTapHeaderToScroll,
			enablePan: context.enablePan,
			header: context.header,
			viewport: context.viewport,
			gutter: '#gutter',
			content: context.content,
			contentWrapper: '#content-wrapper',
			gutterWrapper: '#gutter-wrapper',
			gutterContent: context.gutterContent,
			refreshIndicator: context.refreshIndicator,
			refreshableContent: context.refreshableContent,
			debugContainer: '#debug',
			onRefreshRevealStart: function() {
				context.refreshIndicatorPull.evolutionTransform({
					opacity: 0,
					duration: 20
				});
			},
			onRefreshRevealing: function(percent) {
				if(percent >= 1) {
					percent = 1;
					context.refreshIndicatorPull.addClass('ready');
				} else{
					context.refreshIndicatorPull.removeClass('ready');
				}
				if(context.refreshIndicatorReleaseVisible) {
					context.refreshIndicatorRelease.hide();
					context.refreshIndicatorReleaseVisible = false;
				}
				if(!context.refreshIndicatorPullVisible) {
					context.refreshIndicatorPull.show();
					context.refreshIndicatorPullVisible = true;
				}
				if(context.refreshIndicatorPullVisible) {
					percent = Math.round(percent * 100) / 100;
					if(context.lastRefreshOpacity == undef || context.lastRefreshOpacity != percent) {
						context.lastRefreshOpacity = percent;
						context.refreshIndicatorPull.evolutionTransform({
							rotate: (percent == 1 ? 180 : 0),
							opacity: percent
						}, {
							duration: context.refreshRevealThrottle
						});
					}
				}
			},
			onRefreshing: function(complete) {
				context.refreshing = true;
				messaging.publish(messages.contentRefreshing);
				// store ref to method to call when completed
				context.refreshIndicatorPull.hide();
				context.refreshIndicatorPullVisible = false;
				context.refreshIndicatorRelease.show();
				context.refreshIndicatorReleaseVisible = true;
				context.refreshComplete = function() {
					context.refreshIndicatorPull.hide();
					context.refreshIndicatorPullVisible = false;
					context.refreshIndicatorRelease.hide();
					context.refreshIndicatorReleaseVisible = false;
					scrollfix.isScrolling(false);
					complete();
					context.refreshing = false;
					messaging.publish(messages.contentRefreshed);
				}
				context.navigator.refresh(context.refreshParams);
			},
			onNavigationOpening: function() {
				messaging.publish(messages.navigationOpening);
			},
			onNavigationOpened: function() {
				messaging.publish(messages.navigationOpened);
			},
			onNavigationClosing: function() {
				messaging.publish(messages.navigationClosing);
			},
			onNavigationClosed: function() {
				messaging.publish(messages.navigationClosed);
			},
			onSheetOpening: function() {
				messaging.publish(messages.sheetOpening);
			},
			onSheetOpened: function() {
				messaging.publish(messages.sheetOpened);
			},
			onSheetClosing: function() {
				messaging.publish(messages.sheetClosing);
			},
			onSheetClosed: function() {
				messaging.publish(messages.sheetClosed);
			},
			onKeyboardOpening: function() {
				messaging.publish(messages.keyboardOpen);
			},
			onKeyboardClosing: function() {
				messaging.publish(messages.keyboardClose);
			},
			onKeyboardOpened: function() {
				messaging.publish(messages.keyboardOpened);
			},
			onKeyboardClosed: function() {
				messaging.publish(messages.keyboardClosed);
			}
		});
	}

	function getLastPausedTime() {
		var storedPause = storage.get('last_paused_at');
		if(storedPause) {
			return parseFloat(storedPause);
		} else {
			return new Date().getTime();
		}
	}

	function updateLastPausedTime(date) {
		storage.set('last_paused_at', (date || new Date()).getTime());
	}

	function handleAndRaiseDeviceMessages(context) {
		$(global).on('orientationchange', function(){
			messaging.publish(messages.orientationChange);
		})

		document.addEventListener('deviceready', function () {
			context.navigator.refresh(context.refreshParams);
			messaging.publish(messages.start);
		}, false);

		document.addEventListener('offline', function() {
			messaging.publish(messages.offline);
		}, false);

		document.addEventListener('online', function() {
			messaging.publish(messages.online);
		}, false);

		document.addEventListener('resume', function() {
			// refresh the current page if resuming after a while
			// don't refresh if quickly switching back and forth between apps
			var lastPausedAt = getLastPausedTime();
			if((new Date().getTime() - lastPausedAt) >= context.cacheDuration) {
				context.navigator.refresh(context.refreshParams);
			}
			messaging.publish(messages.resume);
		}, false);

		document.addEventListener('pause', function() {
			updateLastPausedTime(new Date());
			messaging.publish(messages.pause);
		}, false);
	}

	// prevents focusing on inputs in regions not shown
	function handleFocusPreventionWithinRegion(context) {

		context.shell.contentWrapper().on({
			focusin: function(e) {
				if(context.shell.navigationVisible()) {
					$(e.target).blur();
					context.shell.navigationContent().find('input,select,textarea').last().focus();
					return false;
				}
			}
		});

		context.shell.navigationContent().on({
			focusin: function(e) {
				if(!context.shell.navigationVisible()) {
					$(e.target).blur();
					context.shell.contentWrapper().find('input,select,textarea').first().focus();
					return false;
				}
			}
		});
	}

	function preventLabelFocusing(context) {
		if(!context.focusInputsOnLabelTap) {
			context.refreshableContent.on('tap', 'label', function(e){
				e.preventDefault();
				return false;
			});
		}
	}

	function handleHijackedLinkActivation(context, link, replace, e) {
		var href = link.attr('href') ||
			link.closest('[href]').attr('href');

		// don't block message links
		if(link.data('messagename')) {
			return true;
		}

		// ignore empty links
		var trimedHref = $.trim(href);
		if(trimedHref == '#') {
			return false;
		} else if (trimedHref.indexOf('http:') < 0 && trimedHref.indexOf('https:') < 0 && trimedHref.indexOf(':') >= 0) {
			window.location.href = trimedHref;
			return false;
		}

		e.stopPropagation();
		loadUrl(context, href, replace, false);

		return true;
	}

	function loadUrl(context, url, replace, refresh) {
		// specific links
		if(url.indexOf('#login') >= 0) {
			context.authenticator.login();
		} else if(url.indexOf('#logout') >= 0) {
			context.authenticator.logout();
		} else if(url.indexOf('#') === 0) {
			// anchor links
			context.shell.contentScrollTop($('a[name='+url.substr(1)+'],a[id='+url.substr(1)+']').first());
		// actual links
		} else {
			context.navigator.navigateTo(url, {
				replace: replace,
				refresh: refresh,
				currentContentScrollTop: context.shell.contentScrollTop()
			});
		}
	}

	function hijackLinks(context) {
		context.refreshableContent.on('click', 'a', function(e){
			e.preventDefault();
			if(scrollfix.isScrolling()) {
				return false;
			} else {
				return handleHijackedLinkActivation(context, $(e.target), false, e);
			}
		});
		context.gutterContent.on('click', 'a', function(e){
			e.preventDefault();
			context.shell.navigationVisible(false);
			return handleHijackedLinkActivation(context, $(e.target), true, e);
		});
		context.header.on('click', 'a', function(e){
			e.preventDefault();
			return handleHijackedLinkActivation(context, $(e.target), false, e);
		});
	}

	function showNavigationButtons(context) {
		if(context.enableSoftBackButton) {
			global.setTimeout(function(){
				// conditionally enable/disable menu/back buttons
				if(context.navigator.canNavigateBack()) {
					show(context.backButton);
					hide(context.menuButton);
					hide(context.closeKeyboardButton);
				} else {
					hide(context.backButton);
					hide(context.closeKeyboardButton);
					if(context.shell.navigable())
						show(context.menuButton);
				}
			}, 10)
		} else {
			hide(context.backButton);
			hide(context.closeKeyboardButton);
			if(context.shell.navigable())
				show(context.menuButton);
		}
	}

	function buildNavigator(context) {
		context.navigator = new Navigator({
			authenticator: context.authenticator,
			defaultUrl: context.defaultContentUrl,
			initFromStorage: environment.type == 'webapp',
			cacheDuration: context.cacheDuration,
			useDeviceBrowserForExternalUrls: context.isHttpAuth,
			onDetermineRedirect: function() {
				global.clearTimeout(context.hideLoadingIndicatorTimeout);
				showLoading(context);
			},
			onDeterminedRedirect: function() {
				// hide the loading indicator after a brief delay
				// to give the actual content load a chance to cancel this so that
				// it's loader shows
				global.clearTimeout(context.hideLoadingIndicatorTimeout);
				context.hideLoadingIndicatorTimeout = global.setTimeout(function(){
					global.clearTimeout(context.hideLoadingIndicatorTimeout);
					hideLoading(context);
				}, 100);
			},
			onLoad: function(url) {
				global.clearTimeout(context.contentRenderedMessageTimeout);
				// clear any current header button
				if(context.currentHeaderButton)
					hide(context.currentHeaderButton, true);
				// show modal loading indicator if not the resul tof refreshing
				if(!context.refreshing) {
					global.clearTimeout(context.hideLoadingIndicatorTimeout);
					showLoading(context);
				}
				context.shell.hideSheet();
				messaging.publish(messages.contentLoading, {
					url: url
				});
				return transport.load(url);
			},
			onLoadError: function() {
				hideLoading(context);
				context.shell.displayMessage('An error has occurred', {
					cssClass: 'warning',
					disappearAfter: 10 * 1000
				});
			},
			onLoadFromCache: function(url) {
				messaging.publish(messages.contentLoading, {
					url: url
				});
			},
			onNavigated: function(url, content, direction, scrollTop) {
				global.clearTimeout(context.contentRenderedMessageTimeout);

				// clear any current header button
				if(context.currentHeaderButton)
					hide(context.currentHeaderButton, true);
				context.shell.setClass();
				// clear any previously used refresh params
				context.refreshParams = null;
				// if this was from a refresh, tell the shell we're done
				if(context.refreshComplete) {
					context.refreshComplete();
					delete context.refreshComplete;
				}

				// figure out which way to display it
				var animation = 'dissolve';
				if(direction == 'forward')
					animation = 'left';
				else if(direction == 'back')
					animation = 'right';

				// display the content
				context.shell.setContent(content, {
					animate: animation
				}).then(function(){
					//context.shell.contentScrollTop(scrollTop || 0);
				})
				context.shell.contentScrollTop(scrollTop || 0);

				context.refreshing = false;
				hideLoading(context);

				// raise an event that the content has been loaded
				messaging.publish(messages.contentLoaded, {
					url: url
				});

				// raise an event that the content has been shown
				context.contentRenderedMessageTimeout = global.setTimeout(function(){
					global.clearTimeout(context.contentRenderedMessageTimeout);
					messaging.publish(messages.contentRendered, {
						url: url
					});
				}, context.navigationOpenDuration * 2);

				showNavigationButtons(context);
			}
		});
	}

	function buildAuthenticator(context, controllerInstance) {
		context.authenticator = new Authenticator({
			controller: controllerInstance,
			isNative: transport.isNative(),
			useDeviceBrowserForLogin: context.isHttpAuth
		});
	}

	// buttonElement: jQuery selection or DOM element
	// alignment: 'left' or 'right'
	function addHeaderButton(context, buttonElement, region, animate) {
		$(buttonElement)
			.addClass('header-button')
			.css({ opacity: (animate ? 0.01 : 1) })
			.appendTo(region == 'shell' ? context.headerShellArea : context.headerButtonArea);
		if(animate)
			show(buttonElement);
	}

	function hide(el, remove, animate) {
		if(!animate) {
			if(remove === true || remove === 'remove') {
				el.remove();
			} else if(remove === 'detach') {
				el.detach();
			} else {
				el.css({
					display: 'none'
				});
			}
		} else {
			el.evolutionTransform({
				opacity: 0.01
			}, {
				duration: 200,
				complete: function() {
					if(remove === true || remove === 'remove') {
						el.remove();
					} else if(remove === 'detach') {
						el.detach();
					} else {
						el.css({
							display: 'none'
						});
					}
				}
			});
		}
		return el;
	}

	function show(el) {
		el.css({
			opacity: 0.01,
			display: 'block'
		});
		el.evolutionTransform({
			opacity: 0.99
		}, { duration: 200 } );
		return el;
	}

	// add default set of toolbar buttons
	function addDefaultButtons(context) {
		var leftMostButtonStyle = { position: 'absolute', top: 0, left: 0 };
		context.menuButton = $('<span class="icon menu"></span>');
		context.backButton = $('<span class="icon left-open"></span>');
		context.closeKeyboardButton = $('<span class="icon down-open"></span>');

		// menu button to open/close the nav gutter
		context.menuButton.on('click', function(e){
			// mobile safari is slow to figure out that this tap was *not* a click to a div that gets
			// slid in underneath it so set a flag telling it to ignore
			if(context.shell.navigationVisible()) {
				clearTimeout(context.openTimeout);
				context.shell.navigationVisible(false);
				context.refreshIndicatorPull.show().hide();
			} else {
				if(environment.device == 'android') {
					context.openTimeout = global.setTimeout(function(){
						context.shell.navigationVisible(true);
						context.gutterContent.find('input,textarea').blur();
					}, 350);
				} else {
					context.shell.navigationVisible(true);
					context.gutterContent.find('input,textarea').blur();
				}
			}
		});

		context.closeKeyboardButton.on('tap', function(e){
			e.preventDefault();
			if(environment.device == 'android') {
				context.openTimeout = global.setTimeout(function(){
					$(document.activeElement).blur();
				}, 350);
			} else {
				$(document.activeElement).blur();
			}
			return false;
		});

		// nav back button
		context.backButton.on('click', function(e){
			context.navigator.navigateBack({
				currentContentScrollTop: context.shell.contentScrollTop()
			});
		});

		context.headerShellArea = $(document.createElement('div')).addClass('shell').appendTo(context.header);
		context.headerUserArea = $(document.createElement('div')).addClass('user').appendTo(context.header);
		context.headerButtonArea = $(document.createElement('div')).addClass('button').appendTo(context.header);

		if(context.enableRefreshButton) {
			context.refreshButton = $('<a href="#" class="refresh"><span class="icon cw"></span></a>');
			context.refreshButton.on('click', function(e){
				context.shell.refresh();
			});
			addHeaderButton(context, context.refreshButton, 'shell');
		}

		addHeaderButton(context, context.menuButton.hide(), 'shell', false);
		addHeaderButton(context, context.backButton.hide(), 'shell', false);
		addHeaderButton(context, context.closeKeyboardButton.hide(), 'shell', false);
	}

	function loadNav(context) {
		// only load navigation if authenticated, or anonymous allowed
		if(!$.telligent.evolution.user.accessing.isSystemAccount || context.allowAnonymous) {
			messaging.publish(messages.navigationLoading);
			transport.load(context.navigationContentUrl)
				.done(function(content) {
					// clear any navigation-scoped messaging subscriptions before changing navigation
					messaging.clear(messaging.NAVIGATION_SCOPE);
					context.gutterContent.empty().append(content);
					messaging.publish(messages.navigationLoaded);
					messaging.publish(messages.navigationRendered);
				});
		}
	}

	function reset(context, reloadWindow) {
		context.headerUserArea.empty();
		context.headerButtonArea.empty();
		storage.empty();

		if (reloadWindow === true) {
			global.location.reload();
		} else {
			context.navigator.reset();
			loadNav(context);
		}
	}

	function addRefreshParameter(context, key, value) {
		context.refreshParams = context.refreshParams || {};
		context.refreshParams[key] = value;
	}

	function handleHardwareBackButton(context) {
		document.addEventListener("backbutton", function () {
			// if navigation currently open, just close it
			if(context.shell.navigationVisible()) {
				context.shell.navigationVisible(false);
			} else {
			// otherwise navigate back
				context.navigator.navigateBack({
					currentContentScrollTop: context.shell.contentScrollTop()
				});
			}
		}, false);
	}

	function handlePostLists(context) {
		context.postListHandler = new PostListHandler({
			parent: $(context.content),
			highlightClassName: 'post-list-item-loading',
			onTap: function(url) {
				context.navigator.navigateTo(url, {
					currentContentScrollTop: context.shell.contentScrollTop()
				});
			}
		});
		context.postListHandler.handleTargetedTaps();
	}

	function refreshable(context, isRefreshable) {

		if(context.enableRefreshButton) {
			if (isRefreshable === true) {
				if(context.shell.navigable())
					show(context.refreshButton);
			} else if (isRefreshable === false) {
				hide(context.refreshButton);
			}
		}

		return context.shell.refreshable(isRefreshable);
	}

	function handleShowingKeyboardCloseButton(context) {
		// android already has os-level keyboard hiding/closing
		if(environment.device == 'android')
			return;
		messaging.subscribe(messages.keyboardOpen, messaging.GLOBAL_SCOPE, function(){
			hide(context.backButton);
			hide(context.menuButton);
			show(context.closeKeyboardButton);
		});
		messaging.subscribe(messages.keyboardClose, messaging.GLOBAL_SCOPE, function() {
			hide(context.closeKeyboardButton);
			showNavigationButtons(context);
		});
	}

	// parses a URL passed via scheme handler into a path string and data object
	function parsePathAndDataFromSchemeUrl(url) {
		var context = {};

		// parse path
		context.path = url.substr(url.indexOf('://') + 3);
		if (context.path.indexOf('?') > -1) {
			context.path = context.path.substr(0, context.path.indexOf('?'));
		}

		// parse data
		var keyValues = url.substr(url.indexOf('?') + 1).split('&');
		context.data = {};
		for (var i = 0; i < keyValues.length; i++) {
			var keyAndValue = keyValues[i].split('=');
			if (keyAndValue.length == 2) {
				var key = decodeURIComponent(keyAndValue[0]);
				var value = decodeURIComponent(keyAndValue[1]);
				context.data[key] = value;
			}
		}

		return context;
	}

	function handleSchemeBasedRequests(context, routes) {
		// define the handler called by PhoneGap when opened via custom scheme
		global.handleOpenURLInternal = function(url) {
			global.setTimeout(function() {
				var req = parsePathAndDataFromSchemeUrl(url);

				if(routes[req.path] !== undef) {
					routes[req.path](req.data);
				}
			}, 1);
		};
	}

	function registerSchemeBasedRoutes(context) {
		handleSchemeBasedRequests(context, {
			auth: function(data) {
				context.authenticator.handleLoginLogout(data);
			},
			redirect: function(data) {
				transport.adjustUrl(data.url).done(function(adjusted){
					if(adjusted && adjusted.redirectUrl) {
						context.navigator.navigateTo(adjusted.redirectUrl, {
							currentContentScrollTop: context.shell.contentScrollTop(),
							refresh: true
						});
					}
				});
			}
		});
	}

	var defaults = {
		allowAnonymous: false,
		isHttpAuth: false,

		defaultContentUrl: 'default',
		navigationContentUrl: 'navigation',
		// shell settings
		enableRefreshButton: false,
		enablePan: true,
		enableSoftBackButton: true,
		doubleTapHeaderToScroll: true,
		focusInputsOnLabelTap: false,
		// loading overlay settings
		loadingCssClass: 'loading',
		loadingContent: '<span class="icon cw"></span>',
		loadingOpacity: 0.7,
		// animation settings
		easing: 'cubic-bezier(0.160, 0.060, 0.450, 0.940)',
		navigationOpenPercent: 0.8,
		navigationOpenDuration: 275,
		navigationClosedOffsetPercent: -0.2,
		navigationClosedZoom: 0.00,
		// Sheet Settings
		sheetMaxHeightPerent: 0.7,
		sheetCssClass: 'sheet',
		sheetBackgroundColor: '#333',
		sheetBackgroundOpacity: 0.7,
		// pull to refresh options
		refreshOverflow: 10,
		refreshRevealThrottle: 200,
		// cache duration
		cacheDuration: 10 * 60 * 1000, // 10 minutes

		telephonePattern: null
	};

	var Controller = function(options) {
		var context = $.extend({}, defaults, options || {});

		var api = {
			refreshable: function(isRefreshable) {
				return refreshable(context, isRefreshable);
			},
			navigable: function(isNavigable) {
				if(isNavigable !== undef) {
					if(isNavigable) {
						showNavigationButtons(context);
					} else {
						hide(context.menuButton);
						if(context.refreshButton)
							hide(context.refreshButton);
					}
				}
				return context.shell.navigable(isNavigable)
			},
			load: function(url, options) {
				loadUrl(context, url, options && options.replace, options && options.refresh);
			},
			refresh: function() {
				context.navigator.refresh(context.refreshParams);
			},
			back: function(refresh) {
				context.navigator.navigateBack({
					currentContentScrollTop: context.shell.contentScrollTop(),
					refresh: refresh
				});
			},
			navigationVisible: function(isVisible) {
				return context.shell.navigationVisible(isVisible);
			},
			navigationScrollTop: function(to) {
				return context.shell.navigationScrollTop(to);
			},
			contentScrollTop: function(to) {
				return context.shell.contentScrollTop(to);
			},
			displayMessage: function(message, options) {
				context.shell.displayMessage(message, options);
			},
			alert: function(message, callback) {
				context.shell.alert(message, callback);
			},
			confirm: function(message, callback) {
				context.shell.confirm(message, callback);
			},
			setHeaderButton: function(buttonElement) {
				if(context.currentHeaderButton)
					hide(context.currentHeaderButton, 'detach', true);
				addHeaderButton(context, buttonElement, 'button', true);
				context.currentHeaderButton = buttonElement;
			},
			setHeaderContent: function(content) {
				context.headerUserArea.empty().append(content);
			},
			refreshNavigation: function() {
				loadNav(context);
			},
			debug: function(message) {
				context.shell.debug(message);
			},
			reset: function(reloadWindow) {
				reset(context, reloadWindow);
			},
			addRefreshParameter: function(key, value) {
				addRefreshParameter(context, key, value);
			},
			displaySheet: function(options) {
				context.shell.displaySheet(options);
			},
			hideSheet: function() {
				context.shell.hideSheet();
			},
			scrollable: function(options){
				context.shell.scrollable(options);
			},
			clearContent: function(url){
				context.navigator.clearContent(url);
			},
			excludeFromHistory: function() {
				context.navigator.excludeFromHistory();
			},
			setExpiration: function(date, url) {
				context.navigator.setExpiration(date, url);
			},
			setClass: function(className) {
				context.shell.setClass(className);
			},
			showLoading: function(promise) {
				if(promise) {
					if(promise.state() == 'pending') {
						showLoading(context);
						promise.then(function(){
							hideLoading(context);
						});
					}
					return promise;
				} else {
					showLoading(context);
				}
			},
			hideLoading: function() {
				hideLoading(context);
			},
			detectData: function(value) {
				if(!context.dataDetector) {
					context.dataDetector = new DataDetector({
						patterns: {
							telephone: context.telephonePattern
						}
					});
				}
				return context.dataDetector.detect(value);
			}
		};

		captureElements(context);
		buildShell(context);
		handlePostLists(context);
		addDefaultButtons(context);
		buildAuthenticator(context, api);
		buildNavigator(context);
		loadNav(context);
		hijackLinks(context);
		preventLabelFocusing(context);
		handleAndRaiseDeviceMessages(context);
		handleHardwareBackButton(context);
		handleFocusPreventionWithinRegion(context);
		registerSchemeBasedRoutes(context);
		handleShowingKeyboardCloseButton(context);
		scrollfix.monitorEffectiveScrollState(context.content);

		messaging.subscribe('mobile.content.loading', messaging.GLOBAL_SCOPE, function() {
			refreshable(context, true);
		});

		return api;
	}
	Controller.defaults = defaults;

	return Controller;

}, jQuery, window);
