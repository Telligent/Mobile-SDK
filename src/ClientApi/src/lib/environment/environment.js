/*
 * Environment Information
 * Internal API
 *
 * Exposes information about the host environment
 *
 * environment.device  ios|android|windows|unknown
 * environment.type  browser|webapp|native|unknown
 */

/// @name environment
/// @category JavaScript API Module
/// @description Environment details
///
/// ### jQuery.telligent.evolution.mobile.environment
///
/// This module provides data about the host device.
///
/// ### Methods
///
/// #### isOnline
///
/// Returns whether the app is currently online
///
///     $.telligent.evolution.mobile.environment.isOnline()
///
/// ### Properties
///
/// #### device
///
/// Device type: `ios`, `android`, `windows`, or `unknown`
///
///     $.telligent.evolution.mobile.environment.device
///
/// #### type
///
/// Environment type: `browser`, `webapp` (iOS homescreen web page), `native`, or `unknown`
///
///     $.telligent.evolution.mobile.environment.type
///

define('environment', ['messaging'], function(messaging, global, undef) {

	var unknown = 'unknown',
		windows = 'windows',
		ios = 'ios',
		android = 'android',
		browser = 'browser',
		webapp = 'webapp',
		_native = 'native',
		type = unknown,
		manuallyTrackedFallbackOnlineState = true,
		device = unknown;

	function isOnline() {
		// if native (Connection is provided by Cordova)
		if(navigator && navigator.connection && navigator.connection.type && global.Connection !== undef) {
			return navigator.connection.type != global.Connection.NONE;
		} else if(navigator.onLine !== undef) {
			return navigator.onLine;
		} else {
			return manuallyTrackedFallbackOnlineState;
		}
	}

	// native
	if(global.mobileNativeConfig) {
		type = _native;

		// device
		var deviceIdentifier = (global.device.platform || '').toLowerCase();
		switch(deviceIdentifier) {
			case 'iphone':
			case 'ios':
				device = ios;
				break;
			case 'android':
				device = android;
				break;
			case 'windows':
				device = windows;
				break;
			default:
				device = unknown;
		}
	} else {
		// web
		if(global.navigator.standalone) {
			type = webapp;
		} else {
			type = browser;
		}

		// device
		if(navigator.userAgent.match(/Android/i)) {
			device = android;
		} else if(navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
			device = ios;
		} else if(navigator.userAgent.match(/IEMobile/i)) {
			device = windows;
		} else {
			device = unknown;
		}
	}

	// manually track online/offline events to change the fallback state
	messaging.subscribe('mobile.online', messaging.GLOBAL_SCOPE, function(){
		manuallyTrackedFallbackOnlineState = true;
	});
	messaging.subscribe('mobile.offline', messaging.GLOBAL_SCOPE, function(){
		manuallyTrackedFallbackOnlineState = false;
	});

	var environment = {
		type: type,
		device: device,
		isOnline: isOnline
	};

	return environment;

}, window);