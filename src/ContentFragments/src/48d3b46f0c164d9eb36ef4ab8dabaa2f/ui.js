(function($, global, undef){

	var model = {
		addBlogPost: function(data) {
			$.telligent.evolution.mobile.showLoading();
			var addBlogPostPromise = $.telligent.evolution.post({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{BlogId}/posts.json',
				data: data
			}).fail(function(){
				$.telligent.evolution.mobile.hideLoading();
			});
			return addBlogPostPromise;
		},
		editBlogPost: function(data) {
			$.telligent.evolution.mobile.showLoading();
			var editBlogPostPromise = $.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{BlogId}/posts/{BlogPostId}.json',
				data: data
			}).fail(function(){
				$.telligent.evolution.mobile.hideLoading();
			});
			return editBlogPostPromise;
		}
	}

	var api = {
		register: function(options) {
			var postLink = $('<a href="#" class="submit">' + (!options.blogPostId ? options.postLabel : options.editLabel) + '</a>');

			postLink.on('tap', function(){

				var data = {
					Body: $.trim(options.getBodyContent()),
					Title: $.trim($(options.titleInput).val()),
					BlogId: options.blogId,
					BlogPostId: options.blogPostId
				}

				if(data.Body.length > 0 && data.Title.length > 0) {
					$.telligent.evolution.mobile.showLoading((!options.blogPostId ? model.addBlogPost(data) : model.editBlogPost(data)))
						.then(function(response){
							$.telligent.evolution.mobile.load(response.BlogPost.Url, { refresh: true });
						});
				}
			});

			$.telligent.evolution.mobile.setHeaderButton(postLink);
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.createEditBlogPost = api;

})(jQuery, window);