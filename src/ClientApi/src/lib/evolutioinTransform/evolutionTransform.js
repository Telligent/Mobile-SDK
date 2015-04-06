/*
 * Mobile-specific override of evolutionTransform
 * Adds the ability to accept an onComplete callback.
 * This should ideally be ported back to core
 */

/// @name evolutionTransform
/// @category jQuery Plugin
/// @description Performs CSS-based transforms and transitions
///
/// ### jQuery.fn.evolutionTransform
///
/// This plugin performs a CSS-based transforms and transitions on an element, optionally with animation. Uses GPU acceleration where available. Falls back to immediately-applied CSS when not available.
///
/// This is a mobile-specific override of the platform-defined version, adding support for the `complete` callback.
///
/// ### Usage
///
/// Transforms an element
///
///     $('selector').evolutionTransform(settings, options);
///
/// ### Settings
///
/// Settings is an object of CSS keys and values which are transitioned on the element. The following specific keys are applied as CSS transformations:
///
///  * `x`: x offset
///  * `y`: y offset
///  * `left`: alias for x offset (not to be confused with the standard CSS `left` property)
///  * `top`: alias for y offset (not to be confused with the standard CSS `top` property)
///  * `rotate`: z rotation
///  * `rotateX`: x rotation
///  * `rotateY`: y rotation
///  * `scale`: zoom scale
///  * `opacity`: opacity
///  * `complete`: function called when transition completes
///
/// ### Options
///
///  * `duration`: CSS animation duration, default 0
///  * `easing`: CSS animation easing, default 'linear'
///
/// ### Enabling or Disabling Animation
///
/// CSS animation can be globally disabled or enabled through:
///
///     $.fn.evolutionTransform.animationEnabled = false|true
///
/// When disabled, duration and easing options are ignored.

define('evolutionTransform', function($, global, undef) {

	// non-transition fallback detction and support
	function detectTransitionSupport() {
		var bodyStyle = (document.body || document.documentElement).style,
			vendors = ['Moz', 'webkit', 'Webkit', 'Khtml', 'O', 'ms'];

		if(typeof bodyStyle['transition'] == 'string')
			return true;

		for(var i=0; i<vendors.length; i++) {
			if(typeof bodyStyle[vendors[i] + 'Transition'] == 'string')
				return true;
		}
		return false;
	}

	function applyStyle(elm, name, value) {
		elm.style[name] = value;
	}

	// native support

	var x = 'x',
		y = 'y',
		left = 'left',
		top = 'top',
		rotate = 'rotate',
		rotateX = 'rotateX',
		rotateY = 'rotateY',
		scale = 'scale',
		opacity = 'opacity',
		undef,
		body,
		supportsCssTransition = null,
		vendorPrefix = (function () {
			if(!('getComputedStyle' in window))
				return '';
			var styles = window.getComputedStyle(document.documentElement, ''),
				pre = (Array.prototype.slice.call(styles).join('')
					.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1];
			return '-' + pre + '-';
		}());

	function transform(transforms, options) {
		if(!this || this.length == 0)
			return this;

		var settings = transforms || {},
			options = options || {},
			props = [],
			transX,
			transY,
			transRot = null,
			transRotX = null,
			transRotY = null,
			transScale = null,
			transforms = [];

		if(supportsCssTransition === null)
			supportsCssTransition = detectTransitionSupport();

		this.each(function(){
			if(this.nodeType === 3)
				return

			var elm = this,
				$elm = $(elm);

			$elm.off('.evolutionTransform');
			if(options.complete) {
				$elm.on('transitionend.evolutionTransform', options.complete);
				$elm.on('webkitTransitionEnd.evolutionTransform', options.complete);
				$elm.on('oTransitionEnd.evolutionTransform', options.complete);
				$elm.on('MSTransitionEnd.evolutionTransform', options.complete);
			}

			if(!supportsCssTransition) {
				if(settings.x)
					settings['left'] = settings.x;
				if(settings.y)
					settings['y'] = settings.y;
				return $elm.css(settings);
			}

			for(var opt in transform.defaults) {
				if(!options[opt]) {
					options[opt] = transform.defaults[opt];
				}
			}

			for(var key in settings) {
				var val = settings[key];
				if(key === x || key === left) {
					transX = val;
					delete settings[key];
				} else if(key === y || key === top) {
					transY = val;
					delete settings[key];
				} else if(key === rotate) {
					transRot = val;
					delete settings[key];
				} else if(key === rotateX) {
					transRotX = val;
					delete settings[key];
				} else if(key === rotateY) {
					transRotY = val;
					delete settings[key];
				} else if(key === scale) {
					transScale = val;
					delete settings[key];
				} else if(key == opacity) {
					if(val === 0) {
						settings[key] = 0.00001;
					} else if(val === 1) {
						settings[key] = 0.99999;
					}
					props[props.length] = key;
				} else {
					// change int (n) values to Npx
					if(typeof val === 'number' && val % 1 == 0) {
						settings[key] = (val + 'px');
					}
					props[props.length] = key;
				}
			}

			if(transX != undef || transY != undef) {
				transforms[transforms.length] = ('translate3d(' + (transX || 0) + 'px, ' + (transY || 0) + 'px, 0px)');
			}

			if(transRot != undef) {
				transforms[transforms.length] = ('rotateZ(' + transRot + 'deg)');
			}

			if(transRotX != undef) {
				transforms[transforms.length] = ('rotateX(' + transRotX + 'deg)');
			}

			if(transRotY != undef) {
				transforms[transforms.length] = ('rotateY(' + transRotY + 'deg)');
			}

			if(transScale != undef) {
				transforms[transforms.length] = ('scale(' + transScale + ')');
			}

			if(transforms.length > 0) {
				var propName = vendorPrefix + 'transform';
				mergedTransforms = transforms.join(' ');
				props[props.length] = propName;
				settings[propName] = mergedTransforms;
				settings['transform'] = mergedTransforms;
			}

			// only animate transitions if animationEnabled
			var transitionPart = $.fn.evolutionTransform.animationEnabled
					? ((options.duration / 1000) + 's ' + options.easing)
					: '';
				transition = props.join(' ' + transitionPart + ', ') + ' ' + transitionPart;

			// force a redraw to avoid batched CSS by accessing offsetHeight
			// pass it to noop to keep the closure compiler happy by not
			// removing the access due to being not used
			$.noop(elm.offsetHeight);

			// if rotating 3d, make sure there's a perspective on the body
			if(transRotY || transRotX) {
				body = body || $('body').get(0);
				body.style[vendorPrefix + 'perspective'] = options.perspective;
				body.style['perspective'] = options.perspective;
			}
			applyStyle(elm, vendorPrefix + 'transition', transition);
			applyStyle(elm, 'transition', transition);
			for(var key in settings) {
				applyStyle(elm, key, settings[key]);
			}
		});

		return this;
	};
	transform.defaults = {
		duration: 0,
		easing: 'linear',
		perspective: 250,
		complete: null
	};

	$.fn.evolutionTransform = transform;
	$.fn.evolutionTransform.animationEnabled = true;

	return {};

}, jQuery, window);