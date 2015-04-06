/*
 * Message Bus
 * Internal API that is an override of $.telligent.evolution.messaging to support scopes.
 * Shell clears content and navigation scopes as they're refreshed
 *
 * var subscriptionId = messaging.subscribe(messageName, [scope], handler) // scope is optional and defaults to 'content'
 * messaging.publish(messageName, data)
 * messaging.unsubscribe(subscriptionId)
 * messaging.clear(scope)
 *
 * Exposed as an override of $.telligent.evolution.messaging, but without clear()
 *
 */

/// @name messaging
/// @category JavaScript API Module
/// @description Mobile-specific client-side bus for publishing and subscribing to messages
///
/// ### jQuery.telligent.evolution.messaging
///
/// This module provides a mobile-specific superset of the Evolution client side message bus, a simple, generic publish/subscribe message bus for client code to use. This enables easy cross-widget communication without relying on expectation of specifc DOM elements or events. Additionally, the platform uses messages for coordinating synchronization between separate UI components related to the same piece of content.
///
/// In mobile, message handlers can be scoped to define their lifetime relative to other events occurring in the shell.
///
/// ### Methods
///
/// #### subscribe
///
/// Subscribes to a message, optionally passing a scope. Returns a subscription handle.
///
///     var subscriptionId = $.telligent.evolution.messaging.subscribe(messageName, function(data) {
///         // handle message
///     });
///
///     var subscriptionId = $.telligent.evolution.messaging.subscribe(messageName, scope, function(data) {
///         // handle message
///     });
///
/// * `messageName`: message to subscribe to
/// * `scope`: mobile scope - 'content', 'navigation', or 'global'. Scope defines handlers' lifetime. When the scope is navigation, a refresh of the navigation unsubscribes any previously-subscribed handlers. When the scope is content, a refresh of the content or any other navigation-triggered content loading unsubscribes previously-subscribed handlers. When the scope is global, handlers remain subscribed persistently. *default when not provided: content*
/// * `handler`: message handler
///
/// #### publish
///
/// Publishes a message. All current subscriptions will be called and passed the `data`.
///
///     $.telligent.evolution.messaging.publish(messageName, data);
///
/// #### unsubscribe
///
/// Unsubcribes a specific message handler by subscription handle
///
///     $.telligent.evolution.messaging.unsubscribe(subscriptionId);
///
/// ### Automatic Message Links
///
/// Anchors which define the attribute, `data-messagename` raise a message named according to the value of the attribute when clicked without the need for explicitly binding. Message links' binding is delegated to support links being added or modified dynamically.
///
///     // Register a message link on an anchor
///     <a href="#" data-messagename="action.occurred">My Link</a>
///
///     // handle the message
///     $.telligent.evolution.messaging.subscribe('action.occurred', function(data) {
///         // handle the message
///         // data.target is the link which raised the message
///     });

define('messaging', ['util'], function(util, $, global, undef) {

	var subscriptionsByName = {},  // for fast publishing and subsscribing
		subscriptionsById = {},    // for fast unsubscribing
		subscriptionsByScope = {}; // each scope tracks a list of subscription ids registered against it

	function publish(messageName, data) {
		if(!messageName) {
			throw 'messageName is required when publishing a message';
		}
		if(messageName === null || messageName.length === 0) {
			return;
		}
		var subscriptions = subscriptionsByName[messageName];
		if(subscriptions) {
			$.each(subscriptions, function(i, subscription) {
				if(subscription.handler !== null) {
					try {
						subscription.handler.call(this, data);
					} catch(e) { }
				}
			});
		}
	}

	function subscribe(messageName, scope, handler) {
		if(!messageName) {
			throw 'messageName is required when subscribing to a message';
		}
		if(messageName === null || messageName.length === 0) {
			return 0;
		}
		if(typeof subscriptionsByName[messageName] === 'undefined') {
			subscriptionsByName[messageName] = [];
		}

		// default to content scope if scope not defined
		var messageScope = scope;
		if(handler == undef) {
			handler = scope;
			messageScope = 'content';
		}

		var subscription = {
			message: messageName,
			handler: handler,
			scope: messageScope,
			id: util.guid()
		};
		subscriptionsByName[messageName][subscriptionsByName[messageName].length] = subscription;
		subscriptionsById[String(subscription.id)] = subscription;

		// add this subscription reference to the scope it was registered with
		if(!subscriptionsByScope[messageScope])
			subscriptionsByScope[messageScope] = [];
		subscriptionsByScope[messageScope][subscriptionsByScope[messageScope].length] = subscription.id;

		return subscription.id;
	}

	function unsubscribe(subscriptionId) {
		if(!subscriptionId) {
			throw 'subscriptionId is required when unsubscribing a message';
		}
		if(typeof subscriptionsById[String(subscriptionId)] !== 'undefined') {
			var subscription = subscriptionsById[String(subscriptionId)],
				subscriptionByNameIndex = -1,
				allSubscriptionsForMessage = subscriptionsByName[subscription.message];
			// find the instance of the subscription in the collection for all of it message type
			$.each(allSubscriptionsForMessage, function(i, sub) {
				if(sub === subscription) {
					subscriptionByNameIndex = i;
				}
			});
			// remove that subscription object and also the subscription messge if it was the last one
			if(subscriptionByNameIndex >= 0) {
				allSubscriptionsForMessage.splice(subscriptionByNameIndex, 1);
			}
			if(allSubscriptionsForMessage.length === 0) {
				delete subscriptionsByName[subscription.message];
			}
			// remove the subscription referenced by its id
			delete subscriptionsById[String(subscriptionId)];
		}
	}

	function clear(scope) {
		if(!scope || !subscriptionsByScope[scope])
			return;
		// unsubscribe each subscription for this scope
		for(var i = 0; i < subscriptionsByScope[scope].length; i++ ) {
			unsubscribe(subscriptionsByScope[scope][i]);
		}
		// clear the array of scoped subscriptions
		subscriptionsByScope[scope].length = 0;
	}

	var messaging = {
		publish: publish,
		subscribe: subscribe,
		unsubscribe: unsubscribe,
		clear: clear,
		CONTENT_SCOPE: 'content',
		NAVIGATION_SCOPE: 'navigation',
		GLOBAL_SCOPE: 'global'
	};

	return messaging;

}, jQuery, window);
