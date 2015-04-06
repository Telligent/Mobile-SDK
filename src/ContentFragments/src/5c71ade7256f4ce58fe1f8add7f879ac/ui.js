(function($, global, undef){

	function requestFriendship(requestorId, requesteeId, requestMessage) {
		return $.telligent.evolution.post({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{RequestorId}/friends.json',
			data: {
				RequestorId: requestorId,
				RequesteeId: requesteeId,
				RequestMessage: (requestMessage || '')
			}
		});
	}

	var api = {
		register: function(options) {
			options.body = $(options.bodyId);

			var sendLink = $('<a href="#" class="submit">' + options.sendLabel + '</a>');
			$.telligent.evolution.mobile.setHeaderButton(sendLink);

			sendLink.on('tap', function(){
				if (options.body.val().length > 0) {
					$.telligent.evolution.mobile.showLoading();
					requestFriendship(options.requestorId, options.requesteeId, options.body.val())
						.then(function(){
							$.telligent.evolution.mobile.displayMessage(options.requestSent, {
								disappearAfter: 5000,
								cssClass: 'info'
							});
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
	$.telligent.evolution.widgets.userFriendshipRequest = api;

})(jQuery, window);
