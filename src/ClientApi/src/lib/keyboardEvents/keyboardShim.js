/*
 * KeyboardShim
 * Internal API
 *
 * Raises keyboard visibility messages and provides an API around knowing whether the keyboard is opened
 * and decides to render them as a slider (tray) or to expand them with a 'more' link

 * When available, uses native keyboard events raised by Cordova Keyboard. Otherwise, falls back to
 * listening for focus/blur and debouncing their change for field switching
 *
 * https://github.com/martinmose/cordova-keyboard/blob/master/README.md
 *
 * Not exposed publicly.
 *
 * Use:
 *
 * keyboard.handleVisibilityChange(options)
 *
 * options:
 *   container: selector of parent element(s) to listen for focus events
 *   onShow: function called when keyboard is showing
 *   onHide: function called when keyboard is hiding
 *   onShown: function called when keyboard is shown
 *   onHidden: function called when keyboard is hidden
 *
 * keyboard.isVisible()
 *
 * Returns whether keyboard is currently visible.
 *
 */
define('keyboardShim', ['environment'], function(environment, $, global, undef) {

	// potential Keyboard event sources...
	var keyboards = [{
		// cordova Keyboard plugin
		test: function() {
			return global.cordova && global.cordova.plugins && global.cordova.plugins.Keyboard;
		},
		build: function() {
			var nativeKeyboard = global.cordova.plugins.Keyboard;
			return {
				handleVisibilityChange: function(options) {
					var hideTimeout;

					global.addEventListener('native.keyboardshow', function(){
						global.clearTimeout(hideTimeout);
						if(options.onShow) {
							options.onShow();
						}
					});

					global.addEventListener('native.keyboardhide', function(){
						global.clearTimeout(hideTimeout);
						hideTimeout = global.setTimeout(function(){
							if(options.onHide) {
								options.onHide();
							}
						}, 5);

					});

				},
				isVisible: function() {
					return nativeKeyboard.isVisible;
				}
			};
		}
	}, {
		// Keyboard plugin
		test: function() {
			return global.Keyboard;
		},
		build: function(){
			var nativeKeyboard = global.Keyboard;
			return {
				handleVisibilityChange: function(options) {
					var hideTimeout;

					nativeKeyboard.onshowing = function() {
						global.clearTimeout(hideTimeout);
						if(options.onShow) {
							options.onShow();
						}
					};
					nativeKeyboard.onhiding = function() {
						global.clearTimeout(hideTimeout);
						hideTimeout = global.setTimeout(function(){
							if(options.onHide) {
								options.onHide();
							}
						}, 5);
					};
					nativeKeyboard.onshow = function() {
						global.clearTimeout(hideTimeout);
						if(options.onShown) {
							options.onShown();
						}
					};
					nativeKeyboard.onhide = function() {
						//Keyboard.shrinkView(false);
						global.clearTimeout(hideTimeout);
						if(options.onHidden) {
							options.onHidden();
						}
					};
				},
				isVisible: function() {
					return nativeKeyboard.isVisible;
				}
			};
		}
	}, {
		// web-based shim
		test: function() {
			return true;
		},
		build: function(){
			var shimmedKeyboardOpenState = false;

			// detect visiblity changes through listening for focus/blur and de-bouncing
			function handleVisibilityChange(options) {
				var unfocusedTimeout;
				var lastFocusTime = new Date().getTime();
				$(options.container).on({
					// when focused on an input,
					// add a extra vertical padding to the content
					// to allow there to be enough space to scroll the input to
					// the top of the viewport so as to not push the menu bar off
					// if this is the first focus and not a refocus, call the onKeyboardOpening callback
					focusin: function(e){
						global.clearTimeout(unfocusedTimeout);

						if(!unfocusedTimeout && options.onShow) {
							options.onShow();
						}

						shimmedKeyboardOpenState = true;
					},
					// when focusing out, remove
					// add a extra vertical padding to the content
					// to allow there to be enough space to scroll the input to
					// the top of the viewport so as to not push the menu bar off
					// if this is a complete blur and not a refocus, call the onKeyboardClosing callback
					focusout: function(e){
						global.clearTimeout(unfocusedTimeout);
						unfocusedTimeout = global.setTimeout(function(){
							global.clearTimeout(unfocusedTimeout);
							unfocusedTimeout = null;

							if(options.onHide) {
								options.onHide();
							}
							shimmedKeyboardOpenState = false;
						}, 5);
					}
				});
			}

			function isVisible() {
				return shimmedKeyboardOpenState;
			}

			return {
				handleVisibilityChange: function(options) {
					handleVisibilityChange(options);
				},
				isVisible: function() {
					return isVisible();
				}
			};
		}
	}];

	var keyboardApi = null;
	$.each(keyboards, function(i, k) {
		if(!keyboardApi && k.test()) {
			keyboardApi = k.build();
		}
	});

	return keyboardApi;

}, jQuery, window);
