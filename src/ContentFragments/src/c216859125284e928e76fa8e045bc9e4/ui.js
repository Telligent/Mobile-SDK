(function($) {

	var model = {
		addThread: function(options) {
			var data = {
				WikiId: options.wikiId,
				Body: options.body,
				Title: options.subject
			};
			if (options.parent) {
				data.ParentPageId = options.parent.val() ? options.parent.val() : -1;
			}

			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.post({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/wikis/{WikiId}/pages.json',
				data: data
			}));
		},
		editThread: function(options) {
			var data = {
				WikiId: options.wikiId,
				Id: options.wikiPageId,
				Body: options.body,
				Title: options.subject
			};
			if (options.parent) {
				data.ParentPageId = options.parent.val() ? options.parent.val() : -1;
			}

			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/wikis/{WikiId}/pages/{Id}.json',
				data: data
			}));
		}
	}

	var bindElements = function(options) {
		options.parentInput = $(options.parentInput);
		if (options.parentInput && options.lookupPagesUrl && options.noPageMatchesText) {
			var timeout = null;
			options.parentInput.glowLookUpTextBox({
				'maxValues':1,
				'emptyHtml':'',
				'onGetLookUps':function(tb, searchText) {
					var disabled = tb.glowLookUpTextBox('disabled');
					window.clearTimeout(timeout);
					if(searchText && searchText.length > 2) {
						tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp','','<div style="text-align: center;"><img src="' + $.telligent.evolution.site.getBaseUrl() + 'utility/spinner.gif" /></div>','<div style="text-align: center;"><img src="' + $.telligent.evolution.site.getBaseUrl() + 'utility/spinner.gif" alt="…" /></div>', false)]);
						timeout = window.setTimeout(function() {
							$.telligent.evolution.mobile.showLoading($.telligent.evolution.get({
								url: options.lookupPagesUrl,
								data: {
									w_wikiId: options.wikiId,
									w_searchText: searchText
								}, success: function(response) {
									if (response && response.pages.length > 1)
									{
										var suggestions = [];
										for (var i = 0; i < response.pages.length - 1; i++)
											suggestions[suggestions.length] = tb.glowLookUpTextBox('createLookUp',response.pages[i].pageId,response.pages[i].title,response.pages[i].title,true);
										tb.glowLookUpTextBox('updateSuggestions', suggestions);
									}
									else
										tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp','',options.noPageMatchesText,options.noPageMatchesText,false)]);
								}
							}));
						}, 749);
					}
				},
				'selectedLookUpsHtml': (options.parentPageTitle ? [options.parentPageTitle] : [])
			});
		}
	}
	var api = {
		register: function(options) {

			var titleInput = $(options.titleInput),
				subscribeInput = $(options.subscribeInput),
				wikiIdInput = options.wikiId,
				postLink = $('<a href="#" class="submit">' + (options.mode == 'add' ? options.postLabel : options.editLabel) + '</a>');

			postLink.on('tap', function(){
				var body = $.trim(options.getBodyContent()),
					subject = $.trim(titleInput.val()),
					parent = $(options.parentInput),
					wikiId = $.trim(wikiIdInput),
					subscribe = subscribeInput.is(':checked'),
					submitAction;

				if(body.length > 0 && subject.length > 0) {
					if(options.mode == 'add') {
						submitAction = model.addThread({
							subject: subject,
							parent: parent,
							body: body,
							wikiId: wikiId,
							subscribeToThread: subscribeInput.length == 0 ? null : subscribeInput.is(':checked')
						});
					} else if(options.mode == 'edit') {
						submitAction = model.editThread({
							subject: subject,
							parent: parent,
							body: body,
							wikiId: wikiId,
							wikiPageId: options.wikiPageId,
							subscribeToThread: (subscribeInput.length == 0 ? null : subscribeInput.is(':checked'))
						});
					}

					$.telligent.evolution.mobile.showLoading(submitAction).then(function(response){
						var link = '/wikipages/' + response.WikiPage.Id;
						$.telligent.evolution.put({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/wikis/{wikiid}/pages/{wikipageid}/subscriptions.json',
							data: {
								wikiid: response.WikiPage.WikiId,
								wikipageid: response.WikiPage.Id,
								IsSubscribed: subscribe
							}
						}).done(function() {
							$.telligent.evolution.mobile.load(link, { refresh: true });
						});
					});
				}
			});

			$.telligent.evolution.mobile.setHeaderButton(postLink);

			bindElements(options);
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.wikiPageAddEdit = api;

})(jQuery, window);