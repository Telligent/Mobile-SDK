/*
 * var auth = new Authenticator(context)
 * context:
 *   controller: Controller instance
 *   isNative: bool
 *   useDeviceBrowserForLogin: bool
 *
 * auth.login(returnUrl)
 * auth.logout()
 * auth.handleLoginLogout(data)
 */
define('authentication', ['transport', 'environment', 'messaging'],
	function(transport, environment, messaging, $, global){

	function setAuthorizationCookie(value) {
		return transport.load('callback.ashx?authenticate=' + encodeURIComponent(value), {
			async: false
		});
	}

	function unSetAuthorizationCookie() {
		return transport.load('callback.ashx?deauthenticate=deauthenticate', {
			async: false
		});
	}

	var Authenticator = function(context) {

		var hasChildBrowser = false;
		var loginOrLogout = function(data) {
			if (data['native'] == 'logout') {
				unSetAuthorizationCookie();
				messaging.publish('user.logout', {});
				context.controller.reset(true);
			} else if (data['native'] == 'login') {
				setAuthorizationCookie(data.token);
				messaging.publish('user.login', {});
				context.controller.reset(true);
			}
		};

		return {
			handleLoginLogout: function(data) {
				loginOrLogout(data);
			},
			login: function(returnUrl) {
				var t = this;
				returnUrl = returnUrl || global.location.href;

				var state = 'client=';
				// native
				if (context.isNative) {
					state += 'native';
				// homescreened web parage
				} else if (environment.type == 'webapp') {
					state += 'standalone';
				// web
				} else {
					state += 'unknown';
				}

				state += '&url=' + encodeURIComponent(returnUrl);

				if(context.isNative) {
					if (context.useDeviceBrowserForLogin) {
						global.open(transport.baseUrl()  + 'callback.ashx?login=login&state=' + encodeURIComponent(state), '_system', '');
						if (environment.device == 'android') {
							navigator.app.exitApp();
						}
					} else if (!hasChildBrowser) {
						hasChildBrowse = true;

						// native
						var cb = global.open(transport.baseUrl()  + 'callback.ashx?login=login&state=' + encodeURIComponent(state), '_blank', '');
						cb.addEventListener('loadstop', function (event) {
							if (event.url.indexOf(transport.baseUrl()) >= 0 && event.url.indexOf('callback.ashx') > -1) {
								var keyValues = event.url.substr(event.url.indexOf('?') + 1).split('&');
								var data = {};
								for (var i = 0; i < keyValues.length; i++) {
									var keyAndValue = keyValues[i].split('=');
									if (keyAndValue.length == 2) {
										var key = decodeURIComponent(keyAndValue[0]);
										var value = decodeURIComponent(keyAndValue[1]);
										data[key] = value;
									}
								}

								cb.close();
								loginOrLogout(data);
							}
						});
						cb.addEventListener('exit', function (event) {
							hasChildBrowser = false;
						});
					}
				} else {
					var authUrl = transport.baseUrl() + 'callback.ashx?login=login&state=' + encodeURIComponent(state);
					// homescreened web app
					if (environment.type == 'webapp') {
						var headerHeight = ($('#header').is(':visible') ? $('#header').outerHeight() : 0);
						var modalBrowser = $('<div></div>').css({
							position: 'fixed',
							width: $(document).width() + 'px',
							height: $(document).height() + 'px',
							top: $(document).height() + 'px',
							left: '0px',
							'z-index': 100,
							'transition': '-webkit-transform 0.4s cubic-bezier(0.455, 0.03, 0.515, 0.955)'
						});

						$('<a href="#">&nbsp;</a>')
							.css({
								display: 'block',
								height: headerHeight + 'px',
								overflow: 'hidden'
							})
							.on('click', function() {
								modalBrowser.remove();
								return false;
							})
							.appendTo(modalBrowser);

						$('<div></div>')
							.css({
								'-webkit-overflow-scrolling': 'touch',
								'overflow': 'scroll',
								'background-color': '#fff',
								width: $(document).width() + 'px',
								height: ($(document).height() - headerHeight) + 'px'
							})
							.appendTo(modalBrowser)
							.append(
								$('<iframe src="' + authUrl + '" frameborder="0"></iframe>')
									.css({
										width: $(document).width() + 'px',
										'min-height': ($(document).height() - headerHeight) + 'px'
									})
							);

						$('body').append(modalBrowser);
						modalBrowser.css({
							'-webkit-transform': 'translateY(-' + $(document).height() + 'px)'
						});

					// web browser
					} else {
						global.location.href = authUrl;
					}
				}
			},
			logout: function() {
				transport.load('callback.ashx?logout=logout').done(function(data, status){
					if (context.isNative) {
						messaging.publish('user.logout', {});
						unSetAuthorizationCookie();
					}
					context.controller.reset(true);
				});
			}
		}
	};

	return Authenticator;

}, jQuery, window);