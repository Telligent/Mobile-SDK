/*
 * Defines Exposure of the Mobile API
 */
require(['controller', 'transport', 'messaging', 'pushNotifications', 'environment', 'media', 'uiformatteddate', 'evolutionMobileComments', 'uicomments', 'uimoderate', 'uilike', 'evolutionResize', 'evolutionHighlight', 'keyboardfix', 'glowUpload', 'scrollfix', 'touchEventAdapter', 'evolutionTransform' ],
function(Controller, transport, messaging, pushNotifications, environment, media, uiformatteddate, evolutionMobileComments, uicomments, uimoderate, uilike, evolutionResize, evolutionHighlight, keyboardfix, glowUpload, scrollFix, touchEventAdapter, evolutionTransform, $, global) {

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.mobile = $.telligent.evolution.mobile || {
		environment: environment,
		defaults: Controller.defaults
	};

	$(function(){
		touchEventAdapter.adapt();
		keyboardfix.fix();
		scrollFix.adaptBannerAndFormScrollPositionOnKeyboardFocus();

		// the mobile api still requires being 'inited' by
		// the client code via $.telligent.evolution.mobile.init(options)
		var inited = false;
		function exposeControllerIniting() {
			//$.telligent.evolution.mobile.defaults = Controller.defaults;
			$.telligent.evolution.mobile.init = function(options) {
				if(inited)
					return;
				inited = true;
				// when inited, replace the definition of mobile
				// with an instance of the controller
				$.extend($.telligent.evolution.mobile, new Controller(options));
			};
		}

		function overrideMessaging() {
			// override the evolution messaing API with our own
			$.telligent.evolution.messaging = {
				publish: messaging.publish,
				subscribe: messaging.subscribe,
				unsubscribe: messaging.unsubscribe
			};
		}

		function overrideLanguageFormatAgoDate() {
			var dateCache = {},
				buildCacheKey = function(date) {
					return date.toString();
				},
				loadFormattedDate = function (date, complete) {
					var formattedDate = dateCache[buildCacheKey(date)];
					if(typeof formattedDate === 'undefined') {
						$.telligent.evolution.get({
							url: 'services/formatagodate',
							data: {
								date: $.telligent.evolution.formatDate(date)
							},
							success: function (response) {
								if (response && complete && typeof response !== 'undefined' && response !== null && response.formattedDate) {
									dateCache[buildCacheKey(date)] = response.formattedDate;
									complete(response.formattedDate);
								}
							}
						});
					} else {
						complete(formattedDate);
					}
				};

			var api = {
				formatAgoDate: function(date, complete) {
					loadFormattedDate(date, complete);
				}
			};

			if(!$.telligent) { $.telligent = {}; }
			if(!$.telligent.evolution) { $.telligent.evolution = {}; }
			$.telligent.evolution.language = $.extend({}, $.telligent.evolution.language, api);
		}

		function displayDefaultUiComponentMessages() {
			// when items are reported, hide any open sheets and show a default message
			messaging.subscribe('ui.reportabuse', messaging.GLOBAL_SCOPE, function(data) {
				// update existing moderate link components so that if they regenerate, have the proper value
				// this is a shim and should ideally occur at the component level
				var moderateLinks = $('.ui-moderate[data-contentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"]');
				moderateLinks.attr('data-initialstate', 'true');

				$.telligent.evolution.mobile.displayMessage(
					$.telligent.evolution.ui.components.moderate.defaults.reportedText, {
						disappearAfter: 5000,
						cssClass: 'info'
					});
				$.telligent.evolution.mobile.hideSheet();
			});

			// when items are bookmarked or unbookmarked, hide any open sheets and show a default message
			messaging.subscribe('ui.bookmark', messaging.GLOBAL_SCOPE, function(data) {
				// update existing bookmark link components so that if they regenerate, have the proper value
				// this is a shim and should ideally occur at the component level
				var bookmarkLinks = data.typeId
					? $('.ui-bookmark[data-contentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"][data-typeid="' + data.typeId + '"]')
					: $('.ui-bookmark[data-contentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"]');
				bookmarkLinks.attr('data-value', data.bookmarked.toString());

				var message = data.bookmarked ? 'Bookmark added' : 'Bookmark removed';

				$.telligent.evolution.mobile.displayMessage(message, {
					disappearAfter: 2500,
					cssClass: 'info'
				});
				$.telligent.evolution.mobile.hideSheet();
			});
		}

		function adjustAjaxSettings() {
			// ensure all Ajax URLs are fully absolutized
			$(document).ajaxSend(function(event, jqxhr, settings) {
				settings.url = transport.absolutize(settings.url);
			});

			$(document).ajaxError(function(e, xhr, settings, error) {
				// ignore errors from talking to anything other than RSW
				if(settings.url.indexOf('rsw') < 0)
					return;
				$.telligent.evolution.mobile.displayMessage('An error has occurred', {
					cssClass: 'warning',
					disappearAfter: 10 * 1000
				});
			});
		}

		function initAndExposeApi() {
			overrideMessaging();
			adjustAjaxSettings();
			displayDefaultUiComponentMessages();
			exposeControllerIniting();
			overrideLanguageFormatAgoDate();
		};

		if(environment.type == 'native') {
			document.addEventListener('deviceready', function () {
				transport.configure({
					isNative: true,
					domain: global.mobileNativeConfig.domain,
					baseUrl: global.mobileNativeConfig.baseUrl
				});

				initAndExposeApi();
			});
		} else {
			var baseUrl = global.location.href.indexOf('#') > -1
				? global.location.href.substr(0, global.location.href.indexOf('#'))
				: global.location.href;
			var baseUrl = baseUrl.indexOf('?') > -1
				? baseUrl.substr(0, baseUrl.indexOf('?'))
				: baseUrl;
			if(baseUrl.lastIndexOf('/') != baseUrl.length - 1)
				baseUrl = baseUrl + '/';
			transport.configure({
				isNative: false,
				baseUrl: baseUrl
			});
			initAndExposeApi();
		}

		// set environment-specific styling classes
		$('body').addClass(environment.device + ' ' + environment.type);
	});

}, jQuery, window);