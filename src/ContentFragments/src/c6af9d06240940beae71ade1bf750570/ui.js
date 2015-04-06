(function($){

	var api = {
		register: function(options) {
			$(options.wrapper).on('tap', 'a.answered', function(e){
				var t = $(this);
				var threadId = t.data('threadid');

				var p = t.parents('.post-list-item');
				var a = p.find('.post.answer');
				if (a.length > 0) {
					if (a.css('display') == 'none') {
						a.show();
					} else {
						a.hide();
					}
				} else {
					a = $('<div class="post answer" style="display: none;"></div>');

					$.telligent.evolution.get({
						url: options.answerUrl,
						data: {
							w_threadid: threadId
						},
						success: function(r) {
							a.html(r);
							p.append(a);
							a.show();
						}
					});
				}

				return false;
			});

			$.telligent.evolution.mobile.scrollable({
				region: 'content',
				load: function(pageIndex, success, error) {
					if ($(options.wrapper + ' div.data:last').data('hasmore')) {
						$.telligent.evolution.get({
							url: options.moreUrl,
							data: {
								w_pageIndex: pageIndex
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
					$(options.wrapper).find('div.post-list').append(content);
					content.evolutionTransform({ opacity: 1 }, { duration: 400 });
				}
			});

			if (options.canPost) {
				var postLink = $('<a href="' + options.postUrl + '" class="add">' + options.postLabel + '</a>');
				$.telligent.evolution.mobile.setHeaderButton(postLink);
			}
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.forumThreadList = api;

})(jQuery);