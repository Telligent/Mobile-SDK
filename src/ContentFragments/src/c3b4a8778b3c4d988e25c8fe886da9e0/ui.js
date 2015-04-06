(function($){

	var api = {
		register: function(options) {

			$.telligent.evolution.mobile.addRefreshParameter('w_filter', options.filter);

			$(options.wrapper + ' .filters a').on('tap', function(e) {
				var filter = $(this).data('filter');
				if (filter != options.filter) {
					$.telligent.evolution.mobile.addRefreshParameter('w_filter', filter);
					$.telligent.evolution.mobile.refresh();
				}
				return false;
			});

			$.telligent.evolution.mobile.scrollable({
				region: 'content',
				load: function(pageIndex, success, error) {
					if ($('.bookmarks.' + options.filter + ' div.data:last').data('hasmore')) {
						$.telligent.evolution.get({
							url: options.moreUrl,
							data: {
								w_pageIndex: pageIndex,
								w_pageSize: options.pageSize
							},
							success: function(r) {
								success(r);
							},
							error: function() {
								error();
							}
						});
					} else {
						success();
					}
				},
				complete: function(content) {
					content = $(content).css({ opacity: 0 });
					$('div.post-list.bookmarks.' + options.filter).append(content);
					content.evolutionTransform({ opacity: 1 }, { duration: 400 });
				}
			});

			$.telligent.evolution.messaging.subscribe("ui.bookmark", function(data) {
				$.telligent.evolution.mobile.refresh();
			});
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.userBookmarks = api;

})(jQuery);