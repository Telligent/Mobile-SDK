(function($, global, undef){

	var model = {
		addReply: function(options) {
			var data = {
				ThreadId: options.threadId,
				Body: options.body
			};

			if(options.parentReplyId)
				data.ParentReplyId = options.parentReplyId;
			if(options.subscribeToThread != undef && options.subscribeToThread != null)
				data.SubscribeToThread = options.subscribeToThread;
			if(options.isSuggestedAnswer != undef && options.isSuggestedAnswer != null)
				data.IsSuggestedAnswer = options.isSuggestedAnswer;

			return $.telligent.evolution.post({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/forums/threads/{ThreadId}/replies.json',
				data: data
			});
		},
		editReply: function(options) {
			var data = {
				ForumId: options.forumId,
				ThreadId: options.threadId,
				ReplyId: options.replyId,
				Body: options.body
			};

			if(options.subscribeToThread != undef && options.subscribeToThread != null)
				data.SubscribeToThread = options.subscribeToThread;
			if(options.isSuggestedAnswer != undef && options.isSuggestedAnswer != null)
				data.IsSuggestedAnswer = options.isSuggestedAnswer;

			return $.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/forums/{ForumId}/threads/{ThreadId}/replies/{ReplyId}.json',
				data: data
			});
		}
	}

	var api = {
		register: function(options) {

			var suggestAsAnswerInput = $(options.suggestAsAnswerInput),
				subscribeInput = $(options.subscribeInput),
				postLink = $('<a href="#" class="submit">' + (options.mode == 'add' ? options.postLabel : options.editLabel) + '</a>');

			postLink.on('tap', function(){
				var body = $.trim(options.getBodyContent()),
					submitAction;

				if(body.length > 0) {

					if(options.mode == 'add') {
						submitAction = model.addReply({
							threadId: options.forumThreadId,
							parentReplyId: options.forumReplyId,
							body: body,
							isSuggestedAnswer: suggestAsAnswerInput.length == 0 ? null : suggestAsAnswerInput.is(':checked'),
							subscribeToThread: subscribeInput.length == 0 ? null : subscribeInput.is(':checked')
						});
					} else if(options.mode == 'edit') {
						submitAction = model.editReply({
							forumId: options.forumId,
							threadId: options.forumThreadId,
							replyId: options.forumReplyId,
							body: body,
							isSuggestedAnswer: suggestAsAnswerInput.length == 0 ? null : suggestAsAnswerInput.is(':checked'),
							subscribeToThread: subscribeInput.length == 0 ? null : subscribeInput.is(':checked')
						});
					}

					$.telligent.evolution.mobile.showLoading();
					submitAction.done(function(response){
						$.telligent.evolution.mobile.load(response.Reply.Url, { refresh: true });
					}).fail(function(){
						$.telligent.evolution.mobile.hideLoading();
					})
				}
			});

			$.telligent.evolution.mobile.setHeaderButton(postLink);
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.createEditForumReply = api;

})(jQuery, window);