/*
 * Scroll Fixing for Mobile Browsers to prevent bouncing
 * Private API
 *
 * scrollfix.preventBounce(container)
 * // monitors whether a container is currently scrolling, inertial or not.
 * // Not 100% foolproof, errs on the side of assuming it's not, as this isn't fully possible to know
 * scrollfix.monitorEffectiveScrollState(container)
 * // Returns the assumed scrolling state
 * scrollfix.effectiveScrollState()  // returns true
 */
define('scrollfix', ['messaging', 'environment', 'scrolled'], function(messaging, environment, scrolled, $, global, undef){

	function preventBodyBounce(selection) {
		var originalScrollTop,
			elem = selection.get(0);
		selection.on('pointerstart', function(e){
			originalScrollTop = elem.scrollTop;

			if(originalScrollTop <= 0)
				elem.scrollTop = 1;

			if(originalScrollTop + elem.offsetHeight >= elem.scrollHeight)
				elem.scrollTop = elem.scrollHeight - elem.offsetHeight - 1;


			originalScrollLeft = elem.scrollLeft;

			if(originalScrollLeft <= 0)
				elem.scrollLeft = 1;

			if(originalScrollLeft + elem.offsetWidth >= elem.scrollWidth)
				elem.scrollLeft = elem.scrollWidth - elem.offsetWidth - 1;
		});
	};


	function fixKeyboardHeaderScrolling() {
		var fixHeaderPositionHandle = null;
		var fixed = false;
		var header = $('#header');
		var previousScrollY = 0;
		var bottomPadding;
		var removedOffset = null;
		var originalTopPadding;
		var originalHeaderHeight;
		var extraTopPadding;

		function applyExtraTopPadding() {
			extraTopPadding = $(global).height();
			originalTopPadding = parseInt(header.css('padding-top'), 10);
			originalHeaderHeight = header.outerHeight() - originalTopPadding;

			header.evolutionTransform({
				'padding-top': extraTopPadding + originalTopPadding,
				top: -1 * extraTopPadding
			}, { duration: 0 });
			header.data('_extra_top_padding', extraTopPadding);
		}

		messaging.subscribe('mobile.orientationchange', function(data) {
			applyExtraTopPadding();
			if(fixed)
				fixHeaderPosition();
			else
				unFixHeaderPosition();
		});

		setTimeout(applyExtraTopPadding, 100)

		function offsetFormToAllowForSpacingAtFormBase() {
			// add padding to bottom of form to allow for it to be scrollable
			bottomPadding = bottomPadding || $('<div>&nbsp;</div>').css({
				height: 300,
				display: 'none',
				backgroundColor: 'transparent'
			});
			bottomPadding.appendTo('.slideable:first').show();

			var el = $(document.activeElement);
			// if focused element is positioned such that there's no space between it and the keyboard,
			// then offset the content to allow for space
			if(window.innerHeight - (el.outerHeight(true) + el.offset().top) <= 0) {
				if(removedOffset === null)
					removedOffset = $('#content').css('top');
				$('#content').css({ top: (environment.device == 'ios' ? '20px' : '0px') });
			}
		}

		function unOffsetForm() {
			if(bottomPadding)
				bottomPadding.remove();
			if(removedOffset !== null)
				$('#content').css({ top: removedOffset });
			removedOffset = null;
		}

		function getYScroll() {
			return global.scrollY;
		}

		function fixHeaderPosition(refocus) {
			global.clearTimeout(fixHeaderPositionHandle);
			var newYScroll = getYScroll();
			// long scroll
			if(Math.abs(newYScroll - previousScrollY) > originalHeaderHeight) {
				// down
				if(newYScroll > previousScrollY) {
					header.evolutionTransform({ top: newYScroll - extraTopPadding - originalHeaderHeight }, { duration: 0 })
						.evolutionTransform({ top: newYScroll - extraTopPadding }, { duration: 100 });
				// up
				} else {
					header.evolutionTransform({ top: newYScroll - extraTopPadding }, { duration: 50 });
				}
			// short scroll
			} else {
				header.evolutionTransform({ top: newYScroll - extraTopPadding }, { duration: 50 });
			}
			previousScrollY = newYScroll;
			fixed = true;
			if(!refocus) {
				offsetFormToAllowForSpacingAtFormBase();
			}
		}

		function unFixHeaderPosition() {
			global.clearTimeout(fixHeaderPositionHandle);
			// if page was scrolled, hide the header place it just out of final position, and then slide it back in
			if(previousScrollY >= originalHeaderHeight) {
				header.css({ visibility: 'none' })
					.evolutionTransform({ top: -1 * originalHeaderHeight - extraTopPadding }, { duration: 0 })
					.evolutionTransform({ top:  -1 * extraTopPadding }, { duration: 50 });
			// otherwise just hide transition the header back to where it should be to avoid making movement
			// more interrupted than it already would have been.
			} else {
				header.evolutionTransform({ top: -1 * extraTopPadding }, { duration: 150 });
			}
			previousScrollY = 0;
			fixed = false;
			unOffsetForm();
		}

		messaging.subscribe('mobile.keyboard.open', messaging.GLOBAL_SCOPE, function() {
			global.clearTimeout(fixHeaderPositionHandle);
			fixHeaderPositionHandle = global.setTimeout(function(){ fixHeaderPosition(false) }, 50);
		});
		messaging.subscribe('mobile.keyboard.close', messaging.GLOBAL_SCOPE, unFixHeaderPosition);
		$('#content').on('focus', 'input, select, textarea', function(e) {
			if(fixed) {
				global.clearTimeout(fixHeaderPositionHandle);
				fixHeaderPositionHandle = global.setTimeout(function(){ fixHeaderPosition(true) }, 1);
			}
		});
		messaging.subscribe('mobile.keyboard.opened', messaging.GLOBAL_SCOPE, function() {
		});
		messaging.subscribe('mobile.keyboard.closed', messaging.GLOBAL_SCOPE, function(){
		});
	};

	var scrolling = false;
	function monitorEffectiveScrollState(selection) {
		var scrolledTimeout;
		$(selection).on({
			pointermove: function() {
				global.clearTimeout(scrolledTimeout);

				if(!scrolling) {
					scrolling = true;
				}
			},
			scrolled: function(e) {
				if(e.scrollType === 'momentum') {
					global.clearTimeout(scrolledTimeout);
					scrolledTimeout = global.setTimeout(function(){
						scrolling = false;
					}, 310);
				} else {
					global.clearTimeout(scrolledTimeout);
					scrolling = false;
				}
			}
		});
	}

	var api = {
		adaptBannerAndFormScrollPositionOnKeyboardFocus: function() {
			fixKeyboardHeaderScrolling();
		},
		preventBounce: function(selection) {
			selection = selection || $('body').children().first();
			preventBodyBounce(selection);
		},
		fix: function(selection) {
			selection.on('touchmove.scrollfix mousemove.scrollfix mspointermove.scrollfix', function(e){
				e.originalEvent.preventDefault();
			});
		},
		unfix: function(selection) {
			selection.off('.scrollfix');
		},
		monitorEffectiveScrollState: function(selection) {
			if(environment.device == 'ios') {
				monitorEffectiveScrollState(selection);
			}
		},
		isScrolling: function(difference) {
			if(difference !== undef) {
				scrolling = difference
			}
			if(environment.device == 'ios') {
				return scrolling;
			} else {
				return false;
			}
		}
	};

	return api;

}, jQuery, window);