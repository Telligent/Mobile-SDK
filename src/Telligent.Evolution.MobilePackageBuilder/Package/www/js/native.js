(function ($, global) {

	var SUCCESS = 0,
		DISCONNECTED = 1,
		RELOAD = 2;

	var $ = $.noConflict(true),
		headers = '',
		body = '',
		lastUpdateCheck = 0,
		online = null;

	var updateHeaders = function () {
		var success = SUCCESS;
		var scaleFactor = (Math.round(window.devicePixelRatio || 1) || 1);

		$.ajax({
			type: 'GET',
			url: global.mobileNativeConfig.baseUrl + 'callback.ashx?headers=native&scalefactor=' + scaleFactor,
			crossDomain: false,
			dataType: 'html',
			timeout: 60000,
			cache: false,
			async: false,
			success: function (html) {
				if (html != headers) {
					if (headers !== '') {
						success = RELOAD;
						return;
					}

					headers = html;

					var scripts = [];
					var findScriptInclude = new RegExp("src\s?=\s?\"([^\"]*)\"", "i");
					var html = html.replace(new RegExp("<script(?:\n|\r|.)*?</script>", "gi"), function (match) {
						var r = findScriptInclude.exec(match);
						if (r && r[1]) {
							scripts.push({ type: 'include', url: $('<div></div>').html(r[1]).text() });
						} else {
							scripts.push({ type: 'inline', html: match });
						}
						return '';
					});

					$('head *[data-native!="true"]').remove()
					$('head').append(html);

					var i = -1;
					var next = function () {
						i++;
						if (i < scripts.length) {
							var script = scripts[i];
							if (script.type == 'include') {
								$.getScript(script.url)
									.done(function () {
										global.setTimeout(function () { next(); }, 9);
									})
							} else {
								$('head').append(script.html);
								global.setTimeout(function () { next(); }, 9);
							}
						}
					}

					next();
				}
			},
			error: function () {
				success = DISCONNECTED;
			}
		});
		return success;
	}, updateBody = function () {
		var success = SUCCESS;

		$.ajax({
			type: 'GET',
			url: global.mobileNativeConfig.baseUrl + 'callback.ashx?rootpage=native',
			crossDomain: false,
			dataType: 'html',
			timeout: 60000,
			cache: false,
			async: false,
			success: function (html) {
				if (html != body) {
					if (body !== '') {
						success = RELOAD;
						return;
					}

					body = html;

					$('body').html(html);
				}
			},
			error: function () {
				success = DISCONNECTED;
			}
		});

		return success;
	}, initialize = function() {
		var currentTime = (new Date()).getTime();
		var success = (navigator.connection && navigator.connection.type != Connection.NONE) ? SUCCESS : DISCONNECTED;
		if (currentTime - lastUpdateCheck > 300000 || online !== (success == SUCCESS)) {
			lastUpdateCheck = currentTime;
			online = success === SUCCESS;

			if (success == SUCCESS) {
			    success = updateBody();
			}

			if (success == SUCCESS) {
			    success = updateHeaders();
			}

			if (success == DISCONNECTED) {
				showNotConnected();
				navigator.splashscreen.hide();
			} else if (success == RELOAD) {
				navigator.splashscreen.show();
				location.reload();
			} else {
			    navigator.splashscreen.hide();
			}
		}
	}, showNotConnected = function() {
		var messages = {
			'en': 'This application requires an internet connection. Please connect to the internet and try again.',
			'es': 'Esta aplicación requiere una conexión a Internet. Por favor, conectarse a Internet y vuelva a intentarlo.',
			'fr': 'Cette application nécessite une connexion Internet. S\'il vous plaît se connecter à Internet et essayez à nouveau.',
			'zh': '此應用程序需要連接到互聯網。請連接到互聯網，然後再試一次。',
			'cs': 'Tato aplikace vyžaduje připojení k internetu. Prosím, připojení k internetu a zkuste to znovu.',
			'nl': 'Deze applicatie is een internetverbinding vereist. Maak verbinding met het internet en probeer het opnieuw.',
			'de': 'Diese Anwendung erfordert eine Internet-Verbindung. Bitte mit dem Internet verbinden und erneut versuchen.',
			'el': 'Αυτή η εφαρμογή απαιτεί σύνδεση στο internet. Παρακαλούμε συνδεθείτε στο Internet και δοκιμάστε ξανά.',
			'id': 'Aplikasi ini membutuhkan koneksi internet. Silakan terhubung ke internet dan coba lagi.',
			'it': 'Questa applicazione richiede una connessione a internet. Si prega di collegarsi a Internet e riprova.',
			'jp': 'このアプリケーションはインターネット接続が必要です。インターネットに接続し、再度実行してください。',
			'ko': '이 응용 프로그램은 인터넷 연결이 필요합니다. 인터넷에 연결 한 후 다시 시도하십시오.',
			'ru': 'Для этого приложения требуется подключение к интернету. Пожалуйста, подключиться к Интернету и повторите попытку.'
		}
		
		var showMessage = function(m) {
			$('body').empty();
			$('body').append(
				$('<div data-native="notconnected"></div>')
					.css({
						'height': $(window).height(),
						'width': $(window).width(),
						'background': 'url(splash.png) center center',
						'background-size': 'cover',
						'position': 'absolute',
						'top': '0px',
						'left': '0px'
					})
					.append(
						$('<span></span')
						.css({
							'display': 'block',
							'position': 'absolute',
							'bottom': '36px',
							'left': '0px',
							'line-height': 'normal',
							'text-shadow': '0 0 4px #000',
							'background': '#555',
							'opacity': .5,
							'font-family': 'Arial, Helvetica',
							'font-size': '18px',
							'color': '#fff',
							'text-align': 'center',
							'padding': '9px 18px',
							'width': '100%',
							'box-sizing': 'border-box',
						})
						.text(m)
					)
				);
			body = 'not connected';
			
			$(window).on('resize', function() {
				$('body div[data-native="notconnected"]').css({
					'height': $(window).height(),
					'width': $(window).width()
				});
			});
		}
		
		navigator.globalization.getLocaleName(function(locale) {
			var l = locale.value.substr(0, 2);
			if (messages[l]) {
				showMessage(messages[l]);
			} else {
				showMessage(messages['en']);
			}
		}, function() {
			showMessage(messages['en']);
		});
	}

	var initializeTimeout = null;

	document.addEventListener('deviceready', function () {
	    $(document).ready(function () {
	        global.clearTimeout(initializeTimeout);
	        initializeTimeout = global.setTimeout(function () {
		        var i = function () {
		            initialize();
		            if (!online) {
		                global.clearTimeout(initializeTimeout);
		                initializeTimeout = global.setTimeout(function () { i(); }, 500);
		            }
		        }
		        i();
			}, 9);
		 });
	}, false);

	document.addEventListener('offline', function() {
		if (online === true) {
			online = false;
			showNotConnected();
		}
	}, false);

	document.addEventListener('online', function() {
		$(document).ready(function () {
		    if (online !== true) {
		        global.clearTimeout(initializeTimeout);
		        initializeTimeout = global.setTimeout(function () {
			        var i = function () {
			            initialize();
			            if (!online) {
			                global.clearTimeout(initializeTimeout);
			                initializeTimeout = global.setTimeout(function () { i(); }, 500);
			            }
			        }
			        i();
			    }, 9);
			}
		});
	}, false);

	document.addEventListener('resume', function() {
	    $(document).ready(function () {
	        global.clearTimeout(initializeTimeout);
	        initializeTimeout = global.setTimeout(function () {
		        var i = function () {
		            initialize();
		            if (!online) {
		                global.clearTimeout(initializeTimeout);
		                initializeTimeout = global.setTimeout(function () { i(); }, 500);
		            }
		        }
		        i();
		    }, 9);
		});
	}, false);
	
})(jQuery, window);