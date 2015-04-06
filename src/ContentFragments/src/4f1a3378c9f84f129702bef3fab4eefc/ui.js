(function($){

	var model = {
		deletePost: function (blogId, postId) {
			return $.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{BlogId}/posts/{PostId}.json',
				data: {
					BlogId: blogId,
					PostId: postId
				}
			});
		}
	}

	function handleBlogPostDeletionEvents(options) {
		$.telligent.evolution.messaging.subscribe('blogpost.delete', function (data) {
			$.telligent.evolution.mobile.hideSheet();
			$.telligent.evolution.mobile.confirm(options.postDeleteConfirmation, function (confirmed) {
				if (confirmed) {
					$.telligent.evolution.mobile.showLoading(model.deletePost(options.blogId, options.postId))
						.done(function () {
							// navigate back to the deleted post's blog, clearing its cache
							$.telligent.evolution.mobile.load(options.blogUrl, { refresh: true });
						});
				}
			});
		});
	}

	var api = {
		register: function (options) {
			handleBlogPostDeletionEvents(options);
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.blogPost = api;

})(jQuery);