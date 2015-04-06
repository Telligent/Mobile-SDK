/*
 * Push Notifications
 * Internal API
 *
 * Publishes:
 *   notification.raised
 *   notification.read
 */

/// @name notification.raised
/// @category Client Message
/// @description Raised when a notification is received
///
/// ### notification.raised Client Message
///
/// Published when a notification is received. Mobile version, overrides the platform `notification.raised` message, including an additional `unreadCount` data property.
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('notification.raised', function(data) {
///         // handle the event
///     });
///
/// ### Data
///
///  * `id`: id of the notification
///  * `contentId`: related content id string
///  * `contentTypeId`: related content type id string
///  * `typeId`: notification type id string
///  * `contentUrl`: url of the related content
///  * `message`: short, displayable message regarding the notification
///  * `avatarUrl`: url of actor who triggered the notification
///  * `unreadCount`: Current unread count of notifications
///

/// @name notification.read
/// @category Client Message
/// @description Raised when a notification is read
///
/// ### notification.read Client Message
///
/// Published when a notification is read. Mobile-specific override.
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('notification.read', function(data) {
///         // handle the event
///     });
///
/// ### Data
///
///  * `unreadCount`: Remaining unread count of notifications
///

define('pushNotifications', ['transport','controller','environment','messaging'],
function(transport, controller, environment, messaging, $, global, undef) {

	var iosNotificationRegistered = function(t) {
		if (t.length > 0) {
			token = t;
			registerWithEvolution();
			messaging.subscribe('user.login', messaging.GLOBAL_SCOPE, function() { registerWithEvolution(); });
			messaging.subscribe('user.logout', messaging.GLOBAL_SCOPE, function() { unregisterWithEvolution() });
		}
	}, androidNotificationRegistered = function(e) {
	}, notificationRegistrationFailed = function(e) {
		// fail silently
	}, sendNotification = function(notificationId, unreadCount) {
		$.telligent.evolution.get({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/notification/{NotificationId}.json?IncludeFields=NotificationId,ContentId,ContentTypeId,NotificationTypeId,TargetUrl,Message,AvatarUrl,Actors',
			global: false,
			data: {
				NotificationId: notificationId
			},
			success: function(response) {
				messaging.publish('notification.raised', {
					id: response.Notification.NotificationId,
					contentId: response.Notification.ContentId,
					contentTypeId: response.Notification.ContentTypeId,
					typeId: response.Notification.NotificationTypeId,
					contentUrl: response.Notification.TargetUrl,
					message: response.Notification.Message,
					avatarUrl: response.Notification.Actors != null && response.Notification.Actors.length > 0 ? response.Notification.Actors[response.Notification.Actors.length - 1].User.AvatarUrl : null,
					unreadCount: unreadCount
				});
			},
			error: function() {
				// ignore
			}
		});
	}, processNotificationOnResume = function(notificationId, unreadCount) {
		$.telligent.evolution.get({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/notification/{NotificationId}.json?IncludeFields=TargetUrl,IsRead',
			global: false,
			data: {
				NotificationId: notificationId
			},
			success: function(response) {
				var complete = function() {
					var url = response.Notification.TargetUrl;
					if(url.indexOf('rsw.ashx') > 0 && url.indexOf('~') > 0) {
						transport.load(url).then(function(data){
							if(data && data.redirectUrl) {
								if(transport.isLocal(data.redirectUrl)) {
									$.telligent.evolution.mobile.load(data.redirectUrl);
								} else {
									$.telligent.evolution.mobile.load(global.mobileNativeConfig.notificationsUrl ? global.mobileNativeConfig.notificationsUrl : (global.mobileNativeConfig.baseUrl + 'notifications'));
								}
							} else {
								$.telligent.evolution.mobile.load(global.mobileNativeConfig.notificationsUrl ? global.mobileNativeConfig.notificationsUrl : (global.mobileNativeConfig.baseUrl + 'notifications'));
							}
						});
					} else {
						controller.load(global.mobileNativeConfig.notificationsUrl ? global.mobileNativeConfig.notificationsUrl : (global.mobileNativeConfig.baseUrl + 'notifications'));
					}
				}

				if (!response.Notification.IsRead) {
					$.telligent.evolution.put({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/notification/{NotificationId}.json',
						data: {
							NotificationId: notificationId,
							MarkAsRead: 'True'
						},
						success: function(r) {
							jQuery.telligent.evolution.messaging.publish('notification.read', {
								unreadCount: (unreadCount - 1)
							});
							complete();
						}
					});
				} else {
					jQuery.telligent.evolution.messaging.publish('notification.read', {
						unreadCount: unreadCount
					});
					complete();
				}
			},
			error: function() {
				// ignore
			}
		});
	}, registerWithEvolution = function() {
		if (token != null && token.length > 0 && deviceType != 'Unknown') {
			$.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/mobile/pushnotifications/registration.json',
				global: false,
				async: false,
				data: {
					Token: token,
					Device: deviceType
				},
				success: function(response) {
					// done
				},
				error: function() {
					unregisterWithEvolution();
				}
			});
		}
	}, unregisterWithEvolution = function() {
		if (token != null && token.length > 0 && deviceType != 'Unknown') {
			$.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/mobile/pushnotifications/registration.json',
				global: false,
				async: false,
				data: {
					Token: token,
					Device: deviceType
				},
				success: function(response) {
					// done
				},
				error: function() {
					// fail silently
				}
			});
		}
	}, deviceType = null,
	token = null;

	global.androidNotification = function(e) {
		switch(e.event) {
			case 'registered':
				if (e.regid.length > 0) {
					token = e.regid;
					registerWithEvolution();
					messaging.subscribe('user.login', messaging.GLOBAL_SCOPE, function() { registerWithEvolution(); });
					messaging.subscribe('user.logout', messaging.GLOBAL_SCOPE, function() { unregisterWithEvolution() });
				}
				break;
			case 'message':
				if (e.payload.n) {
					if (e.foreground) {
						sendNotification(e.payload.n, e.payload.msgcnt);
					} else {
						processNotificationOnResume(e.payload.n, e.payload.msgcnt);
					}
				}
				break;
		}
	}

	global.iosNotification = function(e) {
		if (e.n != undef) {
			if (e.foreground == 1) {
				sendNotification(e.n, e.badge);
			} else {
				processNotificationOnResume(e.n, e.badge);
			}
		}
	}

	if (environment.type == 'native') {
		if (environment.device == 'android') {
			deviceType = 'Android';
			if (global.mobileNativeConfig.androidSenderId) {
				global.plugins.pushNotification.register(global.androidNotification, notificationRegistrationFailed, {"senderID":global.mobileNativeConfig.androidSenderId,"ecb":"androidNotification"});
			}
		} else if (environment.device == 'ios') {
			deviceType = 'IOS';
			global.plugins.pushNotification.register(iosNotificationRegistered, notificationRegistrationFailed, {"badge":"true","sound":"true","alert":"true","ecb":"iosNotification"});
		}
	}

	return {};
}, jQuery, window);
