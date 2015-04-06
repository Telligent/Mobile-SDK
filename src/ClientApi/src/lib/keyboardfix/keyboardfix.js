/*
 * Keyboard Fixing for Mobile Browsers to close keyboard when not needed
 * Private API
 *
  */
define('keyboardfix', ['messaging'], function(messaging, $, global, undef){

	var handle = null;

	function blurCurrentElement() {
		if ($(document.activeElement).is('input, textarea')) {
			document.activeElement.blur();
		}
	}

	function blurCurrentElementsOnShellUpdates() {
		messaging.subscribe('mobile.navigation.opening', messaging.GLOBAL_SCOPE, function(data) {
			blurCurrentElement();
		});

		messaging.subscribe('mobile.navigation.closing', messaging.GLOBAL_SCOPE, function(data) {
			blurCurrentElement();
		});

		messaging.subscribe('mobile.content.loading', messaging.GLOBAL_SCOPE, function(data) {
			blurCurrentElement();
		});
	}

	if (global.cordova && global.cordova.plugins && global.cordova.plugins.Keyboard) {
		global.cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
	}

	return {
		fix: function() {
			blurCurrentElementsOnShellUpdates();
		}
	}

}, jQuery, window);
