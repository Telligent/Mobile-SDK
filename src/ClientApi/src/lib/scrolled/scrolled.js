/// @name scrolled
/// @category jQuery Event
/// @description Raised when a scrollable container stops scrolling
///
/// ### jQuery.event.special.scrolled
///
/// The scrolled event is raised when a scrollable container stops scrolling, including containers that use inertial scrolling via `-webkit-overflow-scrolling: touch`.
///
/// Raised when:
///
/// * scrolling from constant touch contact (dragging) stops
/// * inertial scrolling stops on its own
/// * inertial scrolling is interrupted
///
/// Inertial scrolling is detected by measuring travel distance and time and inferring inertial scrolling is likely taking place after a touch end. While usually correct, this is prone to an occasional incorrect guess.
///
/// ### Usage
///
///     // handle the 'scrolled' event on a selection
///     $(selection).on('scrolled', function() {
///         // handle event
///     });
///
define('scrolled', function($, global, undef){

	var eventName = 'scrolled';

	function pushPositionToStack(context, position, time) {
		if(context.positionStack.push({ position: position, time: time }) === 4) {
			context.positionStack.shift();
		}
	}

	function calculateVelocityFromPositions(context) {
		if(context.positionStack.length <= 1)
			return 0;
		var distance = context.positionStack[context.positionStack.length - 1].position - context.positionStack[0].position;
		if(distance < 0)
			distance = distance * -1;
		var time = context.positionStack[context.positionStack.length - 1].time - context.positionStack[0].time;
		return distance / time;
	}

	function onPointerStart(context) {
		var triggered = false;
		if(context.momentumScrolling) {
			trigger(context, true);
			triggered = true;
		}
		context.positionStack = [];
		context.momentumScrolling = false;
		if(!triggered)
			pushPositionToStack(context, context.currentPointerPageY, context.now);
	}

	function onPointerMove(context) {
		pushPositionToStack(context, context.currentPointerPageY, context.now);
	}

	function onPointerEnd(context) {
		if(context.positionStack.length <= 1)
			return;
		pushPositionToStack(context, context.currentPointerPageY, context.now);
		context.momentumScrolling = (calculateVelocityFromPositions(context) >= $.event.special.scrolled.defaults.velocityThreshold);
		if(!context.momentumScrolling) {
			trigger(context, false);
		}
	}

	function onScroll(context) {
		if(context.momentumScrolling) {
			trigger(context, true);
		}
	}

	function trigger(context, fromMomentum) {
		context.elm.trigger($.Event(eventName, {
			scrollType: (fromMomentum ? 'momentum' : 'drag')
		}));
		context.positionStack = [];
		context.momentumScrolling = false;
	}

	$.event.special.scrolled = {
		add: function(handle) {
			var elm = $(this);
			if(elm.data('_scrolled_bound'))
				return;

			var context = {
				elm: elm,
				didPointerStart: false,
				didScroll: false,
				didPointerMove: false,
				didPointerEnd: false,
				positionStack: [],
				currentPointerPageY: null,
				now: null,
				momentumScrolling: false,
				lastPointerEndAt: new Date().getTime()
			};

			context.checkInterval = global.setInterval(function(){
				context.now = new Date().getTime();
				if(context.didPointerStart) {
					context.didPointerStart = false;
					onPointerStart(context);
				}
				if(context.didPointerMove) {
					context.didPointerMove = false;
					onPointerMove(context)
				}
				if(context.didPointerEnd) {
					context.didPointerEnd = false;
					onPointerEnd(context)
					context.lastPointerEndAt = new Date().getTime();
				}
				if(context.didScroll) {
					context.didScroll = false;
					if((new Date().getTime() - context.lastPointerEndAt) > 100)
						onScroll(context);
				}
			}, 50);

			context.elm.on('pointerstart', function(e){
				context.didPointerStart = true;
				context.currentPointerPageY = e.pointers[0].pageY;
			});
			context.elm.on('pointermove', function(e){
				context.didPointerMove = true;
				context.currentPointerPageY = e.pointers[0].pageY;
			});
			context.elm.on('scroll', function(e){
				context.didScroll = true;
			});
			context.elm.on('pointerend', function(e){
				context.didPointerEnd = true;
				context.currentPointerPageY = e.pointers[0].pageY;
			});

			elm.data('_scrolled_bound', { context: context });
		},
		teardown: function() {
			var d = $(this).data('_scrolled_bound');
			if (d) {
				global.clearInterval(d.checkInterval);
			}
		}
	}
	$.event.special.scrolled.defaults = {
		velocityThreshold: .2
	};

	return {};

}, jQuery, window);
