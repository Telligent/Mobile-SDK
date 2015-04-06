(function($){

	var model = {
		deleteConversation: function(conversationId) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/conversations/{ConversationId}.json',
				data: {
					ConversationId: conversationId
				}
			}));
		},
		addMessage: function(replyUrl, conversationId, text) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.post({
				url: replyUrl,
				data: {
					ConversationId: conversationId,
					Body: text
				}
			}));
		},
		getLatestMessages: function(latestMessageUrl) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.get({
				url: latestMessageUrl,
				cache: false
			}));
		},
		markAsRead: function(conversationId) {
			return $.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/conversations/{ConversationId}/read.json',
				data: {
					ConversationId: conversationId,
					HasRead: 'True'
				}
			});
		},
		loadMore: function(moreUrl, pageIndex) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.get({
				url: moreUrl,
				data: {
					w_pageIndex: pageIndex
				}
			}));
		}
	}

	function renderLatestMessages(wrapper, messages) {
		var p = $(wrapper + ' .post-list.messages');
		$('<div>' + messages + '</div>').find('.post-list-item.message').each(function() {
			var parent = $(this);
			var replyId = parent.data('replyid');
			if (p.find('.post-list-item.message[data-replyid="' + replyId + '"]').length == 0) {
				p.append(parent);
			}
		});
	}

	function handleDeleteEvent(options) {
		$.telligent.evolution.mobile.confirm(options.deleteConfirmation, function(confirmed) {
			if (confirmed) {
				model.deleteConversation(options.conversationId)
					.done(function(){
						$.telligent.evolution.mobile.load(options.conversationsUrl);
					});
			}
		});
	}

	function handleReplyEvent(options) {
		var input = $(options.wrapper + ' .reply-form textarea');
		if (input.val().length > 0) {
			input.blur();
			model.addMessage(options.replyUrl, options.conversationId, input.val())
				.done(function() {
					input.val('');
					model.getLatestMessages(options.getLatestUrl).then(function(r){
						renderLatestMessages(options.wrapper, r);
						$.telligent.evolution.mobile.contentScrollTop(input.get(0));
					})
				});
		}
	}

	function initPaging(options) {
		$(options.wrapper).on('tap', '.post-list.messages a.view-more', function(e) {
			var l = $(this);
			var pi = parseInt(l.data('pageindex'), 10);
			if (isNaN(pi)) {
				return;
			}

			model.loadMore(options.moreUrl, pi).done(function(r){
				var top = $.telligent.evolution.mobile.contentScrollTop();
				var list = l.parents('.post-list.messages');
				var h = list.outerHeight();
				l.before(r);
				l.hide();
				top = top + list.outerHeight() - h;
				$.telligent.evolution.mobile.contentScrollTop(top);
			});

			return false;
		});
	}

	var api = {
		register: function(options) {

			initPaging(options);

			var deleteLink = $('<a href="#">' + options.deleteText + '</a>');
			deleteLink.on('click', function() {
				handleDeleteEvent(options);
			});

			var replyLink = $('<a href="#">' + options.replyText + '</a>');
			replyLink.on('click', function() {
				handleReplyEvent(options);
			});

			$.telligent.evolution.mobile.setHeaderButton(deleteLink);
			$(options.wrapper + ' .reply-form textarea')
				.on('focus', function() {
					$.telligent.evolution.mobile.setHeaderButton(replyLink);
				})
				.on('blur', function() {
					window.setTimeout(function() {
						$.telligent.evolution.mobile.setHeaderButton(deleteLink);
					}, 249);
				});

			$.telligent.evolution.messaging.subscribe('notification.raised', function(d) {
				if (d.typeId == options.conversationNotificationTypeId && d.contentId == options.conversationId) {
					model.getLatestMessages(options.getLatestUrl).then(function(r){
						renderLatestMessages(options.wrapper, r);
					});
					model.markAsRead(d.contentId).then(function(r){
						$.telligent.evolution.messaging.publish('notification.read', {
							typeId: options.conversationNotificationTypeId,
							unreadCount: '-=1'
						});
					});
				}
			});

			$.telligent.evolution.mobile.contentScrollTop($(options.wrapper + ' .reply-form').offset().top);
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.conversation = api;

})(jQuery);