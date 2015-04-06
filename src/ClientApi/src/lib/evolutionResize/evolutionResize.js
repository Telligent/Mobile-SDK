/*
 * Mobile-friendly override of $.fn.evolutionResize
 * Doesn't support overrides or max-height.
 */
define('evolutionResize', function($, global, undef){

	var win = $(global);
	var resize = function(context) {
			var maxHeight = win.height() * context.maxHeightPercent;
			var scrolls = false;
			context.area.css({ height: 'auto' });

			var newHeight = context.area.prop('scrollHeight');
			if(newHeight > maxHeight) {
				scrolls = true;
				newHeight = maxHeight;
			}

			context.area.css({ height: newHeight });

			newHeight = context.area.outerHeight();
			if(newHeight !== context.oldHeight) {
				context.area.css({ overflow: (scrolls ? 'auto': 'hidden') });
				context.area.trigger('evolutionResize', { newHeight: newHeight, oldHeight: context.oldHeight });
				context.oldHeight = newHeight;
			}
		};

	$.fn.evolutionResize = function(options) {
		var settings = $.extend({}, $.fn.evolutionResize.defaults, options || {});
		return this.filter('textarea').each(function(){
			var area = $(this)
					.css({ width: '100%', resize: 'none', overflow: 'hidden' });
			var originalHeight = area.height();
			var context = {
					area: area,
					oldHeight: area.height(),
					maxHeightPercent: settings.maxHeightPercent
				};
			setTimeout(function(){
				resize(context);
				area.bind('input', function(){ resize(context); });
			}, 500);
		});
	};
	$.fn.evolutionResize.defaults = {
		maxLength: 250,
		maxHeightPercent: .25
	};

	return {};

}, jQuery, window);
