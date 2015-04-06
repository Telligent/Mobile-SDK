/*
 * Mobile-friendly override of the touchEventAdapter
 * Also handles ensuring that programmatic tap-based .focus() doesn't double-focus when a subsequent native is raised
 *
 * Unfortunately, mobile cannot override core's adapter using $.telligent.evolution._SUPPRESS_TOUCH_CLICK_EVENTS since
 * core checks this value too early for mobile to set (before $ is even available to mobile be overriden).
 * Instead, mobile is temporarily setting window.parent to {} to trick core into thinking it's in an iframe,
 * and thus it's not run. And then in this overriding adapter, window.parent is re-set to window
 */
define('touchEventAdapter', ['util'], function(util, $, global, undef){

	// mobile hack. see above
	global.parent = global;

	var preventAllTriggers = false;
	var modalEventTriggerDebounceDuration = 250;

	var hasTouchEvents = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
	var forceRemap = '_evolutionForceTouchRemap' in window;
	var suppressTouchMouseEvents = $.telligent && $.telligent.evolution && $.telligent.evolution._SUPPRESS_TOUCH_MOUSE_EVENTS;
	var suppressTouchClickEvents = $.telligent && $.telligent.evolution && $.telligent.evolution._SUPPRESS_TOUCH_CLICK_EVENTS;
	var isEmbedded = global != global.parent;

	var isChrome = /chrom(e|ium)/.test(navigator.userAgent.toLowerCase());
	var isAndroid = /android/.test(navigator.userAgent.toLowerCase());
	var isWindows = /windows nt/.test(navigator.userAgent.toLowerCase());

	var hasNativeMouseEvents = ('MouseEvent' in window) && (!('ontouchstart' in window) || isWindows);
	var chromeVersion = parseInt((/Chrome\/([0-9]+)/.exec(navigator.userAgent) || ['0','0'])[1], 10);
	var viewPortIsDeviceWidth = document.querySelector && document.querySelector('meta[name=viewport][content*="width=device-width"]') !== undef;
	var viewPortNotUserScalable = document.querySelector && document.querySelector('meta[name=viewport][content*="user-scalable=no"]') !== undef;

	function isFormInput(el) {
		return (el.nodeName == 'INPUT' || el.nodeName == 'TEXTAREA' || el.nodeName == 'SELECT' || el.nodeName == 'FILE');
	}

	function isCheckboxOrRadio(el) {
		return (el.nodeName == 'INPUT' && el.type.toLowerCase() == 'checkbox' || el.type.toLowerCase() == 'radio');
	}

	function synthesizeNativeEvent(el, evt) {
		if(preventAllTriggers) {
			return;
		}

		if(document.createEventObject){
			// IE
			trigger = document.createEventObject();
			trigger.synthesized = true;
			el.fireEvent('on' + evt, trigger);
		} else {
			// Others
			trigger = document.createEvent('HTMLEvents');
			trigger.initEvent(evt, true, true);
			trigger.synthesized = true;
			el.dispatchEvent(trigger);
		}
	}

	function synthesizeClicksFromTaps() {
		var lastSynthClickTime = new Date();
		var lastSynthFocusTime = new Date();
		var focusedElm;

		// handle taps globally
		$('body').on('tap', function(e){
			if(preventAllTriggers) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}

			// if a form element, focus on it (or change it) directly (don't just synthesize a focus event)
			if(isFormInput(e.target)){
				// if checkbox or radio, change its value
				if(isCheckboxOrRadio(e.target)) {
					var input = $(e.target);
					if(input.is(':checked')) {
						setTimeout(function(){
							input.prop('checked', false).trigger('change');
						}, 25)
					} else {
						setTimeout(function(){
							input.prop('checked', true).trigger('change');
						}, 25);
					}
				// if it's a select, let the delay occur as normal, Android can't be focused
				} else if(e.target.nodeName == 'SELECT') {
					return true;
				// all other inputs, focus immediately
				} else {
					lastSynthFocusTime = new Date();
					focusedElm = $(e.target);
					// if already focused, allow normal behavior
					if(focusedElm.is(':focus')) {
						return true;
					// otherwise immediately focus
					} else {
						focusedElm.focus();
					}
				}

				// prevent any synth clicks or normal clicks from happening
				e.stopPropagation();
				e.stopImmediatePropagation();
				e.preventDefault();
				return false;
			}

			lastSynthClickTime = new Date();

			// trigger synthesized native 'click' events on tapped elements
			synthesizeNativeEvent(e.target, 'click');

			// prevent anything else from happening
			e.stopPropagation();
			e.stopImmediatePropagation();
			e.preventDefault();
		});

		// handle taps globally
		document.addEventListener('click', function(e){
			if(preventAllTriggers) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}

			var now = new Date();
			var timeSinceLastSynthesizedClick = now - lastSynthClickTime;
			// programmatic .click() should also pass, and can be detected (typically) from their lack of mouse coordinates
			var fromAnOriginMouseEvent = !(e.clientX || e.clientY || e.pageX || e.pageY || e.x || e.y);
			// if the click wasn't syntehsized and happened within a
			// small gap from last synth click, block it
			if(!(fromAnOriginMouseEvent || e.synthesized) && timeSinceLastSynthesizedClick < 350) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
			return true;
		}, true);

		$('body').on('focus focusin', 'textarea,input', function(e){
			var now = new Date();
			var timeSinceLastSynthesizedFocus = now - lastSynthFocusTime;
			if(timeSinceLastSynthesizedFocus < 350) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			} else {
				return true;
			}
		});
	}

	function remapMouseEventHandlersToTouchEventHandlers() {
		var mappedEvents = {
			'mouseenter': 'taphold',
			'mouseover': 'taphold',
			'mouseleave': 'pointerend',
			'mousedown': 'pointerstart',
			'mouseup': 'pointerend'
		};

		$.fn.on = $.fn.bind = translate($.fn.on, mappedEvents, true);
		$.fn.trigger = translate($.fn.trigger, mappedEvents, false);
		$.fn.off = $.fn.unbind = translate($.fn.off, mappedEvents, false);
	}

	function translate(method, mappings, useObjectSyntax) {
		// returns a new method that adjusts the calling of 'bind' or 'on' to bind 'tap' instead of 'click'
		// maintains any event namespaces
		// also supports object syntax
		return function() {
			var args = Array.prototype.slice.call(arguments, 0);
			// object syntax
			if(useObjectSyntax && args.length === 1 && $.isPlainObject(args[0])) {
				// object bound syntax. replaces 'click' binders with 'tap'
				var bindingObj = args[0];
				$.each(mappings, function(k, v){
					if(bindingObj[k] != undef) {
						bindingObj[v] = bindingObj[k];
						delete bindingObj[k];
					}
				});

				return method.call(this, bindingObj);
			// string syntax
			} else {
				// if this doesn't apply, skip it
				if(typeof args[0] != 'string')
					return method.apply(this, args);

				eventParts = args[0].split('.', 2);

				// don't re-map events used internally by pointers and gestures, as mouse events are still needed to simulate
				// touch events for non-touch targets
				if(eventParts.length == 2 && (eventParts[1] == '_gesture_events_namespace' || eventParts[1] == '_pointer_events_namespace'))
					return method.apply(this, args);

				// remap events (accounting or namespace)
				if(mappings[eventParts[0]]) {
					eventParts[0] = mappings[eventParts[0]];
					args[0] = eventParts.join('.');
				}
				return method.apply(this, args);
			}
		}
	}

	// safely wraps modal dialogs to cancel any gesture detection in progress
	function wrapModalDialogs() {
		// when a modal dialog (alert or confirm) is shown, prevent any more triggering from
		// occurring for a limited time, as gesture detection would otherwise get confused
		// with the unexpected absence of pointer events during the modal dialog's display

		var modalDialogWrapOptions = {
			after: function() {
				preventAllTriggers = true;
				setTimeout(function(){
					preventAllTriggers = false;
				}, modalEventTriggerDebounceDuration);
			}
		};

		global.alert = util.wrap(global.alert, modalDialogWrapOptions);
		global.confirm = util.wrap(global.confirm, modalDialogWrapOptions);
	}

	return {
		adapt: function() {
			// don't even attemp to adapt if there are no touch events or simulated/forced ones
			if(!(hasTouchEvents || forceRemap))
				return;

			// remap mouse events if not suppressed
			if(!hasNativeMouseEvents && !suppressTouchMouseEvents){
				remapMouseEventHandlersToTouchEventHandlers();
			}

			// clicks should be synthesized from taps when...
			var shouldSynthesizeClickFromTaps = true
				// not explicitly suppressed
				&& !suppressTouchClickEvents
				// and not running in an inframe
				&& !isEmbedded
				// and not running in new versions of android chrome which don't have 300ms delays
				&& !(isChrome && isAndroid && chromeVersion >= 32 && viewPortIsDeviceWidth)
				// and not running in older versions of android chrome with user-scalable turned off
				&& !(isChrome && isAndroid && chromeVersion < 32 && viewPortIsDeviceWidth && viewPortNotUserScalable);

			if(shouldSynthesizeClickFromTaps) {
				wrapModalDialogs();
				synthesizeClicksFromTaps();
			}

			// give styling an indicator that this is a touch client
			$(function(){
				$('body').addClass('touch');
			});
		}
	};

}, jQuery, window);