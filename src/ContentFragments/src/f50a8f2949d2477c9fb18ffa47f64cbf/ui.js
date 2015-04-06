(function($, global, undef){

	var model = {
		addThread: function(options) {
			var data = {
				ForumId: options.forumId,
				Body: options.body,
				Subject: options.subject
			};

			if(options.isQuestion != undef && options.isQuestion != null)
				data.IsQuestion = options.isQuestion;
			if(options.subscribeToThread != undef && options.subscribeToThread != null)
				data.SubscribeToThread = options.subscribeToThread;

			return $.telligent.evolution.post({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/forums/{ForumId}/threads.json',
				data: data
			});
		},
		editThread: function(options) {
			var data = {
				ForumId: options.forumId,
				ThreadId: options.threadId,
				Body: options.body,
				Subject: options.subject
			};

			if(options.isQuestion != undef && options.isQuestion != null)
				data.IsQuestion = options.isQuestion;
			if(options.subscribeToThread != undef && options.subscribeToThread != null)
				data.SubscribeToThread = options.subscribeToThread;

			return $.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/forums/{ForumId}/threads/{ThreadId}.json',
				data: data
			});
		}
	}

	var api = {
		register: function(options) {
			var titleInput = $(options.subjectInput),
				bodyInput = $(options.bodyInput),
				threadTypeInput = $(options.threadTypeInput),
				subscribeInput = $(options.subscribeInput),
				postLink = $('<a href="#" class="submit">' + (options.mode == 'add' ? options.postLabel : options.editLabel) + '</a>');

			postLink.on('tap', function(){
				var body = $.trim(options.getBodyContent()),
					subject = $.trim(titleInput.val()),
					submitAction;

				if(body.length > 0 && subject.length > 0) {

					if(options.mode == 'add') {
						submitAction = model.addThread({
							forumId: options.forumId,
							threadId: options.forumThreadId,
							subject: subject,
							body: body,
							isQuestion: (threadTypeInput.length == 0 ? null : threadTypeInput.val() == 'QuestionAndAnswer'),
							subscribeToThread: subscribeInput.length == 0 ? null : subscribeInput.is(':checked')
						});
					} else if(options.mode == 'edit') {
						submitAction = model.editThread({
							forumId: options.forumId,
							threadId: options.forumThreadId,
							subject: subject,
							body: body,
							isQuestion: (threadTypeInput.length == 0 ? null : threadTypeInput.val() == 'QuestionAndAnswer'),
							subscribeToThread: (subscribeInput.length == 0 ? null : subscribeInput.is(':checked'))
						});
					}

					$.telligent.evolution.mobile.showLoading();
					submitAction.done(function(response){
						$.telligent.evolution.mobile.load(response.Thread.Url, { refresh: true });
					}).fail(function(){
						$.telligent.evolution.mobile.hideLoading();
					});
				}
			});

			$.telligent.evolution.mobile.setHeaderButton(postLink);
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.createEditForumThread = api;

})(jQuery, window);