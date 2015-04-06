(function($, global, undef){

	var model = {
		addConversation: function(options) {
			var data = {
				Participants: options.participants,
				Body: options.body,
				Subject: options.subject
			};

			return $.telligent.evolution.post({
				url: options.addConversationUrl,
				data: data
			});
		}
	}

	var api = {
		register: function(options) {
			var subjectInput = $(options.subjectInput),
				bodyInput = $(options.bodyInput),
				participants = $(options.recipientInput),
				postLink = $('<a href="#" class="submit">' + options.postLabel + '</a>'),
				formatSuggestion = function(text) {
					return '<div style="padding: 4px 0;">' + text + "</div>";
				};

			postLink.on('tap', function(){
				var body = $.trim(bodyInput.val()),
					subject = $.trim(subjectInput.val()),
					userList = '';

				for (var i = 0; i < participants.glowLookUpTextBox('count'); i++) {
					if (userList.length > 0) {
						userList += ',';
					}
					userList += participants.glowLookUpTextBox('getByIndex', i).Value;
				}

				if(body.length > 0 && subject.length > 0 && userList.length > 0) {
					$.telligent.evolution.mobile.showLoading(model.addConversation({
						addConversationUrl: options.addConversationUrl,
						subject: subject,
						body: body,
						participants: userList
					})).then(function(response){
						$.telligent.evolution.mobile.load(response.conversationUrl, { refresh: true });
					});
				}
			});

			participants.glowLookUpTextBox({
			    emptyHtml: '',
			    maxValues: 20,
			    onGetLookUps: function (tb, searchText) {
			        window.clearTimeout(options.lookupTimeout);
			        if (searchText && searchText.length >= 2) {
			            tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', options.userLookupLoadingText, formatSuggestion(options.userLookupLoadingText), false)]);
			            options.lookupTimeout = window.setTimeout(function () {
			                $.telligent.evolution.get({
			                    url: options.lookupUserUrl,
			                    data: { w_SearchText: searchText },
			                    success: function (response) {
			                        if (response && response.matches.length > 1) {
			                            var suggestions = [];
			                            for (var i = 0; i < response.matches.length - 1; i++) {
			                                var item = response.matches[i];
		                                    suggestions[suggestions.length] = tb.glowLookUpTextBox('createLookUp', item.userName, item.title, formatSuggestion(item.title), true);
			                            }

			                            tb.glowLookUpTextBox('updateSuggestions', suggestions);
			                        }
			                        else
			                            tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', options.noUserMatchesText, formatSuggestion(options.noUserMatchesText), false)]);
			                    }
			                });
			            }, 749);
			        }
			    },
			    selectedLookUpsHtml: options.selectedUserDisplayName ? [options.selectedUserDisplayName] : [],
			    lookUpPopUpHeight: 75
			});

			$.telligent.evolution.mobile.setHeaderButton(postLink);
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.createConversation = api;

})(jQuery, window);