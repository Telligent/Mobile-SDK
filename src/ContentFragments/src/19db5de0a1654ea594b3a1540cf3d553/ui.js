(function($){

	var api = {
		register: function(options) {
			var joinOptions = {
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/users.json',
				data: {
					GroupId: options.groupId,
					UserId: options.userId
				},
				success: function() {
					$.telligent.evolution.notifications.show(options.joinedText, { type: 'success' });
					$.telligent.evolution.mobile.refresh();
				}
			};

			// activate group joining buttons
			$.telligent.evolution.messaging.subscribe(options.joinMessageLinkName, function() {
				joinOptions.data.GroupMembershipType = 'Member';
				$.telligent.evolution.mobile.showLoading($.telligent.evolution.post(joinOptions));
				return false;
			});

			// request join
			$.telligent.evolution.messaging.subscribe(options.requestJoinMessageLinkName, function() {
				if (options.canJoinGroup) {
					joinOptions.data.GroupMembershipType = 'PendingMember';
					$.telligent.evolution.mobile.showLoading($.telligent.evolution.post(joinOptions));
				} else {
					$.telligent.evolution.mobile.load(options.requestJoinUrl);
				}
				return false;
			});

			// activate membership cancellation links
			$.telligent.evolution.messaging.subscribe(options.cancelMessageLinkName, function() {
				$.telligent.evolution.mobile.confirm(options.cancelConfirmMessage, function(r) {
					if (r) {
						$.telligent.evolution.mobile.showLoading($.telligent.evolution.del({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/users/{UserId}.json',
							data: {
								GroupId: options.groupId,
								UserId: options.userId
							},
							success: function(){
								$.telligent.evolution.notifications.show(options.leftText, { type: 'success' });
								$.telligent.evolution.mobile.addRefreshParameter('w_justleft', true);
								$.telligent.evolution.mobile.refresh();
							}
						}));
					}
				});
				return false;
			});
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.groupBanner = api;

})(jQuery);