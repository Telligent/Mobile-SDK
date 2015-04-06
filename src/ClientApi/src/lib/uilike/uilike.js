/*
 * UI Like Component Override
 */

/// @name like
/// @category UI Component
/// @description Presents a content like UI
///
/// ### jQuery.telligent.evolution.ui.components.like
///
/// Override of the platform-defined ui-like component.
///
/// ### Implementation
///
/// For reference purposes or as the basis for an override:
///
///     (function($, global, undef) {
///
///     var getCurrentCount = function(contentId, contentTypeId, typeId, complete) {
///         $.telligent.evolution.get({
///             url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/likes.json',
///             data: {
///                 ContentId: contentId,
///                 ContentTypeId: contentTypeId,
///                 TypeId: typeId,
///                 SortBy: 'Date',
///                 SortOrder: 'Descending',
///                 PageSize: 1,
///                 PageIndex: 0
///             },
///             cache: false,
///             dataType: 'json',
///             success: function(response) {
///                 complete.call(this, {
///                     count: response.TotalCount,
///                     latestLike: response.Likes.length > 0 ? response.Likes[0] : null
///                 });
///             }
///         });
///     };
///
///     var getLikeToggleMessage = function(liked) {
///         return (liked ? $.fn.evolutionLike.defaults.unlikeText : $.fn.evolutionLike.defaults.likeText);
///     }
///
///     // when items are liked or unliked, hide any open sheets
///     $.telligent.evolution.messaging.subscribe('ui.like', 'global', function(data) {
///         // update existing like components so that if they regenerate, have the proper value
///         // this is a shim and should ideally occur at the component level
///         var likeLinks = data.typeId
///             ? $('.ui-like[data-contentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"][data-typeid="' + data.typeId + '"]')
///             : $('.ui-like[data-contentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"]');
///         likeLinks
///             .attr('data-initialstate', data.liked.toString())
///             .attr('data-initialcount', data.count.toString());
///
///         var config = likeLinks.find('.like-toggle a').data('evolutionToggleLink');
///         if (config) {
///             config.settings.onHtml = config.settings.offHtml = '<span></span>' +  getLikeToggleMessage(data.liked);
///             likeLinks.find('.like-toggle a').data('evolutionToggleLink', config);
///         }
///
///         $.telligent.evolution.mobile.hideSheet();
///     });
///
///     $.telligent.evolution.ui.components.like = {
///         // set up efficient event-delegated handling of showing/hiding who likes popups
///         setup: function() {
///             // when tapping who likes ("and X others")
///             $('#refreshable-content').on('click', '.who-likes', function(e){
///                 // build a URL representing the likers list page with content details
///                 var likeComponent = $(e.target).closest('.ui-like');
///
///                 var data = {
///                     ContentId: likeComponent.data('contentid'),
///                     ContentTypeId: likeComponent.data('contenttypeid')
///                 };
///                 if(likeComponent.data('typeid')) {
///                     data.TypeId = likeComponent.data('typeid');
///                 }
///
///                 var likerUrl = $.telligent.evolution.url.modify({
///                     url: 'likers',
///                     query: data,
///                     hash: { }
///                 });
///
///                 // navigate to that url
///                 $.telligent.evolution.mobile.load(likerUrl);
///             });
///         },
///         // set up instances of bus-bound like toggles/counts/messages
///         add: function(elm, options) {
///             var readOnly = options.readonly === 'true';
///             $(elm).evolutionLike({
///                 contentId: options.contentid,
///                 contentTypeId: options.contenttypeid,
///                 initialState: options.initialstate,
///                 initialMessage: options.initialmessage,
///                 initialCount: options.initialcount,
///                 format: (readOnly ? options.format.replace('{toggle}','') : options.format),
///                 typeId: options.configuration.LikeTypeId,
///                 onLike: function(contentId, contentTypeId, typeId, complete) {
///                     var data = {
///                         ContentId: contentId,
///                         ContentTypeId: contentTypeId
///                     };
///                     if(typeId !== null && typeId.length > 0) {
///                         data.TypeId = typeId;
///                     }
///                     $.telligent.evolution.post({
///                         url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/likes.json',
///                         data: data,
///                         cache: false,
///                         dataType: 'json',
///                         success: function(response) {
///                             getCurrentCount(contentId, contentTypeId, typeId, complete);
///                         }
///                     });
///                 },
///                 onUnlike: function(contentId, contentTypeId, typeId, complete) {
///                     var data = {
///                         ContentId: contentId
///                     };
///                     if(typeId !== null && typeId.length > 0) {
///                         data.TypeId = typeId;
///                     }
///                     $.telligent.evolution.del({
///                         url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/like.json',
///                         data: data,
///                         cache: false,
///                         dataType: 'json',
///                         success: function(response) {
///                             getCurrentCount(contentId, contentTypeId, typeId, complete);
///                         }
///                     });
///                 }
///             });
///         }
///     };
///
///     })(jQuery, window);
///
///
define('uilike', ['messaging', 'url'], function(messaging, url, $, global, undef){

	var getCurrentCount = function(contentId, contentTypeId, typeId, complete) {
		$.telligent.evolution.get({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/likes.json',
			data: {
				ContentId: contentId,
				ContentTypeId: contentTypeId,
				TypeId: typeId,
				SortBy: 'Date',
				SortOrder: 'Descending',
				PageSize: 1,
				PageIndex: 0
			},
			cache: false,
			dataType: 'json',
			success: function(response) {
				complete.call(this, {
					count: response.TotalCount,
					latestLike: response.Likes.length > 0 ? response.Likes[0] : null
				});
			}
		});
	};

	var getLikeToggleMessage = function(liked) {
		return (liked ? $.fn.evolutionLike.defaults.unlikeText : $.fn.evolutionLike.defaults.likeText);
	}

	// when items are liked or unliked, hide any open sheets
	messaging.subscribe('ui.like', messaging.GLOBAL_SCOPE, function(data) {
		// update existing like components so that if they regenerate, have the proper value
		// this is a shim and should ideally occur at the component level
		var likeLinks = data.typeId
			? $('.ui-like[data-contentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"][data-typeid="' + data.typeId + '"]')
			: $('.ui-like[data-contentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"]');
		likeLinks
			.attr('data-initialstate', data.liked.toString())
			.attr('data-initialcount', data.count.toString());

		var config = likeLinks.find('.like-toggle a').data('evolutionToggleLink');
		if (config) {
			config.settings.onHtml = config.settings.offHtml = '<span></span>' +  getLikeToggleMessage(data.liked);
			likeLinks.find('.like-toggle a').data('evolutionToggleLink', config);
		}

		$.telligent.evolution.mobile.hideSheet();
	});

	$.telligent.evolution.ui.components.like = {
		// set up efficient event-delegated handling of showing/hiding who likes popups
		setup: function() {
			// when tapping who likes ("and X others")
			$('#refreshable-content').on('click', '.who-likes', function(e){
				// build a URL representing the likers list page with content details
				var likeComponent = $(e.target).closest('.ui-like');

				var data = {
					ContentId: likeComponent.data('contentid'),
					ContentTypeId: likeComponent.data('contenttypeid')
				};
				if(likeComponent.data('typeid')) {
					data.TypeId = likeComponent.data('typeid');
				}

				var likerUrl = url.modify({
					url: 'likers',
					query: data,
					hash: { }
				});

				// navigate to that url
				$.telligent.evolution.mobile.load(likerUrl);
			});
		},
		// set up instances of bus-bound like toggles/counts/messages
		add: function(elm, options) {
			var readOnly = options.readonly === 'true';
			$(elm).evolutionLike({
				contentId: options.contentid,
				contentTypeId: options.contenttypeid,
				initialState: options.initialstate,
				initialMessage: options.initialmessage,
				initialCount: options.initialcount,
				format: (readOnly ? options.format.replace('{toggle}','') : options.format),
				typeId: options.configuration.LikeTypeId,
				onLike: function(contentId, contentTypeId, typeId, complete) {
					var data = {
						ContentId: contentId,
						ContentTypeId: contentTypeId
					};
					if(typeId !== null && typeId.length > 0) {
						data.TypeId = typeId;
					}
					$.telligent.evolution.post({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/likes.json',
						data: data,
						cache: false,
						dataType: 'json',
						success: function(response) {
							getCurrentCount(contentId, contentTypeId, typeId, complete);
						}
					});
				},
				onUnlike: function(contentId, contentTypeId, typeId, complete) {
					var data = {
						ContentId: contentId
					};
					if(typeId !== null && typeId.length > 0) {
						data.TypeId = typeId;
					}
					$.telligent.evolution.del({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/like.json',
						data: data,
						cache: false,
						dataType: 'json',
						success: function(response) {
							getCurrentCount(contentId, contentTypeId, typeId, complete);
						}
					});
				}
			});
		}
	};

	return {};

}, jQuery, window);
