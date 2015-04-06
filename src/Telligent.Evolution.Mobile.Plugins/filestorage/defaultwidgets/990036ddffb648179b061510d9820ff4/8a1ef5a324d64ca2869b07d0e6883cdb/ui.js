(function($, global) {

	// custom JSON storage which stores all items
	// scoped to the current user and in different
	// backends depending on anonymous or registered
	function ContextStorage(namespace) {
		var store = $.telligent.evolution.user.accessing.isSystemAccount
			? global.sessionStorage
			: global.localStorage;

		function addUserToKey(key) {
			return $.telligent.evolution.user.accessing.id + ':' + key;
		}

		function addNameSpaceToKey(key) {
			return namespace + ':' + key;
		}

		return {
			get: function(key) {
				if (!store) { return; }
				return JSON.parse(store.getItem(addNameSpaceToKey(addUserToKey(key))));
			},
			set: function(key, data) {
				if (!store) { return; }
				store.setItem(addNameSpaceToKey(addUserToKey(key)), JSON.stringify(data));
			},
			remove: function(key) {
				if (!store) { return; }
				store.removeItem(addNameSpaceToKey(addUserToKey(key)));
			}
		};
	};

	function getLastDismissedAt(context) {
		return context.storage.get('dismissed_at');
	}

	function updateLastDismissed(context) {
		return context.storage.set('dismissed_at', (new Date()).getTime());
	}

	function hideBanner(context) {
		context.wrapper.hide();
		$('body').removeClass('with-custom-smart-banner');
	}

	var api = {
		register: function(options) {
			options.wrapper = $(options.wrapperId);
			options.storage = new ContextStorage('smartbanner');

			// don't show if suppressed
			var lastDismissedAt = getLastDismissedAt(options);
			var now = new Date().getTime();
			if(lastDismissedAt && (now - lastDismissedAt < (options.dismissalMinutes * 60 * 1000)))
				return;

			var isIOS = navigator.userAgent.match(/iPad|iPhone|iPod/i) != null,
				isAndroid = navigator.userAgent.match(/Android/i) != null;

			// only render web banner for iOS if not store
			if(isIOS && options.iOSDistribution != 'direct')
				return;

			// build HTML banner view data
			var templateData = {
				name: options.appName,
				description: options.appDescription,
				buttonLabel: (options.linkMode == 'view' ? options.viewLabel : options.installLabel),
				viewLabel: options.viewLabel,
				viewInstallLabel: options.viewInstallLabel,
				installLabel: options.installLabel,
				viewUrl: (options.appUrlScheme + '://redirect?url=~/' + options.currentUrl.substr(options.homeUrl.length))
			};

			if(isIOS) {
				$.extend(templateData, {
					name: options.iOSAppName,
					description: options.iOSAppDescription,
					iconHtml: options.iOSIconHtml,
					installUrl: options.iOSInstallUrl,
					singleViewLink: true // ios unifies open/install links
				});
			} else if(isAndroid){
				$.extend(templateData, {
					name: options.androidAppName,
					description: options.androidAppDescription,
					iconHtml: options.androidIconHtml,
					installUrl: options.androidInstallUrl,
					singleViewLink: options.linkMode === 'install' // android shows separate install/open links
				});
			} else {
				return;
			}

			if(!templateData.installUrl || !templateData.name || !templateData.iconHtml){
				return;
			}

			var installRedirectTimeout;
			var clear = function() {
				global.clearTimeout(installRedirectTimeout);
			}

			$(window).on({
				pageshow: clear,
				pagehide: clear
			});

		    // attach view/dismiss handlers
			options.wrapper.on('click', '.view', function (e) {
			    e.preventDefault();
			    var a = $(this);
			    if (options.linkMode == 'install') {
			        hideBanner(options);
			        global.location = a.attr('href');
			    } else if (options.linkMode == 'view') {
			        // unified open/install link which tries to open first, delays and then intalls otherwise
			        var appHref = a.data('apphref');
			        if (appHref && appHref.length > 0) {
			            global.location = a.data('apphref');
			            installRedirectTimeout = global.setTimeout(function () {
			                global.location = a.attr('href');
			            }, 1000);
			            // separate links
			        } else {
			            global.location = a.attr('href');
			        }
			    }
			    return false;
			});

			options.wrapper.on('click', '.dismiss', function(e){
				e.preventDefault();
				hideBanner(options);
				updateLastDismissed(options);
				return false;
			});

			// render HTML banner
			$('body').addClass('with-custom-smart-banner');
			options.wrapper.children('.content-fragment-content:first').append($.telligent.evolution.template.compile(options.template)(templateData));
			options.wrapper.show();
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.smartBanner = api;

})(jQuery, window);
