(function($){

	var model = {
		updateAnswerState: function (forumId, threadId, replyId, isAnswer) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/forums/{ForumId}/threads/{ThreadId}/replies/{ReplyId}.json?IncludeFields=Reply.IsAnswer,Reply.IsSuggestedAnswer',
				data: {
					ForumId: forumId,
					ThreadId: threadId,
					replyId: replyId,
					IsAnswer: isAnswer,
					IsSuggestedAnswer: false
				}
			}));
		},
		deleteReply: function(forumId, threadId, replyId) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/forums/{ForumId}/threads/{ThreadId}/replies/{ReplyId}.json',
				data: {
					ForumId: forumId,
					ThreadId: threadId,
					ReplyId: replyId,
					DeleteChildren: false,
					SendAuthorDeleteNotification: false
				}
			}));
		},
		deleteThread: function(forumId, threadId) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/forums/{ForumId}/threads/{ThreadId}.json',
				data: {
					ForumId: forumId,
					ThreadId: threadId,
					DeleteChildren: true,
					SendAuthorDeleteNotification: false
				}
			}));
		}
	}

	function handleReplyDeletionEvents(options) {
		$.telligent.evolution.messaging.subscribe('forumreply.delete-reply', function(data){
			var a = $(data.target);
			$.telligent.evolution.mobile.hideSheet();
			$.telligent.evolution.mobile.confirm(options.replyDeleteConfirmation, function(confirmed) {
				if (confirmed) {
					model.deleteReply(options.forumId, options.threadId, a.data('replyid'))
						.done(function(){
							// hide and remove the deleted reply
							var replyItem = $(options.wrapper + ' .post-list-item[data-replyid="' + a.data('replyid') + '"]');
							replyItem.evolutionTransform({
								opacity: 0
							}, {
								duration: 200,
								complete: function() {
									replyItem.remove();
								}
							});
						});
				}
			});
		});
	}

	function handleThreadDeletionEvents(options) {
		$.telligent.evolution.messaging.subscribe('forumreply.delete-thread', function(data){
			var a = $(data.target);
			$.telligent.evolution.mobile.hideSheet();
			$.telligent.evolution.mobile.confirm(options.threadDeleteConfirmation, function(confirmed) {
				if (confirmed) {
					model.deleteThread(options.forumId, options.threadId)
						.done(function(){
							// navigate back to the deleted thread's forum, clearing its cache
							$.telligent.evolution.mobile.load(options.forumUrl, { refresh: true });
						});
				}
			});
		});
	}

	function handleAnswerChangeEvents(options) {
		$.telligent.evolution.messaging.subscribe('forumreply.answer-action', function(data) {
			var a = $(data.target),
				action = a.data('action');

			model.updateAnswerState(options.forumId, options.threadId, a.data('replyid'), action == 'accept-answer')
				.done(function(){
					if (options.filter == 'verified-answers') {
						if ($(options.wrapper + ' .post-list.replies').find('.post-list-item').length == 1) {
							$.telligent.evolution.mobile.refresh();
						} else {
							$(options.wrapper + ' .post-list.replies .post-list-item.forumreply[data-replyid="' + a.data('replyid') + '"]').remove();
						}
						$.telligent.evolution.mobile.hideSheet();
					} else {
						var p = $(options.wrapper + ' .post-list.replies .post-list-item.forumreply[data-replyid="' + a.data('replyid') + '"]');
						p.removeClass('suggested-answer');
						if (action == 'accept-answer') {
							p.addClass('answer');
						} else {
							p.removeClass('answer');
						}

						if (action == 'accept-answer') {
							a.parents('ul').find('a.answer-action').data('action', 'reject-answer').html(options.markAsNotAnswerText);
						} else {
							a.parents('ul').find('a.answer-action').data('action', 'accept-answer').html(options.markAsAnswerText);
						}

						$.telligent.evolution.mobile.hideSheet();

						p.find('.ui-links').uilinks('remove', 'a.answer-action.second-link');
					}
				})
				.fail(function(){
					$.telligent.evolution.mobile.hideSheet();
				});
		});
	}

	function initPaging(options) {
		$(options.wrapper).on('tap', '.post-list.replies a.view-more', function(e) {
			var l = $(this);
			var pi = parseInt(l.data('pageindex'), 10);
			if (isNaN(pi)) {
				return;
			}
			var lpi = parseInt(l.data('lastpageindex'), 10);


			$.telligent.evolution.mobile.showLoading($.telligent.evolution.get({
				url: options.moreUrl,
				data: {
					w_pageIndex: pi,
					w_filter: options.filter
				},
				success: function(r) {
					var top = $.telligent.evolution.mobile.contentScrollTop();
					var list = l.parents('.post-list.replies');
					var h = list.outerHeight();
					l.before(r);
					if (isNaN(lpi)) {
						l.hide();
						top = top + list.outerHeight() - h;
						$.telligent.evolution.mobile.contentScrollTop(top);
					} else if (pi == lpi) {
						l.hide();
						$(options.wrapper + ' .view-more[data-pageindex="' + (pi - 1) + '"]').hide();
					} else {
						l.data('pageindex', pi + 1);
						$(options.wrapper + ' .view-more[data-pageindex="' + (pi - 1) + '"]').hide();
					}
				}
			}));

			return false;
		});
	}

	function applyFilters(options) {
		$.telligent.evolution.mobile.addRefreshParameter('w_filter', options.filter);

		$(options.wrapper + ' .filters a').on('tap', function(e) {
			var filter = $(this).data('filter');
			if (filter != options.filter) {
				$.telligent.evolution.mobile.addRefreshParameter('w_filter', filter);
				$.telligent.evolution.mobile.refresh();
			}
			return false;
		});
	}

	var api = {
		register: function(options) {
			applyFilters(options);
			handleAnswerChangeEvents(options);
			handleReplyDeletionEvents(options);
			handleThreadDeletionEvents(options);
			initPaging(options);
			if (options.replyId) {
				var reply = $(options.wrapper + ' .post-list-item.forumreply[data-replyid="' + options.replyId + '"]');
				$.telligent.evolution.mobile.contentScrollTop(reply.offset().top);
			}
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.forumThread = api;

})(jQuery);