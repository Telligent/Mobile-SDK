(function($){

	var api = {
		register: function(options) {

			// handle filter changes
			$(options.wrapper + ' ul.activity-filters a').on('click', function(e) {
				var filterIndex = $(this).data('filterindex');
				$.telligent.evolution.mobile.addRefreshParameter('w_filterIndex', filterIndex);
				$.telligent.evolution.mobile.refresh();
				return false;
			});

			// if there's a currently-applied filter index
			// re-apply it so it's ready for any manual pull-to-refreshes
			if(options.currentFilterIndex) {
				$.telligent.evolution.mobile.addRefreshParameter('w_filterIndex', options.currentFilterIndex);
			}

			if (options.postUrl) {
				var postLink = $('<a href="#" class="add">' + options.postLabel + '</a>').on('click', function(e) {
					$.telligent.evolution.mobile.clearContent();
					$.telligent.evolution.mobile.load(options.postUrl);
				});
				$.telligent.evolution.mobile.setHeaderButton(postLink);
			}

			$.telligent.evolution.mobile.scrollable({
				region: 'content',
				load: function(pageIndex, success, error) {
					var lastDate = $(options.wrapper + ' div.data:last').data('lastmessagedate');
					$.telligent.evolution.get({
						url: options.moreUrl,
						data: {
							FilterType: options.filterType,
							FilterIndex: options.currentFilterIndex,
							PageSize: options.pageSize,
							EndDate: lastDate,
							GroupId: options.groupId
						},
						success: function(r) {
							var response = $(r),
								hasNoRecords = response.find('.message.norecords:first').length > 0;
							if(hasNoRecords) {
								success();
							} else {
								success(response);
							}
						},
						error: function() {
							error();
						}
					})
				},
				complete: function(content) {
					content = $(content).css({ opacity: 0 });
					$(options.wrapper).find('div.stream').append(content);
					content.evolutionTransform({ opacity: 1 }, { duration: 400 });
				}
			});
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.activityStoryStream = api;

})(jQuery);