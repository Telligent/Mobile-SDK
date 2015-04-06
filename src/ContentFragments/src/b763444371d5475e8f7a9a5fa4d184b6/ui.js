(function($){


	var api = {
		register: function(options) {
			if (options.canPost) {
				var postLink = $('<a href="' + options.postUrl + '" class="add">' + options.postLabel + '</a>');
				$.telligent.evolution.mobile.setHeaderButton(postLink);
			}
		}
	}
	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.wiki = api;

})(jQuery);