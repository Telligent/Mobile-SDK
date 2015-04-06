/* Storage
 * Internal API
 *
 * Enables storing and retrieving objects from serialized storage.
 * Keeps storage user-specific
 * When anonymous, only stores across current session
 */

define('storage', function($, global){

	var contextualStore = $.telligent.evolution.user.accessing.isSystemAccount
		? global.sessionStorage
		: global.localStorage;

	function addUserToKey(key) {
		return $.telligent.evolution.user.accessing.id + ':' + key;
	}

	function addNameSpaceToKey(key) {
		return 'mobile' + ':' + key;
	}

	return {
		set: function(key, obj) {
			if (!contextualStore) { return; }
			contextualStore.setItem(addNameSpaceToKey(addUserToKey(key)), JSON.stringify(obj));
		},
		get: function(key) {
			if (!contextualStore) { return; }
			return JSON.parse(contextualStore.getItem(addNameSpaceToKey(addUserToKey(key))));
		},
		del: function(key) {
			if (!contextualStore) { return; }
			contextualStore.removeItem(addNameSpaceToKey(addUserToKey(key)));
		},
		empty: function() {
			if (!contextualStore) { return; }
			contextualStore.clear();
		}
	};

}, jQuery, window);
