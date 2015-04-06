(function($){

	var model = {
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
		},

		requestFriendship: function(requestorId, requesteeId, requestMessage) {
			return $.telligent.evolution.post({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{RequestorId}/friends.json',
				data: {
					RequestorId: requestorId,
					RequesteeId: requesteeId,
					RequestMessage: (requestMessage || '')
				}
			});
		},

		cancelFriendship: function(requestorId, requesteeId) {
			return $.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{RequestorId}/friends/{RequesteeId}.json',
				data: {
					RequestorId: requestorId,
					RequesteeId: requesteeId
				}
			});
		},

		acceptFriendship: function(requestorId, requesteeId) {
			return $.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{RequestorId}/friends/{RequesteeId}.json',
				data: {
					RequestorId: requestorId,
					RequesteeId: requesteeId,
					FriendshipState: 'Approved'
				}
			});
		},

		rejectFriendship: function(requestorId, requesteeId) {
			return this.cancelFriendship(requestorId, requesteeId);
		}
	}

	function handleActions(context) {
		var on = $.telligent.evolution.messaging.subscribe;

		// follow/unfollow
		on(context.messageFollow, function (data) {
			var target = $(data.target);
			if (!target.hasClass("processing")) {
				target.addClass("processing").text('...');
				var follows = target.data('follows');
				var action = follows ? model.stopFollowing : model.startFollowing;
				action(target.data('followerid'), target.data('followingid'))
					.done(function () {
						follows = !follows;
						target.data('follows', follows);
						$.telligent.evolution.mobile.displayMessage(
							!follows ? context.unfollowedText : context.followedText, {
								disappearAfter: 5000,
								cssClass: 'info'
							});
					})
					.always(function () {
						target.removeClass("processing")
							  .text(follows ? context.unfollowText : context.followText );
						$.telligent.evolution.mobile.hideSheet();
					});
			}
		});

		// request friendship
		on(context.messageRequestFriendship, function(data) {
			var target = $(data.target);
			var requestUrl = target.data('requesturl');
			// if this requires a custom request, show that page
			if(requestUrl) {
				$.telligent.evolution.mobile.load(requestUrl);
			} else {
				model.requestFriendship(target.data('requestorid'), target.data('requesteeid'), target.data('requestmessage'))
					.done(function() {
						$.telligent.evolution.mobile.displayMessage(context.requestComplete, {
							disappearAfter: 5000,
							cssClass: 'info'
						});
						$.telligent.evolution.mobile.refresh();
					})
					.always(function(){
						$.telligent.evolution.mobile.hideSheet();
					});
			}
		});

		// unfriend or cancel request
		on(context.messageCancelFriendship, function(data) {
			var target = $(data.target);
			if(confirm(target.data('canceltype') === 'unfriend' ? context.unfriendConfirmation : context.cancelConfirmation)) {
				model.cancelFriendship(target.data('requestorid'), target.data('requesteeid'))
					.done(function() {
						$.telligent.evolution.mobile.displayMessage((target.data('canceltype') === 'unfriend' ? context.unfriendComplete : context.cancelComplete), {
							disappearAfter: 5000,
							cssClass: 'info'
						});
						$.telligent.evolution.mobile.refresh();
					})
					.always(function(){
						$.telligent.evolution.mobile.hideSheet();
					});
			}
		});

		// accept request
		on(context.messageAcceptFriendship, function(data) {
			var target = $(data.target);
			model.acceptFriendship(target.data('requestorid'), target.data('requesteeid'))
				.done(function() {
					$.telligent.evolution.mobile.displayMessage(context.acceptComplete, {
						disappearAfter: 5000,
						cssClass: 'info'
					});
					$.telligent.evolution.mobile.refresh();
				})
				.always(function(){
					$.telligent.evolution.mobile.hideSheet();
				});
		});

		// reject request
		on(context.messageRejectFriendship, function(data) {
			var target = $(data.target);
			model.rejectFriendship(target.data('requestorid'), target.data('requesteeid'))
				.done(function() {
					$.telligent.evolution.mobile.displayMessage(context.rejectComplete, {
						disappearAfter: 5000,
						cssClass: 'info'
					});
					$.telligent.evolution.mobile.refresh();
				})
				.always(function(){
					$.telligent.evolution.mobile.hideSheet();
				});
		});
	}

	var api = {
		register: function(options) {
			handleActions(options);
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.userBanner = api;

})(jQuery);