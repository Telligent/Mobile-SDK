(function($, global, undef){
	var api = {
		register: function(options) {
			options.body = $(options.bodyId);

			var sendLink = $('<a href="#" class="submit">' + options.sendLabel + '</a>');
			$.telligent.evolution.mobile.setHeaderButton(sendLink);

			sendLink.on('tap', function(){
				if (options.body.val().length > 0) {
					$.telligent.evolution.mobile.showLoading();
					$.telligent.evolution.post({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/users.json',
						data: {
							GroupId: options.groupId,
							UserId: options.userId,
							GroupMembershipType: 'PendingMember',
							Message: options.body.val()
						}
					}).then(function(){
						$.telligent.evolution.mobile.back(true);
					})
					.fail(function(){
						$.telligent.evolution.mobile.hideLoading();
					});
				}
				return false;
			});
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.groupMembershipRequest = api;

})(jQuery, window);