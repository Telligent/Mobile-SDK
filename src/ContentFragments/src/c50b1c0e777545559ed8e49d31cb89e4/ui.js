(function($, global){

	var api = {
		register: function(options) {
			var searchTimeout = null,
				unreadNotificationCount = options.unreadNotificationCount,
				unreadConversationCount = options.unreadConversationCount,
				lastActivity = 0,
				lastNotificationCheck = 0,
				notificationPingDuration = 60 * 1000,
				header = null,
				searchInput = $(options.wrapper + ' input[type="search"]'),
				searchResults = $(options.wrapper).find('div.search-results'),
				searchFilters = $(options.wrapper).find('div.search-filters'),
				searchNavigation = $(options.wrapper).find('div.navigation'),
				initializeHeader = function() {
					header = $('<span class="header-notifications"><a href="' + options.notificationsUrl + '" class="notifications"><span class="icon bell"></span><span class="count" data-count="0"></span></a><a href="' + options.conversationsUrl + '" class="conversations"><span class="icon chat"></span><span class="count" data-count="0"></span></a></span>');
					$.telligent.evolution.mobile.setHeaderContent(header);
					retrieveUnreadCounts();
				},
				updateUnreadCounts = function() {
					header.find('.notifications .count').html(unreadNotificationCount == 0 ? '' : (unreadNotificationCount > 9 ? '9+' : unreadNotificationCount)).attr('data-count', unreadNotificationCount);
					header.find('.conversations .count').html(unreadConversationCount == 0 ? '' : (unreadConversationCount > 9 ? '9+' : unreadConversationCount)).attr('data-count', unreadConversationCount);
				},
				notificationCountUpdatePing = function() {
					var currentTime = (new Date()).getTime()
					if (currentTime - lastActivity < (notificationPingDuration * 5) && currentTime - lastNotificationCheck > notificationPingDuration) {
						retrieveUnreadCounts();
					}
				},
				resetNotificationCheckTimeout = function() {
					lastNotificationCheck = (new Date()).getTime();
				},
				retrieveUnreadCounts = function() {
					resetNotificationCheckTimeout();
					$.telligent.evolution.get({
						url: options.getUnreadCountsUrl,
						cache: false,
						success: function(r) {
							unreadNotificationCount = r.UnreadNotificationCount;
							unreadConversationCount = r.UnreadConversationCount;
							updateUnreadCounts();
						}
					});
				},
				showSearch = function() {
					searchResults.empty().show();
					searchFilters.show();
					searchNavigation.hide();
				},
				showNavigation = function() {
					searchResults.hide();
					searchFilters.hide();
					searchNavigation.show();
				},
				search = function() {
					showSearch();
					$.telligent.evolution.mobile.scrollable({
						region: 'navigation',
						initialPageIndex: -1,
						load: function(pageIndex, success, error) {
							var d = $(options.wrapper + ' div.search-results div.data:last')
							if (d.length == 0 || d.data('hasmore')) {
								$.telligent.evolution.get({
									url: options.searchUrl,
									data: {
										w_pageIndex: pageIndex,
										w_query: options.searchQuery,
										w_filter: options.searchFilter
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
							searchResults.append(content);
							content.evolutionTransform({ opacity: 1 }, { duration: 400 });
						}
					});
				};

			$(options.wrapper + ' .filters a').on('click', function(e) {
				e.preventDefault();
				var filter = $(this).data('filter');
				if (filter != options.filter) {
					options.searchFilter = filter;
					$(options.wrapper + ' .filters a').removeAttr('data-selected');
					$(this).attr('data-selected', true);
					search();
				}
				return false;
			});

			$.telligent.evolution.messaging.subscribe('mobile.content.rendered', 'navigation', function(d) {
				lastActivity = (new Date()).getTime();
			});

			$.telligent.evolution.messaging.subscribe('notification.read', 'navigation', function(d) {
				if (d && d.unreadCount) {
					var isConversation = (d.typeId === undefined || d.typeId == options.conversationNotificationTypeId);

					if (d.unreadCount.substr(0, 2) == '-=' && !isNaN(parseInt(d.unreadCount.substr(2), 10))) {
						if (isConversation) {
							unreadConversationCount -= parseInt(d.unreadCount.substr(2), 10);
							if (unreadConversationCount < 0) {
								unreadConversationCount = 0;
							}
						} else {
							unreadNotificationCount -= parseInt(d.unreadCount.substr(2), 10);
							if (unreadNotificationCount < 0) {
								unreadNotificationCount = 0;
							}
						}
						updateUnreadCounts();
					} else if (d.unreadCount.substr(0, 2) == '+=' && !isNaN(parseInt(d.unreadCount.substr(2), 10))) {
						if (isConversation) {
							unreadConversationCount += parseInt(d.unreadCount.substr(2), 10);
						} else {
							unreadNotificationCount += parseInt(d.unreadCount.substr(2), 10);
						}
						updateUnreadCounts();
					} else if (!isNaN(parseInt(d.unreadCount, 10)) && parseInt(d.unreadCount, 10) != (unreadConversationCount + unreadNotificationCount)) {
						retrieveUnreadCounts();
					}
				}
			});

			$.telligent.evolution.messaging.subscribe('notification.raised', 'navigation', function(d) {
				if (d && d.unreadCount && !isNaN(parseInt(d.unreadCount, 10)) && parseInt(d.unreadCount, 10) != (unreadConversationCount + unreadNotificationCount)) {
					retrieveUnreadCounts();
				} else {
					resetNotificationCheckTimeout();
				}
			});

			$.telligent.evolution.messaging.subscribe('mobile.content.loading', function(e){
				searchInput.blur();
			});

			$.telligent.evolution.messaging.subscribe('ui.bookmark', 'navigation', function(data) {
				$.telligent.evolution.mobile.refreshNavigation();
			});

			searchInput
				.attr('autocomplete', 'off')
				.keyup(function(e) {
					global.clearTimeout(searchTimeout);
					var query = $(this).val();
					if (query.length > 0) {
						$(options.wrapper + ' .search').addClass('with-value');
						searchTimeout = global.setTimeout(function() {
							options.searchQuery = query;
							search();
						}, 499);
					} else {
						$(options.wrapper + ' .search').removeClass('with-value');
						showNavigation();
					}
				});

			$(options.wrapper + ' .clear-search')
				.on('pointerstart', function(e) {
					e.preventDefault();
					searchInput.val('').focus();
					$(options.wrapper + ' .search').removeClass('with-value');
					global.clearTimeout(searchTimeout);
					showNavigation();
					return false;
				});

			if (options.searchQuery.length > 0) {
				searchInput.val(options.searchQuery);
				search(options.searchQuery);
			} else {
				showNavigation();
			}

			searchInput.on({
				focus: function(e) {
					$(options.wrapper + ' .search').addClass('active');
				},
				blur: function(e) {
					$(options.wrapper + ' .search').removeClass('active');
				}
			})

			if(options.includeConversationsAndNotifications) {
				initializeHeader();
				global.setInterval(function() {
					notificationCountUpdatePing();
				}, 499);
			}
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.navigation = api;

})(jQuery, window);