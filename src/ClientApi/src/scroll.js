/* scroll event shim, not included in mobile api as it's already in Evolution API, but duplicated here for testing */

(function($){
	var settings = {},
		initDataKey = '_scrollend_init';

	$.event.special.scrollend = {
		setup: function (options) {
			settings = $.extend({
				padding: 150,
				delay: 250
			}, options);
		},
		add: function() {
			var self = $(this);
			if(self.data(initDataKey)) {
				return;
			}

			var isWindow = this === document,
				scrollable = isWindow ? $(window) : self,
				didScroll = false,
				reachedEnd = function() {
					if(isWindow) {
						return ($(self).height() - $(self).scrollTop() - $(scrollable).height()) <= settings.padding;
					} else {
						return ((self.scrollTop() + self.innerHeight() + settings.padding) >= self[0].scrollHeight);
					}
				};

			scrollable.on('scroll', function(){
				didScroll = true;
			});

			var intervalHandle = setInterval(function() {
				if(didScroll) {
					if(reachedEnd()) {
						self.trigger('scrollend');
					}
					didScroll = false;
					if($(window).scrollTop() > 0) {
						$('body').addClass('scrolled');
					} else {
						$('body').removeClass('scrolled');
					}
				}
			}, settings.delay);

			self.data(initDataKey, { intervalHandle: intervalHandle });
		},
		teardown: function() {
			var d = $(this).data(initDataKey);
			if (d) {
				clearInterval(d.intervalHandle);
			}
		}
	};
}(jQuery));

(function($){
	var settings = {},
		initDataKey = '_scrolltop_init';

	$.event.special.scrolltop = {
		setup: function (options) {
			settings = $.extend({
				padding: 150,
				delay: 250
			}, options);
		},
		add: function() {
			var self = $(this);
			if(self.data(initDataKey)) {
				return;
			}

			var isWindow = this === document,
				scrollable = isWindow ? $(window) : self,
				didScroll = false,
				reachedTop = function() {
					return (self.scrollTop() <= settings.padding);
				};

			scrollable.on('scroll', function(){
				didScroll = true;
			});

			var intervalHandle = setInterval(function() {
				if(didScroll) {
					if(reachedTop()) {
						self.trigger('scrolltop');
					}
					didScroll = false;
				}
			}, settings.delay);

			self.data(initDataKey, { intervalHandle: intervalHandle });
		},
		teardown: function() {
			var d = $(this).data(initDataKey);
			if (d) {
				clearInterval(d.intervalHandle);
			}
		}
	};
}(jQuery));