(function($){

	var model = {
		removeFriendship: function (requestorId, requesteeId) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{RequestorId}/friends/{RequesteeId}.json',
				data: {
					RequestorId: requestorId,
					RequesteeId: requesteeId
				}
			}));
		},

		updateFriendship: function (requestorId, requesteeId, friendshipState) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{RequestorId}/friends/{RequesteeId}.json',
				data: {
					RequestorId: requestorId,
					RequesteeId: requesteeId,
					FriendshipState: friendshipState
				}
			}));
		},

		startFollowing: function (followerId, followingId) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.post({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{FollowerId}/following.json',
				data: {
					FollowerId: followerId,
					FollowingId: followingId
				}
			}));
		},

		stopFollowing: function (followerId, followingId) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{FollowerId}/following/{FollowingId}.json',
				data: {
					FollowerId: followerId,
					FollowingId: followingId
				}
			}));
		}
	}

	var api = {

		handleActions: function(options) {

			//remove friend
			$.telligent.evolution.messaging.subscribe('friendship.remove-friend', function (data) {
				var target = $(data.target);
				$.telligent.evolution.mobile.hideSheet();
				$.telligent.evolution.mobile.confirm(options.friendshipDeleteFriendConfirmation, function (confirmed) {
					if (confirmed) {
						model.removeFriendship(target.data('userid'), target.data('friendid'))
							.done(function () {
								$.telligent.evolution.mobile.refresh();
							});
					}
				});
			});

			//cancel request
			$.telligent.evolution.messaging.subscribe('friendship.cancel-request', function (data) {
				var target = $(data.target);
				$.telligent.evolution.mobile.hideSheet();
				$.telligent.evolution.mobile.confirm(options.friendshipRequestCancelConfirmation, function (confirmed) {
					if (confirmed) {
						model.removeFriendship(target.data('userid'), target.data('friendid'))
							.done(function () {
								$.telligent.evolution.mobile.refresh();
							});
					}
				});
			});

			//reject request
			$.telligent.evolution.messaging.subscribe('friendship.reject-request', function (data) {
				var target = $(data.target);
				$.telligent.evolution.mobile.hideSheet();
				model.removeFriendship(target.data('friendid'), target.data('userid'))
					.done(function () {
						$.telligent.evolution.mobile.refresh();
					});
			});

			//approve request
			$.telligent.evolution.messaging.subscribe('friendship.approve-request', function (data) {
				var target = $(data.target);
				$.telligent.evolution.mobile.hideSheet();
				model.updateFriendship(target.data('friendid'), target.data('userid'), 'Approved')
					.done(function () {
						$.telligent.evolution.mobile.refresh();
					});
			});

			// start / stop following
			$.telligent.evolution.messaging.subscribe('friendship.follow', function (data) {
				var target = $(data.target);
				if (!target.hasClass("processing")) {
					target.addClass("processing")
						  .text('...');
					var follows = target.data('follows');
					var action = follows ? model.stopFollowing : model.startFollowing;
					action(target.data('followerid'), target.data('followingid'))
						.done(function () {
							follows = !follows;
							target.data('follows', follows);
							$.telligent.evolution.mobile.displayMessage(
								!follows ? options.unfollowedText : options.followedText, {
									disappearAfter: 5000,
									cssClass: 'info'
								});
						})
						.always(function () {
							target.removeClass("processing")
								  .text(follows ? options.unfollowText : options.followText );
							$.telligent.evolution.mobile.hideSheet();
						});
				}
			});
		},

		initScrolling: function(options) {

			$.telligent.evolution.mobile.scrollable({
				region: 'content',
				load: function(pageIndex, success, error) {
					if ($('.friendships.' + options.filter + ' div.data:last').data('hasmore')) {
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
					$('div.post-list.friendships.' + options.filter).append(content);
					content.evolutionTransform({ opacity: 1 }, { duration: 400 });
				}
			});

		},

		applyFilters: function(options) {

			$.telligent.evolution.mobile.addRefreshParameter('w_filter', options.filter);

			$(options.wrapper + ' .filters a').on('tap', function(e) {
				var filter = $(this).data('filter');
				if (filter != options.filter) {
					$.telligent.evolution.mobile.addRefreshParameter('w_filter', filter);
					$.telligent.evolution.mobile.refresh();
				}
				return false;
			});

		},

		register: function(options) {
			api.handleActions(options);
			api.initScrolling(options);
			api.applyFilters(options);

		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.userFriendships = api;

})(jQuery);