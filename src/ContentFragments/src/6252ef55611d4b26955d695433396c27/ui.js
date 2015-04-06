(function($){

	var api = {
		register: function(options) {

		},
		del: function(id, context) {
			if(confirm(context.confirm)) {
				$.telligent.evolution.mobile.showLoading($.telligent.evolution.del({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/stories/{StoryId}.json',
					data: { StoryId: id },
					cache: false
				})).done(function(){
					$.telligent.evolution.mobile.back(true);
					$.telligent.evolution.mobile.hideSheet();
				})
			} else {
				$.telligent.evolution.mobile.hideSheet();
			}
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.activityStory = api;

})(jQuery);
