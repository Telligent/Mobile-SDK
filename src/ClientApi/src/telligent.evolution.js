(function(){ 
var require, define;
(function (undef){
	var modules = {},
		resolve = function(name) {
			var module = modules[name];
			if(module == undef)
				throw ('Module not defined or loaded: ' + name);

			if(module.compiled)
				return module.compiled;

			var resolvedDependencies = [];
			if(module.dependencies && module.dependencies.length > 0) {
				for(var i = 0; i < module.dependencies.length; i++) {
					resolvedDependencies.push(resolve(module.dependencies[i]));
				}
			}

			module.compiled = module.factory.apply(this, resolvedDependencies.concat(module.extraArguments));

			if(!module.compiled)
				throw ('Module defined but not loadable: ' + name);

			return module.compiled;
		};
	require = function(dependencies, factory) {
		var deps = dependencies,
			fac = factory,
			offset = 2;
		// if there's no dependencies
		if(!deps.splice) {
			fac = deps;
			deps = undef;
			offset--;
		}

		var extraArgs = Array.prototype.slice.call(arguments, offset);

		var resolvedDependencies = [];
		for(var i = 0; i < deps.length; i++) {
			resolvedDependencies.push(resolve(deps[i]));
		}

		fac.apply(this, resolvedDependencies.concat(extraArgs));
	};
	define = function(name, dependencies, factory) {
		var deps = dependencies,
			fac = factory,
			offset = 3;
		// if there's no dependencies
		if(!deps.splice) {
			fac = deps;
			deps = undef;
			offset--;
		}

		var extraArgs = Array.prototype.slice.call(arguments, offset);

		modules[name] = {
			dependencies: deps,
			factory: fac,
			extraArguments: extraArgs || []
		};
	};
}());
// Stub module which does nothing but require module-wrapped ui-components
// so that they can all be inited just by requiring this module
define('components', [
	'component.bookmark',
	'component.collapseexpand',
	'component.like',
	'component.links',
	'component.moderate',
	'component.page',
	'component.rate',
	'component.searchresult',
	'component.tag',
	'component.theater',
	'component.webpreview',
	'component.tourtip',
	'component.viewhtml',
	'component.previewhtml',
	'component.masonry',
	'component.resizedimage',
	'component.tip',
	'component.select'
], function(){
	return {};
}); 
 
/// @name bookmark
/// @category UI Component
/// @description Presents a content bookmarking UI
///
/// ### jQuery.telligent.evolution.ui.components.bookmark
///
/// [UI Component](@ui) which handles presentation of bookmark behavior for content. Transforms the output from `$core_v2_ui.Bookmark()`, which is a `<span class="ui-bookmark"></span>` stub. The default implementation uses the [evolutionBookmark plugin](@evolutionBookmark). [Overrides can be provided](@ui) at the theme level to present bookmarks differently.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `contenttypeid`: (string) Content Type Id Guid
///  * `contentid`: (string) Content Id Guid
///  * `bookmarktypeid`: (string) Type Id Guid
///  * `value`: (string) If the content is bookmarked or not by the accessing user (`true` or `false`)
///  * `contenttypename`: (string) Type name for this content
///
/// ### Example
///
/// A barebones UI component override which would result in rendering a read-only message of 'Bookmarked? Yes/No' for a given call to `$core_v2_ui.Bookmark()`.
///
///     $.telligent.evolution.ui.components.rate = {
///     	setup: function() {
///     	},
///     	add: function(elm, options) {
///     		$(elm).html('Bookmarked? ' + (options.value == 'true' ? 'Yes' : 'No'));
///
///     		console.log('ContentId: ' + options.contentid);
///     		console.log('ContentTypeId: ' + options.contenttypeid);
///     		console.log('TypeId: ' + options.bookmarktypeid);
///     		console.log('Value: ' + options.value);
///     		console.log('ContentTypeName: ' + options.contenttypename);
///     	}
///     }
///
/// ### Default Implementation
///
/// For reference purposes or as the basis for an override:
///
///     $.telligent.evolution.ui.components.bookmark = {
///             setup: function() {
///             },
///             add: function(elm, options) {
///
///             	var config = {
///             		contentId: options.contentid,
///     				contentTypeId: options.contenttypeid,
///     				typeId: options.bookmarktypeid,
///     				initialState: options.value == 'true',
///     				contentTypeName: options.contenttypename,
///     				onBookmark: function(contentId, contentTypeId, typeId, complete) {
///     					$.telligent.evolution.post({
///     						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/bookmark.json?ContentId={ContentId}&ContentTypeId={ContentTypeId}' + (typeId ? '&TypeId=' + typeId : ''),
///     						data: {
///     							ContentId: contentId,
///     							ContentTypeId: contentTypeId
///     							},
///     						dataType: 'json',
///     						success: function(response) { complete(); }
///     					});
///     				},
///     				onUnbookmark: function(contentId, contentTypeId, typeId, complete) {
///     					$.telligent.evolution.del({
///     						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/bookmark.json?ContentId={ContentId}' + (typeId ? '&TypeId=' + typeId : ''),
///     						data: {
///     							ContentId: contentId
///     							},
///     						dataType: 'json',
///     						success: function(response) { complete(); }
///     					});
///     				}
///     			};
///
///     			if (options.configuration.deleteBookmarkText) { config.deleteBookmarkText = options.configuration.deleteBookmarkText; }
///     			if (options.configuration.addBookmarkText) { config.addBookmarkText = options.configuration.addBookmarkText; }
///     			if (options.configuration.processingText) { config.processingText = options.configuration.processingText; }
///     			if (options.configuration.addBookmarkCssClass) { config.addBookmarkCssClass = options.configuration.addBookmarkCssClass; }
///     			if (options.configuration.deleteBookmarkCssClass) { config.deleteBookmarkCssClass = options.configuration.deleteBookmarkCssClass; }
///     			if (options.configuration.processingCssClass) { config.processingCssClass = options.configuration.processingCssClass; }
///
///             	$(elm).evolutionBookmark(config);
///             }
///         };
///

define('component.bookmark', ['module.ui'], function(ui, $, global, undef) {

    $.telligent.evolution.ui.components.bookmark = {
        setup: function() {
        },
        add: function(elm, options) {

        	var config = {
        		contentId: options.contentid,
				contentTypeId: options.contenttypeid,
				typeId: options.bookmarktypeid,
				initialState: options.value == 'true',
				contentTypeName: options.contenttypename,
				onBookmark: function(contentId, contentTypeId, typeId, complete) {
					$.telligent.evolution.post({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/bookmark.json?ContentId={ContentId}&ContentTypeId={ContentTypeId}' + (typeId ? '&TypeId=' + typeId : ''),
						data: {
							ContentId: contentId,
							ContentTypeId: contentTypeId
							},
						dataType: 'json',
						success: function(response) { complete(); }
					});
				},
				onUnbookmark: function(contentId, contentTypeId, typeId, complete) {
					$.telligent.evolution.del({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/bookmark.json?ContentId={ContentId}' + (typeId ? '&TypeId=' + typeId : ''),
						data: {
							ContentId: contentId
							},
						dataType: 'json',
						success: function(response) { complete(); }
					});
				}
			};

			if (options.configuration.deleteBookmarkText) { config.deleteBookmarkText = options.configuration.deleteBookmarkText; }
			if (options.configuration.addBookmarkText) { config.addBookmarkText = options.configuration.addBookmarkText; }
			if (options.configuration.processingText) { config.processingText = options.configuration.processingText; }
			if (options.configuration.addBookmarkCssClass) { config.addBookmarkCssClass = options.configuration.addBookmarkCssClass; }
			if (options.configuration.deleteBookmarkCssClass) { config.deleteBookmarkCssClass = options.configuration.deleteBookmarkCssClass; }
			if (options.configuration.processingCssClass) { config.processingCssClass = options.configuration.processingCssClass; }

        	$(elm).evolutionBookmark(config);
        }
    };

	return {};
}, jQuery, window);

 
 
/// @name collapseexpand
/// @category UI Component
/// @description Presents content that can be toggled
///
/// ### jQuery.telligent.evolution.ui.components.collapseexpand
///
/// [UI Component](@ui) which handles presentation of content that can be collapsed and expanded. [Overrides can be provided](@ui) at the theme level to present bookmarks differently.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `collapsetext`: (string) Text label when content can be collapsed
///  * `expandtext`: (string) Text label when content can be expanded
///
/// ### Default Implementation
///
/// For reference purposes or as the basis for an override:
///
///     $.telligent.evolution.ui.components.collapseexpand = {
///         setup: function() {
///         },
///         add: function(elm, options) {
///    		var a = $('<a></a>').attr({href: '#'}).text(options.collapsetext);
///     		var isExpanded = false;
///     		a.click(function() {
///     			if(isExpanded) {
///     				elm.slideUp();
///     				a.text(options.collapsetext);
///     			}
///     			else {
///     				elm.slideDown();
///     				a.text(options.expandtext);
///     			}
///     			isExpanded = !isExpanded;
///     			return false;
///     		});
///     		elm.removeClass().before(a).hide();
///          }
///     };
///

define('component.collapseexpand', ['module.ui'], function(ui, $, global, undef) {

    $.telligent.evolution.ui.components.collapseexpand = {
        setup: function() {
        },
        add: function(elm, options) {
			var a = $('<a></a>').attr({href: '#'}).text(options.collapsetext);
			var isExpanded = false;
			a.click(function() {
				if(isExpanded) {
					elm.slideUp();
					a.text(options.collapsetext);
				}
				else {
					elm.slideDown();
					a.text(options.expandtext);
				}
				isExpanded = !isExpanded;
				return false;
			});
			elm.removeClass().before(a).hide();
        }
    };

	return {};
}, jQuery, window);
 
 
/// @name like
/// @category UI Component
/// @description Presents a content like UI
///
/// ### jQuery.telligent.evolution.ui.components.like
///
/// [UI Component](@ui) which handles presentation of like behavior for content. Transforms the output from `$core_v2_ui.Like()`, which is a `<span class="ui-like"></span>` stub. The default implementation uses the [evolutionLike plugin](@evolutionLike). [Overrides can be provided](@ui) at the theme level to present liking differently.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `contenttypeid`: (string) Content Type Id Guid
///  * `contentid`: (string) Content Id Guid
///  * `initialcount`: (number) Current Like Count
///  * `initialstate`: (boolean) Whether the accessing user has already liked the content
///  * `readonly`: (boolean) Whether the UI component should render in a read-only state
///  * `initialmessage`: (string) Pre-rendered message regarding the current likes a piece of content has
///  * `format`: string containing tokens identifying if, and where, the component should render a count, toggle link, and 'who likes' message. For example, `"{toggle} {count}"`, `"{count} - {message}"`.
///    * Tokens:
///      * {count}
///      * {toggle}
///      * {message}
///  * `configuration`: Object of all other keys and values passed via the options dictionary to `$core_v2_ui.Like()`, regardless of whether they have been pre-defined
///     * [jQuery.evolutionLike](@evolutionLike) looks for the following optional configuration:
///       * `LinkClassName`:
///       * `LikeTypeId`:
///
/// ### Example
///
/// A barebones UI component override which would result in rendering a read-only message of 'Likes: [count] Liked? [yes|no]'.
///
///     $.telligent.evolution.ui.components.like = {
///     	setup: function() {
///     	},
///     	add: function(elm, options) {
///     	    var message = 'Likes: ' + (options.initialcount || 0);
///     	    if(options.initialstate) {
///     	        message = message + ' Liked? yes';
///     	    } else {
///     	        message = message + ' Liked? no';
///     	    }
///
///     		$(elm).html(message);
///     	}
///     };
///
/// ### Default Implementation
///
/// For reference purposes or as the basis for an override:
///
///     (function($){
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
///     $.telligent.evolution.ui.components.like = {
///         // set up efficient event-delegated handling of showing/hiding who likes popups
///         setup: function() {
///             $.fn.evolutionLike.delegatePopups({
///                 containerSelector: '.content-fragment',
///                 delegatedSelector: '.ui-like',
///                 onList: function(contentId, contentTypeId, typeId, complete, pageSize, pageIndex) {
///                     $.telligent.evolution.get({
///                         url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/likes.json',
///                         data: {
///                             ContentId: contentId,
///                             ContentTypeId: contentTypeId,
///                             TypeId: typeId,
///                             SortBy: 'Date',
///                             SortOrder: 'Descending',
///                             PageSize: pageSize || 20,
///                             PageIndex: pageIndex || 0
///                         },
///                         cache: false,
///                         dataType: 'json',
///                         success: function(response) {
///                             complete({
///                                 likers: $.map(response.Likes, function(like) {
///                                     var liker = {
///                                         displayName: like.User.DisplayName,
///                                         profileUrl: like.User.ProfileUrl,
///                                         avatarUrl: like.User.AvatarUrl
///                                     };
///                                     return liker;
///                                 }),
///                                 hasMorePages: (((response.PageIndex + 1) * response.PageSize) < response.TotalCount)
///                             });
///                         }
///                     });
///                 },
///                 onOptions: function(elm) {
///                     var data = $.telligent.evolution.ui.data(elm);
///                     var parsedData = {
///                         contentId: data.contentid,
///                         contentTypeId: data.contenttypeid,
///                         typeId: data.configuration.LikeTypeId
///                     };
///                     return parsedData;
///                 },
///                 likersTemplate: '' +
///                     ' <% foreach(likers, function(liker) { %> ' +
///                     '     <li class="content-item"> ' +
///                     '         <div class="full-post-header"></div> ' +
///                     '         <div class="full-post"> ' +
///                     '             <span class="avatar"> ' +
///                     '                 <a href="<%: liker.profileUrl %>"  class="internal-link view-user-profile"> ' +
///                     '                     <img src="<%: liker.avatarUrl %>" alt="" border="0" width="32" height="32" style="width:32px;height:32px" /> ' +
///                     '                 </a> ' +
///                     '             </span> ' +
///                     '             <span class="user-name"> ' +
///                     '                 <a href="<%: liker.profileUrl %>" class="internal-link view-user-profile"><%= liker.displayName %></a> ' +
///                     '             </span> ' +
///                     '         </div> ' +
///                     '         <div class="full-post-footer"></div> ' +
///                     '     </li> ' +
///                     ' <% }); %> ',
///                 likersPopupTemplate: '' +
///                     ' <div class="who-likes-list"> ' +
///                     '     <div class="content-list-header"></div> ' +
///                     '     <ul class="content-list"><%= likers %></ul> ' +
///                     '     <div class="content-list-footer"></div> ' +
///                     '     <% if(hasMorePages) { %> ' +
///                     '         <a href="#" class="show-more"><%= showMoreText %></a>' +
///                     '     <% } %> ' +
///                     ' </div> '
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
///     }(jQuery));
///
define('component.like', ['module.ui', 'module.messaging'], function(ui, messaging, $, global, undef) {

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

    $.telligent.evolution.messaging.subscribe('ui.like', function(data) {
        // update existing like components so that if they regenerate, have the proper value
        var likeLinks = data.typeId
            ? $('.ui-like[data-contentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"][data-typeid="' + data.typeId + '"]')
            : $('.ui-like[data-contentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"]');
        likeLinks
            .attr('data-initialstate', data.liked.toString())
            .attr('data-initialcount', data.count.toString())
            .attr('data-initialmessage', data.message.toString());
    });

    $.telligent.evolution.ui.components.like = {
        // set up efficient event-delegated handling of showing/hiding who likes popups
        setup: function() {
            $.fn.evolutionLike.delegatePopups({
                containerSelector: '.content-fragment',
                delegatedSelector: '.ui-like',
                onList: function(contentId, contentTypeId, typeId, complete, pageSize, pageIndex) {
                    $.telligent.evolution.get({
                        url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/likes.json',
                        data: {
                            ContentId: contentId,
                            ContentTypeId: contentTypeId,
                            TypeId: typeId,
                            SortBy: 'Date',
                            SortOrder: 'Descending',
                            PageSize: pageSize || 20,
                            PageIndex: pageIndex || 0
                        },
                        cache: false,
                        dataType: 'json',
                        success: function(response) {
                            complete({
                                likers: $.map(response.Likes, function(like) {
                                    var liker = {
                                        displayName: like.User.DisplayName,
                                        profileUrl: like.User.ProfileUrl,
                                        avatarUrl: like.User.AvatarUrl
                                    };
                                    return liker;
                                }),
                                hasMorePages: (((response.PageIndex + 1) * response.PageSize) < response.TotalCount)
                            });
                        }
                    });
                },
                onOptions: function(elm) {
                    var data = $.telligent.evolution.ui.data(elm);
                    var parsedData = {
                        contentId: data.contentid,
                        contentTypeId: data.contenttypeid,
                        typeId: data.configuration.LikeTypeId
                    };
                    return parsedData;
                }
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
 
 
/// @name links
/// @category UI Component
/// @description Presents links
///
/// ### jQuery.telligent.evolution.ui.components.links
///
/// UI component which dynamically renders a list of links horizontally to fit the maximum width available to it. When the width of the links exceeds the horizontal space, adapts to either horizontally scroll and/or render a final 'more' link which, when tapped, displays a sheet containing the remaining links. Supports the `orientationchange` event to re-render the available links. Supports retaining bound event handlers on the rendered links
///
/// Existing instances of ui-links UI components can be modified programmatically using the [$.uilinks](@uilinks) jQuery plugin.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `minlinks`: Minimum number of links that must be always visible and not collapsed. When the link count exceeds minlinks and the combined horizontal width of the links exceeds the available width, remaining links are hidden behind a 'more' link. To cause horizontal scrolling links, this should be a high number. *default: 1*
///  * `maxlinks`: Maximum number of links that can be shown horizontally until remaining links are collapsed behind a 'more' link, regardless of available horiztonal width. To cause a 'more' link when there's still remaining space for links to render horizontally, this should be a low number. *default: 50*
///  * `direction`: Direction of links. 'horizontal' or 'vertical'. When Vertical, only pays attention to maxlinks. Default: 'vertical'
///
/// ### Link Format:
///
/// Links are provided to the component declaratively as an inline `ul`. Each list item contains a single anchor. Classes on list items are preserved.
///
/// ### Anchor attributes:
///
///  * `data-selected`: If the links horizontally scroll, a link with the `data-selected` attribute will be pre-scrolled into view
///  * `data-more`: If the links collapse, a link with the `data-more` attribute will be used as the toggle to reveal the remaining links
///  * `data-cancel`: If the links collapse, a link with the `data-cancel` attribute will be used to hide the sheet of displayed remaining links.
///
/// ### Example
///
/// Render a list of horizontally-scrolling links, pre-scrolled to the third link
///
///     <div class="ui-links" data-minlinks="20">
///         <ul>
///             <li><a href="#">Link 1</a></li>
///             <li class="some-class"><a href="#">Link 2</a></li>
///             <li><a href="#" data-selected>Link 3</a></li>
///             <li><a href="#">Link 4</a></li>
///             <li><a href="#">Link 5</a></li>
///             <li><a href="#">Link 6</a></li>
///             <li><a href="#">Link 7</a></li>
///         <ul>
///     </div>
///
/// Render a list of horizontal links to the maximum available width, hiding remaining links behind a 'more' link.
///
///     <div class="ui-links">
///         <ul>
///             <li><a href="#">Link 1</a></li>
///             <li><a href="#">Link 2</a></li>
///             <li><a href="#">Link 3</a></li>
///             <li><a href="#">Link 4</a></li>
///             <li><a href="#">Link 5</a></li>
///             <li><a href="#">Link 6</a></li>
///             <li><a href="#">Link 7</a></li>
///             <li><a href="#" data-more>More</a></li>
///             <li><a href="#" data-cancel>Cancel</a></li>
///         <ul>
///     </div>
///
/// Render a list of links behind a 'more' link with only the 'more' link visible.
///
///     <div class="ui-links" data-maxlinks="0">
///         <ul>
///             <li><a href="#">Link 1</a></li>
///             <li><a href="#">Link 2</a></li>
///             <li><a href="#">Link 3</a></li>
///             <li><a href="#" data-more>Actions</a></li>
///             <li><a href="#" data-cancel>Cancel</a></li>
///         <ul>
///     </div>
///

/// @name uilinks
/// @category jQuery Plugin
/// @description Enables manipulation of existing ui-link components
///
/// ### jQuery.fn.uilinks
///
/// This plugin is a supplemental API to the [ui-links](@links) UI component. While `ui-links` enables declaring a dynamically-rendered set of links, this plugin enables modification of existing instances of ui-links from client code. The uilinks jQuery plugin does not support creating new instances of [ui-links](@links) UI components.
///
/// ### Methods
///
/// #### add
///
///     $('selector.ui-links').uilinks('add', newLink, options);
///
/// Adds a new link to an existing [ui-links](@links) instance.
///
/// Options:
///
///  * `className`: CSS class name to apply to the wrapper `<li>` when rendering links. This is equivalent to class names applies to `<li>` nodes when declaring ui-links. *(default: null)*
///  * `selected`: When selected is selected, pre-scrolls the ui-links to the link. This is equivalent to the `data-selected` `<li>` attribute when declaring a ui-links component. *(default: false)*
///
/// #### insert
///
///     $('selector.ui-links').uilinks('insert', newLink, index, options);
///
/// Adds a new link to an existing [ui-links](@links) instance at the specified 0-based index.
///
/// Options:
///
///  * `className`: CSS class name to apply to the wrapper `<li>` when rendering links. This is equivalent to class names applies to `<li>` nodes when declaring ui-links. *(default: null)*
///  * `selected`: When selected is selected, pre-scrolls the ui-links to the link. This is equivalent to the `data-selected` `<li>` attribute when declaring a ui-links component. *(default: false)*
///
/// #### remove
///
///     $('selector.ui-links').uilinks('remove', selector);
///
/// Removes links matching a provided selector
///
/// #### show
///
///     $('selector.ui-links').uilinks('show', target);
///
/// Shows the currently-hidden links. Equivalent to clicking 'more'.
/// Target is an optional location at which to show the links. Defaults to the same place it would have by default
///
/// #### hide
///
///     $('selector.ui-links').uilinks('hide');
///
/// Hides the open ui links.
///

define('component.links', ['module.ui', 'lib.dynamicLinks', 'lib.sheetProvider', 'lib.util'], function(ui, DynamicLinks, sheetProvider, util, $, global, undef) {

	var popup, popupShouldBeOpened;

	// UILinks jQuery Plugin
	// Provides access to add, insert, or remove links from already-existing
	// UI Link components
	// $('ui-link-selector').uilinks('add', link, options)
	// $('ui-link-selector').uilinks('insert', link, index, options)
	// $('ui-link-selector').uilinks('remove', 'selector');
	// $('ui-link-selector').uilinks('show', [target]);
	// $('ui-link-selector').uilinks('hide');
	$.fn.uilinks = function() {
		var selection = this,
			dynamicLinks = selection.data('_dynamic_links'),
			args = Array.prototype.slice.call(arguments, 0),
			method = args[0];

		if(!dynamicLinks)
			return selection;

		if(method == 'add') {
			var link = args[1],
				opts = $.extend({}, {
					className: null,
					selected: false
				}, args[2] || {});

			dynamicLinks.addLink({
				element: link,
				className: opts.className,
				selected: opts.selected
			});
		} else if(method == 'insert') {
			var link = args[1],
				index = args[2],
				opts = $.extend({}, {
					className: null,
					selected: false
				}, args[3] || {});

			dynamicLinks.addLink({
				element: link,
				className: opts.className,
				selected: opts.selected
			}, index);
		} else if(method == 'remove') {
			var selector = args[1];

			dynamicLinks.removeLink(selector);
		} else if(method == 'show') {
			var target = args[1] || dynamicLinks.moreLink().element;
			onShowMore(target, dynamicLinks.links(true), dynamicLinks.cancelLink());
		} else if(method == 'hide') {
			sheetProvider.actionSheet.hide();
			if(popup)
				popup.glowPopUpPanel('hide');
		}

		return selection;
	}

	function onShowMore(parent, links, cancelLink) {
		// if narrow, show a sheet
		if($(window).width() < component.minWidth) {
			showLinksSheet(links, cancelLink);
		// otherwise, show a popup in place
		} else {
			showLinksPopUp(parent, links);
		}
	}

	function showLinksPopUp(parent, links) {
		parent.css({ 'position': 'relative '});
        var list = $(document.createElement('ul'));
        for(var i = 0; i < links.length; i++) {
	        var listItem = $(document.createElement('li'));
	        listItem.append($(links[i].element).css('float','none').get(0));
	        list.append(listItem);
        }

        if(popup) {
        	popup.glowPopUpPanel('hide')
        		.glowPopUpPanel('html', '')
	            .glowPopUpPanel('append', list)
	            .glowPopUpPanel('show', parent);
        } else {
	        popup = $('<div></div>')
	            .glowPopUpPanel({
	                cssClass: 'links-popup-panel',
	                zIndex: 20,
	                position: 'down',
	                hideOnDocumentClick: true
	            })
	            .glowPopUpPanel('append', list)
	            .glowPopUpPanel('show', parent);
        }
	}

	function showLinksSheet(links, cancelLink) {
		var linksToShow = links.slice(0);
		linksToShow.push(cancelLink);

		sheetProvider.actionSheet.show({
			links: $.map(linksToShow, function(l) { return l.element; })
		});

		cancelLink.element.one('tap', function(e) {
			e.preventDefault();
			sheetProvider.actionSheet.hide();
			return false;
		});

		var sheetClosedHandler = $.telligent.evolution.messaging.subscribe('sheet.closed', function(){
			$.each(links, function(i, link){
				safelyDetachLink($(link.element));
			});
			$.telligent.evolution.messaging.unsubscribe(sheetClosedHandler);
		});
	}

	// specialized detach
	function safelyDetachLink(link) {
		// if the link is actually a ui-* component
		// go ahead and completely destroy it to allow
		// it to safely regenerate itself and all its contents
		// on next append
		if(link.is('[class^="ui-"]')) {
			link.empty().remove();
		} else {
			// otherwise, just detach it to preserve existing content/handlers
			link.detach();
		}
	}

	var component = {
		setup: function() { },
		add: function(elm, options) {
			var elm = $(elm),
				listItems = elm.find('li'),
				parsedMaxLinks = options.maxlinks,
				parsedMinLinks = options.minlinks,
				moreLink = null;

			var dynamicLinkOptions = {
				parent: elm,
				links: [],
				onShowMore: function(links, cancelLink) {
					onShowMore(moreLink, links, cancelLink)
				}
			};
			if(parsedMaxLinks)
				dynamicLinkOptions.maxLinks = parseInt(parsedMaxLinks, 10);
			if(parsedMinLinks)
				dynamicLinkOptions.minLinks = parseInt(parsedMinLinks, 10);

			dynamicLinkOptions.direction = options.direction;

			for(var i = 0; i < listItems.length; i++) {
				var listItem = $(listItems[i]),
					linkElement = listItem.children();
				safelyDetachLink(linkElement);

				var selected = linkElement.is('[data-selected]');

				if(linkElement.is('[data-more]')) {
					moreLink = linkElement;
					dynamicLinkOptions.moreLink = {
						element: linkElement,
						selected: selected,
						className: listItem.get(0).className
					};
				} else if(linkElement.is('[data-cancel]')) {
					dynamicLinkOptions.cancelLink = {
						element: linkElement,
						selected: selected,
						className: listItem.get(0).className
					};
				} else {
					dynamicLinkOptions.links.push({
						element: linkElement,
						selected: selected,
						className: listItem.get(0).className
					});
				}
			}
			elm.empty();

			var dynamicLinks = new DynamicLinks(dynamicLinkOptions);
			setTimeout(function(){
				dynamicLinks.render();
			}, 10);


			// save a reference to the DynamicLinks instance with the
			// element so that it can be used by the $.fn.uilinks plugin
			elm.data('_dynamic_links', dynamicLinks);

			// re-render links on window resize
			$(window).on('resized', dynamicLinks.render);

			// re-render on orientation change
			$.telligent.evolution.messaging.subscribe('mobile.orientationchange', function(){
				global.setTimeout(function(){
					dynamicLinks.render();
				}, 300)
			});
		}
	};
	component.minWidth = 570;

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.ui = $.telligent.evolution.ui || {};
	$.telligent.evolution.ui.components = $.telligent.evolution.ui.components || {};
	$.telligent.evolution.ui.components.links = component;

	return component;

}, jQuery, window); 
 
/// @name masonry
/// @category UI Component
/// @description Arranges elements in a masonry layout
///
/// ### jQuery.telligent.evolution.ui.components.masonry
///
/// UI component which arranges elements in a masonry layout using [evolutionMasonry](@evolutionMasonry).
///
/// ### Options
///
///
define('component.masonry', ['module.ui', 'plugin.evolutionMasonry'], function(ui, evolutionMasonry, $, global, undef) {

	var component = {
		setup: function() {},
		add: function(elm, options) {
			$(elm).evolutionMasonry({
				'columnClass': (options.columnclass || $.fn.evolutionMasonry.defaults.columnClass)
			}).css({ 'visibility': 'visible' });

		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.ui = $.telligent.evolution.ui || {};
	$.telligent.evolution.ui.components = $.telligent.evolution.ui.components || {};
	$.telligent.evolution.ui.components.masonry = component;

	return component;

}, jQuery, window); 
 
/// @name moderate
/// @category UI Component
/// @description Presents a content moderation UI
///
/// ### jQuery.telligent.evolution.ui.components.moderate
///
/// [UI Component](@ui) which handles presentation of moderation behavior for content. Transforms the output from `$core_v2_ui.Moderate()`, which is a `<span class="ui-moderate"></span>` stub. The default implementation uses the [evolutionModerate plugin](@evolutionModerate). [Overrides can be provided](@ui) at the theme level to present moderation differently.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `contenttypeid`: (string) Content Type Id Guid
///  * `contentid`: (string) Content Id Guid
///  * `initialstate`: (boolean) Reported state, true when already reported by the accessing user
///  * `supportsabuse`: (boolean) Whether this piece of content supports being reported
///  * `configuration`: Object of all other keys and values passed via the options dictionary to `$core_v2_ui.Moderate()`, regardless of whether they have been pre-defined
///    * [jQuery.evolutionModerate](@evolutionModerate) looks for the following optional configuration:
///      * `AdditionalLinks`: Array of objects with keys `href`, `text`, and `className` to present as additional actions alongside moderation
///      * `AdditionalLinksUrl`: Ajax endpoint which returns a JSON array of objects with keys `href`, `text`, and `className` to present as additional actions alongside moderation, used when the set of links is non-deterministic until needed
///      * `LinkClassName`: CSS class name to apply to extra links
///
/// ### Example
///
/// A barebones UI component override which would result in rendering a read-only message of 'You have reported [Content Id]' or 'You have not reported [Content Id]' for a given call to `$core_v2_ui.Moderate()`.
///
///     $.telligent.evolution.ui.components.moderate = {
///     	setup: function() {
///     	},
///     	add: function(elm, options) {
/// 			var message;
/// 			if(options.initialstate) {
/// 				message = 'You have reported ' + options.contentid;
/// 			} else {
/// 				message = 'You have not reported ' + options.contentid;
/// 			}
///
///     		$(elm).html(message);
///     	}
///     }
///
/// ### Default Implementation
///
/// For reference purposes or as the basis for an override:
///
///     (function($){
///
///     var reportAbuse = function(contentId, contentTypeId, complete) {
///         $.telligent.evolution.post({
///             url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/abusereports.json',
///             data: {
///                 ContentId: contentId,
///                 ContentTypeId: contentTypeId
///             },
///             cache: false,
///             dataType: 'json',
///             success: function(response) {
///                 complete(response);
///             }
///         });
///     };
///
///     $.telligent.evolution.ui.components.moderate = {
///         setup: function() { },
///         add: function(elm, options) {
///             elm = $(elm);
///             var moderationOptions = {
///                 contentId: options.contentid,
///                 contentTypeId: options.contenttypeid,
///                 supportsAbuse: options.supportsabuse === 'true',
///                 initialState: options.initialstate === 'true',
///                 onReport: reportAbuse
///             };
///             if(options.configuration && options.configuration.AdditionalLinks) {
///                 var links = $.parseJSON(options.configuration.AdditionalLinks);
///                 // don't render if no links
///                 if(!moderationOptions.supportsAbuse && links.length === 0)
///                     return;
///                 // if given an explicit set of links at init-time, create a wrapper
///                 // callback which always returns them as aditional inks
///                 moderationOptions.onGetAdditionalLinks = function(complete) {
///                     complete(links);
///                 };
///             }
///             else if(options.configuration && options.configuration.AdditionalLinksUrl) {
///                 // don't render if no links
///                 if(!moderationOptions.supportsAbuse && options.configuration.AdditionalLinksUrl.length === 0)
///                     return;
///                 // otherwise, if given a url for additional links, create a wrapper
///                 // callback which makes an ajax request to get the extra links
///                 moderationOptions.onGetAdditionalLinks = function(complete) {
///                     $.telligent.evolution.get({
///                         url: options.configuration.AdditionalLinksUrl,
///                         cache: false,
///                         dataType: 'json',
///                         success: function(response) {
///                             complete(response.links || []);
///                         }
///                     });
///                 };
///             }
///             // don't render if no additional links
///             if(!moderationOptions.supportsAbuse && !moderationOptions.onGetAdditionalLinks)
///                 return;
///             if(options.configuration && options.configuration.LinkClassName) {
///                 moderationOptions.linkClassName = options.configuration.LinkClassName;
///             }
///             elm.evolutionModerate(moderationOptions);
///         }
///     };
///
///     }(jQuery));
///
///
define('component.moderate', ['module.ui'], function(ui, $, global, undef) {

    var reportAbuse = function(contentId, contentTypeId, complete) {
        $.telligent.evolution.post({
            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/abusereports.json',
            data: {
                ContentId: contentId,
                ContentTypeId: contentTypeId
            },
            cache: false,
            dataType: 'json',
            success: function(response) {
                complete(response);
            }
        });
    };

    $.telligent.evolution.ui.components.moderate = {
        setup: function() { },
        add: function(elm, options) {
            elm = $(elm);
            var moderationOptions = {
                contentId: options.contentid,
                contentTypeId: options.contenttypeid,
                supportsAbuse: options.supportsabuse === 'true',
                initialState: options.initialstate === 'true',
                onReport: reportAbuse
            };
            if(options.configuration && options.configuration.AdditionalLinks) {
                var links = $.parseJSON(options.configuration.AdditionalLinks);
                // don't render if no links
                if(!moderationOptions.supportsAbuse && links.length === 0)
                    return;
                // if given an explicit set of links at init-time, create a wrapper
                // callback which always returns them as aditional inks
                moderationOptions.onGetAdditionalLinks = function(complete) {
                    complete(links);
                };
            }
            else if(options.configuration && options.configuration.AdditionalLinksUrl) {
                // don't render if no links
                if(!moderationOptions.supportsAbuse && options.configuration.AdditionalLinksUrl.length === 0)
                    return;
                // otherwise, if given a url for additional links, create a wrapper
                // callback which makes an ajax request to get the extra links
                moderationOptions.onGetAdditionalLinks = function(complete) {
                    $.telligent.evolution.get({
                        url: options.configuration.AdditionalLinksUrl,
                        cache: false,
                        dataType: 'json',
                        success: function(response) {
                            complete(response.links || []);
                        }
                    });
                };
            }
            // don't render if no additional links
            if(!moderationOptions.supportsAbuse && !moderationOptions.onGetAdditionalLinks)
                return;
            if(options.configuration && options.configuration.LinkClassName) {
                moderationOptions.linkClassName = options.configuration.LinkClassName;
            }
            elm.evolutionModerate(moderationOptions);
        }
    };

    return {};
}, jQuery, window);
 
 
/// @name page
/// @category UI Component
/// @description Presents a paging UI
///
/// ### jQuery.telligent.evolution.ui.components.page
///
/// [UI Component](@ui) which handles automatic presentation of a paging control. Transforms the output from `$core_v2_ui.Page()`, which is a `<span class="ui-page"></span>` stub. The default implementation uses the [evolutionPager plugin](@evolutionPager). [Overrides can be provided](@ui) at the theme level to present paging differently, either by different usage of [evolutionPager plugin](@evolutionPager) or by an entirely different paging UI.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `currentpage`: Current page index
///  * `pagesize`: Items per page
///  * `totalitems`: Total items
///  * `pagekey`: Pager-specific query string key to use for page numbers
///  * `pagedcontenturl`: Optional ajax endpoint for retrieving paged content (for ajax paging)
///  * `pagedcontentwrapperid`: Optional DOM id of an element to update with paged content retrieved from the ajax paging endpoint
///  * `pagedcontentpagingevent`: Optional name of a client message to raise when ajax paging is occurring
///  * `pagedcontentpagedevent`: Optional name of a client message to raise when ajax paging has completed
///  * `configuration`: Object of all other keys and values passed via the options dictionary to `$core_v2_ui.Page()`, regardless of whether they have been pre-defined
///    * [jQuery.evolutionPager](@evolutionPager) looks for the following optional configuration:
///      * `ShowPrevious`: Whether 'previous' links should be shown (default: `false`)
///      * `ShowNext`: Whether 'next' links should be shown (default: `false`)
///      * `ShowFirst`: Whether 'first' links should be shown (default: `true`)
///      * `ShowLast`: Whether 'last' links should be shown (default: `true`)
///      * `ShowIndividualPages`: Whether individual pages should be shown (default: `true`)
///      * `NumberOfPagesToDisplay:`: Number of individual pages to show (default: `5`)
///
/// ### Example
///
/// A barebones UI component override which would result in rendering the current page number with back and next links, and not performing any paging via Ajax regardless of whether a `pagedcontenturl` was provided:
///
///     $.telligent.evolution.ui.components.page = {
///     	setup: function() {
///     	},
///     	add: function(elm, options) {
///     		var message = '',
///     			currentPage = parseInt(options.currentpage, 10)
///
///     		// show a previous link
///     		if(currentPage > 0) {
///
///     			// build a URL using the query string key
///     			var previousPageQuery = {}, previousPageHref;
///     			previousPageQuery[options.pagekey] = currentPage;
///     			previousPageHref = $.telligent.evolution.html.encode(
///     				$.telligent.evolution.url.modify({ query: previousPageQuery }));
///
///     			message = '<a href="' + previousPageHref + '">Previous</a>';
///     		}
///
///     		// show current page
///     		message = message + 'Page: ' + (currentPage + 1);
///
///     		// show a next link
///     		if((currentPage + 1) < options.totalitems / options.pagesize) {
///
///     			// build a URL using the query string key
///     			var nextPageQuery = {}, nextPageHref;
///     			nextPageQuery[options.pagekey] = currentPage + 2;
///     			nextPageHref = $.telligent.evolution.html.encode(
///     				$.telligent.evolution.url.modify({ query: nextPageQuery }));
///
///     			message = message + '<a href="' + nextPageHref + '">Next</a>';
///     		}
///
///     		$(elm).html(message);
///     	}
///     };
///
/// ### Default Implementation
///
/// For reference purposes or as the basis for an override:
///
///     (function($){
///
///     var ajaxPagerContexts = {};
///     $.telligent.evolution.ui.components.page = {
///     	setup: function() {
///
///     	},
///     	add: function(elm, options) {
///     		// general settings
///     		var settings = {
///     		    currentPage: parseInt(options.currentpage, 10),
///     		    pageSize: parseInt(options.pagesize, 10),
///     		    totalItems: parseInt(options.totalitems, 10),
///     		    showPrevious: typeof options.configuration.ShowPrevious === 'undefined' ? false : options.configuration.ShowPrevious === 'true',
///     		    showNext: typeof options.configuration.ShowNext === 'undefined' ? false : options.configuration.ShowNext === 'true',
///     		    showFirst: typeof options.configuration.ShowFirst === 'undefined' ? true : options.configuration.ShowFirst === 'true',
///     		    showLast: typeof options.configuration.ShowLast === 'undefined' ? true : options.configuration.ShowLast === 'true',
///     		    showIndividualPages: typeof options.configuration.ShowIndividualPages === 'undefined' ? true : options.configuration.ShowIndividualPages === 'true',
///     		    numberOfPagesToDisplay: typeof options.configuration.NumberOfPagesToDisplay === 'undefined' ? 5 : parseInt(options.configuration.NumberOfPagesToDisplay, 10),
///     		    pageKey: options.pagekey,
///     		    hash: options.configuration.Target,
///     		    baseUrl: options.configuration.BaseUrl || window.location.href,
///     			template: typeof options.configuration.Template !== 'undefined' ? options.configuration.Template : '' +
///     		        ' <% foreach(links, function(link, i) { %> ' +
///     		        '     <% if(link.type === "first") { %> ' +
///     		        '         <a href="<%: link.url %>" class="first" data-type="first" data-page="<%= link.page %>" data-selected="false"><span>&#171;</span></a> ' +
///     		        '     <% } else if(link.type === "previous") { %> ' +
///     		        '         <a href="<%: link.url %>" class="previous" data-type="previous" data-page="<%= link.page %>" data-selected="false"><span>&#60;</span></a> ' +
///     		        '     <% } else if(link.type === "page") { %> ' +
///     		        '         <a href="<%: link.url %>" class="page<%= link.selected ? " selected" : "" %>" data-type="page" data-page="<%= link.page %>" data-selected="<%= link.selected ? "true" : "false" %>"><span><%= link.page %></span></a> ' +
///     		        '     <% } else if(link.type === "next") { %> ' +
///     		        '         <a href="<%: link.url %>" class="next" data-type="next" data-page="<%= link.page %>" data-selected="false"><span>&#62;</span></a> ' +
///     		        '     <% } else if(link.type === "last") { %> ' +
///     		        '         <a href="<%: link.url %>" class="last" data-type="last" data-page="<%= link.page %>" data-selected="false"><span>&#187;</span></a> ' +
///     		        '     <% } %> ' +
///     		        '     <% if(i < (links.length - 1)) { %> ' +
///     		        '         <span class="separator"></span> ' +
///     		        '     <% } %> ' +
///     		        ' <% }); %> '
///     		};
///     		// ajax-specific options
///     		if(options.pagedcontenturl) {
///     			ajaxPagerContexts[options.pagedcontentpagingevent] = {
///     				onPage: function(pageIndex, complete) {
///     					var data = {};
///     					data[options.pagekey] = pageIndex;
///     					// modify the url instead of passing as data, as the url might have this in the querystring already
///     					var url = $.telligent.evolution.url.modify({ url: options.pagedcontenturl, query: data });
///     					$.telligent.evolution.get({
///     						url: url,
///     						cache: false,
///     						success: function(response) {
///     							complete(response);
///     						}
///     					});
///     				}
///     			};
///     			$.extend(settings, {
///     				onPage: function(pageIndex, complete) {
///     					ajaxPagerContexts[options.pagedcontentpagingevent].onPage(pageIndex, complete);
///     				},
///     				pagedContentContainer: '#' + options.pagedcontentwrapperid,
///     				pagedContentPagingEvent: options.pagedcontentpagingevent,
///     				pagedContentPagedEvent: options.pagedcontentpagedevent,
///     				transition: options.configuration.Transition,
///     				transitionDuration: typeof options.configuration.TransitionDuration === 'undefined' ? 200 : parseInt(options.configuration.TransitionDuration, 10)
///     			});
///     		}
///     		$(elm).evolutionPager(settings);
///     	}
///     };
///
///     }(jQuery));
define('component.page', ['module.ui'], function(ui, $, global, undef) {

	function showLoadingIndicator(container, mask) {
		var containerOffset = container.offset();
		mask.hide().appendTo('body').css({
			width: container.width(),
			height: container.height(),
			top: containerOffset.top,
			left: containerOffset.left
		}).show();
	}

	function hideLoadingIndicator(container, mask) {
		mask.hide();
	}

	function buildMask() {
		return $('<div></div>').css({
			backgroundColor: '#fff',
			position: 'absolute',
			opacity: .75,
			zIndex: 1
		});
	}

	var ajaxPagerContexts = {};
	$.telligent.evolution.ui.components.page = {
		setup: function() {

		},
		add: function(elm, options) {
			// general settings
			var settings = {
			    currentPage: parseInt(options.currentpage, 10),
			    pageSize: parseInt(options.pagesize, 10),
			    totalItems: parseInt(options.totalitems, 10),
			    showPrevious: typeof options.configuration.ShowPrevious === 'undefined' ? false : options.configuration.ShowPrevious === 'true',
			    showNext: typeof options.configuration.ShowNext === 'undefined' ? false : options.configuration.ShowNext === 'true',
			    showFirst: typeof options.configuration.ShowFirst === 'undefined' ? true : options.configuration.ShowFirst === 'true',
			    showLast: typeof options.configuration.ShowLast === 'undefined' ? true : options.configuration.ShowLast === 'true',
			    showIndividualPages: typeof options.configuration.ShowIndividualPages === 'undefined' ? true : options.configuration.ShowIndividualPages === 'true',
			    numberOfPagesToDisplay: typeof options.configuration.NumberOfPagesToDisplay === 'undefined' ? 5 : parseInt(options.configuration.NumberOfPagesToDisplay, 10),
			    pageKey: options.pagekey,
			    hash: options.configuration.Target,
			    baseUrl: options.configuration.BaseUrl || window.location.href,
				template: typeof options.configuration.Template !== 'undefined' ? options.configuration.Template : '' +
			        ' <% foreach(links, function(link, i) { %> ' +
			        '     <% if(link.type === "first") { %> ' +
			        '         <a href="<%: link.url %>" class="first" data-type="first" data-page="<%= link.page %>" data-selected="false"><span>&#171;</span></a> ' +
			        '     <% } else if(link.type === "previous") { %> ' +
			        '         <a href="<%: link.url %>" class="previous" data-type="previous" data-page="<%= link.page %>" data-selected="false"><span>&#60;</span></a> ' +
			        '     <% } else if(link.type === "page") { %> ' +
			        '         <a href="<%: link.url %>" class="page<%= link.selected ? " selected" : "" %>" data-type="page" data-page="<%= link.page %>" data-selected="<%= link.selected ? "true" : "false" %>"><span><%= link.page %></span></a> ' +
			        '     <% } else if(link.type === "next") { %> ' +
			        '         <a href="<%: link.url %>" class="next" data-type="next" data-page="<%= link.page %>" data-selected="false"><span>&#62;</span></a> ' +
			        '     <% } else if(link.type === "last") { %> ' +
			        '         <a href="<%: link.url %>" class="last" data-type="last" data-page="<%= link.page %>" data-selected="false"><span>&#187;</span></a> ' +
			        '     <% } %> ' +
			        '     <% if(i < (links.length - 1)) { %> ' +
			        '         <span class="separator"></span> ' +
			        '     <% } %> ' +
			        ' <% }); %> '
			};
			// ajax-specific options
			if(options.pagedcontenturl) {
				ajaxPagerContexts[options.pagedcontentpagingevent] = {
					onPage: function(pageIndex, complete, hash) {
						var data = hash || {};
						data[options.pagekey] = pageIndex;
						// modify the url instead of passing as data, as the url might have this in the querystring already
						var url = $.telligent.evolution.url.modify({ url: options.pagedcontenturl, query: data });
						$.telligent.evolution.get({
							url: url,
							cache: false,
							success: function(response) {
								complete(response);
							}
						});
					}
				};
				$.extend(settings, {
					onPage: function(pageIndex, complete, hash) {
						ajaxPagerContexts[options.pagedcontentpagingevent].onPage(pageIndex, complete, hash);
					},
					refreshOnAnyHashChange: (options.loadonanyhashchange === 'true'),
					pagedContentContainer: '#' + options.pagedcontentwrapperid,
					pagedContentPagingEvent: options.pagedcontentpagingevent,
					pagedContentPagedEvent: options.pagedcontentpagedevent,
					transition: options.configuration.Transition,
					transitionDuration: typeof options.configuration.TransitionDuration === 'undefined' ? 200 : parseInt(options.configuration.TransitionDuration, 10)
				});
			}
			$(elm).evolutionPager(settings);

			if(options.loadingindicator === 'true') {
				var container = $('#' + options.pagedcontentwrapperid), mask = buildMask();
				$.telligent.evolution.messaging.subscribe(options.pagedcontentpagingevent, function(){
					showLoadingIndicator(container, mask);
				});
				$.telligent.evolution.messaging.subscribe(options.pagedcontentpagedevent, function(){
					hideLoadingIndicator(container, mask);
				});
			}
		}
	};

	return {};
}, jQuery, window);
 
 
define('component.previewhtml', ['module.ui'], function(ui, $, global, undef) {

	function load(url, width, height, persist) {
		var data = {
			url: url,
			width: 0,
			height: 0,
			outputIsPersisted: false
		};
		if(width)
			data.width = width;
		if(height)
			data.height = height;
		if(persist)
			data.outputIsPersisted = persist;
		return $.telligent.evolution.get({
			url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ui/preview.json',
			data: data
		});
	}

	function loadAndRender(elm, options) {
		// request either the explicit width or the max available width, whichever is smaller
		var width = elm.parent().width();
		if(width > options.width)
			width = options.width;
		load(options.url, width, options.height, options.persist).done(function(response){
			elm.html(response.Html);
		});
	}

	$.telligent.evolution.ui.components.previewhtml = {
		setup: function() { },
		add: function(elm, options) {
			loadAndRender(elm, options);
			$(window).on('resized', function(){
				loadAndRender(elm, options);
			});
		}
	};

	return {};

}, jQuery, window);
 
 
/// @name rate
/// @category UI Component
/// @description Presents a content rating UI
///
/// ### jQuery.telligent.evolution.ui.components.rate
///
/// [UI Component](@ui) which handles presentation of rating behavior for content. Transforms the output from `$core_v2_ui.Rate()`, which is a `<span class="ui-rate"></span>` stub. The default implementation uses the [evolutionStarRating plugin](@evolutionStarRating). [Overrides can be provided](@ui) at the theme level to present ratings differently.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `contenttypeid`: (string) Content Type Id Guid
///  * `contentid`: (string) Content Id Guid
///  * `ratingtypeid`: (string) Type Id Guid
///  * `initialvalue`: (number) Current value
///  * `initialcount`: (number) Requested max count to allow
///
/// ### Example
///
/// A barebones UI component override which would result in rendering a read-only message of 'Current Rating: X' for a given call to `$core_v2_ui.Rate()`.
///
///     $.telligent.evolution.ui.components.rate = {
///     	setup: function() {
///     	},
///     	add: function(elm, options) {
///     		$(elm).html('Current Rating: ' + options.initialvalue * options.initialcount);
///
///     		console.log('ContentId: ' + options.contentid);
///     		console.log('ContentTypeId: ' + options.contenttypeid);
///     		console.log('TypeId: ' + options.ratingtypeid);
///     		console.log('Value: ' + options.initialvalue);
///     		console.log('Count: ' + options.initialcount);
///     	}
///     }
///
/// ### Default Implementation
///
/// For reference purposes or as the basis for an override:
///
///     $.telligent.evolution.ui.components.rate = {
///     	setup: function() {
///     		// no setup needed
///     	},
///     	add: function(elm, options) {
/// 			// build a set of options to pass to the evolutionStarRating plugin
///
///     		var settings = $.extend({}, {
///     			isReadOnly: (options.readonly === 'true'),
///     			value: parseFloat(options.initialvalue),
///     			ratingCount: parseFloat(options.initialcount)
///     		});
///
///     		settings.value = settings.value * $.fn.evolutionStarRating.defaults.maxRating;
///
///     		settings.onRate = function(value) {
///
/// 				// on rate, use REST to adjust the rating
///
///     			if (!options.contentid || !options.contenttypeid) {
///     				return;
///     			}
///
///     			value = value / $.fn.evolutionStarRating.defaults.maxRating;
///
///     			var data = {
///     				ContentId: options.contentid,
///     				ContentTypeId: options.contenttypeid,
///     				Value: value
///     			};
///     			if (options.ratingtypeid) {
///     				data.TypeId = options.ratingtypeid;
///     			}
///
///     			$.telligent.evolution.post({
///     				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ratings.json',
///     				data: data,
///     				success: function(response) {
///
/// 						// after a successful rating, refresh the plugin's current rating by requesting the current average
///
///     					var data = {
///     						ContentId: options.contentid
///     					};
///     					if (options.ratingtypeid) {
///     						data.TypeId = options.ratingtypeid;
///     					}
///
///     					$.telligent.evolution.get({
///     						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/rateditem.json',
///     						data: data,
///     						success: function(response) {
///
/// 								// Assign the current average rating to the UI
///
///     							if (response && response.RatedItem && response.RatedItem.AverageValue) {
///     								$(elm).evolutionStarRating('option', {
///     									value: response.RatedItem.AverageValue * $.fn.evolutionStarRating.defaults.maxRating,
///     									ratingCount: response.RatedItem.Count
///     								});
///     							} else {
///     								$(elm).evolutionStarRating('option', {
///     									value: 0,
///     									ratingCount: 0
///     								});
///     							}
///     						}
///     					});
///     				}
///     			});
///     		};
///
///     		if (settings.ratingCount == 0 && settings.isReadOnly) {
///     			return;
///     		}
///
///     		$(elm).evolutionStarRating(settings);
///     	}
///     };

define('component.rate', ['module.ui'], function(ui, $, global, undef) {

	$.telligent.evolution.ui.components.rate = {
		setup: function() {

		},
		add: function(elm, options) {
			var settings = $.extend({}, {
				isReadOnly: (options.readonly === 'true'),
				value: parseFloat(options.initialvalue),
				ratingCount: parseFloat(options.initialcount)
			});

			settings.value = settings.value * $.fn.evolutionStarRating.defaults.maxRating;
			settings.onRate = function(value) {
				if (!options.contentid || !options.contenttypeid) {
					return;
				}

				value = value / $.fn.evolutionStarRating.defaults.maxRating;

				var data = {
					ContentId: options.contentid,
					ContentTypeId: options.contenttypeid,
					Value: value
				};
				if (options.ratingtypeid) {
					data.TypeId = options.ratingtypeid;
				}

				$.telligent.evolution.post({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ratings.json',
					data: data,
					success: function(response) {
						var data = {
							ContentId: options.contentid
						};
						if (options.ratingtypeid) {
							data.TypeId = options.ratingtypeid;
						}

						$.telligent.evolution.get({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/rateditem.json',
							data: data,
							success: function(response) {
								if (response && response.RatedItem && response.RatedItem.AverageValue) {
									$(elm).evolutionStarRating('option', {
										value: response.RatedItem.AverageValue * $.fn.evolutionStarRating.defaults.maxRating,
										ratingCount: response.RatedItem.Count
									});
								} else {
									$(elm).evolutionStarRating('option', {
										value: 0,
										ratingCount: 0
									});
								}
							}
						});
					}
				});
			};

			if (settings.ratingCount == 0 && settings.isReadOnly) {
				return;
			}

			$(elm).evolutionStarRating(settings);
		}
	};

	return {};
}, jQuery, window);

 
 
/// @name resizedimage
/// @category UI Component
/// @description Presents a resized image
///
/// ### jQuery.telligent.evolution.ui.components.resizedimage
///
/// [UI Component](#) which allows client-side declarative rendering of an image using server-side resizing. This is useful when a URL of an image is known from the result of a REST request on the client, but it is not necessarily efficient to render an `img` tag directly sourcing it. Supports both local images (in CFS) as well as externally hosted images. Supports both `ZoomAndCrop` as well as `ScaleDown` resize methods.
///
/// ### Options
///
///  * `src`: Image Source URL
///  * `width`: Max Width
///  * `height`: Max Height
///  * `resizemethod`: Resize Method, either 'ScaleDown' or 'ZoomAndCrop'
///
/// ### Example
///
/// Render a server-side-resized image at 100x100 cropped and zoomed to fit.
///
///     <img class="ui-resizedimage" data-src="IMAGE-URL" data-width="100" data-height="100" data-resizemethod="ZoomAndCrop" />
///
///
define('component.resizedimage', ['module.ui'], function(ui, $, global, undef) {

	$.telligent.evolution.ui.components.resizedimage = {
		setup: function() { },
		add: function(elm, options) {

			elm.removeClass('ui-resizedimage');

			$.telligent.evolution.media.previewHtml(options.src, {
				width: (options.width || 0),
				height: (options.height || 0),
				resizeMethod: (options.resizemethod || 'ZoomAndCrop'),
				success: function(response) {
					var renderedImg = $(response.html);
					if(renderedImg.attr('style'))
						elm.attr('style', renderedImg.attr('style'))
					elm.attr('src', renderedImg.attr('src'));
				}
			});

		}
	}

	return {};

}, jQuery, window); 
 
/// @name searchresult
/// @category UI Component
/// @description Registers dynamic behavior for rendered search results
///
/// ### jQuery.telligent.evolution.ui.components.searchresult
///
/// [UI Component](@ui) which handles automatic presentation and registration of search result items' dynamic behavior. Decorates `<div class="ui-searchresult"></div>` items to present Ajax-loaded search result details. [Overrides can be provided](@ui) at the theme level to present search result items differently.
///
/// This is primarily used by ISearchableContentType plugins to provide for ajax-fetched details (also provided by the plugins) to be dynamically loaded when the plugins' rendered search results are moused over.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `detailsurl`: Ajax endpoint URL for fetching extra search result details.
///
/// ### Example
///
/// Given a search result rendered by `ISearchablContentType.GetViewHtml` ...
///
///     <div class="abbreviated-post ui-searchresult"
///         data-detailsurl="">
///         <div class="post-metadata">
///             <ul class="property-list">
///                 <li class="property-item date">[CONTENT DATE]</li>
///                 <li class="property-item author">
///                     <span class="user-name">
///                         <a href="[USER_PROFILE_URL]" class="internal-link view-user-profile"><span></span>
///                             [USER NAME]
///                         </a>
///                     </span>
///                 </li>
///                 <li>
///                     <ul class="details"></ul>
///                 </li>
///             </ul>
///         </div>
///         <h4 class="post-name">
///             <a class="internal-link view-post" title="Test Wiki" href="[CONTENT URL]">[CONTENT NAME]</a>
///         </h4>
///         <div class="post-summary">[CONTENT SUMMARY]</div>
///         <div class="post-application">
///             <a href="[CONTENT APPLICATION URL]">[CONTENT APPLICATION NAME]</a>
///             <a href="[CONTENT CONTAINER URL]">[CONTENT CONTAINER NAME]</a>
///         </div>
///     </div>
///
/// ... and an Ajax callback's response, potentially provided by the same plugin's `IHttpCallback`'s `ProcessRequest()` ...
///
///     <li class="property-item">238 views</li>
///     <li class="property-item">2 revisions</li>
///     <li class="property-item">Latest: 12 May 2010</li>
///
/// ... then the response will be automatically rendered within `<ul class="details"></ul>` whenever the search result is moused over.
///
/// ### Default Implementation
///
/// For reference purposes or as the basis for an override:
///
///     (function($){
///
///     	var template = ('' +
///             '<% foreach(properties, function(property) { %> ' +
///             '<li class="property-item"><%= property %></li> ' +
///             '<% }); %> '),
///     		compiledTemplate = $.telligent.evolution.template.compile(template),
///     		getDetails = function(url, complete) {
///     			$.telligent.evolution.get({
///     				url: url,
///     				dataType: 'json',
///     				success: function(response) {
///     					if(response) {
///     						complete(formatDetails(response));
///     					}
///     				}
///     			});
///     		},
///     		formatDetails = function(details) {
///     			return compiledTemplate(details);
///     		};
///
///     	$.telligent.evolution.ui.components.searchresult = {
///     		setup: function() {
///     		},
///     		add: function(elm, options) {
///     			if(options.detailsurl) {
///     				var details = null,
///     					detailsList = elm.find('ul.details'),
///     					initialDetailsList = detailsList.html();
///     				elm.bind('mouseenter', function(e){
///     					if(details !== null) {
///     						detailsList.html(details);
///     					} else {
///     						getDetails(options.detailsurl, function(response) {
///     							details = response;
///     							detailsList.html(details);
///     						});
///     					}
///     				}).bind('mouseleave', function(e){
///     					detailsList.html(initialDetailsList);
///     				});
///     			}
///     		}
///     	};
///
///     }(jQuery));
///
///
define('component.searchresult', ['module.ui', 'module.template'], function(ui, template, $, global, undef) {

	var template = ('' +
'<% foreach(properties, function(property) { %> ' +
'<li class="property-item"><%= property %></li> ' +
'<% }); %> '),
		compiledTemplate = $.telligent.evolution.template.compile(template),
		getDetails = function(url, complete) {
			$.telligent.evolution.get({
				url: url,
				dataType: 'json',
				success: function(response) {
					if(response) {
						complete(formatDetails(response));
					}
				}
			});
		},
		formatDetails = function(details) {
			return compiledTemplate(details);
		};

	$.telligent.evolution.ui.components.searchresult = {
		setup: function() {
		},
		add: function(elm, options) {
			if(options.detailsurl) {
				var details = null,
					detailsList = elm.find('ul.details'),
					initialDetailsList = detailsList.html();
				elm.bind('mouseenter', function(e){
					if(details !== null) {
						detailsList.html(details);
					} else {
						getDetails(options.detailsurl, function(response) {
							details = response;
							detailsList.html(details);
						});
					}
				}).bind('mouseleave', function(e){
					detailsList.html(initialDetailsList);
				});
			}
		}
	};

	return {};
}, jQuery, window);
 
 
define('component.select', ['module.ui'], function(ui, $, global, undef) {

	var minWindowWidth = 570,
		minWidth = 150,
		measuredHeight = null,
		measuredBorderHeight = null;

	function measure(elm) {
		if(measuredHeight)
			return;
		var testDiv = $('<span class="uiselect"><span>measure</span></span>').css({'display':'none'}).appendTo(elm.parent());
		measuredHeight = testDiv.height();
		measuredBorderHeight = parseInt(testDiv.css('border-top-width') || '0') + parseInt(testDiv.css('border-bottom-width') || '0');
		testDiv.remove();
	}

	$.telligent.evolution.ui.components.select = {
		setup: function() { },
		add: function(elm, options) {
			elm.removeClass('ui-select');
			measure(elm);

			if(elm.is('select') && $(window).width() > minWindowWidth) {
				// set the height of the expanded view to not have empty space
				var optionLength = elm.find('option').length;
				var expandedHeight = optionLength * measuredHeight;

				// set a reasonable default width
				var width = elm.width();
				if(width < minWidth)
					width = minWidth;

				// render
				elm.glowDropDownList({
					selectedItemWidth: width + 20,
					selectedItemHeight: measuredHeight,
					itemsWidth: width + 20,
					itemsHeight: expandedHeight + measuredBorderHeight + 4, // (glowDropDownList assumes to - 4 from height)
					buttonImageUrl: null,
					className: 'uiselect'
				});
			}
		}
	};

	return {};

}, jQuery, window);
 
 
/// @name tag
/// @category UI Component
/// @description Presents a content tagging UI
///
/// ### jQuery.telligent.evolution.ui.components.tag
///
/// [UI Component](@ui) which handles presentation of tagging behavior for content. Transforms the output from `$core_v2_ui.Tag()`, which is a `<span class="ui-tag"></span>` stub. The default implementation uses the [evolutionInlineTagEditor plugin](@evolutionInlineTagEditor). [Overrides can be provided](@ui) at the theme level to present tagging differently.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `contenttypeid`: (string) Content Type Id Guid
///  * `contentid`: (string) Content Id Guid
///  * `tagtypeid`: (string) Tag Type Id
///  * `urlformat`: (string) URL containing a token named `{tag}` which, when replaced with a tag name, shows other content with the same tag
///  * `readonly`: (boolean) When true, the component should not present editing controls
///  * `tags`: Comma-separated list of tags currently applied to the content
///  * `selectabletags`: Comma-separated list of optionally-selectable tags that may be presented to the user when not in read-only. These tags are already in use by other content.
///  * `configuration`: Object of all other keys and values passed via the options dictionary to `$core_v2_ui.Tag()`, regardless of whether they have been pre-defined
///
/// ### Example
///
/// A barebones UI component override which would result in rendering a read-only message of 'Tagged: [Tag 1], [Tag 1], [Tag 3], [etc]'.
///
///     $.telligent.evolution.ui.components.tag = {
///     	setup: function() {
///     	},
///     	add: function(elm, options) {
///     		var message = 'Tagged: ',
///     			renderedTagLinks = $.map(options.tags.split(','), function(tagName) {
///     		    	var tagUrl = options.urlformat.replace(/{tag}/, tagName);
///     		    	return  '<a href="' + tagUrl + '">' + tagName + '</a>';
///     			});
///
///     		$(elm).html(message + renderedTagLinks.join(', '));
///     	}
///     };
///
/// ### Default Implementation
///
/// For reference purposes or as the basis for an override:
///
///     (function($){
///
///     var formatTags = function(tagsList, urlFormat, elm) {
///     	var c = $(elm);
///     	c.html('');
///
///     	if (!tagsList) {
///     		return;
///     	}
///
///     	var first = true;
///     	$.each(tagsList.split(/,/), function(i, v) {
///     		var t = $.trim(v);
///     		if (t) {
///     			if (first) {
///     				first = false;
///     			} else {
///     				c.append(", ");
///     			}
///     			if (!urlFormat) {
///     				c.append(t);
///     			} else {
///     				c.append($('<a>').attr('rel','nofollow tag').attr('href', urlFormat.replace(/{tag}/g, $.telligent.evolution.url.encodePathComponent($.telligent.evolution.html.decode(t)))).text(t));
///     			}
///     		}
///     	});
///     };
///
///     $.telligent.evolution.ui.components.tag = {
///     	setup: function() {
///     	},
///     	add: function(elm, options) {
///     		var tagsContainer = jQuery('<span></span>');
///     		$(elm).append(tagsContainer);
///     		formatTags(options.tags, options.urlformat, tagsContainer);
///
///     		var editTags = null;
///     		if (options.readonly !== 'true') {
///     			editTags = $('<a href="javascript:void(0);" class="internal-link edit-tags"></a>');
///     			$(elm).append(editTags);
///
///     			editTags.evolutionInlineTagEditor({
///     				allTags: $.grep(options.selectabletags.split(','), function(item) { return item; }),
///     				currentTags: $.grep(options.tags.split(','), function(item) { return item; }),
///     				onSave: function(tags, successFn) {
///     					var data = {
///     						Tags: tags && tags.length > 0 ? tags.join(',') : '',
///     						ContentId: options.contentid,
///     						ContentTypeId: options.contenttypeid
///     					};
///
///     					if (options.tagtypeid) {
///     						data.TypeId = options.tagtypeid;
///     					}
///
///     					$.telligent.evolution.put({
///     						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/contenttags.json',
///     						data: data,
///     						success: function(response) {
///     							formatTags(data.Tags, options.urlformat, tagsContainer);
///     							successFn();
///     						}
///     					});
///     				}
///     			});
///     		}
///     	}
///     };
///
///     }(jQuery));
///
///
define('component.tag', ['module.ui'], function(ui, $, global, undef) {

	var formatTags = function(tagsList, urlFormat, elm) {
		var c = $(elm);
		c.html('');

		if (!tagsList) {
			return;
		}

		var first = true;
		$.each(tagsList.split(/,/), function(i, v) {
			var t = $.trim(v);
			if (t) {
				if (first) {
					first = false;
				} else {
					c.append(", ");
				}
				if (!urlFormat) {
					c.append(t);
				} else {
					c.append($('<a>').attr('rel','nofollow tag').attr('href', urlFormat.replace(/{tag}/g, $.telligent.evolution.url.encodePathComponent($.telligent.evolution.html.decode(t)))).text(t));
				}
			}
		});
	};

	$.telligent.evolution.ui.components.tag = {
		setup: function() {
		},
		add: function(elm, options) {
			var tagsContainer = jQuery('<span></span>');
			$(elm).append(tagsContainer);
			formatTags(options.tags, options.urlformat, tagsContainer);

			var editTags = null;
			if (options.readonly !== 'true') {
				editTags = $('<a href="javascript:void(0);" class="internal-link edit-tags"></a>');
				$(elm).append(editTags);

				editTags.evolutionInlineTagEditor({
					allTags: $.grep(options.selectabletags.split(','), function(item) { return item; }),
					currentTags: $.grep(options.tags.split(','), function(item) { return item; }),
					onSave: function(tags, successFn) {
						var data = {
							Tags: tags && tags.length > 0 ? tags.join(',') : '',
							ContentId: options.contentid,
							ContentTypeId: options.contenttypeid
						};

						if (options.tagtypeid) {
							data.TypeId = options.tagtypeid;
						}

						$.telligent.evolution.put({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/contenttags.json',
							data: data,
							success: function(response) {
								formatTags(data.Tags, options.urlformat, tagsContainer);
								successFn();
							}
						});
					}
				});
			}
		}
	};

	return {};
}, jQuery, window);
 
 
/// @name theater
/// @category UI Component
/// @description Registers dynamic behaviors to initiate jQuery.evolutionTheater plugin usage
///
/// ### jQuery.telligent.evolution.ui.components.theater
///
/// [UI Component](@ui) which handles automatic setup of content theaters. Transforms `<span class="ui-theater"></span>` elements. The default implementation uses the [evolutionTheater plugin](@evolutionTheater). [Overrides can be provided](@ui) at the theme level to present theaters differently, either by different usage of [evolutionTheater plugin](@evolutionTheater) or by an entirely different theater UI.
///
/// #### Used by:
///
/// This component is primarily used by rendered activity stories provided by IActivityStory plugins or rendered search results provided by ISearchableContentType which also implement ajax callbacks via IHttpCallback for providing theater content.
///
/// #### Next/Previous links
///
/// The [evolutionTheater plugin](@evolutionTheater) provides the optional function parameters `nextContent` and `previousContent` which, when provided, instruct the plugin to render forward/back links and asynchronously return content to replace in the theater when those links are returned. The implementation of how this content is produced is provided by the plugin's consumer.
///
/// The default `jQuery.telligent.evolution.ui.components.theater` implementation produces content for these function parameters via ajax requests to endpoints for forward/back theater content. The URLs it uses for endpoints are provided by the current theater content. If the theater content contains an `anchor` element with the `data-nexttheaterurl` and/or `data-previoustheaterurl`, then `previousContent` and/or `nextContent` will be set on `jQuery.evolutionTheater` with functions which perform ajax requests against these data attributes' values. The same process is followed for subsequently-loaded theater content. In this way, theater content is responsible for identifying what other items may be navigated to from itself.
///
/// #### Comments
///
/// The default ui component implementation also bundles automatic support for adding content comments when the theater content contains comment-related markup.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `theaterurl`: Ajax endpoint which returns rendered content to be shown within a theater
///
/// ### Example
///
/// Given the markup...
///
///     <span class="ui-theater" data-theaterurl="[AJAX ENDPOINT]">View a Preview</span>
///
/// ... and an ajax endpoint which returns an html fragment ...
///
///     <div>
///         <!-- some preview image -->
///         <img src="..." />
///     </div>
///
/// to show within the theater, the UI component automatically handles click events and renders a theater with content from the ajax endpoint using [jQuery.evolutionTheater](@evolutionTheater).
///
/// If the theater callback contains more content such as the following, it will automatically make use of pre-defined styling. **Note** that this is not required, but the default `jQuery.telligent.evolution.ui.components.theater` component implementation can make better use of content in this format.
///
/// **Note** the inclusion of `data-previoustheaterurl` and `data-nexttheaterurl` to instruct the default `jQuery.telligent.evolution.ui.components.theater` component implementation to provide `previousContent` and `nextContent` ajax request function wrapper parameters to the [jQuery.evolutionTheater](@evolutionTheater) plugin.
///
///     <div class="post-attachment-viewer">
///         <!-- some preview image -->
///         <img src="..." />
///     </div>
///     <div class="activity-story"
///         data-contentid="[CONTENT ID]"
///         data-contenttypeid="[CONTENT TYPE ID]">
///         <div class="full-post-header activity">
///             <a href="#"
///                data-previoustheaterurl="[PREVIOUS THEATER CONTENT AJAX ENDPOINT]">
///                Previous
///             </a>
///             <a href="#"
///                data-nexttheaterurl="[NEXT THEATER CONTENT AJAX ENDPOINT]">
///                Next
///             </a>
///         </div>
///         <div class="full-post activity">
///             <div class="post-author activity">
///                 <span class="avatar">
///                     <a href="[AUTHOR PROFILE URL]" class="internal-link view-user-profile">
///                         <img src="[AUTHOR AVATAR]" border="0" />
///                     </a>
///                 </span>
///             </div>
///             <div class="post-content activity">
///                 <div class="activity-summary">
///                     <span class="user-name">
///                         <a href="[AUTHOR PROFILE URL]"
///                            class="internal-link view-user-profile">
///                            <span></span>[AUTHOR DISPLAY NAME]
///                         </a>
///                     </span> in
///                     <a href="[CONTENT CONTAINER URL]"><span></span>[CONTENT CONTAINER NAME]</a>
///                 </div>
///                 <div class="activity-content">
///                     <a href="[CONTENT URL]" class="internal-link view-post">
///                         <span></span>[CONTENT NAME]
///                     </a>
///                     <a href="[CONTENT APPLICATION URL]" class="internal-link view-application">
///                         <span></span>[CONTENT APPLICATION NAME]
///                     </a>
///                 </div>
///             </div>
///         </div>
///         <div class="post-actions activity">
///             <div class="navigation-list-header"></div>
///             <ul class="navigation-list">
///                 <li class="navigation-item">
///                     <a class="internal-link comment" href="#">
///                         <span></span>Comment
///                     </a>
///                 </li>
///                 <li class="navigation-item">
///                     <a class="internal-link view-post" href="[ACTIVITY STORY PERMALINK URL]">
///                         <span class="post-date">9 hours ago</span>
///                     </a>
///                 </li>
///             </ul>
///             <div class="navigation-list-footer"></div>
///         </div>
///     </div>
///
/// If the `<div class="activity-story">` element also contains comment markup, the default implementation of `jQuery.telligent.evolution.ui.components.theater` will decorate it to be active.
///
///     <div class="content-list-header comments"></div>
///     <div class="content-list-name comments"></div>
///     <ul class="content-list comments">
///         <li class="content-item comment comment-form">
///             <div class="field-list-header"></div>
///             <fieldset class="field-list">
///                 <ul class="field-list">
///                     <li class="field-item">
///                         <span class="field-item-input">
///                             <span class="avatar">
///                                 <img src="" />
///                             </span>
///                             <textarea placeholder="Write a comment..." maxlength="512" rows="1"></textarea>
///                         </span>
///                     </li>
///                 </ul>
///             </fieldset>
///             <div class="field-list-footer"></div>
///         </li>
///     </ul>
///     <div class="content-list-footer comments"></div>
///
/// ### Default Implementation
///
/// For reference purposes or as the basis for an override:
///
///     (function($){
///
///     var emptyTypeId = '00000000-0000-0000-0000-000000000000',
///     	CommentService = (function(){
///         return {
///             add: function(contentId, contentTypeId, typeId, body, success, fail) {
///             	var data = {
///                     ContentId: contentId,
///                     ContentTypeId: contentTypeId,
///                     Body: body
///             	};
///             	if(typeof typeId !== 'undefined' && typeId !== null) {
///             		data.CommentTypeId = typeId;
///             	}
///                 $.telligent.evolution.post({
///                     url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/comments.json',
///                     data: data,
///                     cache: false,
///                     success: success,
///                     error: fail
///                 });
///             },
///             del: function(commentId, success, fail) {
///                 $.telligent.evolution.del({
///                     url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/comments/{CommentId}.json',
///                     data: {
///                         CommentId: commentId
///                     },
///                     cache: false,
///                     success: success,
///                     error: fail
///                 });
///             }
///         };
///     }());
///
/// 	var loadUrl = function(url, complete) {
/// 			$.telligent.evolution.get({
/// 				url: url,
/// 				cache: false,
/// 				success: function(response) {
/// 					complete(response);
/// 				}
/// 			});
/// 		},
/// 		initLikeAdjustments = function(context) {
/// 			var storyLikeMessageItem = context.content.find('.content-item.action.likes');
///             $.telligent.evolution.messaging.subscribe('ui.like', function(data){
///             	if(data.contentId === context.contentId && ((typeof context.typeId === 'undefined' || context.typeId === '' || context.typeId === emptyTypeId) || data.typeId === context.typeId)) {
///             		if(data.count > 0) {
///             			storyLikeMessageItem.removeClass('without-likes').addClass('with-likes');
///             		} else {
///             			storyLikeMessageItem.removeClass('with-likes').addClass('without-likes');
///             		}
///             	} else {
/// 					var likedComment = context.content.find('li.comment[data-commentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"]');
///             		if(data.count > 0) {
///             			likedComment.addClass('with-likes');
///             		} else {
///             			likedComment.removeClass('with-likes');
///             		}
///             	}
///             });
///
/// 		},
/// 		initCommenting = function(context) {
/// 			context.content.find('.internal-link.comment').bind('click',function(e){
/// 				e.preventDefault();
/// 				context.content.find('.comment-form').show().find('textarea').focus();
/// 			});
/// 			context.content.off('focus', '.comment-form textarea').on('focus', '.comment-form textarea', function(e) {
/// 				context.content.find('.comment-form').addClass('with-avatar');
/// 				var ta = $(e.target);
/// 				// when a text area is focused, set up its composer and set up handlers for submitting its results
/// 				if(!ta.data('theater_composer_inited')) {
/// 					ta.data('theater_composer_inited', true);
/// 					ta.evolutionComposer({
/// 						plugins: ['mentions','hashtags']
/// 					});
/// 					ta.evolutionComposer('onkeydown', function(e){
/// 						if (e.which === 13)
/// 						{
/// 							var body = $(e.target).evolutionComposer('val');
/// 							if($.trim(body).length > 0) {
/// 								context.content.find('.comment-form textarea').attr('disabled',true).blur();
/// 								CommentService.add(context.contentId, context.contentTypeId, context.typeId, body,
/// 									function(response) {	// success
/// 										$.evolutionTheater.refresh(mergeComments);
/// 										$.telligent.evolution.messaging.publish('activity.commentadded',response);
/// 									},
/// 									function(response) {	// error
/// 										context.content.find('.comment-form textarea')
/// 											.evolutionComposer('val','')
/// 											.trigger('keydown')	// to trigger autoresize to collapse
/// 											.trigger('keyup')	// to trigger autoresize to collapse
/// 											.removeAttr('disabled')
/// 											.closest('.comment-form')
/// 											.removeClass('with-avatar');
/// 									});
/// 							}
/// 						}
/// 						return true;
/// 					});
/// 				}
///
/// 			});
/// 			context.content.delegate('.comment-form textarea', 'blur', function(e) {
/// 				context.content.find('.comment-form').removeClass('with-avatar');
/// 			});
/// 		},
/// 		mergeComments = function(container, newContent) {
/// 			var currentReplies = $('<div></div>').html(newContent).find('ul.content-list.comments');
/// 			container.find('ul.content-list.comments').replaceWith(currentReplies);
/// 		},
/// 		initCommentModeration = function(context) {
/// 			context.content.find('.content-item.comment').bind('evolutionModerateLinkClicked', function(e, link) {
/// 				var commentId = $(this).data('commentid');
/// 				CommentService.del(commentId,
/// 					function(response) {	// success
/// 						$.evolutionTheater.refresh(mergeComments);
/// 						$.telligent.evolution.messaging.publish('activity.commentremoved',response);
/// 					},
/// 					function(response) {	// failure
///
/// 					});
/// 			});
/// 		},
/// 		buildContext = function(content) {
/// 			var content = $(content),
/// 				story = content.find('.activity-story'),
/// 				context = {
/// 					content: content,
/// 					story: story
/// 				};
/// 			if(story !== null) {
/// 				$.extend(context, {
/// 					contentId: story.data('contentid'),
/// 					contentTypeId: story.data('contenttypeid'),
/// 					typeId: story.data('typeid')
/// 				});
/// 			}
/// 			return context;
/// 		};
///
///
/// 	$.telligent.evolution.ui.components.theater = {
/// 		setup: function() {
///
/// 		},
/// 		// set up instances of theaters using ajax-loaded callbacks for content
/// 		add: function(elm, options) {
/// 			elm = $(elm);
/// 			var inited = false;
/// 			elm.bind('click', function(e){
/// 				e.preventDefault();
/// 				$.evolutionTheater.show({
/// 					content: function(complete) {
/// 						loadUrl(options.theaterurl, complete);
/// 					},
/// 					nextContent: function(content) {
/// 						var nextUrl = content.find('a[data-nexttheaterurl]').data('nexttheaterurl');
/// 						if(nextUrl && nextUrl.length > 0) {
/// 							return function(complete) {
/// 								loadUrl(nextUrl, complete);
/// 							}
/// 						}
/// 					},
/// 					previousContent: function(content) {
/// 						var previousUrl = content.find('a[data-previoustheaterurl]').data('previoustheaterurl');
/// 						if(previousUrl && previousUrl.length > 0) {
/// 							return function(complete) {
/// 								loadUrl(previousUrl, complete);
/// 							}
/// 						}
/// 					},
/// 					loaded: function(content) {
/// 						var context = buildContext(content);
/// 						initLikeAdjustments(context);
/// 						initCommenting(context);
/// 						initCommentModeration(context);
/// 					}
/// 				});
/// 			});
/// 		}
/// 	};
///
///     }(jQuery));
///
///
/* Theater UI component */
define('component.theater', ['module.ui'], function(ui, $, global, undef) {

    var emptyTypeId = '00000000-0000-0000-0000-000000000000',
    	CommentService = (function(){
        return {
            add: function(contentId, contentTypeId, typeId, body, success, fail) {
            	var data = {
                    ContentId: contentId,
                    ContentTypeId: contentTypeId,
                    Body: body
            	};
            	if(typeof typeId !== 'undefined' && typeId !== null) {
            		data.CommentTypeId = typeId;
            	}
                $.telligent.evolution.post({
                    url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/comments.json',
                    data: data,
                    cache: false,
                    success: success,
                    error: fail
                });
            },
            del: function(commentId, success, fail) {
                $.telligent.evolution.del({
                    url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/comments/{CommentId}.json',
                    data: {
                        CommentId: commentId
                    },
                    cache: false,
                    success: success,
                    error: fail
                });
            }
        };
    }());

	var loadUrl = function(url, complete) {
			$.telligent.evolution.get({
				url: url,
				cache: false,
				success: function(response) {
					complete(response);
				}
			});
		},
		initLikeAdjustments = function(context) {
			var storyLikeMessageItem = context.content.find('.content-item.action.likes');
            $.telligent.evolution.messaging.subscribe('ui.like', function(data){
            	if(data.contentId === context.contentId && ((typeof context.typeId === 'undefined' || context.typeId === '' || context.typeId === emptyTypeId) || data.typeId === context.typeId)) {
            		if(data.count > 0) {
            			storyLikeMessageItem.removeClass('without-likes').addClass('with-likes');
            		} else {
            			storyLikeMessageItem.removeClass('with-likes').addClass('without-likes');
            		}
            	} else {
					var likedComment = context.content.find('li.comment[data-commentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"]');
            		if(data.count > 0) {
            			likedComment.addClass('with-likes');
            		} else {
            			likedComment.removeClass('with-likes');
            		}
            	}
            });

		},
		initCommenting = function(context) {
			context.content.find('.internal-link.comment').bind('click',function(e){
				e.preventDefault();
				context.content.find('.comment-form').show().find('textarea').focus();
			});
			context.content.off('focus', '.comment-form textarea').on('focus', '.comment-form textarea', function(e) {
				context.content.find('.comment-form').addClass('with-avatar');
				var ta = $(e.target);
				// when a text area is focused, set up its composer and set up handlers for submitting its results
				if(!ta.data('theater_composer_inited')) {
					ta.data('theater_composer_inited', true);
					ta.evolutionComposer({
						plugins: ['mentions','hashtags']
					});
					ta.evolutionComposer('onkeydown', function(e){
						if (e.which === 13)
						{
							var body = $(e.target).evolutionComposer('val');
							if($.trim(body).length > 0) {
								context.content.find('.comment-form textarea').attr('disabled',true).blur();
								CommentService.add(context.contentId, context.contentTypeId, context.typeId, body,
									function(response) {	// success
										$.evolutionTheater.refresh(mergeComments);
										$.telligent.evolution.messaging.publish('activity.commentadded',response);
									},
									function(response) {	// error
										context.content.find('.comment-form textarea')
											.evolutionComposer('val','')
											.trigger('keydown')	// to trigger autoresize to collapse
											.trigger('keyup')	// to trigger autoresize to collapse
											.removeAttr('disabled')
											.closest('.comment-form')
											.removeClass('with-avatar');
									});
							}
						}
						return true;
					});
				}

			});
			context.content.delegate('.comment-form textarea', 'blur', function(e) {
				context.content.find('.comment-form').removeClass('with-avatar');
			});
		},
		initConversation = function(context) {
			context.content.find('.internal-link.start-conversation').bind('click',function(e) {
				e.preventDefault();
				var conversationUrl = $(e.target).data('conversationurl');
				$.glowModal(conversationUrl, { width: 550, height: 360 });
			});
		},
		mergeComments = function(container, newContent) {
			var currentReplies = $('<div></div>').html(newContent).find('ul.content-list.comments');
			container.find('ul.content-list.comments').replaceWith(currentReplies);
		},
		initCommentModeration = function(context) {
			context.content.find('.content-item.comment').bind('evolutionModerateLinkClicked', function(e, link) {
				var commentId = $(this).data('commentid');
				CommentService.del(commentId,
					function(response) {	// success
						$.evolutionTheater.refresh(mergeComments);
						$.telligent.evolution.messaging.publish('activity.commentremoved',response);
					},
					function(response) {	// failure

					});
			});
		},
		buildContext = function(content) {
			var content = $(content),
				story = content.find('.activity-story'),
				context = {
					content: content,
					story: story
				};
			if(story !== null) {
				$.extend(context, {
					contentId: story.data('contentid'),
					contentTypeId: story.data('contenttypeid'),
					typeId: story.data('typeid')
				});
			}
			return context;
		};


	$.telligent.evolution.ui.components.theater = {
		setup: function() {

		},
		// set up instances of theaters using ajax-loaded callbacks for content
		add: function(elm, options) {
			elm = $(elm);
			var inited = false;
			elm.bind('click', function(e){
				e.preventDefault();
				$.evolutionTheater.show({
					content: function(complete) {
						loadUrl(options.theaterurl, complete);
					},
					nextContent: function(content) {
						var nextUrl = content.find('a[data-nexttheaterurl]').data('nexttheaterurl');
						if(nextUrl && nextUrl.length > 0) {
							return function(complete) {
								loadUrl(nextUrl, complete);
							}
						}
					},
					previousContent: function(content) {
						var previousUrl = content.find('a[data-previoustheaterurl]').data('previoustheaterurl');
						if(previousUrl && previousUrl.length > 0) {
							return function(complete) {
								loadUrl(previousUrl, complete);
							}
						}
					},
					loaded: function(content) {
						var context = buildContext(content);
						initLikeAdjustments(context);
						initCommenting(context);
						initConversation(context);
						initCommentModeration(context);
					}
				});
			});
		}
	};

    return {};
}, jQuery, window);
 
 
define('component.tip', ['module.ui'], function(ui, $, global, undef) {

	$.telligent.evolution.ui.components.tip = {
		setup: function() { },
		add: function(elm, options) {
			$(elm).evolutionTip({
				attribute: options.tipcontent || $.fn.evolutionTip.defaults.attribute
			});
		}
	};

	return {};
}, jQuery, window);
 
 
define('component.tourtip', ['module.ui', 'module.tourtips'], function(ui, tourtips, $, global, undef) {

	$.telligent.evolution.ui.components.tourtip = {
		setup: function() { },
		add: function(elm, options) {
			$.telligent.evolution.tourTips.register({
            	key: options.tourtipkey,
            	message: options.tourtipmessage,
            	index: options.tourtipindex,
            	element: elm.get(0)
			});
		}
	};

	return {};

}, jQuery, window);
 
 
define('component.viewhtml', ['module.ui', 'module.messaging'], function(ui, messaging, $, global, undef) {

	var maximumViewableHeight;
	var usingScrollableHeight = false;

	function load(url, width, height, persist) {
		var data = {
			url: url,
			width: 0,
			height: 0,
			outputIsPersisted: false
		};
		if(width)
			data.width = width;
		if(height)
			data.height = height;
		if(persist)
			data.outputIsPersisted = persist;
		return $.telligent.evolution.get({
			url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ui/view.json',
			data: data
		});
	}

	function loadAndRender(elm, options, viewableHeightChanged) {

		if (elm.css('display') == 'none' || elm.parent().css('display') == 'none') {
			global.setTimeout(function() {
				loadAndRender(elm, options, viewableHeightChanged);
			}, 499);

			return;
		}

		if (viewableHeightChanged && options.resizedBy != 'viewable') {
			return;
		}

		var width = elm.parent().width();
		var height = elm.parent().height();
		var resizedBy = 'parent';
		var measuredHeight = height;

		if (width == 0) {
			width = elm.parents('.layout-region-inner').width();
		}

		if(width > options.width) {
			width = options.width;
		}

		if (height == 0 || options.resizedBy != 'parent' || height > maximumViewableHeight) {
			measuredHeight = maximumViewableHeight;
			height = Math.round(maximumViewableHeight * .8);
			resizedBy = 'viewable';
		}

		if (height > options.height  && options.height > 0) {
			measuredHeight = height = options.height;
			resizedBy = 'configured';
		}

		options.resizedBy = resizedBy;
		if (measuredHeight != options.lastHeight || width != options.lastHeight) {

			var currentWidth = elm.width();
			var currentHeight = elm.height();

			// width-bound, don't refresh
			if (width == options.lastWidth && measuredHeight <= options.lastHeight && (currentHeight <= measuredHeight || measuredHeight == 0))
				return;

			// height-bound, don't refresh
			if (measuredHeight == options.lastHeight && width <= options.lastWidth && (currentWidth <= width || width == 0))
				return;

			load(options.url, width, height, options.persist).done(function(response){
				if (options.lastHtml != response.Html) {
					elm.html(response.Html);
					options.lastHtml = response.Html;
				}
			});

			options.lastHeight = measuredHeight;
			options.lastWidth = width;
		}
	}

	$.telligent.evolution.ui.components.viewhtml = {
		setup: function() {
			maximumViewableHeight = $(window).height();

			$(window).on('resized', function() {
				if (!usingScrollableHeight) {
					maximumViewableHeight = $(window).height();
				}
			});

			$.telligent.evolution.messaging.subscribe('window.scrollableheight', function(data) {
				maximumViewableHeight = data.height;
				usingScrollableHeight = true;
			});
		},
		add: function(elm, options) {
			options.resizedBy = 'parent';
			options.lastWidth = -1;
			options.lastHeight = -1;
			options.lastHtml = '';

			loadAndRender(elm, options, false);
			$(window).on('resized', function(){
				loadAndRender(elm, options, false);
			});
			$.telligent.evolution.messaging.subscribe('window.scrollableheight', function(data) {
				loadAndRender(elm, options, true);
			});
		}
	};

	return {};

}, jQuery, window);
 
 
/// @name webpreview
/// @category UI Component
/// @description Presents an asynchronously-loaded Web Preview
///
/// ### jQuery.telligent.evolution.ui.components.webpreview
///
/// [UI Component](@ui) which handles automatic asynchronous loading and presentation of [[web previews]] within other content. Decorates `<span class="ui-webpreview"></span>` elements to present Ajax-loaded web previews. [Overrides can be provided](@ui) at the theme level to present web previews differently. This enables content to be loaded quickly without waiting for remote web content to be scraped and processed.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `configuration`: Object of all query string encoded keys and values embedded in the `data-configuration` attribute
///      * `url`: URL to preview
///      * `maximagewidth`: optional max image width requested
///      * `maximageheight`: optional max image height requested
///
/// ### Example:
///
/// Given the markup...
///
///     <span class="ui-webpreview" data-configuration="url=http%3A%2F%2Ftelligent.com">
///         <a target="_new" rel="nofollow" href="http://telligent.com">Telligent</a>
///     </span>
///
/// After being rendered within the DOM, it will be automatically replaced with an asynchronously-loaded web preview of the target URL (in this http://telligent.com).
///
/// ### Default Implementation
///
/// For reference purposes or as the basis for an override:
///
///     (function($){
///
///     var getWebPreviewData = function(options) {
///     		$.telligent.evolution.preview.load(options.url, {
///     			maxImageWidth: options.maxImageWidth,
///     			maxImageHeight: options.maxImageHeight,
///     			success: options.success
///     		});
///     	},
///     	renderWebPreview = function(elm, preview) {
///     		return $.telligent.evolution.preview.render(preview, {
///     			template: $.telligent.evolution.preview.defaults.template
///     		});
///     	};
///
///     $.telligent.evolution.ui.components.webpreview = {
///     	setup: function() { },
///     	add: function(elm, options) {
///     		var previewOptions = {
///     			url: options.configuration.url,
///     			success: function(preview) {
///     				if(preview) {
///     					var templatedPreview = renderWebPreview(elm, preview);
///     					if (typeof templatedPreview !== 'undefined' &&
///     					    templatedPreview !== null && templatedPreview.length > 0)
///     					{
///     						elm.replaceWith(templatedPreview);
///     					}
///     				}
///     			}
///     		};
///     		if(typeof options.configuration.maximagewidth !== 'undefined') {
///     			previewOptions.maxImageWidth = options.configuration.maximagewidth;
///     		}
///     		if(typeof options.configuration.maximageheight !== 'undefined') {
///     			previewOptions.maxImageHeight = options.configuration.maximageheight;
///     		}
///     		getWebPreviewData(previewOptions);
///     	}
///     };
///
///     }(jQuery));
///
define('component.webpreview', ['module.ui'], function(ui, $, global, undef) {

	var getWebPreviewData = function(options) {
			$.telligent.evolution.preview.load(options.url, {
				maxImageWidth: options.maxImageWidth,
				maxImageHeight: options.maxImageHeight,
				success: options.success
			});
		},
		renderWebPreview = function(elm, preview) {
			return $.telligent.evolution.preview.render(preview, {
				template: $.telligent.evolution.preview.defaults.template
			});
		};

	$.telligent.evolution.ui.components.webpreview = {
		setup: function() { },
		add: function(elm, options) {
			var previewOptions = {
				url: options.configuration.url,
				success: function(preview) {
					if(preview) {
						var templatedPreview = renderWebPreview(elm, preview);
						if(typeof templatedPreview !== 'undefined' && templatedPreview !== null && templatedPreview.length > 0) {
							elm.replaceWith(templatedPreview);
						}
					}
				}
			};
			if(typeof options.configuration.maximagewidth !== 'undefined') {
				previewOptions.maxImageWidth = options.configuration.maximagewidth;
			}
			if(typeof options.configuration.maximageheight !== 'undefined') {
				previewOptions.maxImageHeight = options.configuration.maximageheight;
			}
			getWebPreviewData(previewOptions);
		}
	};

	return {};
}, jQuery, window);
 
 
// Stub module which does nothing but require module-wrapped composer plugins
// so that they can all be inited just by requiring this module
define('composers', [
	'composer.hashtags',
	'composer.mentions',
	'composer.urlhighlight'
], function(){
	return {};
}); 
 
/// @name hashtags
/// @category Composer Plugin
/// @description Adds hashtag support to the Composer
///
/// ### Hashtag Composer Plugin
///
/// [Composer](@evolutionComposer) plugin which adds hashtag support.
///
/// ### Usage
///
/// Like other [Composer](@evolutionComposer) plugins, it can be declared in the list of plugins when instantiating a composer
///
///     $('textarea.selector').evolutionComposer({
///     	plugins: ['hashtags']
/// 		// extra options supported by the hashtag plugin
///     });
///
/// ### Options
///
///  * `onTagList`: function which is called to asynchronously provide suggested type-ahead results during hashtag composition
///    * parameters:
///      * `query`: string query
///      * `complete`: function to be called to pass the results back to the composer. Should be passed an array of objects with `name` and `token` keys on each.
///    * default: **This is automatically supplied globally by Evolution, but can be overridden**
///  * `highlightClass`: class name to apply to the hashtag to differentiate it from surrounding text.
///    * default: `'composer-hashtag-highlight'`
///
/// #### Default onTagList implementation:
///
/// This is automatically supplied globally by Evolution, but can be overridden:
///
///     onTagList: function(query, complete) {
///     	$.telligent.evolution.get({
///     		url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/hashtags.json?IncludeFields=Token,PreviewHtml',
///     		data: {
///     			QueryText: query,
///     			PageSize: 5
///     		},
///     		cache: false,
///     		dataType: 'json',
///     		success: function(response) {
///     			if(response.HashTags && response.HashTags.length > 0) {
///     				var results = $.map(response.HashTags, function(tag) {
///     					return { name: tag.PreviewHtml, token: tag.Token };
///     				});
///     				complete(results);
///     			} else {
///     				complete(null);
///     			}
///     		}
///     	});
///     }
///
define('composer.hashtags', ['plugin.evolutionComposer'], function(evolutionComposer, $, global, undef){

	// hash tag composer plugin
	var hashTagComposer = (function(){
		var ignored = '-_~`!@#$%^&*()=+{[}]\\|;:\'",<.>/? ', // escapes on these characters
			ignoredRegex = null,
			ignoredCharacterCodes = {},
			isActiveKey = '_hashtag_composer_active',
			getTaggedTags = function(context) {
				var taggedTags = context.data('_tagged_tags');
				if(typeof taggedTags === 'undefined' || taggedTags === null) {
					taggedTags = [];
					context.data('_tagged_tags', taggedTags);
				}
				return taggedTags;
			},
			createAdHocTaggable = function(rawTagText) {
				return {
					decodedName: rawTagText,
					name: rawTagText,
					token: '[tag:' + rawTagText.substr(1) + ']'
				}
			},
			setCursorPosition = function (context, position) {
				var textarea = context.input.get(0);
			    if(textarea.setSelectionRange) {
			        textarea.setSelectionRange(position, position);
			    } else if(textarea.createTextRange) {
			        var range = textarea.createTextRange();
			        range.collapse(true);
			        range.moveEnd('character', position);
			        range.moveStart('character', position);
			        range.select();
			    }
			},
			addTag = function(context, tag, replaceCurrentWord, appendSpace, release) {
				// record what was tagged for pre-processing later
				var taggedTags = getTaggedTags(context);
				taggedTags[taggedTags.length] = tag;
				// replace #text with tag's name
				if(replaceCurrentWord) {
					var currentWord = context.currentWord();
					context.replace(currentWord.start, currentWord.stop + 1, tag.decodedName + (appendSpace ? ' ' : ''));
				}

				var newPosition = (currentWord.start + (tag.decodedName + (appendSpace ? ' ' : '')).length);
				setCursorPosition(context, newPosition);

				// highlight tags
				updateHighlights(context);

				context.data(isActiveKey, false);
				TagSelector.hide();
				context.input.focus();

				// release back to input (and hide selector)
				if(release) {
					context.release();
				}
			},
			updateHighlights = function(context) {
				var hashTags = getTaggedTags(context).reverse(),
					currentValue = context.val();
				context.clearHighlights(context.settings.highlightClass || hashTagHighlightClass);
				var tagStarts = {};
				$.each(hashTags, function(i, hashTag) {
					if(hashTag && hashTag.decodedName !== null && hashTag.decodedName.length > 0) {
						var nameStart = currentValue.indexOf(hashTag.decodedName);
						if(nameStart < 0 || tagStarts[nameStart]) {
							hashTags.splice(i,1);
						} else {
							while(nameStart >= 0) {
								context.addHighlight({
									start: nameStart,
									stop: hashTag.decodedName.length + nameStart,
									className: context.settings.highlightClass || hashTagHighlightClass
								});
								tagStarts[nameStart] = true;
								nameStart = currentValue.indexOf(hashTag.decodedName, nameStart + 1);
							}
						}
					}
				});
				context.renderHighlights();
			},
			wordIsTaggable = function(word) {
				return word.length > 2 && word.indexOf('#') === 0 && !ignoredRegex.test(word.substr(1)) && isNaN(parseInt(word[1], 10));
			},
			hashTagHighlightClass = 'composer-hashtag-highlight', // local ref to passed class for highlighting hashtags
			listTags = function() {}, // local ref to passed fn for listing tags
			listTagsTimeout = null;

		// capture ignored character codes
		ignoredRegex = new RegExp('[' + ignored.replace(']','\\]') + ']','i');
		for(var i = 0; i < ignored.length; i++) {
			ignoredCharacterCodes[ignored.charCodeAt(i)] = true;
		}

		var api = {
			init: function(context) {
				listTags = context.settings.onTagList || $.fn.evolutionComposer.plugins.hashtags.defaults.onTagList;
				context.input.bind(TagSelector.selectedEventName, function(){
					addTag(context, TagSelector.selection(), true, true, true);
				});
				context.input.bind('blur', function(){
					setTimeout(function(){
						context.release();
					}, 500);
				});
			},
			onTransform: function(context) {
				updateHighlights(context);
			},
			shouldActivate: function(context) {
				return wordIsTaggable(context.currentWord().value);
			},
			onActivate: function(context) {
				context.data(isActiveKey, true);
				$(document).bind('click.ui-composer-hashtags',function(){
					context.release();
					$(document).unbind('.ui-composer-hashtags');
				});
			},
			onDeactivate: function(context) {
				var currentWord = context.currentWord();
				if(wordIsTaggable(currentWord.value)) {
					addTag(context, createAdHocTaggable(currentWord.value), true, false, false);
				}
				context.data(isActiveKey, false);
				TagSelector.hide();
				context.input.focus();
			},
			val: function(value, context) {
				var hashTags = getTaggedTags(context);
				$.each(hashTags, function(i, hashTag) {
					value = value.replace(new RegExp($.telligent.evolution.regex.encode(hashTag.decodedName),'g'), hashTag.token);
				});
				return value;
			},
			onkeydown: function(context, e) {
				if(e.which === 27 || e.which === 32) {    // esc or space exits tag selection
					context.release();
				} else if(e.which === 13 || e.which === 9) { // enter or tab captures selection
					var taggable = TagSelector.selection();
					if(!taggable) {
						context.release();
					} else {
						addTag(context, taggable, true, true, true);
						return false;
					}
				} else if(e.which === 38) { // up navigates tags
					TagSelector.moveHighlightUp();
					return false;
				} else if(e.which === 40) { // down navigates tags
					TagSelector.moveHighlightDown();
					return false;
				}
				return true;
			},
			onkeypress: function(context, e) {
				// release on ignored characters
				if(typeof ignoredCharacterCodes[e.which] !== 'undefined') {
					context.release();
				}
				return true;
			},
			oninput: function(context, e) {
				if(!wordIsTaggable(context.currentWord().value)) {
					context.release();
					return true;
				}

				clearTimeout(listTagsTimeout);
				TagSelector.loading(context.input);
				listTagsTimeout = setTimeout(function(){
					var query = context.currentWord().value;
					if(!wordIsTaggable(query)) {
						context.release();
					} else if(query.length >= 2) {
						listTags(query.substr(1), function(taggables) {
							// if no longer active at this point, ignore results
							if(!context.data(isActiveKey))
								return;

							if(taggables) {
								taggables = $.map(taggables, function(tag) {
									return {
										name: tag.name,
										token: tag.token,
										decodedName: $.telligent.evolution.html.decode(tag.name)
									}
								});
							}

							var currentValue = context.currentWord().value;
							if (currentValue == query &&
								wordIsTaggable(currentValue) &&
								taggables !== null &&
								taggables.length > 0)
							{
								TagSelector.show(context.input, taggables, query);
							} else {
								TagSelector.hide();
							}
						});
					}
				}, 500);

				return true;
			}
		};

		return api;
	}());

	// encapsulated ui for displaying tags and selecting, used by the composer
	var TagSelector = (function(){
		var element = null,
			highlightClass  = 'highlight',
			tagDataKey = 'tagData',
			availableTags = {},
			attachedInput = null,
			loading = null,
			init = function(input) {
				attachedInput = input;

				if(element !== null) {
					return;
				}

				element = $('<ul class="composer-hashtag-selector"></ul>').hide().appendTo($('body'));
				loading = $('<li class="loading">...</li>');

				var loadingHighlightIndex = 0,
					loadingHtml = [
						'<strong>&bull;</strong>&bull;&bull;',
						'&bull;<strong>&bull;</strong>&bull;',
						'&bull;&bull;<strong>&bull;</strong>'
					],
					loadingHtmlInterval;
				loadingHtmlInterval = setInterval(function(){
					loadingHighlightIndex = loadingHighlightIndex+1;
					if(loadingHighlightIndex === 3)
						loadingHighlightIndex = 0;
					loading.get(0).innerHTML = loadingHtml[loadingHighlightIndex];
				}, 175);

				element.delegate('li','click',function(e){
					if(attachedInput !== null) {
						element.find('li.' + highlightClass).removeClass(highlightClass);
						$(this).addClass(highlightClass);
						attachedInput.trigger(api.selectedEventName);
					}
				});
			},
			reposition = function() {
				if(attachedInput !== null) {
					var offset = attachedInput.offset(), input = $(attachedInput);
					element.css({
						width: input.outerWidth() - 2,
						top: offset.top + input.outerHeight() - 1,
						left: offset.left
					});
				}
			};

		var api = {
			selectedEventName: 'HASHTAG_SELECTED',
			show: function(input, tags, query) {
				init(input);
				reposition();
				element.hide().empty();
				var queryRegex = new RegExp($.telligent.evolution.regex.encode($.telligent.evolution.html.encode(query)),'i');
				$.each(tags, function(i, tag){
					var match = tag.name.match(queryRegex);
					var tagListItem = match !== null
						? $('<li>'+tag.name.replace(queryRegex, '<strong>' + match[0] + '</strong>')+'</li>')
						: $('<li>'+tag.name+'</li>');
					tagListItem.data(tagDataKey, tag);
					element.append(tagListItem);
				});
				element.show();
			},
			hide: function() {
				if(element !== null) {
					element.hide().empty();
				}
			},
			loading: function(input) {
				init(input);
				reposition();
				element.hide().empty().append(loading).show();
			},
			moveHighlightUp: function() {
				var choices = element.find('li');
				if(choices.length === 0) {
					return;
				}
				// find currently selected
				var highlightIndex = choices.length;
				$.each(choices, function(i, choice){
					if($(choice).hasClass(highlightClass)) {
						highlightIndex = i;
						$(choice).removeClass(highlightClass);
					}
				});
				// if past the end, loop to the top
				if(highlightIndex - 1 < 0) {
					highlightIndex = choices.length;
				}
				// highlight new choice
				$(choices.get(highlightIndex - 1)).addClass(highlightClass);
			},
			moveHighlightDown: function() {
				var choices = element.find('li');
				if(choices.length === 0) {
					return;
				}
				// find currently selected
				var highlightIndex = -1;
				$.each(choices, function(i, choice){
					if($(choice).hasClass(highlightClass)) {
						highlightIndex = i;
						$(choice).removeClass(highlightClass);
					}
				});
				// if past the end, loop to the top
				if(highlightIndex + 1 >= choices.length) {
					highlightIndex = -1;
				}
				// highlight new choice
				$(choices.get(highlightIndex + 1)).addClass(highlightClass);
			},
			selection: function() {
				var choices = element.find('li');
				if(choices.length === 0) {
					return null;
				}
				var currentHighlight = choices.filter('li.' + highlightClass);
				if(currentHighlight !== null && currentHighlight.length > 0) {
					return currentHighlight.data(tagDataKey);
				} else {
					// return first hashTag
					return $(choices.get(0)).data(tagDataKey);
				}
			}
		}

		return api;
	}());

	$.fn.evolutionComposer.plugins.hashtags = hashTagComposer;
	$.fn.evolutionComposer.plugins.hashtags.defaults = {
		onTagList: function(query, complete) {
			$.telligent.evolution.get({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/hashtags.json?IncludeFields=Token,PreviewHtml',
				data: {
					QueryText: query,
					PageSize: 5
				},
				cache: false,
				dataType: 'json',
				success: function(response) {
					if(response.HashTags && response.HashTags.length > 0) {
						var results = $.map(response.HashTags, function(tag) {
							return { name: tag.PreviewHtml, token: tag.Token };
						});
						complete(results);
					} else {
						complete(null);
					}
				}
			});
		}
	};

	return {}
}, jQuery, window);
 
 
/// @name mentions
/// @category Composer Plugin
/// @description Adds @mention support to the Composer
///
/// ### Mention Composer Plugin
///
/// [Composer](@evolutionComposer) plugin which adds @mention support.
///
/// ### Usage
///
/// Like other [Composer](@evolutionComposer) plugins, it can be declared in the list of plugins when instantiating a composer
///
///     $('textarea.selector').evolutionComposer({
///     	plugins: ['mentions']
/// 		// extra options supported by the mentions plugin
///     });
///
/// ### Options
///
///  * `onMentionableList`: function which is called to asynchronously provide suggested type-ahead results during @mention composition
///    * parameters:
///      * `query`: string query
///      * `complete`: function to be called to pass the results back to the composer. Should be passed an array of objects with `name` and `token` keys on each.
///    * default: ** This is automatically supplied globally by Evolution, but can be overridden**
///  * `highlightClass`: class name to apply to the @mention to differentiate it from surrounding text.
///    * default: `'composer-mentionable-mention-highlight'`
///
/// #### Default onMentionableList implementation:
///
/// This is automatically supplied globally by Evolution, but can be overridden:
///
///     onMentionableList: function(query, complete) {
///     	$.telligent.evolution.get({
///     		url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/mentionables.json?IncludeFields=Token,PreviewHtml',
///     		data: {
///     			QueryText: query,
///     			PageSize: 20
///     		},
///     		cache: false,
///     		dataType: 'json',
///     		success: function(response) {
///     			if(response.Mentionables && response.Mentionables.length > 0) {
///     				var results = $.map(response.Mentionables, function(mentionable) {
///     					return { name: mentionable.PreviewHtml, token: mentionable.Token };
///     				});
///     				complete(results);
///     			} else {
///     				complete(null);
///     			}
///     		}
///     	});
///     }
///
define('composer.mentions', ['plugin.evolutionComposer'], function(evolutionComposer, $, global, undef){

	// mentionable composer plugin
	var mentionComposer = (function(){

		var queryCache = {},
			entryChar = '@'
			allowedSpacesKey = '_allowed_spaces',
			isActiveKey = '_hashtag_composer_active',
			caretPosition = 0,
			getMentions = function(context) {
				var mentionedMentionables = context.data('_mentioned_mentionables');
				if(typeof mentionedMentionables === 'undefined' || mentionedMentionables === null) {
					mentionedMentionables = [];
					context.data('_mentioned_mentionables', mentionedMentionables);
				}
				return mentionedMentionables;
			},
			setCursorPosition = function (context, position) {
				var textarea = context.input.get(0);
			    if(textarea.setSelectionRange) {
			        textarea.setSelectionRange(position, position);
			    } else if(textarea.createTextRange) {
			        var range = textarea.createTextRange();
			        range.collapse(true);
			        range.moveEnd('character', position);
			        range.moveStart('character', position);
			        range.select();
			    }
			},
			mentionMentionable = function(context, mentionable) {
				// record what was mentioned for pre-processing later
				var mentionedMentionables = getMentions(context);
				mentionedMentionables[mentionedMentionables.length] = mentionable;
				// release back to input (and hide selector)
				context.release();
				// replace @text with mentionable's name
				var currentWord = effectiveCurrentWord(context);
				context.replace(currentWord.start, currentWord.stop + 1, mentionable.decodedName + ' ');
				// highlight mentinoed mentionables
				updateHighlights(context);
				// remove any allowed spaces in current word checks
				allowedSpaces(context, 0)
				// set proper position
				setCursorPosition(context, (currentWord.start + (mentionable.decodedName + ' ').length));
			},
			updateHighlights = function(context) {
				var mentions = getMentions(context),
					currentValue = context.val();
				context.clearHighlights(context.settings.highlightClass || mentionHighlightClass);
				$.each(mentions, function(i, mention) {
					if(mention && mention.decodedName !== null && mention.decodedName.length > 0) {
						var nameStart = currentValue.indexOf(mention.decodedName);
						if(nameStart < 0) {
							mentions.splice(i,1);
						} else {
							while(nameStart >= 0) {
								context.addHighlight({
									start: nameStart,
									stop: mention.decodedName.length + nameStart,
									className: context.settings.highlightClass || mentionHighlightClass
								});
								nameStart = currentValue.indexOf(mention.decodedName, nameStart + 1);
							}
						}
					}
				});
				context.renderHighlights();
			},
			mentionHighlightClass = 'composer-mentionable-mention-highlight', // local ref to passed class for highlighting mentinos
			getMentionables = function() {}, // local ref to passed fn for listing mentionables
			getMentionablesTimeout = null,
			allowedSpaces = function(context, spaces) {
				if(typeof spaces !== 'undefined') {
					context.data('_allowed_spaces', spaces);
					return spaces;
				} else {
					var allowed = context.data('_allowed_spaces');
					return allowed || 0;
				}
			},
			effectiveCurrentWord = function(context) {
				var toCaret = context.val().substring(0, caretPosition),
					knownGoodQuery = null;
				$.each(queryCache, function(query, mentionables) {
					if(mentionables !== null && mentionables.length > 0 && toCaret.match(entryChar + $.telligent.evolution.regex.encode(query) + '$')) {
						knownGoodQuery = entryChar + query;
						return false;
					}
				});
				if(knownGoodQuery !== null) {
					var queryAt = toCaret.length - knownGoodQuery.length;
					allowedSpaces(context, knownGoodQuery.split(' ').length - 1);
					return {
						value: knownGoodQuery,
						start: queryAt,
						stop: queryAt + knownGoodQuery.length
					};
				} else {
					return context.currentWord({
						caretPosition: caretPosition,
						allowedWhiteSpaceBeforeCaret: allowedSpaces(context),
						additionalWhiteSpaceSymbols: ['(', ')', '"', '\'', '<', '>']
					});
				}
			};

		var api = {
			init: function(context) {
				getMentionables = context.settings.onMentionableList || $.fn.evolutionComposer.plugins.mentions.defaults.onMentionableList;
				context.input.bind(MentionSelector.selectedEventName, function(){
					mentionMentionable(context, MentionSelector.selection());
				});
				context.input.bind({
					blur: function(){
						setTimeout(function(){
							context.release();
						}, 500);
					},
					// always get a reference to the latest caret position, even when inactive, as
					// chrome returns an inaccurate position during onInput
					keydown: function() {
						caretPosition = context.caretPosition() + 1;
					}
				});
			},
			onTransform: function(context) {
				updateHighlights(context);
			},
			shouldActivate: function(context) {
				return effectiveCurrentWord(context).value.indexOf(entryChar) === 0;
			},
			onActivate: function(context) {
				context.data(isActiveKey, true);
				$(document).bind('click.mentions',function(){
					context.release();
					$(document).unbind('.mentions');
				});
			},
			onDeactivate: function(context) {
				context.data(isActiveKey, false);
				MentionSelector.hide();
				context.input.focus();
				allowedSpaces(context, 0);
			},
			val: function(value, context) {
				var mentions = getMentions(context);
				$.each(mentions, function(i, mention) {
					value = value.replace(mention.decodedName, mention.token);
				});
				return value;
			},
			onkeydown: function(context, e) {
				if(e.which === 32) { // space adds to the tracked allowed spaces, which may be ignored if no match
					allowedSpaces(context, allowedSpaces(context) + 1);
				} else if(e.which === 27) {	   // esc exits mentionable selection
					context.release();
					return false;
				} else if(e.which === 13 || e.which === 9) { // enter or tab captures selection
					var mentionable = MentionSelector.selection();
					if(!mentionable) {
						context.release();
					} else {
						mentionMentionable(context, mentionable);
					}
					return false;
				} else if(e.which === 38) { // up navigates mentionables
					MentionSelector.moveHighlightUp();
					return false;
				} else if(e.which === 40) { // down navigates mentionables
					MentionSelector.moveHighlightDown();
					return false;
				}
				return true;
			},
			onkeypress: function(context, e) {
				return true;
			},
			oninput: function(context, e) {
				clearTimeout(getMentionablesTimeout);
				MentionSelector.loading(context.input);
				getMentionablesTimeout = setTimeout(function(){
					var query = effectiveCurrentWord(context).value.substring(1);
					if(query.length > 1) {
						var handleMentionables = function(mentionables) {
							if(mentionables !== null && mentionables.length > 0) {
								MentionSelector.show(context.input, mentionables, query);
							} else {
								context.release();
							}
						};
						if(typeof queryCache[query] !== 'undefined') {
							if(!context.data(isActiveKey))
								return;

							handleMentionables(queryCache[query]);
						} else {
							getMentionables(query, function(mentionables) {
								// if no longer active at this point, ignore results
								if(!context.data(isActiveKey))
									return;

								if(mentionables) {
									mentionables = $.map(mentionables, function(mentionable) {
										return {
											name: mentionable.name,
											token: mentionable.token,
											decodedName: $.telligent.evolution.html.decode(mentionable.name)
										}
									});
								}
								queryCache[query] = mentionables;
								if (effectiveCurrentWord(context).value.substring(1) == query) {
									handleMentionables(mentionables);
								}
							});
						}
					} else {
						context.release();
					}
				}, 500);

				return true;
			}
		};

		return api;
	}());

	// encapsulated ui for displaying mentionables and selecting, used by the composer
	var MentionSelector = (function(){
		var element = null,
			highlightClass	= 'highlight',
			mentionableDataKey = 'mentionableData',
			availableMentionables = {},
			attachedInput = null,
			loading = null,
			init = function(input) {
				attachedInput = input;

				if(element !== null) {
					return;
				}

				element = $('<ul class="composer-mentionable-selector"></ul>').hide().appendTo($('body'));
				loading = $('<li class="loading">...</li>');

				var loadingHighlightIndex = 0,
					loadingHtml = [
						'<strong>&bull;</strong>&bull;&bull;',
						'&bull;<strong>&bull;</strong>&bull;',
						'&bull;&bull;<strong>&bull;</strong>'
					],
					loadingHtmlInterval;
				loadingHtmlInterval = setInterval(function(){
					loadingHighlightIndex = loadingHighlightIndex+1;
					if(loadingHighlightIndex === 3)
						loadingHighlightIndex = 0;
					loading.get(0).innerHTML = loadingHtml[loadingHighlightIndex];
				}, 175);

				element.delegate('li','click',function(e){
					if(attachedInput !== null) {
						element.find('li.' + highlightClass).removeClass(highlightClass);
						$(this).addClass(highlightClass);
						attachedInput.trigger(api.selectedEventName);
					}
				});
			},
			reposition = function() {
				if(attachedInput !== null) {
					var offset = attachedInput.offset(), input = $(attachedInput);
					element.css({
						width: input.outerWidth() - 2,
						top: offset.top + input.outerHeight() - 1,
						left: offset.left
					});
				}
			};

		var api = {
			selectedEventName: 'MENTIONABLE_SELECTED',
			show: function(input, mentionables, query) {
				init(input);
				reposition();
				element.hide().empty();
				var queryRegex = new RegExp($.telligent.evolution.regex.encode($.telligent.evolution.html.encode(query)),'i');
				$.each(mentionables, function(i, mentionable){
					var match = mentionable.name.match(queryRegex);
					var mentionableListItem = match !== null
						? $('<li>'+mentionable.name.replace(queryRegex, '<strong>' + match[0] + '</strong>')+'</li>')
						: $('<li>'+mentionable.name+'</li>');
					mentionableListItem.data(mentionableDataKey, mentionable);
					element.append(mentionableListItem);
				});
				element.show();
			},
			hide: function() {
				if(element !== null) {
					element.hide().empty();
				}
			},
			loading: function(input) {
				init(input);
				reposition();
				element.hide().empty().append(loading).show();
			},
			moveHighlightUp: function() {
				var choices = element.find('li');
				if(choices.length === 0) {
					return;
				}
				// find currently selected
				var highlightIndex = choices.length;
				$.each(choices, function(i, choice){
					if($(choice).hasClass(highlightClass)) {
						highlightIndex = i;
						$(choice).removeClass(highlightClass);
					}
				});
				// if past the end, loop to the top
				if(highlightIndex - 1 < 0) {
					highlightIndex = choices.length;
				}
				// highlight new choice
				$(choices.get(highlightIndex - 1)).addClass(highlightClass);
			},
			moveHighlightDown: function() {
				var choices = element.find('li');
				if(choices.length === 0) {
					return;
				}
				// find currently selected
				var highlightIndex = -1;
				$.each(choices, function(i, choice){
					if($(choice).hasClass(highlightClass)) {
						highlightIndex = i;
						$(choice).removeClass(highlightClass);
					}
				});
				// if past the end, loop to the top
				if(highlightIndex + 1 >= choices.length) {
					highlightIndex = -1;
				}
				// highlight new choice
				$(choices.get(highlightIndex + 1)).addClass(highlightClass);
			},
			selection: function() {
				var choices = element.find('li');
				if(choices.length === 0) {
					return null;
				}
				var currentHighlight = choices.filter('li.' + highlightClass);
				if(currentHighlight !== null && currentHighlight.length > 0) {
					return currentHighlight.data(mentionableDataKey);
				} else {
					// return first mention
					return $(choices.get(0)).data(mentionableDataKey);
				}
			}
		}

		return api;
	}());

	$.fn.evolutionComposer.plugins.mentions = mentionComposer;
	$.fn.evolutionComposer.plugins.mentions.defaults = {
		onMentionableList: function(query, complete) {
			$.telligent.evolution.get({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/mentionables.json?IncludeFields=Token,PreviewHtml',
				data: {
					QueryText: query,
					PageSize: 20
				},
				cache: false,
				dataType: 'json',
				success: function(response) {
					if(response.Mentionables && response.Mentionables.length > 0) {
						var results = $.map(response.Mentionables, function(mentionable) {
							return { name: mentionable.PreviewHtml, token: mentionable.Token };
						});
						complete(results);
					} else {
						complete(null);
					}
				}
			});
		}
	};

	return {}
}, jQuery, window);
 
 
/// @name urlhighlight
/// @category Composer Plugin
/// @description Adds URL highlighting support to the Composer
///
/// ### URL Highlight Composer Plugin
///
/// [Composer](@evolutionComposer) plugin which enables URL highlighting support, to display URLs differently than their surrounding text.
///
/// ### Usage
///
/// Like other [Composer](@evolutionComposer) plugins, it can be declared in the list of plugins when instantiating a composer
///
///     $('textarea.selector').evolutionComposer({
///     	plugins: ['urlhighlight']
///     });
///
define('composer.urlhighlight', ['plugin.evolutionComposer'], function(evolutionComposer, $, global, undef){

    var dataKey = '_composer_urlpreview_data',
        urlRegex =/(\b(http):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig,
        findFirstUrlInText = function(content) {
            var urls = (content || "").match(urlRegex);
            if(urls !== null && urls.length > 0) {
                return urls[0];
            }
            return null;
        },
        getContextData = function(context) {
            var data = context.data(dataKey);
            if(data === null || typeof data === 'undefined') {
                data = { };
                context.data(dataKey, data);
            }
            return data;
        },
        highlight = function(context, url) {
            var data = getContextData(context);
            // avoid re-highlighting already-highlighted range
            var position = context.val().indexOf(url);
            if(position >= 0 && typeof data.lastRange === 'undefined' || data.lastRange.start !== position || data.lastRange.stop !== (position + url.length)) {
                data.lastRange = { start: position, stop: position + url.length };
                context.clearHighlights(context.highlighClassName);
                context.addHighlight({
                    start: position,
                    stop: position + url.length,
                    className: context.highlighClassName
                });
                context.renderHighlights();
            }
        };

    // url highlight composer plugin
    var urlHighlightComposer = (function(){

        var api = {
            init: function(context) {
                context.highlighClassName = context.highlighClassName || api.defaults.highlighClassName;
            },
            onTransform: function(context) {
                var url = findFirstUrlInText(context.val());
                if(url !== null) {
                    highlight(context, url);
                } else {
                    context.clearHighlights(context.highlighClassName);
                }
            },
            shouldActivate: function(context) {
                return false;
            },
            val: function(value, context) {
                return value;
            },
            onkeydown: function(context, e) {
                return true;
            },
            oninput: function(context, e) {
                return true;
            }
        };
        api.defaults = {
            highlighClassName: 'composer-url-highlight',
            loadingText: '...'
        };

        return api;
    }());

    $.fn.evolutionComposer.plugins.urlhighlight = urlHighlightComposer;

    return {}
}, jQuery, window);
 
 
// Stub module which does nothing but require module-wrapped jQuery event modules
// so that they can all be inited just by requiring this module
define('events', [
	'events.gestures',
	'events.hashchange',
	'events.notifications',
	'events.pointers',
	'events.scroll',
	'events.textinput',
	'events.resized'
], function(){
	return {};
}); 
 
/*
 * Gesture Events
 *   Internally-defined API, but events exposed publicly as jQuery special events
 *   Elements with handled gesture events automaticallly prevent actions on 'click'
 *
 *   Tap
 *     Events:
 *	     tap
 *       taphold
 *       doubletap
 *     Data:
 *       pointers
 *       originalEvent
 *       duration
 *
 *   Swipe
 *     Events
 *       swipe
 *       swipeup
 *       swipedown
 *       swiperight
 *       swipeleft
 *     Data:
 *       pointers
 *       originalEvent
 *       duration
 *       angle
 *       direction
 *       pageX
 *       pageY
 *
 *   Pan
 *     Events
 *       panstart
 *       pan
 *       panend
 *     Data:
 *       pointers
 *       originalEvent
 *       angle
 *       direction
 *       pageX
 *       pageY
 *
 *   Orientation
 *     Events:
 *       orientationchange
 *
 *   Settings:
 *     $.gestures.defaults:
 *        tapHoldDuration: 400
 *        tapHoldMaxDistance: 1
 *        tapMaxDuration: 250
 *        tapMaxDistance: 10
 *        swipeMinVelocity: 0.7
 *        panMinDistance: 10
 *        doubleTapMaxDuration: 250
 */

/// @name tap
/// @category jQuery Event
/// @description Raised when after a completed, brief, cycle of [pointerstart](@pointerstart) and [pointerend](@pointerend)
///
/// ### jQuery.event.special.tap
///
/// Event raised when after a complete cycle of [pointerstart](@pointerstart) and [pointerend](@pointerend) which completes in under 250 ms and moves no more than 10 pixels.
///
/// Bubbles and can be delegated against.
///
/// ### Usage
///
///     $(element).bind('tap', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///  * `originalEvent`: Native event object which was re-interpreted as a `tap`
///  * `duration`: duration of the tap
///

/// @name taphold
/// @category jQuery Event
/// @description Raised when an element is tapped and not released
///
/// ### jQuery.event.special.taphold
///
/// Event raised when an element is tapped and not released for over 400ms and not moved over 1 pixel.
///
/// Bubbles and can be delegated against.
///
/// ### Usage
///
///     $(element).bind('taphold', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///  * `originalEvent`: Native event object which was re-interpreted as a `tap`
///  * `duration`: duration of the tap
///

/// @name doubletap
/// @category jQuery Event
/// @description Raised on a second tap
///
/// ### jQuery.event.special.doubletap
///
/// Event raised when a second [tap](@tap) occurs within 250 ms of a previous tap.
///
/// Bubbles and can be delegated against.
///
/// ### Usage
///
///     $(element).bind('doubletap', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///  * `originalEvent`: Native event object which was re-interpreted as a `tap`
///  * `duration`: duration of the tap
///

/// @name swipe
/// @category jQuery Event
/// @description Raised after a pointer release which was moved a minimum velocity
///
/// ### jQuery.event.special.swipe
///
/// Event raised after a complete cycle of `[pointerstart](@pointerstart)`, `[pointermove](@pointermove)`, and `[pointerend](@pointerend)` in which the velocity (distance of movement / duration between start and end) is greater than a minimum. Useful as a shortcut for an action, though panning can be a better option for realtime, tracked, movement of a touched element.
///
/// Bubbles and can be delegated against.
///
/// ### Usage
///
///     $(element).bind('swipe', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///  * `originalEvent`: Native event object
///  * `duration`: duration of the gesture
///  * `angle`: angle, in degrees, of the swipe from start to finish
///  * `direction`: general direction of the swipe, based on the angle. 'up', 'down', 'right', or 'left'
///  * `pageX`: x position at `[pointerend](@pointerend)`
///  * `pageY`: y position at `[pointerend](@pointerend)`
///

/// @name swipeleft
/// @category jQuery Event
/// @description Raised after a pointer release which was moved a minimum velocity in a left direction
///
/// ### jQuery.event.special.swipeleft
///
/// Event raised after a complete cycle of `[pointerstart](@pointerstart)`, `[pointermove](@pointermove)`, and `[pointerend](@pointerend)` in which the velocity (distance of movement / duration between start and end) is greater than a minimum and the angle of the gesture was > 135 degrees and <= 225 degrees.
///
/// This is a shortcut event which is raised after the generic `[swipe](@swipe)` event that also includes the `direction`.
///
/// Useful as a shortcut for an action, though panning can be a better option for realtime, tracked, movement of a touched element.
///
/// Bubbles and can be delegated against.
///
/// ### Usage
///
///     $(element).bind('swipeleft', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///  * `originalEvent`: Native event object
///  * `duration`: duration of the gesture
///  * `angle`: angle, in degrees, of the swipe from start to finish
///  * `direction`: general direction of the swipe, based on the angle. 'up', 'down', 'right', or 'left'
///  * `pageX`: x position at `[pointerend](@pointerend)`
///  * `pageY`: y position at `[pointerend](@pointerend)`
///

/// @name swiperight
/// @category jQuery Event
/// @description Raised after a pointer release which was moved a minimum velocity in a right direction
///
/// ### jQuery.event.special.swiperight
///
/// Event raised after a complete cycle of `[pointerstart](@pointerstart)`, `[pointermove](@pointermove)`, and `[pointerend](@pointerend)` in which the velocity (distance of movement / duration between start and end) is greater than a minimum and the angle of the gesture was > 315 degrees or <= 45 degrees.
///
/// This is a shortcut event which is raised after the generic `[swipe](@swipe)` event that also includes the `direction`.
///
/// Useful as a shortcut for an action, though panning can be a better option for realtime, tracked, movement of a touched element.
///
/// Bubbles and can be delegated against.
///
/// ### Usage
///
///     $(element).bind('swiperight', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///  * `originalEvent`: Native event object
///  * `duration`: duration of the gesture
///  * `angle`: angle, in degrees, of the swipe from start to finish
///  * `direction`: general direction of the swipe, based on the angle. 'up', 'down', 'right', or 'left'
///  * `pageX`: x position at `[pointerend](@pointerend)`
///  * `pageY`: y position at `[pointerend](@pointerend)`
///

/// @name swipeup
/// @category jQuery Event
/// @description Raised after a pointer release which was moved a minimum velocity in an up direction
///
/// ### jQuery.event.special.swipeup
///
/// Event raised after a complete cycle of `[pointerstart](@pointerstart)`, `[pointermove](@pointermove)`, and `[pointerend](@pointerend)` in which the velocity (distance of movement / duration between start and end) is greater than a minimum and the angle of the gesture was > 45 degrees and <= 135 degrees.
///
/// This is a shortcut event which is raised after the generic `[swipe](@swipe)` event that also includes the `direction`.
///
/// Useful as a shortcut for an action, though panning can be a better option for realtime, tracked, movement of a touched element.
///
/// Bubbles and can be delegated against.
///
/// ### Usage
///
///     $(element).bind('swipeup', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///  * `originalEvent`: Native event object
///  * `duration`: duration of the gesture
///  * `angle`: angle, in degrees, of the swipe from start to finish
///  * `direction`: general direction of the swipe, based on the angle. 'up', 'down', 'right', or 'left'
///  * `pageX`: x position at `[pointerend](@pointerend)`
///  * `pageY`: y position at `[pointerend](@pointerend)`
///

/// @name swipedown
/// @category jQuery Event
/// @description Raised after a pointer release which was moved a minimum velocity in a down direction
///
/// ### jQuery.event.special.swipedown
///
/// Event raised after a complete cycle of `[pointerstart](@pointerstart)`, `[pointermove](@pointermove)`, and `[pointerend](@pointerend)` in which the velocity (distance of movement / duration between start and end) is greater than a minimum and the angle of the gesture was > 225 degrees and <= 315 degrees.
///
/// This is a shortcut event which is raised after the generic `[swipe](@swipe)` event that also includes the `direction`.
///
/// Useful as a shortcut for an action, though panning can be a better option for realtime, tracked, movement of a touched element.
///
/// Bubbles and can be delegated against.
///
/// ### Usage
///
///     $(element).bind('swipedown', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///  * `originalEvent`: Native event object
///  * `duration`: duration of the gesture
///  * `angle`: angle, in degrees, of the swipe from start to finish
///  * `direction`: general direction of the swipe, based on the angle. 'up', 'down', 'right', or 'left'
///  * `pageX`: x position at `[pointerend](@pointerend)`
///  * `pageY`: y position at `[pointerend](@pointerend)`
///

/// @name panstart
/// @category jQuery Event
/// @description Raised once when a pointer is moved a minimum
///
/// ### jQuery.event.special.panstart
///
/// Event raised once when a pointer is being moved (on `[pointermove](@pointermove)`) after a minimum distance from its original position at `[pointerstart](@pointerstart)`.
///
/// Useful as a way to move an element in realtime tracked against a touch. The current `pageX` and `pageY` position on `pan` events can be compared against the position at `panstart` to determine an offset to move the panned element.
///
/// ### Usage
///
///     $(element).bind('panstart', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///  * `originalEvent`: Native event object
///  * `duration`: duration of the gesture
///  * `angle`: angle, in degrees, of the pan from start to finish
///  * `direction`: general direction of the pan, based on the angle. 'up', 'down', 'right', or 'left'
///  * `pageX`: x position
///  * `pageY`: y position
///

/// @name pan
/// @category jQuery Event
/// @description Raised while a pointer is being moved past a minimum
///
/// ### jQuery.event.special.pan
///
/// Event raised repeatedly while a pointer is being moved (on `[pointermove](@pointermove)`) after a minimum distance from its original position at `[pointerstart](@pointerstart)`.
///
/// Useful as a way to move an element in realtime tracked against a touch. The current `pageX` and `pageY` position on `pan` events can be compared against the position at `panstart` to determine an offset to move the panned element.
///
/// ### Usage
///
///     $(element).bind('pan', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///  * `originalEvent`: Native event object
///  * `duration`: duration of the gesture
///  * `angle`: angle, in degrees, of the pan from start to finish
///  * `direction`: general direction of the pan, based on the angle. 'up', 'down', 'right', or 'left'
///  * `pageX`: x position
///  * `pageY`: y position
///

/// @name panend
/// @category jQuery Event
/// @description Raised when a pointer is releaed after a pan
///
/// ### jQuery.event.special.panend
///
/// Event raised once when a pointer is released (on `[pointerend](@pointerend)`) after the pointer has already been raising `[pan](@pan)` events.
///
/// ### Usage
///
///     $(element).bind('panend', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///  * `originalEvent`: Native event object
///  * `duration`: duration of the gesture
///  * `angle`: angle, in degrees, of the pan from start to finish
///  * `direction`: general direction of the pan, based on the angle. 'up', 'down', 'right', or 'left'
///  * `pageX`: x position
///  * `pageY`: y position
///

define('events.gestures', ['events.pointers'], function(pointers, $, global) {

	var dataKey = '._gesture_events_bound',
		nameSpace = '._gesture_events_namespace',
		undef,
		events = {
			tap: 'tap',
			taphold: 'taphold',
			doubleTap: 'doubletap',
			swipe: 'swipe',
			swipeUp: 'swipeup',
			swipeDown: 'swipedown',
			swipeRight: 'swiperight',
			swipeLeft: 'swipeleft',
			panStart: 'panstart',
			pan: 'pan',
			panEnd: 'panend'
		},
		orientationChange = 'orientationchange',
		defaults = {
			tapHoldDuration: 400,
			tapHoldMaxDistance: 1,
			tapMaxDuration: 350,
			tapMaxDistance: 10,
			swipeMinVelocity: 0.5,
			panMinDistance: 10,
			doubleTapMaxDuration: 250
		},
		pointerEvents = {
			start: 'pointerstart',
			move: 'pointermove',
			end: 'pointerend'
		};

	function getDistance(x0, y0, x1, y1) {
		return Math.abs(Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)));
	}

	function getDuration(startTime) {
		return ((new Date).getTime() - startTime);
	}

	function getVelocity(distance, duration) {
		return distance / duration;
	}

	function getAngle(x0, y0, x1, y1) {
		var dx = x1 - x0,
			dy = y0 - y1;
		var angle = Math.atan2(dy, dx) * 180 / Math.PI;
		if(angle < 0) {
			angle += 360;
		}
		return angle;
	}

	function getDirection(angle) {
		if(angle > 315 || angle <= 45)
			return 'right';
		if(angle > 45 && angle <= 135)
			return 'up';
		if(angle > 135 && angle <= 225)
			return 'left';
		if(angle > 225 && angle <= 315)
			return 'down';
	}

	function doOnlyIfBoundOrDelegated(handle, e, fn) {
		if(handle.selector) {
			var targ = $(e.originalEvent.target);
			if(targ.is(handle.selector) || targ.closest(handle.selector).length > 0) {
				return fn.call(this, e);
			}
		} else {
			return fn.call(this, e);
		}
	}

	function trigger(originalEvent, elm, data, bubble) {
		data.target = originalEvent.target;
		if(bubble)
			elm.trigger(data);
		else if(elm)
			elm.triggerHandler(data);
		return originalEvent.cancelBubble == undef ? true : originalEvent.cancelBubble;
	}

	function bindEvents(elm, handle) {
		var state;
		elm.on(pointerEvents.start + nameSpace, function(e) {
			return doOnlyIfBoundOrDelegated(handle, e, function(){
				if(state)
					global.clearTimeout(state.tapHoldDurationout);

				state = {
					startTime: (new Date).getTime(),
					startPageX: (e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageX : 0,
					startPageY: (e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageY : 0,
					held: false,
					tapHoldDurationout: null,
					lastTap: state ? state.lastTap : 0
				};

				state.tapHoldDurationout = global.setTimeout(function(){
					state.held = true;
					trigger(e, elm, {
						type: events.taphold,
						pointers: e.pointers,
						originalEvent: e,
						duration: getDuration(state.startTime)
					});
				}, defaults.tapHoldDuration);
			});
		});
		elm.on(pointerEvents.move + nameSpace, function(e) {
			return doOnlyIfBoundOrDelegated(handle, e, function(){
				var distance = getDistance(state.startPageX, state.startPageY,
					(e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageX : 0,
					(e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageY : 0);

				if(state.tapHoldDurationout && distance >= defaults.tapHoldMaxDistance)
					global.clearTimeout(state.tapHoldDurationout);

				if(state.panning ||
					(e && e.pointers && e.pointers.length === 1 &&
					 distance > defaults.panMinDistance))
				{
					var angle = getAngle(state.startPageX, state.startPageY,
							(e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageX : 0,
							(e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageY : 0),
						direction = getDirection(angle);

					var eventData = {
						type: events.panStart,
						pointers: e ? e.pointers : [],
						originalEvent: e,
						angle: angle,
						direction: direction,
						pageX: (e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageX : 0,
						pageY: (e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageY : 0
					};

					if(!state.panning) {
						state.panning = true;
						trigger(e, elm, eventData, true);
					}

					eventData.type = events.pan;
					trigger(e, elm, eventData, true);
				}
			});
		});
		elm.on(pointerEvents.end + nameSpace, function(e) {
			return doOnlyIfBoundOrDelegated(handle, e, function(){
				if(state)
					global.clearTimeout(state.tapHoldDurationout);

				var duration = getDuration(state.startTime),
					distance = getDistance(state.startPageX, state.startPageY,
						(e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageX : 0,
						(e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageY : 0);

				if(!state.held &&
					duration <= defaults.tapMaxDuration &&
					distance <= defaults.tapMaxDistance)
				{
					var tapEventData = {
						type: events.tap,
						pointers: e ? e.pointers : [],
						originalEvent: e,
						duration: duration
					};
					trigger(e, elm, tapEventData);
					var now = (new Date().getTime());
					if(state.lastTap && (now - state.lastTap) <= defaults.doubleTapMaxDuration) {
						tapEventData.type = events.doubleTap;
						trigger(e, elm, tapEventData);
						state.lastTap = 0;
					} else {
						state.lastTap = now;
					}
					return;
				}

				if(state.panning) {
					trigger(e, elm, {
						type: events.panEnd,
						pointers: e ? e.pointers : [],
						originalEvent: e,
						pageX: (e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageX : 0,
						pageY: (e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageY : 0
					}, true);
				}

				var velocity = getVelocity(distance, duration);
				if(e && e.pointers && e.pointers.length === 1 &&
					velocity >= defaults.swipeMinVelocity)
				{
					var angle = getAngle(state.startPageX, state.startPageY,
						(e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageX : 0,
						(e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageY : 0),
						direction = getDirection(angle);

					var triggerData = {
						type: events.swipe,
						pointers: e ? e.pointers : [],
						originalEvent: e,
						duration: duration,
						angle: angle,
						direction: direction,
						pageX: (e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageX : 0,
						pageY: (e && e.pointers && e.pointers.length >= 1) ? e.pointers[0].pageY : 0
					};
					trigger(e, elm, triggerData, true);

					triggerData.type = triggerData.type + direction;
					trigger(e, elm, triggerData, true);
					return;
				}

				state = {};
			});
		});
	}

	function unbindEvents(elm, handle) {
		elm.off(nameSpace);
	}

	// shim 'orientationchange' in browsers that only have 'resize'
	if(window.onorientationchange === undef) {
		$.event.special[orientationChange] = {
			setup: function() {
				var win = $(window),
					bounceTimer,
					triggerChange = function(){
						win.trigger(orientationChange);
					};
				window.addEventListener('resize', function(e) {
					// debounce resize events - only trigger on the last one
					global.clearTimeout(bounceTimer);
					bounceTimer = global.setTimeout(triggerChange, 100);
				}, false);
			}
		}
	};

	var unselectableTapHoldStyle = {
		'-webkit-touch-callout': 'none',
		'-webkit-user-select': 'none',
		'-khtml-user-select': 'none',
		'-moz-user-select': 'none',
		'-ms-user-select': 'none',
		'user-select': 'none',
		'-webkit-tap-highlight-color': 'rgba(0,0,0,0)'
	};

	$.each(events, function(name) {
		$.event.special[name] = {
			add: function(handleObj) {
				var elm = $(this);
				if(name === events.taphold)
					elm.css(unselectableTapHoldStyle);
				if(elm.data(dataKey))
					return;
				elm.data(dataKey, true);
				// if taphold, make the element unselectable
				bindEvents(elm, handleObj);
			},
			remove: function(handleObj) {
				var elm = $(this);
				unbindEvents(elm, handleObj);
				elm.removeData(dataKey);
			}
		};
	});

	$.gestures = {
		defaults: defaults
	};

	return {};

}, jQuery, window); 
 
/// @name hashchange
/// @category jQuery Event
/// @description Raised on changes to the URL hash
///
/// ### jQuery.event.special.hashchange
///
/// Shims the `hashchange` to be available for binding in all browsers via jQuery, whether or not the browser provides it natively. Event is raised whenever the hashdata in the URL changes.
///
/// This is commonly useful for supporting deep linking and back buttons while retaining a dynamic UI in conjunction with the methods provided by the [url module](@url).
///
/// Used by [ajax paging](@evolutionPager), and many Evolution widgets.
///
/// ### Usage
///
///     $(window).bind('hashchange', function(){
///         // handle event...
///     });
///
define('events.hashchange', function($, global) {

	var nativelySupportsHashChange = ('onhashchange' in global) && (document.documentMode === undefined || document.documentMode > 7),
		lastHash = global.location.href,
		globalSelection = $(global),
		hashChangeInterval;
	if(!nativelySupportsHashChange) {
		$.event.special.hashchange = {
			setup: function () {
				if(!hashChangeInterval) {
					hashChangeInterval = setInterval(function(){
						if(global.location.href !== lastHash) {
							lastHash = global.location.href;
							globalSelection.trigger('hashchange');
						}
					}, $.hashChangeSettings.interval);
				}
			}
		};
	}
	$.hashChangeSettings = {
		interval: 10
	};

	return {};

}, jQuery, window);

 
 
define('events.textinput', function($, global, undef){

	var nativeInputEventName = 'input';
	var onInputSupported = !$.browser.msie && (('on'+nativeInputEventName) in document.createElement('input')) && (('on'+nativeInputEventName) in document.createElement('textarea'));

	$.event.special['textinput'] = {
		setup: function() {
			var elm = $(this);
			if(onInputSupported) {
				elm.bind('input', function(e){
					elm.trigger('textinput', { which: e.which });
				});
			} else {
				var currentValue;
				elm.bind({
					keydown: function(e) {
						currentValue =	elm.val();
					},
					keyup: function(e) {
						var newValue = elm.val();
						if(newValue !== currentValue) {
							elm.trigger('textinput', { which: e.which })
						}
						currentValue = newValue;
					}
				});
			}
		}
	}

	return {};

}, jQuery, window); 
 
/// @name notification.raised
/// @category Client Message
/// @description Raised when a notification is received via a live alert

/// ### notification.raised Client Message
///
/// [Client-side message](@messaging) raised when a notification is received via a live alert. Only raised when the Socket Notification (Live Alert) Distribution Type
/// plugin is enabled, and only received when a recipient has enabled the notification type and the live alert distribution type for the given notification type id. Powers live alert messages.
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('notification.raised', function(data) {
///         // handle the event
///     });
///
/// ### Data
///
///  * `id`: id of the notification
///  * `contentId`: related content id string
///  * `contentTypeId`: related content type id string
///  * `typeId`: notification type id string
///  * `contentUrl`: url of the related content
///  * `message`: short, displayable message regarding the notification
///  * `avatarUrl`: url of actor who triggered the notification
///
define('events.notifications', ['module.messaging'], function(messaging, $, global) {

    $.telligent.evolution.messaging.subscribe('socket.connected', function() {
        $.telligent.evolution.sockets.notifications.on('received', function(notification){
            $.telligent.evolution.messaging.publish('notification.raised', notification);
        });
    });

	return {};

}, jQuery, window);
 
 
/*
 * Normalizes pointer events across Mobile WebKit (touch*), Windows Mobile (mspointer*), and desktop (mouse*)
 * Internally-defined API, but events exposed publicly as jQuery special events
 *
 *   Events:
 *     pointerstart
 *     pointermove
 *     pointerend
 *   Data:
 *     originalEvent - source event
 *     pointers - array of Pointer objects, each with pageX, pageY
 *     target
 *   Settings:
 *     $.pointer.defaults
 *         pointerMoveThrottle: 10
 *
 *   Notes:
 *     * Only triggers pointermove events after pointerstart and before pointerend
 *     * pointermove events are throttled
 */

/// @name pointerstart
/// @category jQuery Event
/// @description Raised when pointing or touching begins
///
/// ### jQuery.event.special.pointerstart
///
/// Cross-platform event raised when pointing/touching has begun. Supported on Android, iOS, Windows Phone, and desktop browsers (via mouse events).
///
/// Bubbles and can be delegated against.
///
/// `pointerstart` is a low-level event consumed by higher-level gesture events. If attempting handle a user's tap, it's almost always better to handle the explicit [tap](@tap) gesture event in the same way that it's typically better to handle the `click` event instead of `mousedown` on the desktop.
///
/// ### Usage
///
///     $(element).bind('pointerstart', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `originalEvent`: Native event object which was re-interpreted as a `pointerstart`. (`mousedown`, `touchstart`, or `mspointerstart`)
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///

/// @name pointerend
/// @category jQuery Event
/// @description Raised when pointing or touching ends
///
/// ### jQuery.event.special.pointerend
///
/// Cross-platform event raised when pointing/touching has ended. Supported on Android, iOS, Windows Phone, and desktop browsers (via mouse events).
///
/// Bubbles and can be delegated against.
///
/// `pointerend` is a low-level event consumed by higher-level gesture events. If attempting handle a user's tap, it's almost always better to handle the explicit [tap](@tap) gesture event in the same way that it's typically better to handle the `click` event instead of `mouseup` on the desktop.
///
/// ### Usage
///
///     $(element).bind('pointerend', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `originalEvent`: Native event object which was re-interpreted as a `pointerend`. (`mouseup`, `touchend`, or `mspointerend`)
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///

/// @name pointermove
/// @category jQuery Event
/// @description Raised when pointing or touching moves
///
/// ### jQuery.event.special.pointermove
///
/// Cross-platform event raised when an existing point/touch has moved. Supported on Android, iOS, Windows Phone, and desktop browsers (via mouse events).
///
/// Bubbles and can be delegated against.
///
/// `pointermove` is a low-level event consumed by higher-level gesture events. If attempting handle a user's movement, it's almost always better to handle the explicit [swipe](@swipe) or [pan](@pan) gesture events.
///
/// ### Usage
///
///     $(element).bind('pointermove', function(e){
///         // handle event...
///     });
///
/// ### Data on the event
///
///  * `originalEvent`: Native event object which was re-interpreted as a `pointermove`. (`mousemove`, `touchmove`, or `mspointermove`)
///  * `pointers`: array of Pointer objects, each with`pageX` and `pageY` properties
///
define('events.pointers', ['lib.util'], function(util, $, global, undef){

	var dataKey = '._pointer_events_bound',
		nameSpace = '._pointer_events_namespace',
		events = {
			start: 'pointerstart',
			move: 'pointermove',
			end: 'pointerend'
		},
		defaults = {
			pointerMoveThrottle: 10
		};

	function Pointer(pageX, pageY) {
		this.pageX = pageX;
		this.pageY = pageY;
	}

	function convertMousePointers(evt) {
		return [ new Pointer(evt.pageX, evt.pageY) ];
	}

	function convertTouches(nativeTouches) {
		if(!nativeTouches || !nativeTouches.length)
			return [];
		var touches = [];
		for(var i = 0; i < nativeTouches.length; i++) {
			touches[touches.length] = new Pointer(nativeTouches[i].pageX, nativeTouches[i].pageY)
		}
		return touches;
	}

	function convertMsPointers(evt) {
		return [ new Pointer(evt.originalEvent.pageX, evt.originalEvent.pageY) ];
	}

	function trigger(elm, type, pointers, originalEvent) {
		if(elm && elm.length) {
			elm.triggerHandler({
				type: type,
				pointers: pointers,
				originalEvent: originalEvent,
				target: originalEvent.target
			});
		}
	}

	function doOnlyIfBoundOrDelegated(handle, e, fn) {
		if(handle.selector) {
			var targ = $(e.originalEvent.target);
			if(targ.is(handle.selector) || targ.closest(handle.selector).length > 0) {
				return fn.call(this, e);
			}
		} else {
			fn.call(this, e);
		}
	}

	var platforms = [{
		// Windows (MSPointer*)
			test: function() {
				return ('onmspointerdown' in window);
			},
			add: function(elm, handle) {
				var active = false;
				elm.on('MSPointerDown' + nameSpace, function(e){
					doOnlyIfBoundOrDelegated(handle, e, function(){
						trigger(elm, events.start, convertMsPointers(e), e);
						active = true;
					});
				});
				elm.on('MSPointerMove' + nameSpace, util.throttle(function(e){
					doOnlyIfBoundOrDelegated(handle, e, function(){
						if(active)
							trigger(elm, events.move, convertMsPointers(e), e);
					});
				}, defaults.pointerMoveThrottle));
				elm.on('MSPointerUp' + nameSpace, function(e){
					doOnlyIfBoundOrDelegated(handle, e, function(){
						active = false;
						trigger(elm, events.end, convertMsPointers(e), e);
					});
				});
				elm.on('MSPointerCancel' + nameSpace, function(e){
					doOnlyIfBoundOrDelegated(handle, e, function(){
						active = false;
						trigger(elm, events.end, convertMsPointers(e), e);
					})
				});
			},
			remove: function(elm) {
				elm.off(nameSpace);
			}
		},{
		// Mobile WebKit (touch*)
			test: function() {
				return ('ontouchstart' in window);
			},
			add: function(elm, handle) {
				var active = false;
				elm.on('touchstart' + nameSpace, function(e){
					doOnlyIfBoundOrDelegated(handle, e, function(){
						trigger(elm, events.start, convertTouches(e.originalEvent.touches), e);
						active = true;
					});
				});
				elm.on('touchmove' + nameSpace, util.throttle(function(e){
					doOnlyIfBoundOrDelegated(handle, e, function(){
						if(active) {
							trigger(elm, events.move, convertTouches(e.originalEvent.touches), e);
						}
					});
				}, defaults.pointerMoveThrottle));
				elm.on('touchend' + nameSpace, function(e){
					doOnlyIfBoundOrDelegated(handle, e, function(){
						active = false;
						trigger(elm, events.end, convertTouches(e.originalEvent.changedTouches), e);
					});
				});
				elm.on('touchcancel' + nameSpace, function(e){
					doOnlyIfBoundOrDelegated(handle, e, function(){
						active = false;
						trigger(elm, events.end, convertTouches(e.originalEvent.changedTouches), e);
					});
				});
			},
			remove: function(elm) {
				elm.off(nameSpace);
			}
		},{
		// Desktop (mouse*)
			test: function() {
				return ('onmousedown' in window);
			},
			add: function(elm, handle) {
				var active = false;
				elm.on('mousedown' + nameSpace, function(e){
					doOnlyIfBoundOrDelegated(handle, e, function(){
						trigger(elm, events.start, convertMousePointers(e), e);
						active = true;
					})
				});
				elm.on('mousemove' + nameSpace, util.throttle(function(e){
					doOnlyIfBoundOrDelegated(handle, e, function(){
						if(active)
							trigger(elm, events.move, convertMousePointers(e), e);
					});
				}, defaults.pointerMoveThrottle));
				elm.on('mouseup' + nameSpace, function(e){
					doOnlyIfBoundOrDelegated(handle, e, function(){
						active = false;
						trigger(elm, events.end, convertMousePointers(e), e);
					});
				});
				elm.on('mouseleave' + nameSpace, function(e){
					doOnlyIfBoundOrDelegated(handle, e, function(){
						if(active) {
							trigger(elm, events.end, convertMousePointers(e), e);
						}
						active = false;
					});
				})
			},
			remove: function(elm) {
				elm.off(nameSpace);
			}
		}
	];

	var platform;
	for(var i = 0; i < platforms.length; i++) {
		if(!platform && platforms[i].test())
			platform = platforms[i];
	}

	if(!platform)
		return;

	for(var key in events) {
		var name = events[key];
		$.event.special[name] = {
			add: function(handleObj) {
				var elm = $(this);
				if(elm.data(dataKey))
					return;
				elm.data(dataKey, true);
				platform.add(elm, handleObj);
			},
			remove: function(handleObj) {
				var elm = $(this);
				platform.remove(elm);
				elm.removeData(dataKey);
			}
		};
	};

	$.pointer = {
		defaults: defaults
	};

	return {};

}, jQuery, window);
 
 
/// @name resized
/// @category jQuery Event
/// @description Throttled window resize event, raised after resizing has completed
///
/// ### jQuery.event.special.resized
///
/// Throttled window resize event, raised after resizing has completed
///
/// ### Usage
///
///     $(window).on('resized', function(e){
///         // handle event...
///     });
///
define('events.resized', function($, global, undef){

	$.event.special.resized = {
		setup: function(data) {
			var win = $(window),
				resizeTimeout;

			function raiseResize() {
				win.trigger('resized');
			}

			function handleResize() {
				global.clearTimeout(resizeTimeout);
				resizeTimeout = global.setTimeout(raiseResize,
					$.event.special.resized.defaults.throttle);
			}

			win.on('resize', handleResize);
		}
	}
	$.event.special.resized.defaults = {
		throttle: 150
	};

	return {};

}, jQuery, window);
 
 
/// @name scrollend
/// @category jQuery Event
/// @description Raised when scrolling near the end of a container
///
/// ### jQuery.event.special.scrollend
///
/// The scrollend event is raised when scrolling near the end of the window or scrollable container element.
///
/// This is commonly useful for enabling endless scrolling interfaces.
///
/// ### Usage
///
///     // handle the 'scrollend' event on an entire document
///     $(document).on('scrollend', function() {
///         // handle event
///     });
///
///     // handle the 'scrollend' event of a vertically-overflowing div
///     $('#SomeOverflowingDiv').on('scrollend', function() {
///         // handle event
///     });
///
///     // handle the 'scrollend' event on an entire document with custom parameters
///     $(document).on('scrollend', {
/// 	        padding: 150,  // distance from the end at which 'scrollend' is raised
/// 	        delay: 150     // frequency to check scroll position during a scroll
///         },
///         function() {
///             // handle event
///         });
///
/// **Tip:** When performing an asynchronous request on a `scrolltop` or `scrollend` event, a flag should be set to block subsequent requests until the current request is complete.

/// @name scrolltop
/// @category jQuery Event
/// @description Raised when scrolling near the top of a container
///
/// ### jQuery.event.special.scrolltop
///
/// The scrolltop event is raised when scrolling near the top of the window or scrollable container element.
///
/// This is commonly useful for enabling endless scrolling interfaces.
///
/// ### Usage
///
///     // handle the 'scrolltop' event on an entire document
///     $(document).on('scrolltop', function() {
///         // handle event
///     });
///
///     // handle the 'scrolltop' event of a vertically-overflowing div
///     $('#SomeOverflowingDiv').on('scrollend', function() {
///         // handle event
///     });
///
///     // handle the 'scrolltop' event on an entire document with custom parameters
///     $(document).on('scrolltop', {
/// 	        padding: 150,  // distance from the top at which 'scrolltop' is raised
/// 	        delay: 150     // frequency to check scroll position during a scroll
///         },
///         function() {
///             // handle event
///         });
///
/// **Tip:** When performing an asynchronous request on a `scrolltop` or `scrollend` event, a flag should be set to block subsequent requests until the current request is complete.
define('events.scroll', function($, global) {

    (function(){

        var settings = {},
            initDataKey = '_scrollend_init';

        $.event.special.scrollend = {
            setup: function (options) {
                settings = $.extend({
                    padding: 150,
                    delay: 250
                }, options);
            },
            add: function() {
                var self = $(this);
                if(self.data(initDataKey)) {
                    return;
                }

                self.data(initDataKey, true);

                var isWindow = this === document,
                    scrollable = isWindow ? $(window) : self,
                    didScroll = false,
                    reachedEnd = function() {
                        if(isWindow) {
                            return ($(self).height() - $(self).scrollTop() - $(scrollable).height()) <= settings.padding;
                        } else {
                            return ((self.scrollTop() + self.innerHeight() + settings.padding) >= self[0].scrollHeight);
                        }
                    };

                scrollable.on('scroll', function(){
                    didScroll = true;
                });

                setInterval(function() {
                    if(didScroll) {
                        if(reachedEnd()) {
                            self.trigger('scrollend');
                        }
                        didScroll = false;
                    }
                }, settings.delay);
            }
        };
    })();

    (function(){

        var settings = {},
            initDataKey = '_scrolltop_init';

        $.event.special.scrolltop = {
            setup: function (options) {
                settings = $.extend({
                    padding: 150,
                    delay: 250
                }, options);
            },
            add: function() {
                var self = $(this);
                if(self.data(initDataKey)) {
                    return;
                }

                self.data(initDataKey, true);

                var isWindow = this === document,
                    scrollable = isWindow ? $(window) : self,
                    didScroll = false,
                    reachedTop = function() {
                        return (self.scrollTop() <= settings.padding);
                    };

                scrollable.on('scroll', function(){
                    didScroll = true;
                });

                setInterval(function() {
                    if(didScroll) {
                        if(reachedTop()) {
                            self.trigger('scrolltop');
                        }
                        didScroll = false;
                    }
                }, settings.delay);
            }
        };

    })();

    return {};

}, jQuery, window);
 
 
// Stub module which does nothing but require module-wrapped libraries
// so that they can all be inited just by requiring this module
define('lib', [
	'lib.actionSheet',
	'lib.dynamicLinks',
	'lib.messageLinks',
	'lib.scrollFix',
	'lib.sheet',
	'lib.sheetProvider',
	'lib.util',
	'lib.touchEventAdapter'
], function(){
	return {};
}); 
 
/*
 * ActionSheet
 * Private API
 *
 * Higher level abstraction of using the Sheet. Designed specifically to render a list of links
 *
 * var actionSheet = new ActionSheet(options)
 *   sheet: Sheet instance
 *
 * actionSheet.show(options)
 *   options:
 *     links: array of elements to render
 */
define('lib.actionSheet', function($, global, undef) {

    function addLink(list, link) {
        var listItem = $(document.createElement('li'));
        listItem.append(link);
        list.append(listItem);
    }

    function show(context, links) {
        // build a UL of links
        var list = $(document.createElement('ul'));
        list.addClass('action-sheet');

        for(var i = 0; i < links.length; i++) {
            addLink(list, links[i]);
        }
        // show the UL in a sheet
        context.sheet.show(list);
    }

    function hide(context) {
        context.sheet.hide();
    }

    var ActionSheet = function(context) {

        context = context || {};
        context.sheet = context.sheet;

        return {
            show: function(options) {
                options = options || {};
                options.links = options.links || [];
                show(context, options.links || []);
            },
            hide: function() {
                hide(context);
            }
        }
    };
    return ActionSheet;

}, jQuery, window); 
 
/*
 * DynamicLinks
 * Internal API
 *
 * Accepts a set of links within a container with given boundaries
 * and decides to render them as a slider (tray) or to expand them with a 'more' link
 *
 * Not exposed publicly, but used as the implementation for the ui-links UI Component
 *
 * var dynamicLinks = new DynamicLinks(options)
 *
 * options:
 *   minLinks: 50  // minimum required to be visible (will make it scrollable to that limit)
 *   maxLinks: 50  // maximum before it shows a show-more link
 *   direction: 'vertical' | 'horizontal'  defaults to vertical
 *   parent: parent container element
 *   links: array of link objects
 *   moreLink: link object
 *   cancelLink: link object
 *   onShowMore: function passed links to render and cancelLink
 *
 * Link object:
 *   className: class to apply to rendered wrapper li
 *   element: jQuery selection of an a element
 *   selected: true/false whether or not this should be considered 'selected'
 *
 * methods:
 *   render()  // renders the links, can be called to re-render them upon continaer/links change
 *   addLink(link, atIndex) // adds a link and re-renders. atIndex allows insertion. Otherwise adds to the end.
 *   removeLink(selector) // removes a link according to a selector
 *   links: function(hidden) // returns the currently-defined links. when 'hidden' is true, only returns currently-hidden links
 *   cancelLink: function() // returns the currently-defined 'cancel' link
 *   moreLink: function() // returns the currently-defined 'more' link
 */
define('lib.dynamicLinks', ['lib.scrollFix', 'lib.actionSheet'], function(scrollFix, ActionSheet, $, global, undef) {

	var moreEventNameSpace = '._dynamicLinks',
		containerStyle = {
			'overflow': 'hidden',
			'overflow-x': 'auto',
			'-webkit-overflow-scrolling': 'touch'
		},
		listStyle = {
			'visible': 'hidden',
			'list-style': 'none',
			'padding': '0px',
			'margin': '0px',
			'overflow': 'hidden'
		},
		linkStyle = {
			'float': 'left'
		};

	function getFullWidth(el) {
		return (el.outerWidth() + parseInt(el.css('marginLeft'), 10) + parseInt(el.css('marginRight'), 10) + 3);
	}

	function setupContainer(context) {
		if(context.direction == 'vertical') {
			context.parent.empty();
			context.listWrapper = $(document.createElement('div'))
				.addClass('container')
				.appendTo(context.parent);
			context.list = $(document.createElement('ul'))
				.appendTo(context.listWrapper)
				.css(listStyle);
		} else {
			context.parent
				.css({ overflow: 'hidden' })
				.empty();
			context.listWrapper = $(document.createElement('div'))
				.css(containerStyle)
				.addClass('container')
				.appendTo(context.parent);

			context.parentWidth = context.listWrapper.outerWidth();

			context.list = $(document.createElement('ul'))
				.appendTo(context.listWrapper)
				.css(listStyle);

			// block pointer events from propagating beyond the tray
			context.listWrapper.on('pan swipe pointerend', function(e){
				if(e.direction == 'left' || e.direction == 'right') {
					e.stopPropagation();
				}
			});
			scrollFix.preventBounce(context.listWrapper);
		}
	}

	function processLinks(context) {
		context.additionalLinks = [];
		context.accumulatedWidth = 0;
		context.preScrollTo = 0;

		if(context.direction == 'vertical') {
			if(context.moreLink != undef) {
				context.list.append(context.moreLink.element);
				context.moreLink.element.detach();
			}

			for(var i = 0; i < context.links.length; i++) {
				var link = context.links[i];

				if(i > context.maxLinks - 1) {
					context.additionalLinks.push(link);
				} else {
					var listItem = $(document.createElement('li')).append(link.element);
					listItem.addClass(link.className).appendTo(context.list);
				}
			}
		} else {

			context.moreLinkWidth = 0;
			if(context.moreLink != undef) {
				context.moreLink.element.css(linkStyle);
				context.list.append(context.moreLink.element);
				context.moreLinkWidth = getFullWidth(context.moreLink.element);
				context.moreLink.element.detach();
			}

			for(var i = 0, idx = 0; i < context.links.length; i++) {
				var link = context.links[i],
					listItem = $(document.createElement('li')).append(link.element);
				if (listItem.children().length == 0)
					continue;
				listItem.css({ display: 'inline' }).addClass(link.className);
				// add link to list so it can be measured, and then measure it
				listItem.appendTo(context.list);
				link.element.css(linkStyle);
				var linkWidth = getFullWidth(link.element);

				// if selected, capture current width to know where to scroll to after
				if(link.selected)
					context.preScrollTo = context.accumulatedWidth;

				// contiue to accumulate width if it's still under the min links length and this would otherwise be wider than the container
				if (context.accumulatedWidth + linkWidth > context.parentWidth && (idx + 1) <= context.minLinks) {
					context.accumulatedWidth += linkWidth;
				// add the link to the additional links and remove it from display if this would be wider than the container and defined to do so
				} else if(
					context.additionalLinks.length > 0 ||
					(
						(
							(context.accumulatedWidth + linkWidth + context.moreLinkWidth > context.parentWidth) ||
							((idx + 1) > context.maxLinks)
						)
						&& (idx + 1) > context.minLinks
					)
				){
					listItem.detach();
					context.additionalLinks.push(link);
				// otherwise, continue to just add to the container
				} else {
					context.accumulatedWidth += linkWidth;
				}
				idx++;
			}
		}
	}

	function finalizeContainer(context) {
		if(context.direction == 'vertical') {
			if(context.additionalLinks.length > 0 && context.moreLink && context.onShowMore) {
				$(document.createElement('li')).append(context.moreLink.element).addClass(context.moreLink.className).appendTo(context.list);
				context.moreLink.element.off(moreEventNameSpace).on('click' + moreEventNameSpace, function(e) {
					context.onShowMore(context.additionalLinks, context.cancelLink);
					return false;
				});
			}
			context.list.css({
				'visibility': 'visible'
			});
		} else {
			if(context.additionalLinks.length > 0 && context.moreLink && context.onShowMore) {
				$(document.createElement('li')).css({ display: 'inline' }).append(context.moreLink.element).addClass(context.moreLink.className).appendTo(context.list);
				context.accumulatedWidth += context.moreLinkWidth;
				context.moreLink.element.off(moreEventNameSpace).on('click' + moreEventNameSpace, function(e) {
					context.onShowMore(context.additionalLinks, context.cancelLink);
					return false;
				});
			}
			// apply total width to list so that it will scroll horizontally
			context.list.css({
				'width': (context.accumulatedWidth > context.parentWidth ? context.accumulatedWidth : context.parentWidth),
				'visibility': 'visible'
			});
			// set pre-scroll state
			context.listWrapper.get(0).scrollLeft = (context.preScrollTo - context.preScrollOffset);

			// set the parent to the same height as the list
			// set the in-between container to 10px taller to allow space for the
			// horizontal scrollbar to be hidden
			var originalListHeight = context.list.height();
			context.parent.css({ height: originalListHeight });
			context.listWrapper.css({ height: originalListHeight + 20 });
		}
	}

	var DynamicLinks = function(options) {
		var context = $.extend({}, DynamicLinks.defaults, options || {});
		return {
			render: function() {
				setupContainer(context);
				processLinks(context);
				finalizeContainer(context);
			},
			addLink: function(link, atIndex) {
				if(atIndex != undef) {
					context.links.splice(atIndex, 0, link);
				} else {
					context.links[context.links.length] = link;
				}

				setupContainer(context);
				processLinks(context);
				finalizeContainer(context);
			},
			removeLink: function(selector) {
				context.links = $.grep(context.links, function(l) {
					return !$(l.element).is(selector);
				});

				setupContainer(context);
				processLinks(context);
				finalizeContainer(context);
			},
			links: function(hidden) {
				return hidden ? context.additionalLinks : context.links;
			},
			cancelLink: function() {
				return context.cancelLink;
			},
			moreLink: function() {
				return context.moreLink;
			}
		}
	};
	DynamicLinks.defaults = {
		preScrollOffset: 10,
		minLinks: 0,
		maxLinks: 50,
		direction: 'vertical',
		parent: null,
		links: [],
		moreLink: null,
		cancelLink: null,
		onShowMore: function(links, cancelLink) { }
	}
	return DynamicLinks;

}, jQuery, window); 
 
/*
 * MessageLinkHandler
 * Internal API
 *
 * Intercepts taps of any <a> in a container that has a data-messagename attribute
 * Blocks default action and publishes a message of that message + the link
 *
 * var messageLinkHandler = new MessageLinkHandler(options)
 *
 * options:
 *   parent: container to monitor for taps
 *
 * methods:
 *   handle(eventName)  // initiates. eventName defaults to 'click'
 */
 define('lib.messageLinks', function($, global, undef) {

	var MessageLinkHandler = function(options) {
		options = options || {};
		var parent = $(options.parent);

		return {
			handle: function(eventName) {
				eventName = eventName || 'click';
				parent.on(eventName, 'a[data-messagename]', function(e){
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();
					$.telligent.evolution.messaging.publish($(this).data('messagename'), { target: this });
				});
			}
		}
	};

	return MessageLinkHandler;

}, jQuery, window); 
 
/*
 * Scroll Fixing to prevent bouncing on pointer events
 * Private API
 *
 * scrollfix.preventBounce(container)
 */
define('lib.scrollFix', function($, global, undef){

	function preventBodyBounce(selection) {
		var originalScrollTop,
			elem = selection.get(0);
		selection.on('pointerstart', function(e){
			originalScrollTop = elem.scrollTop;

			if(originalScrollTop <= 0)
				elem.scrollTop = 1;

			if(originalScrollTop + elem.offsetHeight >= elem.scrollHeight)
				elem.scrollTop = elem.scrollHeight - elem.offsetHeight - 1;


			originalScrollLeft = elem.scrollLeft;

			if(originalScrollLeft <= 0)
				elem.scrollLeft = 1;

			if(originalScrollLeft + elem.offsetWidth >= elem.scrollWidth)
				elem.scrollLeft = elem.scrollWidth - elem.offsetWidth - 1;
		});
	}

	var api = {
		preventBounce: function(selection) {
			selection = selection || $('body').children().first();
			preventBodyBounce(selection);
		},
		fix: function(selection) {
			selection.on('touchmove.scrollfix mousemove.scrollfix mspointermove.scrollfix', function(e){
				e.originalEvent.preventDefault();
			});
		},
		unfix: function(selection) {
			selection.off('.scrollfix');
		}
	};

	return api;

}, jQuery, window); 
 
/*
 * Sheet
 * Private API
 *
 * Provides support for sliding in and out a modal overlay over the document
 * Can be hidden via its API as well as tapping in the grayed out background
 * Can also be swiped or panned away
 *
 * var sheet = new Sheet(options)
 *   options:
 *     enablePan: true (when true, can pan down sheet)
 *     maxHeightPerent: default - 0.7
 *     parent: parent element
 *     cssClass: default - 'sheet'
 *     backgroundColor: default - '#333'
 *     backgroundOpacity: default 0.5;
 *     animationDuration: default 250;
 *     animationEasing: default 'cubic-bezier(0.160, 0.060, 0.450, 0.940)'
 *     onOpening(fn)
 *     onOpened(fn)
 *     onClosing(fn)
 *     onClosed(fn)
 *
 * sheet.show(content)
 * sheet.hide();
 */
define('lib.sheet', ['lib.scrollFix', 'module.messaging'], function(scrollFix, messaging, $, global, undef){

	function init(context) {
		if(context.inited)
			return;
		context.inited = true;

		// create a backdrop element, don't show it yet
		context.backDrop = $(document.createElement('div'))
			.css({
				backgroundColor: context.backgroundColor,
				opacity: 0.01,
				zIndex: 100,
				position: 'fixed',
				top: 0,
				left: 0,
				display: 'none',
				'-webkit-transform': 'translate3d(0,0,0)',
				'-webkit-backface-visibility': 'hidden',
				'transform': 'translate3d(0,0,0)'
			})
			.appendTo(context.parent);

		// create a sheet element, don't do anything with it yet
		context.sheet = $(document.createElement('div'))
			.css({
				zIndex: 101,
				position: 'fixed',
				left: 0,
				top: 0,
				display: 'none',
				'-webkit-transform': 'translate3d(0,0,0)',
				'-webkit-backface-visibility': 'hidden',
				'transform': 'translate3d(0,0,0)'
			})
			.appendTo(context.parent)
			.addClass(context.cssClass);

		// intercept clicks against links in the sheet
		context.sheet.on('click', 'a', function(){
			var link = $(this),
				href = link.attr('href') || link.closest('[href]').attr('href');
			if(href && href.length > 1 && $.telligent && $.telligent.evolution && $.telligent.evolution.mobile) {
				$.telligent.evolution.mobile.load(href);
			}
		})

		handleEvents(context);

		// ensure that it can't be scrolled around
		scrollFix.fix(context.backDrop);
		scrollFix.fix(context.sheet);
	}

	function setDimensions(context) {
		context.windowWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);
		context.windowHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height);
		if(context.visible) {
			context.backDrop.css({
				width: context.windowWidth,
				height: context.windowHeight
			});
			context.sheet.css({
				width: context.windowWidth,
				maxHeight: context.maxHeightPerent * context.windowHeight
			});
		} else {
			context.backDrop.css({
				width: context.windowWidth,
				height: context.windowHeight
			});
			context.sheet.css({
				width: context.windowWidth,
				maxHeight: context.maxHeightPerent * context.windowHeight
			});
		}
	}

	function positionSheet(context, revealPercent, duration) {
		duration = duration || context.animationDuration;

		var opacity = .01 + (revealPercent * context.backgroundOpacity);
		context.backDrop
			.evolutionTransform({ opacity: context.backDrop.css('opacity') })
			.evolutionTransform({ opacity: .01 + (revealPercent * context.backgroundOpacity) },
				{ duration: duration, easing: context.animationEasing });

		context.sheet//.evolutionTransform({ y: context.windowHeight, x: 0 })
			.evolutionTransform({
				y:  (context.windowHeight - revealPercent * context.sheet.outerHeight()),
				x: 0
			}, {
				duration: duration,
				easing: context.animationEasing
			});
		if(revealPercent >= 1) {
			if(context.onOpened) {
				global.clearTimeout(context.openedTimeout);
				context.openedTimeout = global.setTimeout(function(){
					context.onOpened.apply(this);
					global.clearTimeout(context.openedTimeout);
				}, duration);
			}
		} else if(revealPercent <= 0) {
			if(context.onClosed) {
				global.clearTimeout(context.closedTimeout);
				context.closedTimeout = global.setTimeout(function(){
					context.onClosed.apply(this);
					global.clearTimeout(context.closedTimeout);
				}, duration);
			}
		}
	}

	function show(context, content) {
		if(context.visible)
			return;
		context.visible = true;

		if(context.onOpening) {
			context.onOpening.apply(this);
		}

		// init
		init(context);
		setDimensions(context);

		// apply content
		context.sheet.empty().append(content);

		// pre-position sheet off the bottom
		context.sheet.evolutionTransform({
			y: context.windowHeight,
			x: 0
		});

		// ready for displayig
		showSelection(context.backDrop);
		showSelection(context.sheet);

		// position the ui at 100% revealed
		positionSheet(context, 1);
	}

	function hide(context, duration) {
		if(!context.visible)
			return;
		context.visible = false;
		duration = duration || context.animationDuration;

		if(context.onClosing) {
			context.onClosing.apply(this);
		}

		// position the ui at 0% revealed
		positionSheet(context, 0);
		// after the animation duration, clean up
		global.setTimeout(function(){
			if(context.visible)
				return;
			context.visible = false;
			hideSelection(context.backDrop);
			hideSelection(context.sheet);
		}, duration);
	}

	function handleEvents(context){
		// hide sheet when backdrop tapped
		context.backDrop.on('tap', function(){
			hide(context);
		});

		if(context.enablePan) {
			context.sheet.on({
				panstart: function(e) {
					context.startY = e.pageY;
					context.sheetHeight = context.sheet.outerHeight();
				},
				pan: function(e) {
					// drag the sheet in realtime if the direction is somewhat down
					var offset = e.pageY - context.startY;
					if(offset <  0 || e.direction === 'left' || e.direction === 'right')
						return;
					positionSheet(context, (context.sheetHeight - offset) / context.sheetHeight, 10);
				},
				panend: function(e) {
					var offset = e.pageY - context.startY;
					var closedPercent = (context.sheetHeight - offset) / context.sheetHeight;
					if(closedPercent <= .5) {
						// if has moved down more than half the height, close it completely
						hide(context, context.animationDuration * 3/4 );
					} else {
						// if has not moved down more than hafl the height, open it back up
						positionSheet(context, 1, context.animationDuration * 3/4 )
					}
				}
			})
		}
		context.sheet.on({
			swipedown: function(e) {
				hide(context);
			}
		})
	}

	function hideSelection(sel) {
		sel.get(0).style.display = 'none';
	}

	function showSelection(sel) {
		sel.get(0).style.display = 'block';
	}

	var Sheet = function(context) {
		// defaults
		context = context || {};
		context.enablePan = context.enablePan != undef ? context.enablePan : true;
		context.maxHeightPerent = context.maxHeightPerent || 0.7;
		context.parent = $(context.parent);
		context.cssClass = context.cssClass || 'sheet';
		context.backgroundColor = context.backgroundColor || '#333';
		context.backgroundOpacity = context.backgroundOpacity || 0.5;
		context.animationDuration = context.animationDuration || 250;
		context.animationEasing = context.animationEasing || 'cubic-bezier(0.160, 0.060, 0.450, 0.940)';

		context.visible = false;

		// re-calc dimensions on orientation change
		$.telligent.evolution.messaging.subscribe('mobile.orientationchange', function(){
			global.setTimeout(function(){
				setDimensions(context);
			}, 300)
		})

		return {
			show: function(content) {
				show(context, content);
			},
			hide: function() {
				hide(context);
			}
		}
	};

	return Sheet;

}, jQuery, window);
 
 
define('lib.sheetProvider', function($, global, undef){

	return {};

}, jQuery, window); 
 
define('lib.touchEventAdapter', function($, global, undef){

	function blockNativeClicks() {
		$(document).on('click', 'a', function(e) {
			e.preventDefault();
		});
	}

	function handleTaps() {
		$(document).on('tap', 'a', function(e){
			// if this was a non-blocked anchor click event, rediret to its href
			if(this && this.href != undef &&
				(e && e.originalEvent && e.originalEvent.originalEvent && !e.originalEvent.originalEvent.isDefaultPrevented()))
			{
				global.location = this.href;
			}
		});
	}

	function remapEvents() {
		var mappedEvents = {
			'click': 'tap',
			'mouseenter': 'taphold',
			'mouseover': 'taphold',
			'mouseleave': 'pointerend',
			'mouseup': 'pointerend'
		};

		$.fn.on = $.fn.bind = translate($.fn.on, mappedEvents);
		$.fn.off = $.fn.unbind = translate($.fn.off, mappedEvents);
		$.fn.trigger = translate($.fn.trigger, mappedEvents);
	}

	function translate(method, mappings) {
		// returns a new method that adjusts the calling of 'bind' or 'on' to bind 'tap' instead of 'click'
		// maintains any event namespaces
		// also supports object syntax
		return function() {
			args = Array.prototype.slice.call(arguments, 0);
			if(args[0] && $.isPlainObject(args[0])) {
				// object bound syntax. replaces 'click' binders with 'tap'
				var bindingObj = args[0];
				if(bindingObj.click != undef) {
					bindingObj.tap = bindingObj.click;
					delete bindingObj.click;
				}
				return method.call(this, bindingObj);
			} else {
				// string syntax... replaces 'click' with 'tap' - keeps namespaces
				if(typeof args[0] != 'string')
					return this;
				eventParts = args[0].split('.', 2);
				if(mappings[eventParts[0]]) {
					eventParts[0] = mappings[eventParts[0]];
					args[0] = eventParts.join('.');
				}
				return method.apply(this, args);
			}
		}
	}

	function supportsTouch() {
		return 'ontouchstart' in window || navigator.msMaxTouchPoints;
	}


	return {
		adapt: function() {
			if(supportsTouch()) {
				blockNativeClicks();
				handleTaps();
				remapEvents();
				$(function(){
					$('body').addClass('touch');
				})
			}
		}
	};

}, jQuery, window); 
 
/*
 * Small utility functions
 * Internal API
 *
 * // only execute calls to the throttledFunction once every 500 ms...
 * var throttledFunction = util.throttle(fn, 500);
 *
 * // debounce calls to debouncedFunction to only be called after they've stopped occurring for 500+ ms
 * var debouncedFunc = util.debounce(fn, 500);
 *
 * // wrap a function with other behavior to occur before/after it runs
 * var wrappedFunc = util.wrap(fn, {
 *   before: function() { }	,
 *   after: function() { }
 * });
 *
 * // guid
 * var guid = util.guid();
 *
 */
define('lib.util', function(global){

	function r4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	};

	return {
		throttle: function(fn, limit) {
			var lastRanAt, timeout;
			return function() {
				var scope = this
					attemptAt = (new Date().getTime()),
					args = arguments;
				if(lastRanAt && (lastRanAt + (limit || 50)) > attemptAt) {
					global.clearTimeout(timeout);
					timeout = global.setTimeout(function(){
						lastRanAt = attemptAt;
						fn.apply(scope, args);
					}, (limit || 50));
				} else {
					lastRanAt = attemptAt;
					fn.apply(scope, args);
				}
			};
		},
		debounce: function(fn, limit) {
			var bounceTimout;
			return function(){
				var scope = this,
					args = arguments;
				clearTimeout(bounceTimout);
				bounceTimout = setTimeout(function(){
					fn.apply(scope, args);
				}, limit || 10);
			}
		},
		wrap: function(fn, options) {
			return function () {
				try {
					if (options.before) {
						options.before.apply(this, arguments);
					}
				} catch (e) { }
				var response = fn.apply(this, arguments);
				try {
					if (options.after) {
						options.after.apply(this, arguments);
					}
				} catch (e) { }
				return response;
			};
		},
		guid: function() {
			return r4() + r4() + '-' + r4() + '-' + r4() + '-' + r4() + '-' + r4() + r4() + r4();
		}
	};

}, window); 
 
// Stub module which does nothing but require modules
// so that they can all be inited just by requiring this module
define('modules', [
	'module.emailDigest',
	'module.administrationToolbar',
	'module.configuration',
	'module.editableGroup',
	'module.html',
	'module.language',
	'module.maxlength',
	'module.media',
	'module.messaging',
	'module.navigationConfirmation',
	'module.notifications',
	'module.preview',
	'module.regex',
	'module.sockets',
	'module.template',
	'module.ui',
	'module.url',
	'module.tourtips'
], function(){
	return {};
}); 
 
﻿define('module.emailDigest', function($, global, undef){

	if (!$.telligent)
		$.telligent = {};

	if (!$.telligent.evolution)
		$.telligent.evolution = {};

	var _updateSubscription = function(context, frequency)
	{
		if(frequency < 0)
			return;

		if((frequency > 0 && context.subscriptionId != '') && (context.context == '' || context.contextId === 'undefined')) {
			_showMessage(context, context.errorMessage);
			return;
		}

		$.telligent.evolution.post({
			url: context.emailDigestUrl,
			data: {
				subscriptionId: context.subscriptionId,
				frequency: frequency,
				context: context.context,
				contextId: context.contextId
			},
			success: function(response)
			{
				var d = eval('(' + response + ')');
				var message = null;
				if(d.action == "create") {
					context.subscriptionId = d.subscriptionId;
					context.frequency = frequency;
					if(frequency == 1)
						message = context.dailyMessage;
					else if(frequency == 7)
						message = context.weeklyMessage;
				}
				else if(d.action == "update") {
					context.frequency = frequency;
					if(frequency == 1)
						message = context.dailyMessage;
					else if(frequency == 7)
						message = context.weeklyMessage;
				}
				else if(d.action == "delete") {
					context.subscriptionId = '';
					context.frequency = 0;
					if(context.context == "group")
						message = context.unsubscribeGroupMessage;
				}

				if (d.warnings && d.warnings.length > 0)
					_showMessage(context, d.warnings[0], 'warning');
				else if (message)
					_showMessage(context, message, 'success');

				var eventData = {
					subscriptionId: context.subscriptionId,
					frequency: context.frequency,
					context: context.context,
					contextId: context.contextId,
					action: d.action
				};
				$(document).trigger('emailDigestSubscriptionChange', [eventData]);
			},
			error: function(xhr, desc, ex)
			{
				_showMessage(context, context.errorMessage, 'error');
			}
		});
	},
	_updateRollup = function(context, eventData) {
		if(eventData.context != context.context ||
			eventData.contextId != context.contextId)
			return;
		var html = '';
		if(eventData.action == 'create' || eventData.action == 'update') {
			if(eventData.frequency == '1')
				html = context.rollupDaily;
			else if(eventData.frequency == '7')
				html = context.rollupWeekly;
			context.subscriptionId = eventData.subscriptionId;
		}
		else {
			html = context.rollupUnsubscribed;
			context.subscriptionId = '';
		}
		context.frequency = eventData.frequency;
		$('#' + context.rollupTextId).html(html);
	},
	_showPopup = function(context, element) {
		var selected1 = '', selected7 = '', selected0 = '';
		if(context.frequency == 1)
			selected1 = 'email-digest-selected';
		else if(context.frequency == 7)
			selected7 = 'email-digest-selected';
		else
			selected0 = 'email-digest-selected';

		var elementWidth = element.outerWidth(),
			elementHeight = element.outerHeight(),
			elementOffset = element.offset();

		var popupHtml = "<div class='email-digest-selectWrapper' style=\"min-width: " + (elementWidth-2) + "px;\">" +
				"<div frequency=\"1\" class=\"email-digest-selectable " + context.selectableTag + " " + selected1 + "\"><span style=\"display: block; white-space: nowrap;\">" + context.popupDaily + "</span></div>" +
				"<div frequency=\"7\" class=\"email-digest-selectable " + context.selectableTag + " " + selected7 + "\"><span style=\"display: block; white-space: nowrap;\">" + context.popupWeekly + "</span></div>" +
				"<div frequency=\"0\" class=\"email-digest-selectable " + context.selectableTag + " " + selected0 + "\"><span style=\"display: block; white-space: nowrap;\">" + context.popupUnsubscribe + "</span></div>" +
			"</div>";

		$('#' + context.selectPopupId)
			.glowPopUpPanel('hide')
			.glowPopUpPanel('html', popupHtml)
			.glowPopUpPanel('show', elementOffset.left+4, elementOffset.top+5, elementWidth, elementHeight-10, false);
	}
	_showMessage = function(context, message, type) {
		$.telligent.evolution.notifications.show(message, {type: type, duration: 5000});
	};

	$.telligent.evolution.emailDigest = {
		register: function(context)
		{
			$('#' + context.selectPopupId).glowPopUpPanel({
				cssClass: 'Panel',
				position: 'updown',
				zIndex: 100,
				hideOnDocumentClick: true });

			$('#' + context.rollupWrapperId).click(function() {
				_showPopup(context, $(this));
			});

			$('.' + context.selectableTag).live('click', function() {
				var obj = $(this);
				if(obj.hasClass('email-digest-selected'))
					return;
				var frequency = obj.attr('frequency');
				_updateSubscription(context, frequency);
			});

			$(document).bind('emailDigestSubscriptionChange', function(e, eventData) {
				_updateRollup(context, eventData);
			});
		}
	};

	return {};
}, jQuery, window);
 
 
﻿/// @name administrationToolbar
/// @category JavaScript API Module
/// @description Methods for accessing the site-wide admin toolbar
///
/// ### jQuery.telligent.evolution.administrationToolbar
///
/// This module adds support for controlling the administrative toolbar at the top of each page rendered by Evolution.
///
/// ### Methods
///
/// #### get
///
/// Returns the jQuery object representing the administrative toolbar's content.  If the toolbar is not currently shown, it is created.  The returned object can be used to adjust the content of the toolbar.
///
///     $.telligent.evolution.administrationToolbar.get()
///
define('module.administrationToolbar', function($, global, undef){

	if (!$.telligent)
		$.telligent = {};

	if (!$.telligent.evolution)
		$.telligent.evolution = {};

	var config = {
		baseUrl: ''
	},
	getContainer = function()
	{
		var c = $('.admin-bar');
		if (c.length > 0)
		{
			return c;
		}

		var p = $('form');
		if (p.length > 1)
		{
			p = $('body');
		}
		p.prepend($('<div class="admin-bar-header"></div><div class="admin-bar site"></div><div class="admin-bar-footer"></div>'));

		return $('.admin-bar');
	};

	$.telligent.evolution.administrationToolbar = {
		get: function()
		{
			return getContainer();
		}
	};

	return {};
}, jQuery, window);

 
 
﻿/// @name rest
/// @category JavaScript API Module
/// @description Helper methods to assist with performing ajax requests against the REST API
///
/// ### jQuery.telligent.evolution REST helpers
///
/// This module exposes helper methods to assist with performing ajax requests against the REST API. They are essentially thin wrappers over [jQuery.ajax()](http://api.jquery.com/jQuery.ajax/), and all options supported by jQuery.ajax() are supported by these wrappers. However, using these wrappers provides the following benefits:
///
///  * Auth Tokens are automatically pre-set on the requests' headers. Security "just works"
///  * The proper Rest-Method verb overload header is added when it's a PUT or DELETE
///  * Items in the data option are automatically interpolated into the parameterized Endpoint URL as demonstrated below.
///  * REST api endpoints' parameters are automatically uri-encoded
///
/// #### Methods
///
/// #### get
///
///     $.telligent.evolution.get(options)
///
/// #### post
///
///     $.telligent.evolution.post(options)
///
/// #### put
///
///     $.telligent.evolution.put(options)
///
/// #### del
///
///     $.telligent.evolution.del(options)
///
/// Options is an optional object which supports all the same parameters defined by [jQuery.ajax()](http://api.jquery.com/jQuery.ajax/). However, there is no need to set auth tokens or Rest-Method overload headers via `beforeSend()`. Additionally, error handling is provided out of the box via display of a notification containing the error. This can be overridden with the standard error handler parameter.
///
/// ### Examples
///
/// #### Deleting a user from a group.
///
/// Note that the `{GroupId}` and `{UserId}` parameters in the URL are left parameterized, and items in data will resolve to the URL before it is requested.
///
///     jQuery.telligent.evolution.del({
///         url: $.telligent.evolution.site.getBaseUrl() + '/api.ashx/v2/groups/{GroupId}/members/users/{UserId}.json',
///         data: {
///             GroupId: 5,
///             UserId: 2107
///         },
///         success: function(response) { console.log(response); }
///     });
///
/// #### Add a message to an existing conversation
///
/// Note that in this case, Id gets interpolated into the raw API endpoint as `/api.ashx/v2/conversations/50.json`, but `Subject` and `Body` are still passed as post parameters, and `Id` is not
///
///     jQuery.telligent.evolution.post({
///         url: $.telligent.evolution.site.getBaseUrl() + '/api.ashx/v2/conversations/{Id}.json',
///         data: {
///             Id: 50,
///             Subject: "New Mesage Subject",
///             Body: "New Message Body"
///         },
///         success: function(response) { console.log(response); }
///     });
///
/// #### Request Conversations
///
/// This is a more traditional scenario, where `PageSize` and `PageIndex` are passed as query string parameters to the URL, which needs no interpolation.
///
///     jQuery.telligent.evolution.get({
///         url: $.telligent.evolution.site.getBaseUrl() + '/api.ashx/v2/conversations.json',
///         data: {
///             PageSize: 10,
///             PageIndex: 3
///         },
///         success: function(response) { console.log(response); }
///     });
///


/// @name utilities
/// @category JavaScript API Module
/// @description Generic utilities and site configuration
///
/// ### jQuery.telligent.evolution Utilities
///
/// This module adds support for generic utilities and site-specific configuration.
///
/// ### Methods
///
/// #### getBaseUrl
///
/// This returns the current absolute-to-root base URL for the site, with a trailing forward slash.
///
///     $.telligent.evolution.site.getBaseUrl()
///
/// #### formatDate
///
/// Serializes a date properly for REST API usage
///
///     $.telligent.evolution.formatDate(date)
///
/// #### writeAuthorizationHeader
///
/// Allows for manually adding Security Tokens to an xmlHttpRequest before usage. This should not usually be necessary, as it is automatically called by the REST helpers.
///
///     $.telligent.evolution.writeAuthorizationHeader(xmlHttpRequest)
///
/// #### ensureRemoteUrlEncoding
///
/// Allows for manually ensuring URLs are encoded for use on sites accessing Evolution via remoting.
///
///     url = $.telligent.evolution.ensureRemoteUrlEncoding(url)
///
define('module.configuration', function($, global, undef){

	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }

	var config = {
		baseUrl: '',
		authorizationCookieName: 'AuthorizationCookie',
		defaultErrorMessage: 'An error occured while communicating with the server.',
		defaultMultiErrorMessagePrefix: 'The following errors occured while communicating with the server:	 ',
		isRemote: false,
		remoteUrlEncodePattern: '',
		accessingUserId: 0,
		accessingUserIsSystemAccount: true
	};

	var knownErrors = ['RecordNotFound', 'BadRequest', 'Conflict', 'Unauthorized', 'Unknown'];

	var ensureRemoteEncoding = function(url) {
		if (url && url.substr(0, 2) == '~/') {
			url = config.baseUrl + url.substr(2);
		}
		if (config.isRemote && config.remoteUrlEncodePattern && url && url.lastIndexOf('/~/') > -1) {
			// this is a remote request without URL encoding.  Encode URLs appropriately
			url = url.substr(0, url.lastIndexOf('/~/') + 3) + url.substr(url.lastIndexOf('/~/') + 3).replace(new RegExp(config.remoteUrlEncodePattern, 'gi'), function(toReplace, $0, offset) {
				return '_' + toReplace.substr(1);
			});
		}

		return url;
	},
	rest = function (options, verb)
	{
		if (options.url && options.data && typeof (options.data) !== 'string')
		{
			$.each(options.data, function (key, val)
			{
				var urlValueRegEx = new RegExp('{' + key + '}', 'gim');
				if (options.url.match(urlValueRegEx))
				{
					options.url = options.url.replace(urlValueRegEx, global.encodeURIComponent(val));
					delete options.data[key];
				}
			});
		}

		options.url = ensureRemoteEncoding(options.url);

		var before = options.beforeSend;
		var error = options.error;

		// build a set of options that should be used within the ajax call
		// defaulting to global config when not provided
		var callOptions = $.extend({}, config, options);

		$.extend(options, {
			type: verb === 'GET' ? verb : 'POST',
			beforeSend: function (xhr)
			{
				if (typeof before !== "undefined")
				{
					before(xhr);
				}
				writeAuthorizationHeader(xhr);
				if (verb === 'PUT' || verb === 'DELETE')
				{
					xhr.setRequestHeader('Rest-Method', verb);
				}
			},

			error: function (xhr, desc, ex)
			{
				// ignore errors due to page unloads
				if(xhr.readyState === 0 || xhr.status === 0) {
					return;
				}

				desc = callOptions.defaultErrorMessage;
				var scrubberRegEx = /(?:<|>)/g;
				var firstError = null;

				try
				{
					var response = $.parseJSON(xhr.responseText);
					if (response && response.Errors && $.isArray(response.Errors) && response.Errors.length > 0)
					{
						var errorMessages = [];

						$.each(response.Errors, function(i, error){
							var components = error.split(':', 2);
							if(components.length === 1) {
								errorMessages.push(components[0].replace(scrubberRegEx, ''));
							} else if($.inArray(components[0], knownErrors) >= 0) {
								errorMessages.push(components[1].replace(scrubberRegEx, ''));
							}
						});

						if(errorMessages.length === 1 || (errorMessages.length > 1 && typeof $.telligent.evolution.notifications === 'undefined')) {
							desc = errorMessages[0];
						} else if(errorMessages.length > 1) {
							firstError = errorMessages[0];
							desc = callOptions.defaultMultiErrorMessagePrefix;
							desc += "<ul>"
							$.each(errorMessages, function(i, message){
								desc += ("<li>" + message + "</li>");
							});
							desc += "</ul>"
						}
					}
					if(desc === null || $.trim(desc) === '') {
						desc = callOptions.defaultErrorMessage;
					}
				}
				catch (e) { }

				if (typeof error !== "undefined")
				{
					error(xhr, firstError || desc, ex);
				}
				else
				{
					try
					{
						$.telligent.evolution.notifications.show(desc, { type: 'error' });
					}
					catch (e)
					{
						alert(firstError || desc);
					}
				}
			}
		});
		return $.ajax(options);
	},
	formatDate = function (d)
	{
		try
		{
			return [pad(d.getFullYear(), 4, '0'), '-', pad(d.getMonth() + 1, 2, '0'), '-', pad(d.getDate(), 2, '0'), 'T', pad(d.getHours(), 2, '0'), ':', pad(d.getMinutes(), 2, '0'), ':', pad(d.getSeconds(), 2, '0')].join('');
		}
		catch (e)
		{
		}

		return '';
	},
	parseDate = (function(){
		var addMinutes = function(date, minutes) {
    			return new Date(date.getTime() + minutes * 60000);
			},
			timeZoneOffset = new Date().getTimezoneOffset();

		return function(d) {
		    var jsonDate = /\/Date\((\d+)(?:-(\d+))?\)\//;
		    var restDate = /(\d{4,4})\-(\d{2,2})\-(\d{2,2})(?:T(\d{2,2}):(\d{2,2}):(?:(\d{2,2})(?:\.(\d{0,3}))?))([zZ]|([+\-])(((\d\d):(\d\d))|(\d\d\d\d)))?/;
		    var result;
		    var undefined;
		    var now = new Date();
		    if (d === null || d === '') {
		        return now;
		    } else if ((result = jsonDate.exec(d)) != null) {
		        return new Date(parseInt(result[1], 10));
		    } else if ((result = restDate.exec(d)) != null) {
		        var components = [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()];
		        for (var i = 1; i < result.length && i < 8; i++) {
		            if (result[i] != '' && result[i] != undefined) {
		                components[i-1] = parseInt(result[i], 10);
		            }
		        }
		        var date = new Date(components[0],components[1] - 1,components[2],components[3],components[4],components[5],components[6]);
		        // iso time zone offset
		        if(result[8]) {
		            var offset, sign;
		            // utc
		            if(result[8] == 'z' || result[8] == 'Z') {
		                offset = 0;
		                sign = 1;
		            // specific offset including hour and minutes in \d\d:\d\d format
		            } else if(result[9] && result[12] && result[13]) {
		                offset = parseInt(result[12], 10) * 60 + parseInt(result[13], 10);
		                sign = result[9] == '+' ? 1 : -1;
		            // specific offset including hour and minutes in \d\d\d\d format
		            } else if(result[9] && result[10]) {
		                offset = parseInt(result[10].substring(0,2), 10) * 60 + parseInt(result[10].substring(2), 10);
		                sign = result[9] == '+' ? 1 : -1;
		            }
		            date = addMinutes(date, -1 * (sign * offset + timeZoneOffset));
		        }
		        return date;
		    }
		    throw 'Invalid date format';
		};
	})(),
	pad = function (v, l, c)
	{
		v = v + '';
		while (v.length < l)
		{
			v = c + v;
		}
		return v;
	},
	writeAuthorizationHeader = function(xhr)
	{
		var readCookie = function (input)
		{
			var nameEQ = input + "=";
			var ca = document.cookie.split(';');
			for (var i = 0; i < ca.length; i++)
			{
				var c = ca[i];
				while (c.charAt(0) == ' ')
				{
					c = c.substring(1, c.length);
				}

				if (c.indexOf(nameEQ) == 0)
				{
					return c.substring(nameEQ.length, c.length);
				}
			}
			return null;
		};

		var authHeader = readCookie(config.authorizationCookieName);
		if (authHeader != null)
		{
			xhr.setRequestHeader("Authorization-Code", authHeader);
			xhr.setRequestHeader("Rest-Authorization-Code", authHeader);
		}
	};

	var restApi = {
		get: function (options) { return rest(options, 'GET'); },
		post: function (options) { return rest(options, 'POST'); },
		put: function (options) { return rest(options, 'PUT'); },
		del: function (options) { return rest(options, 'DELETE'); },
		formatDate: function (d) { return formatDate(d); },
		parseDate: function(d) { return parseDate(d); },
		writeAuthorizationHeader: function(xhr) { return writeAuthorizationHeader(xhr); },
		ensureRemoteUrlEncoding: function(url) { return ensureRemoteEncoding(url); }
	};

	$.extend($.telligent.evolution, restApi);

	$.telligent.evolution.site = {
		configure: function(options)
		{
			config = $.extend({}, config, options);

			$.telligent.evolution.user = {
				accessing: {
					id: config.accessingUserId,
					isSystemAccount: config.accessingUserIsSystemAccount
				}
			};

			if ($.fn.glowDateTimeSelector)
			{
				$.extend($.fn.glowDateTimeSelector.defaults,
				{
					monthNames: config.monthNames,
					dayNames: config.dayNames,
					calendarButtonImageUrl: $.telligent.evolution.site.getBaseUrl() + 'utility/images/glow/DateTimeSelectorCalendar.gif'
				});
			}

			if ($.glowModal)
			{
				$.extend($.glowModal.defaults, {
					loadingHtmlUrl: $.telligent.evolution.site.getBaseUrl() + 'utility/loading.htm',
					windowCssClasses: ['modal'],
					windowTitleCssClasses: ['modal-title', 'modal-title-2', 'modal-title-3', 'modal-title-4'],
					windowCloseCssClasses: ['modal-close'],
					windowContentCssClasses: ['modal-content', 'modal-content-2'],
					windowMaskCssClasses: ['modal-mask'],
					windowFooterCssClasses: ['modal-footer', 'modal-footer-2', 'modal-footer-3'],
					windowResizeCssClasses: ['modal-resize'],
					zIndex: 200001
				});

				global.Telligent_Modal =
				{
					GetWindowOpener: function (modalWindow, openerWindow)
					{
						return $.glowModal.opener(modalWindow, openerWindow);
					},
					IsShown: function (openerWindow)
					{
						return $.glowModal.visible(openerWindow);
					},
					Resize: function (width, height, preventAutomaticResizing, openerWindow)
					{
						$.glowModal.resize(width, height, preventAutomaticResizing, openerWindow);
					},
					MoveTo: function (x, y, openerWindow)
					{
						$.glowModal.moveTo(x, y, openerWindow);
					},
					Open: function (url, width, height, onCloseFunction, x, y, ignoreCloseAndAnimation, isManuallyResized, openerWindow)
					{
						$.glowModal(url, {
							width: width,
							height: height,
							onClose: onCloseFunction,
							x: x,
							y: y,
							ignoreCloseAndAnimation: ignoreCloseAndAnimation,
							isManuallyresized: isManuallyResized,
							openerWindow: openerWindow
						});
					},
					Close: function (returnValue, openerWindow)
					{
						$.glowModal.close(returnValue, openerWindow);
					},
					Refresh: function (openerWindow)
					{
						$.glowModal.refresh(openerWindow);
					}
				};
			}

			if ($.fn.glowDropDownList)
			{
				$.extend($.fn.glowDropDownList.defaults, {
					buttonImageUrl: $.telligent.evolution.site.getBaseUrl() + 'utility/images/glow/DropDownListButton.gif'
				});
			}

			if ($.fn.glowColorSelector)
			{
				$.extend($.fn.glowColorSelector.defaults, {
					blendImageUrl: $.telligent.evolution.site.getBaseUrl() + 'utility/images/glow/ColorSelectorSv.png',
					hueBlendImageUrl: $.telligent.evolution.site.getBaseUrl() + 'utility/images/glow/ColorSelectorHue.png'
				});
			}

			if ($.fn.glowMultiUpload)
			{
				$.extend($.fn.glowMultiUpload.defaults, {
					swfUrl: $.telligent.evolution.site.getBaseUrl() + 'utility/images/glow/plupload.flash.swf',
					silverlightUrl: config.silverlightFileUploadEnabled ? $.telligent.evolution.site.getBaseUrl() + 'utility/images/glow/plupload.silverlight.xap' : '',
					runtimes: config.silverlightFileUploadEnabled ? 'html5,silverlight,flash' : 'html5,flash'
				});
			}

			if ($.fn.glowUpload)
			{
				$.extend($.fn.glowUpload.defaults, {
					swfUrl: $.telligent.evolution.site.getBaseUrl() + 'utility/images/glow/plupload.flash.swf',
					silverlightUrl: config.silverlightFileUploadEnabled ? $.telligent.evolution.site.getBaseUrl() + 'utility/images/glow/plupload.silverlight.xap' : '',
					runtimes: config.silverlightFileUploadEnabled ? 'html5,silverlight,flash' : 'html5,flash'
				});
			}
		},
		getBaseUrl: function()
		{
			return config.baseUrl;
		}
	};

	if (typeof global.TelligentUtility == "undefined")
	{
		global.TelligentUtility = new Object();
	}

	global.TelligentUtility.WriteAuthorizationHeader = function (xhr)
	{
		$.telligent.evolution.writeAuthorizationHeader(xhr);
	};

	// device pixel ratio
	document.cookie = ".te.dpr=" + (global.devicePixelRatio || 1);

	return {};
}, jQuery, window);
 
 
﻿/// @name editableGroup
/// @category JavaScript API Module
/// @description Enables widgets to be validated and edited in groups
///
/// ### jQuery.telligent.evolution.editableGroup
///
/// The editable group module enables widgets to be validated and edited in groups.  This is how the editable user profile is implemented.
///
/// Note that this API works with the `$core_editableGroup` scripted widget extension that exposes methods to simplify registration, retrieving the save script, retrieving the validation script, loading related widgets in edit mode and view mode.
///
/// ### Methods
///
/// #### register
///
/// Registers a widget or script to be edited within a group identified by groupName.
///
///     $.telligent.evolution.editableGroup.register(groupName, options)
///
/// *options:*
///
///  * `save`: a function that, when called, should perform the grouped save associated to this registration.  The function can return true or false to identify whether the save was successful or not return a boolean but use the passed in function parameters success and failure to identify success and failure asynchronously.
///  * `validate`: a function that, when called, should perform validation associated to this registration.  The function can return true or false to identify whether the save was successful or not return a Boolean but use the passed in function parameters success and failure to identify success and failure asynchronously.
///
/// #### save
///
/// Initiates the saving functionality related to the specified groupName.
///
///     $.telligent.evolution.editableGroup.save(groupName, options)
///
/// *options:*
///
///  * `success`: a function to execute when all registered save behavior has completed successfully.
///  * `error`: a function to execute when any of the registered save behavior identifies an error.
///
/// #### validate
///
/// Initiates the validation functionality related to the specified groupName.
///
///     $.telligent.evolution.editableGroup.validate(groupName, options)
///
/// *options:*
///
///  * `success`: a function to execute when all registered validations have been successful.
///  * `error`: a function to execute when any of the registered validations have failed.
///
define('module.editableGroup', function($, global, undef){

	if (!$.telligent)
		$.telligent = {};

	if (!$.telligent.evolution)
		$.telligent.evolution = {};

	var config = {
		groups: {}
	},
	_saveSuccess = function(group, index, options)
	{
		if (!group.isSaving)
			return;

		if (index + 1 < group.widgets.length)
		{
			var w = group.widgets[index + 1];
			if (w.save)
			{
				var result = w.save(function(){_saveSuccess(group,index + 1,options)}, function(){_saveError(group,index + 1,options)});
				if (result === false)
				{
					_saveError(group, index + 1, options);
				}
				else if (result === true)
				{
					_saveSuccess(group, index + 1, options);
				}
			}
			else
			{
				_saveSuccess(group, index + 1, options);
			}
		}
		else if (options.success)
		{
			group.isSaving = false;
			options.success();
		}
	},
	_saveError = function(group, index, options)
	{
		if (group.isSaving)
		{
			group.isSaving = false;
			if (options.error)
				options.error();
		}
	},
	_validateSuccess = function(group, index, options)
	{
		if (!group.isValidating)
			return;

		group.widgets[index].valid = true;

		var pendingCount = 0;
		$.each(group.widgets, function(index, w) {
			if (w.valid !== true)
				pendingCount++;
		});

		if (pendingCount == 0)
		{
			group.isValidating = false;
			if (options.success)
				options.success();
		}
	},
	_validateError = function(group, index, options)
	{
		if (group.isValidating)
		{
			group.widgets[index].valid = false;
			group.isValidating = false;
			if (options.error)
				options.error();
		}
	};

	$.telligent.evolution.editableGroup = {
		register: function(groupName, options)
		{
			var group = config.groups[groupName];
			if (!group)
			{
				group = { widgets: [], isSaving: false, isValidating: false };
				config.groups[groupName] = group;
			}

			group.widgets[group.widgets.length] = $.extend({}, options || {}, { valid: false, saved: false });
		},
		save: function(groupName, options)
		{
			$.telligent.evolution.editableGroup.validate(groupName, {
				success: function() {
					var group = config.groups[groupName];
					if (group && group.widgets.length > 0)
					{
						group.isSaving = true;
						_saveSuccess(group, -1, options);
					}
					else if (options && options.success)
						options.success();
				},
				error: function() {
					if (options.error)
						options.error();
				}
			});
		},
		validate: function(groupName, options)
		{
			var group = config.groups[groupName];
			if (group && group.widgets.length > 0)
			{
				$.each(group.widgets, function(index, w)
				{
					w.valid = undef;
				});

				group.isValidating = true;

				$.each(group.widgets, function(index, w)
				{
					if (w.validate)
					{
						var result = w.validate(function(){_validateSuccess(group,index,options)}, function(){_validateError(group,index,options)});
						if (result === false)
						{
							_validateError(group, index, options);
						}
						else if (result === true)
						{
							_validateSuccess(group, index, options);
						}
					}
					else
					{
						_validateSuccess(group, index, options);
					}
				});
			}
			else if (options && options.success)
				options.success();
		}
	};

	return {};
}, jQuery, window);
 
 
/// @name html
/// @category JavaScript API Module
/// @description Methods for encoding and decoding html
///
/// ### jQuery.telligent.evolution.html
///
/// This module exposes HTML-related utilities
///
/// ### Methods
///
/// #### encode
///
/// Provides the HTML-encoded version of text
///
///     $.telligent.evolution.html.encode(text)
///
/// #### decode
///
/// Provides the text version of an HTML-encoded string
///
///     $.telligent.evolution.html.decode(text)
///
define('module.html', function($, global, undef){

    var api = {
        encode: function(val) {
        	if (!val)
        		return val;

        	return $('<div/>').text(val).html();
        },
        decode: function(val) {
        	if (!val)
        		return val;

        	// remove HTML before applying to DIV to prevent script/image loading and execution
        	val = val.replace(/<[^>]*>/g, ' ');

        	return $('<div/>').html(val).text();
        }
    };

    if(!$.telligent) { $.telligent = {}; }
    if(!$.telligent.evolution) { $.telligent.evolution = {}; }
    $.telligent.evolution.html = api;

    return {};
}, jQuery, window);
 
 
/// @name language
/// @category JavaScript API Module
/// @description Methods for formatting client-side dates against user-specified server-side formats
///
/// ### jQuery.telligent.evolution.language
///
/// This module exposes language-related utilities
///
/// ### Methods
///
/// #### formatDate
///
/// Formats the given date according the accessing user's formatting options and returns the string representation via a callback function. The callback function is given one parameter: the string representation of the date.
///
///     $.telligent.evolution.language.formatDate(date, completeCallback)
///
/// #### formatDateAndTime
///
/// Formats the given date according to the accessing user's formatting options with a date and returns the string representation via a callback function. The callback function is given one parameter: the string representation of the date.
///
///     $.telligent.evolution.language.formatDateAndTime(date, completeCallback)
///
/// #### formatAgoDate
///
/// Formats the given date as a relative date and returns the string representation via a callback function. The callback function is given one parameter: the string representation of the date.
///
///     $.telligent.evolution.language.formatAgoDate(date, completeCallback)
///
define('module.language', function($, global, undef){

    var dateCache = {},
        buildCacheKey = function(date, format) {
            return date.toString() + '-' + format;
        },
        loadFormattedDate = function (date, format, complete) {
            var formattedDate = dateCache[buildCacheKey(date, format)];
            if(typeof formattedDate === 'undefined') {
                $.telligent.evolution.get({
                    url: api.defaults.dateEndpoint,
                    data: {
                        date: $.telligent.evolution.formatDate(date),
                        format: format
                    },
                    success: function (response) {
                        if (response && complete && typeof response !== 'undefined' && response !== null && response.formattedDate) {
                            dateCache[buildCacheKey(date, format)] = response.formattedDate;
                            complete(response.formattedDate);
                        }
                    }
                });
            } else {
                complete(formattedDate);
            }
        };

    var api = {
        formatDate: function (date, complete) {
            loadFormattedDate(date, 'date', complete);
        },
        formatDateAndTime: function(date, complete) {
            loadFormattedDate(date, 'datetime', complete);
        },
        formatAgoDate: function(date, complete) {
            loadFormattedDate(date, 'agodate', complete);
        }
    };
    api.defaults = {
        dateEndpoint: ''
    };

    if(!$.telligent) { $.telligent = {}; }
    if(!$.telligent.evolution) { $.telligent.evolution = {}; }
    $.telligent.evolution.language = api;

    return {};
}, jQuery, window);
 
 
define('module.maxlength', function($, global, undef){

	/* shim for HTML5 textarea maxlength in browsers which do not support it */
	function init() {
		$('textarea[maxlength]').live('keyup change', function() {
		    var area = $(this),
		        max = area.attr('maxlength'),
		        val = area.val();
		    if (val.length > max) {
		        area.val(val.substr(0, max));
		    }
		});
	}

	return {
		shim: init
	};

}, jQuery, window);

 
 
/// @name media
/// @category JavaScript API Module
/// @description Methods for retrieving server-side generated previews of files
///
/// ### jQuery.telligent.evolution.media
///
/// This module allows server-side file viewers to be invoked for URLs from the client side.
///
/// ### Methods
///
/// #### previewHtml
///
/// Returns the FileViewer-provided Preview HTML for a given URL
///
///     $.telligent.evolution.media.previewHtml(url, options)
///
/// *options:*
///
///  * `width`: max viewer width
///  * `height`: max viewer height
///  * `success`: callback function which is invoked when the preview html is returned from an ajax request. The function is passed the response.
///  * `error`: callback function which is invoked if the preview html could not be generated
///
/// #### viewHtml
///
/// Returns the FileViewer-provided View HTML for a given URL
///
///     $.telligent.evolution.media.viewHtml(url, options)
///
/// *options:*
///
///  * `width`: max viewer width
///  * `height`: max viewer height
///  * `success`: callback function which is invoked when the view html is returned from an ajax request. The function is passed the response.
///  * `error`: callback function which is invoked if the view html could not be generated
///
define('module.media', function($, global, undef){

    var loadHtml = function (url, view, options) {
        var settings = $.extend({}, api.defaults, options || {});
        var data = {
            url: url,
            view: view
        };
        if(settings.width) {
            data.width = settings.width;
        }
        if(settings.height) {
            data.height = settings.height;
        }

        $.telligent.evolution.get({
            url: settings.endpoint,
            data: data,
            success: function (response) {
                if (response && settings.success) {
                    settings.success(response);
                }
            },
            error: function (xhr, desc, ex) {
                if(settings.error) {
                    settings.error(xhr, desc, ex);
                }
            }
        });
    };

    var api = {
        previewHtml: function (url, options) {
            loadHtml(url, 'preview', options);
        },
        viewHtml: function (url, options) {
            loadHtml(url, 'view', options);
        }
    };
    api.defaults = {
        endpoint: ''
    };

    if(!$.telligent) { $.telligent = {}; }
    if(!$.telligent.evolution) { $.telligent.evolution = {}; }
    $.telligent.evolution.media = api;

    return {};
}, jQuery, window);
 
 
/// @name messaging
/// @category JavaScript API Module
/// @description Client-side bus for publishing and subscribing to messages
///
/// ### jQuery.telligent.evolution.messaging
///
/// This module provides a simple, generic publish/subscribe message bus for client code to use. This enables easy cross-widget communication without relying on expectation of specifc DOM elements or events. Additionally, the platform uses messages for coordinating synchronization between separate UI components related to the same piece of content.
///
/// ### Methods
///
/// #### subscribe
///
/// Subscribes to a message, and returns a subscription handle.
///
///     var subscriptionId = $.telligent.evolution.messaging.subscribe(messageName, function(data) {
///         // handle message
///     });
///
///     var subscriptionId = $.telligent.evolution.messaging.subscribe(messageName, namespace, function(data) {
///         // handle message
///     });
///
/// * `messageName`: message to subscribe to
/// * `namespace`: optional namespace to allow clearing one or many multiple handlers later without having subscription handles
/// * `handler`: message handler
///
/// #### publish
///
/// Publishes a message. All current subscriptions will be called and passed the `data`.
///
///     $.telligent.evolution.messaging.publish(messageName, data);
///
/// #### unsubscribe
///
/// Unsubcribes a specific message handler by subscription handle or one or multiple subscriptions by namespace
///
///     $.telligent.evolution.messaging.unsubscribe(subscriptionId);
///     $.telligent.evolution.messaging.unsubscribe(namespace);
///
define('module.messaging', function($, global, undef) {

	var id = 0,
		subscriptionsByName = {},  // for fast publishing and subsscribing
		subscriptionsById = {},    // for fast unsubscribing
		subscriptionsByNamespace = {}; // each namespace tracks a list of subscription ids registered against it

	function publish(messageName, data) {
		if(!messageName) {
			throw 'messageName is required when publishing a message';
		}
		if(messageName === null || messageName.length === 0) {
			return;
		}
		var subscriptions = subscriptionsByName[messageName];
		if(subscriptions) {
			$.each(subscriptions, function(i, subscription) {
				if(subscription.handler !== null) {
					try {
						subscription.handler.call(this, data);
					} catch(e) { }
				}
			});
		}
	}

	function subscribe(messageName, namespace, handler) {
		if(!messageName) {
			throw 'messageName is required when subscribing to a message';
		}
		if(messageName === null || messageName.length === 0) {
			return 0;
		}
		if(typeof subscriptionsByName[messageName] === 'undefined') {
			subscriptionsByName[messageName] = [];
		}

		// default to content namespace if namespace not defined
		var messageNamespace = namespace;
		if(handler == undef) {
			handler = namespace;
			messageNamespace = 'content';
		}

		var subscription = {
			message: messageName,
			handler: handler,
			namespace: messageNamespace,
			id: (++id)
		};
		subscriptionsByName[messageName][subscriptionsByName[messageName].length] = subscription;
		subscriptionsById[String(subscription.id)] = subscription;

		// add this subscription reference to the namespace it was registered with
		if(!subscriptionsByNamespace[messageNamespace])
			subscriptionsByNamespace[messageNamespace] = [];
		subscriptionsByNamespace[messageNamespace][subscriptionsByNamespace[messageNamespace].length] = subscription.id;

		return subscription.id;
	}

	function unsubscribe(subscriptionId) {
		if(!subscriptionId) {
			throw 'subscriptionId is required when unsubscribing a message';
		}
		if(isNaN(subscriptionId)) {
			unsubscribeNamespace(subscriptionId);
		} else {
			unsubscribeSubscription(subscriptionId);
		}
	}

	function unsubscribeNamespace(namespace) {
		if(!namespace || !subscriptionsByNamespace[namespace])
			return;
		// unsubscribe each subscription for this namespace
		for(var i = 0; i < subscriptionsByNamespace[namespace].length; i++ ) {
			unsubscribe(subscriptionsByNamespace[namespace][i]);
		}
		// clear the array of namespaced subscriptions
		subscriptionsByNamespace[namespace].length = 0;
	}

	function unsubscribeSubscription(subscriptionId) {
		if(typeof subscriptionsById[String(subscriptionId)] !== 'undefined') {
			var subscription = subscriptionsById[String(subscriptionId)],
				subscriptionByNameIndex = -1,
				allSubscriptionsForMessage = subscriptionsByName[subscription.message];
			// find the instance of the subscription in the collection for all of it message type
			$.each(allSubscriptionsForMessage, function(i, sub) {
				if(sub === subscription) {
					subscriptionByNameIndex = i;
				}
			});
			// remove that subscription object and also the subscription messge if it was the last one
			if(subscriptionByNameIndex >= 0) {
				allSubscriptionsForMessage.splice(subscriptionByNameIndex, 1);
			}
			if(allSubscriptionsForMessage.length === 0) {
				delete subscriptionsByName[subscription.message];
			}
			// remove the subscription referenced by its id
			delete subscriptionsById[String(subscriptionId)];
		}
	}

	var messaging = {
		publish: publish,
		subscribe: subscribe,
		unsubscribe: unsubscribe
	};

	if(!$.telligent) { $.telligent = {}; }
	if(!$.telligent.evolution) { $.telligent.evolution = {}; }
	$.telligent.evolution.messaging = messaging;

	return messaging;

}, jQuery, window);
 
 
﻿/// @name navigationConfirmation
/// @category JavaScript API Module
/// @description Enables confirmation pop-ups when navigating away from pages
///
/// ### jQuery.telligent.evolution.navigationConfirmation
///
/// The navigation confirmation module enables confirmation pop-ups when navigating away from the page by clicking an unregistered link or button.
///
/// ### Methods
///
/// #### configure
///
/// Configures the message shown when the navigation confirmation is rendered.  This is automatically set to a standard evolution-wide message.  Note that this configuration is global.  Only a single confirmation can be rendered.  Options include:
///
///     $.telligent.evolution.navigationConfirmation.configure(options)
///
/// *options:*
///
///  *`baseUrl`: the base URL of the site.
///
/// #### enable
///
/// Enables the navigation confirmation message.  All actions that would navigate to a new URL not performed through a registered element's click event will cause the confirmation to be displayed.
///
///     $.telligent.evolution.navigationConfirmation.enable()
///
/// #### register
///
/// Registers an element, a jQuery selector, or a jQuery collection representing safe elements to prevent the navigation confirmation when clicked.
///
///     $.telligent.evolution.navigationConfirmation.register(elements)
///
/// #### ignoreClick
///
/// Enabled backwards compatibility with the preview ASP.Net control-based implementation.  Temporary disables the navigation confirmation message.
///
///     $.telligent.evolution.navigationConfirmation.ignoreClick()
///
///
define('module.navigationConfirmation', function($, global, undef){

	if (!$.telligent)
		$.telligent = {};

	if (!$.telligent.evolution)
		$.telligent.evolution = {};

	var config =
	{
		message: '',
		enabled: false,
		ignoreClick: false
	},
	beforeUnload = function()
	{
		if (!config.ignoreClick)
			return config.message;
	}

	$.telligent.evolution.navigationConfirmation = {
		configure: function(options)
		{
			config = $.extend(config, options)
		},
		enable: function()
		{
			if (!config.enabled)
			{
				window.onbeforeunload = beforeUnload;
				config.enabled = true;
				$(document).bind('customizepage', function() { config.ignoreClick = true; });
			}
		},
		register: function(e)
		{
			$(e).click(function() {  config.ignoreClick = true; });
		},
		ignoreClick: function()
		{

			config.ignoreClick = true;
		}
	};

	return {};
}, jQuery, window);
 
 
﻿/// @name notifications
/// @category JavaScript API Module
/// @description Supports displaying messages pinned to the top of the viewport
///
/// ### jQuery.telligent.evolution.notifications
///
/// This module adds support for showing notifications centered along the top of the browser's viewport.
///
/// ### Methods
///
/// #### show
///
/// Shows the provided HTML message in the notifications area of the page
///
///     $.telligent.evolution.notifications.show(message, options)
///
/// *options:*
///
///  * `duration`: the number of milliseconds to show the message for
///    * default: `9999`
///  * `width`: the width of the notification area in pixels
///    * default: `300`
///  * `type`: the textual CSS message type
///    * default: `'directions'`
///
define('module.notifications', function($, global, undef){

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};

	var default_config = {
			duration: 9999,
			width: 300,
			type: 'directions',
			cssClass: 'menu notification notification__menu'
		},
		popup = null,
		hideTimeout = null,
		currentWidth = 300,
		mouseOver = false,
		updatePosition = function() {
			if (popup && popup.glowPopUpPanel('isShown'))
				popup.glowPopUpPanel('show', (($(global).width() - currentWidth) / 2), $(global).scrollTop(), currentWidth, 0, true);
		};

	$.telligent.evolution.notifications = {
		show: function(message, options) {
			options = $.extend({}, default_config, options || {});

			if (!popup) {
				popup = $('<div></div>').glowPopUpPanel({
					cssClass: options.cssClass,
					position: 'down',
					zIndex: 10000,
					hideOnDocumentClick: false
				})
				.bind('glowPopUpPanelMouseOver', function() { mouseOver = true; })
				.bind('glowPopUpPanelMouseOut', function()	{ mouseOver = false; });

				$(global).bind('scroll', updatePosition);
			}

			global.clearTimeout(hideTimeout);
			if (popup.glowPopUpPanel('isShown'))
				popup.glowPopUpPanel('hide');

			currentWidth = options.width;

			popup
				.glowPopUpPanel('html', '<div class="message ' + options.type + '" style="width:' + options.width + 'px">' + message + '</div>')
				.glowPopUpPanel('show', (($(global).width() - options.width) / 2), $(global).scrollTop(), options.width, 0);

			hideTimeout = global.setTimeout(function() {
				$.telligent.evolution.notifications.hide(options.callback);
			}, options.duration);
		},
		hide: function(callback) {
			if(!popup)
				return;

			global.clearTimeout(hideTimeout);
			if (!mouseOver) {
				popup.glowPopUpPanel('hide');

				if (callback && typeof callback === 'function')
					callback();
			}
			else
				hideTimeout = global.setTimeout(function() {
					$.telligent.evolution.notifications.hide(callback);
				}, 249);
		}
	};

	return {};
}, jQuery, window);
 
 
/// @name preview
/// @category JavaScript API Module
/// @description Methods for loading a Web Prview of a URL
///
/// ### jQuery.telligent.evolution.preview
///
/// The preview module enables client-side loading of scraped web previews of remote URLs.
///
/// Preview content is scraped from the remote URL, parsed in a way that prefers [Open Graph Protocol metadata](http://ogp.me/), and temporarily cached in Evolution.
///
/// ### Methods
///
/// #### load
///
/// Returns a Web preview JSON object for a remote URL and an options object.
///
///     $.telligent.evolution.preview.load(url, options)
///
/// *options*:
///
///  * `maxImageWidth`: maximum preview image width
///  * `maxImageHeight`: maximum preview image height
///  * `success`: callback function invoked when the preview is returned. passed the preview data
///  * `error`: callback function invoked when the preview cannot be generated
///
/// Passes the success callback a preview object with the keys:
///
///  * `url`: Remote URL
///  * `statusCode`: HTTP response code
///  * `title`: Scraped title
///  * `excerpt`: Scraped excerpt
///  * `imageUrl`: Scraped image URL
///  * `resizedImageHtml`: HTML representing the resized scraped image URL
///  * `siteName`: Scraped site name
///
/// #### render
///
/// Renders a web preview object to an HTML fragment. Uses an internally-defined HTML template, but can optionally be passed a separate one.
///
///     $.telligent.evolution.preview.render(preview, options)
///
/// *Options*
///
///  * `template`: [client template](@template) string
///
/// *Default Template*
///
///     <div class="abbreviated-post-header shared-link"></div>
///     <div class="abbreviated-post shared-link <% if(imageUrl !== null && imageUrl.length > 0){ %> with-image <% } %>">
///         <h4 class="post-name">
///             <a href="<%: url %>" class="external-link" target="_new" rel="nofollow">
///                 <%= title %>
///             </a>
///         </h4>
///         <% if(siteName !== null && siteName.length > 0){ %>
///             <div class="post-application">
///                 <span class="label"></span>
///                 <span class="value">
///                     <a href="<%: url %>" class="external-link" target="_new" rel="nofollow">
///                         <%= siteName %>
///                     </a>
///                 </span>
///             </div>
///         <% } %>
///         <% if(imageUrl !== null && imageUrl.length > 0){ %>
///             <div class="post-thumbnail">
///                 <a href="<%: url %>" class="external-link" target="_new" rel="nofollow">
///                     <%= resizedImageHtml %>
///                 </a>
///             </div>
///         <% } %>
///         <% if(excerpt !== null && excerpt.length > 0){ %>
///             <div class="post-summary">
///                 <%= excerpt %>
///             </div>
///         <% } %>
///     </div>
///     <div class="abbreviated-post-footer shared-link"></div>
///
define('module.preview', function($, global, undef){

    var loadPreview = function (url, options) {
        var settings = $.extend({}, api.defaults, options || {});
        $.telligent.evolution.get({
            url: settings.endpoint,
            data: {
                url: url,
                maxImageWidth: typeof options.maxImageWidth !== 'undefined' ? options.maxImageWidth : settings.maxImageWidth,
                maxImageHeight: typeof options.maxImageHeight !== 'undefined' ? options.maxImageHeight : settings.maxImageHeight
            },
            success: function (response) {
                if (response && settings.success && typeof response !== 'undefined' && response !== null) {
                    settings.success(response);
                } else if (settings.error) {
                    settings.error(response);
                }
            },
            error: function (xhr, desc, ex) {
                if(settings.error) {
                    settings.error(xhr, desc, ex);
                }
            }
        });
    };

    var api = {
        load: function (url, options) {
            loadPreview(url, options);
        },
        render: function(preview, options) {
            if(preview === null ||
                typeof preview === 'undefined' ||
                typeof preview.url === 'undefined' ||
                preview.url.length === 0 ||
                typeof preview.title === 'undefined' ||
                preview.title.length === 0)
            {
                return;
            }
            var settings = $.extend({}, api.defaults, options),
                template = $.telligent.evolution.template.compile(settings.template);
            return template(preview);
        }
    };
    api.defaults = {
        endpoint: '',
        maxImageWidth: 90,
        maxImageHeight: 90,
        template: ('' +
        '<div class="abbreviated-post-header shared-link"></div>' +
        '<div class="abbreviated-post shared-link <% if(imageUrl !== null && imageUrl.length > 0){ %> with-image <% } %>">' +
        '   <h4 class="post-name"><a href="<%: url %>" class="external-link" target="_new" rel="nofollow"><%= title %></a></h4>' +
        '   <% if(siteName !== null && siteName.length > 0){ %>' +
        '       <div class="post-application">' +
        '           <span class="label"></span>' +
        '           <span class="value"><a href="<%: url %>" class="external-link" target="_new" rel="nofollow"><%= siteName %></a></span>' +
        '       </div>' +
        '   <% } %>' +
        '   <% if(imageUrl !== null && imageUrl.length > 0){ %>' +
        '       <div class="post-thumbnail">' +
        '           <a href="<%: url %>" class="external-link" target="_new" rel="nofollow"><%= resizedImageHtml %></a>' +
        '       </div>' +
        '   <% } %>' +
        '   <% if(excerpt !== null && excerpt.length > 0){ %>' +
        '       <div class="post-summary">' +
        '           <%= excerpt %>' +
        '      </div>' +
        '   <% } %>' +
        '</div>' +
        '<div class="abbreviated-post-footer shared-link"></div>')
    };

    if(!$.telligent) { $.telligent = {}; }
    if(!$.telligent.evolution) { $.telligent.evolution = {}; }
    $.telligent.evolution.preview = api;

    return {};
}, jQuery, window);
 
 
/// @name regex
/// @category JavaScript API Module
/// @description Regular Expression Utilities
///
/// ### jQuery.telligent.evolution.regex
///
/// The regex module provides regex utilities.
///
/// ### Methods
///
/// Encodes a string for use in a regex when performing a match or replace
///
///     var encoded = $.telligent.evolution.regex.encode(val)
///
define('module.regex', function($, global, undef){

    var api = {
        encode: function(val) {
        	if (!val)
        		return val;

        	return val.replace(/[\-\[\]\{\}\(\)\*\+\?\.\,\\\^\$\|\#\s]/g, '\\$&');
        }
    };

    if(!$.telligent) { $.telligent = {}; }
    if(!$.telligent.evolution) { $.telligent.evolution = {}; }
    $.telligent.evolution.regex = api;

    return {};
}, jQuery, window);

 
 
/// @name socket.connected
/// @category Client Message
/// @description Raised when sockets are ready for receiving messages
///
/// ### socket.connected Client Message
///
/// [Client-side message](@messaging) raised when the realtime socket connection is ready. After this message is raised, it is safe to send and receive socket messages against plugin-defined sockets with `$.telligent.evolution.sockets.SOCKET_NAME.on(eventName, function)` and `$.telligent.evolution.sockets.SOCKET_NAME.send(eventName, data)`
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('socket.connected', function() {
///         // handle the event
///     });
///
define('module.sockets', function($, global, undef){

    var handlers = {},
        connection = null,
        transports = ['serverSentEvents','longPolling','foreverFrame'],
        connectionState = 0,
        raisedInitialConnect = false,
        reconnectTimeout = 0,
        keepAliveInterval = null,
        keepAliveIntervalTime = 60 * 1000, // every 60 seconds, send keep-alive.
                                    // this is not to keep the connection alive but to keep
                                    // the connection <-> user mapping alive in evolution
                                    // which is otherwise garbage-collected by a job
        reconnectDelayTime = 5 * 1000, // after a disconnect, try reconnecting after 5 seconds
        reconnectAttemptLimit = 12, // only attempt reconnection 12 times (1 minute), after which, give up
        reconnectAttempts = 0,
        scheduleReconnect = function(connection) {
            reconnectAttempts++;
            if(reconnectAttempts > reconnectAttemptLimit)
                return;
            clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(function() {
                connection.start({ transport: transports });
                clearTimeout(reconnectTimeout);
            }, 5 * 1000);
        },
        makeSocketMessageName = function(socketName, messageName) {
            return socketName + '|' + messageName;
        },
        send = function(socketName, messageName, data) {
            if(connectionState != $.signalR.connectionState.connected)
                return;
            var message = $.telligent.evolution.url.serializeQuery($.extend(data, {
                _s: socketName,
                _m: messageName
            }));
            connection.send(message);
        },
        handle = function (socketName, messageName, serializedData) {
            var socketHandlers = handlers[makeSocketMessageName(socketName, messageName)];
            if (socketHandlers) {
                var data = serializedData && serializedData.length > 0
                    ? $.parseJSON(serializedData)
                    : null;
                $.each(socketHandlers, function (i, handler) {
                    try { handler(data); } catch(e) {}
                });
            }
        },
        api = function (options) {
            if(!$.connection) {
                return;
            }

            // register SOCKET_NAME.on() and SOCKET_NAME.send() methods for each registerd socket name
            $.each(options.sockets, function(i, socket) {
                api[socket.name] = {
                    on: function(messageName, handler) {
                        var key = makeSocketMessageName(socket.fullName, messageName);
                        handlers[key] = handlers[key] || [];
                        handlers[key].push(handler);
                    },
                    off: function(messageName) {
                        var key = makeSocketMessageName(socket.fullName, messageName);
                        delete handlers[key];
                    },
                    send: function(messageName, data) {
                        send(socket.fullName, messageName, data);
                    }
                };
            });

            // write the authorization header to any ajax requests initiated against endpoint by signalr's js
            $.ajaxPrefilter(function (ajaxOptions, originalAjaxOptions, jqXHR) {
                if (ajaxOptions.url.indexOf(options.endpoint) === 0) {
                    $.telligent.evolution.writeAuthorizationHeader(jqXHR);
                }
            });

            // only start the underlying connection if there were any registered sockets
            if (options.sockets.length > 0) {
                connection = $.connection(options.endpoint);

                connection.received(function (data) {
                    var parsedMessage = $.telligent.evolution.url.parseQuery(data),
                        socketName = parsedMessage['_s'],
                        messageName = parsedMessage['_m'],
                        rawData = parsedMessage['_d'];
                    handle(socketName, messageName, rawData);
                });

                connection.error(function(error) {
                    connectionState = $.signalR.connectionState.disconnected;
                    connection.stop();
                    // scheduleReconnect(connection);
                });

                connection.stateChanged(function(change) {
                    connectionState = change.newState;
                    if(connectionState == $.signalR.connectionState.disconnected) {
                        scheduleReconnect(connection);
                    }
                });

                connection.disconnected(function(){
                    // already handled by stateChanged
                });

                connection.reconnected(function(){
                    connectionState = $.signalR.connectionState.connected;
                });

                connection.start({
                    transport: transports,
                    callback: function () {
                        if(!raisedInitialConnect) {
                            raisedInitialConnect = true;
                            $.telligent.evolution.messaging.publish('socket.connected');
                        }
                        // send keep-alive pings every 1 minutes so the connection cleanup
                        // task doesn't think we're zombies and kill us
                        clearInterval(keepAliveInterval);
                        keepAliveInterval = setInterval(function() {
                            if(connectionState != $.signalR.connectionState.connected)
                                return;
                            connection.send('_KEEP_ALIVE');
                        }, keepAliveIntervalTime);

                        // reset the connection attempts back to 0 if needs to reconnect again later
                        reconnectAttempts = 0;
                    }
                });
            }
        };

    $.telligent = $.telligent || {};
    $.telligent.evolution = $.telligent.evolution || {};
    $.telligent.evolution.sockets = $.telligent.evolution.sockets || api;

    return {};
}, jQuery, window);
 
 
/// @name template
/// @category JavaScript API Module
/// @description Simple client-side templating
///
/// ### jQuery.telligent.evolution.template
///
/// The template module provides a simple client-side templating. This is useful when building UI from REST responses or other cases when it's impractical to render UI in the widget on the server side.
///
/// ### Usage
///
/// #### Defining a template
///
/// Client templates can be defined either as plain JavaScript strings or embedded in HTML rendered by a widget. When rendering in HTML, the template should be defined in a script block of type `text/html`.
///
///     <script type="text/html" id="hello">
///         <p>Hello, <%: name %>.</p>
///     </script>
///
/// Delimiters in the template support rendering (and optionally encoding) variables as well as embedding JavaScript logic.
///
/// The delimiter format `<%= value %>` renders a variable without encoding:
///
///     <p>This variable will be rendered directly without encoding <%= variableName %></p>
///
/// The delimiter format `<%: value %>` renders a variable after HTML-encoding it:
///
///     <p>This variable will be rendered with HTML encoding <%: variableName %></p>
///
/// The delimiter format `<% %>` renders nothing but allows embedding of raw JavaScript logic.
///
///     <div>
///         <% if (answered) { %>
///             <span class="answered">Answered</span>
///         <% } else { %>
///             <span class="not-answered">Not Answered</span>
///         <% } %>
///     </div>
///
/// Looping can be performed with the template helper, `foreach`
///
///     <ul>
///         <% foreach(users, function(user){ %>
///             <li>
///                 <a href="<%: user.profileUrl %>">
///                     <%= user.displayName %>
///                 </a>
///             </li>
///         <% }); %>
///     </ul>
///
/// #### Using the template
///
/// To use a template, it must first be compiled. This transforms it from a string into an efficient function which can be passed data to template, returning a rendered string.
///
///     // given a <script type="text/html" id="hello-world"> ... </script>
///     var helloWorldTemplate = $.telligent.evolution.template.compile('hello-world');
///
///     // alternatively, a raw template string can be passed to compile
///     var helloWorldTemplate = $.telligent.evolution.template.compile('<p>Hello <%: name %></p>');
///
/// The compiled template can then be efficiently used (and re-used) by passing data to template. The data must contain keys that match those contained in the template. In this case, the template can refer to a variable named `'name'`.
///
///     var renderedHello = helloWorldTemplate({
///         name: 'Rob'
///     });
///
/// Arrays can be passed as well. In this case, a template's `foreach` could iterate over `'users'`.
///
///     var renderedUserList = user({
///         users: [
///             { displayName: 'Name1', profileUrl: 'url1' },
///             { displayName: 'Name2', profileUrl: 'url3' },
///             { displayName: 'Name3', profileUrl: 'url3' }
///         ]
///     });
///
/// #### Customizing template syntax
///
/// `foreach` is a platform-defined template helper. Custom helpers can also be defined by passing an object of functions during compilation.
///
///     var myTemplate = $.telligent.evolution.template.compile('myTemplate', {
///         pluralize: function(raw) {
///             // naive pluralization demonstration
///             return raw + 's';
///         }
///     });
///
/// Then the helper can be used within the template
///
///     <script type="text/html" id="myTemplate">
///         <ul>
///             <% foreach(vehicles, function(vehicle) { %>
///                 <li>type: <%= pluralize(vehicle.type) %><%>
///             <% }); %>
///         </ul>
///     </script>
///
/// ### Methods
///
/// #### compile
///
/// Transforms a template string into an efficient JavaScript function which can process data into a rendered string.
///
///     $.telligent.evolution.template.compile(template, extraHelpers, delimiters)
///
///  * `template`: Either a raw JavaScript template string, or an ID of a `<script type="text/html">` element containing an embedded template.
///  * `extraHelpers`: Optional functions made available for use within the template
///  * `delimiters`: Optional object containing overrides for re-defining what delimiter formats are used. Override object must contain both `open` and `close` delimiter keys and values.
///    * default:
///      * `open`: `'<%'`
///      * `close`: `'%>'`
///
define('module.template', function($, global, undef){

    var templates = {},
        defaultDelimiters = {
            open: '<%',
            close: '%>'
        },
        compile = function (template, delimiters) {
            var delms = $.extend({}, defaultDelimiters, delimiters || {});
            var rawPrintExpression = new RegExp('\\' + delms.open + '=([\\s\\S]+?)' + delms.close, 'g'),
                encodedPrintExpression = new RegExp('\\' + delms.open + ':([\\s\\S]+?)' + delms.close, 'g'),
                evalExpression = new RegExp('\\' + delms.open + '(.*?)' + delms.close, 'g');
            var body = "" +
                " var source = []; " +
                " with(data){with(extraHelpers){with(defaultHelpers){ " +
                " source.push('" +
                    template
						//.replace(/\'/g, '\\\'')
                        .replace(/[\r\n]/g, '')
                        .replace(rawPrintExpression, "'); source.push(String($1)); source.push('")
                        .replace(encodedPrintExpression, "'); source.push(escape(String($1))); source.push('")
                        .replace(evalExpression, "'); $1 source.push('") +
                "'); " +
                " }}} " +
                " return source.join('');";
            var compiled = new Function('defaultHelpers', 'extraHelpers', 'data', body);
            compiled.compiledSource = "function(defaultHelpers, extraHelpers, data) { " + body + " } ";
            return compiled;
        },
        api = {
            compile: function (source, extraHelpers, delimiters) {
                var compiledTemplate = templates[source];
                if (typeof compiledTemplate === 'undefined') {
                    var template = document.getElementById(source) !== null ? document.getElementById(source).innerHTML : source,
                        compiledTemplateInner = compile(template, delimiters);
                    templates[source] = compiledTemplate = function(data) {
                        return compiledTemplateInner.call(this, api.helpers || {}, extraHelpers || {}, data || {});
                    };
                    compiledTemplate.source = {
                        raw: template,
                        compiled: compiledTemplateInner.compiledSource
                    };
                }
                return compiledTemplate;
            },
            helpers: {
                foreach: function(items, handler) {
                    if(items && items.length > 0 && handler) {
                        for(var i = 0; i < items.length; i++) {
                            handler(items[i], i);
                        }
                    }
                },
                escape: (function(raw) {
                    var ramp = /&/g,
                        rlt = /</g,
                        rgt = />/g,
                        rqt = /\"/g,
                        eamp = '&amp;',
                        elt = '&lt;',
                        egt = '&gt;',
                        eqt = '&quot;';
                    return function(raw) {
                        var escaped = raw
                            .replace(ramp, eamp)
                            .replace(rlt, elt)
                            .replace(rgt, egt)
                            .replace(rqt, eqt);
                        return escaped;
                    };
                }())
            }
        };

    $.telligent = $.telligent || {};
    $.telligent.evolution = $.telligent.evolution || {};
    $.telligent.evolution.template = api;

    return {};
}, jQuery, window);
 
 
/*
 * Tour Tips API
 *
 * // Registers a tip to be possibly shown to the user
 * // Will depend on whether local or server already has the tip in a read state
 * $.telligent.evolution.tourTips.register(tip)
 *   tip:
 *	   element
 *	   key
 *	   message
 *	   index
 *
 * // mark a tip as read or unread
 * // updates local and server storage
 * $.telligent.evolution.tourTips.mark(tipKey, asRead)
 *
 * Message:
 *   // raised when there's been a (500ms) gap in registrations
 *   // contains all tips that are not in a read state according to local storage or server
 *   ui.tourtips
 *     data:
 *      tips
 *
 */
define('module.tourtips', ['module.configuration'], function(config, $, global, undef){

	// custom JSON storage which stores all items
	// scoped to the current user and in different
	// backends depending on anonymous or registered
	function ContextStorage() {
		var store = $.telligent.evolution.user.accessing.isSystemAccount
			? global.sessionStorage
			: global.localStorage;
		store = global.sessionStorage;

		function addUserToKey(key) {
			return $.telligent.evolution.user.accessing.id + ':' + key;
		}

		return {
			get: function(key) {
                return JSON.parse(store.getItem(addUserToKey(key)));
			},
			set: function(key, data) {
                store.setItem(addUserToKey(key), JSON.stringify(data));
			},
			remove: function(key) {
                store.removeItem(addUserToKey(key));
			}
		};
	};

	// model for interacting with REST
	var model = {
		mark: function(tipKey, asRead) {
			var endpoint = asRead ? $.telligent.evolution.post : $.telligent.evolution.del;

			return endpoint({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/tourtips/{key}.json?IncludeFields=Key,Read',
				data: {
					key: tipKey
				}
			});
		},
		list: function(tipKeys) {
			return $.telligent.evolution.get({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/tourtips.json?IncludeFields=Key,Read',
				data: {
					Keys: tipKeys.join(',')
				}
			});
		}
	};

	var registeredTipBuffer = [];
	var bufferProcessTimeout;
	var tipIndex = 0;
	var tipBufferDuration = 1000;
	var loadingTips = false;
	var contextStorage;

	// tip:
	//   element
	//   key
	//   message
	//   index
	function registerTip(tip) {
		contextStorage = contextStorage || ContextStorage();

		if(!tip) { return; }
		// synthesize an index if one not present
		if(tip.index == undef)
			tip.index = tipIndex++;

		// add tip
		registeredTipBuffer.push(tip);

		// debounce registrations to only process once timeout occurs
		global.clearTimeout(bufferProcessTimeout);
		bufferProcessTimeout = global.setTimeout(processTipBuffer, tipBufferDuration);
	}

	function processTipBuffer() {
		// if currently loading tips, delay this processing
		if(loadingTips) {
			global.clearTimeout(bufferProcessTimeout);
			bufferProcessTimeout = global.setTimeout(processTipBuffer, tipBufferDuration);
		}

		// tips to ultimately show to the user
		var unreadTips = [];
		// tips with unknown read states
		var unknownTips = [];

		// process the buffer
		$.each(registeredTipBuffer, function(i, tip){

			// get locally cached tip state
			var localTip = contextStorage.get(tip.key);
			if(localTip && !localTip.read) {
				// locally stored but not read
				unreadTips.push(tip);
			} else if(!localTip) {
				// not locally stored, need to look up
				unknownTips.push(tip);
			}
		});

		// clear the buffer
		registeredTipBuffer.length = 0;

		if(unknownTips.length > 0) {
			// if anonymous, don't bother asking server, assume they're all unread
			if($.telligent.evolution.user.accessing.isSystemAccount) {
				$.each(unknownTips, function(i, tip){
					unreadTips.push(tip);
				});
				raiseUnreadTips(unreadTips);
				return;
			}

			// build a list of unknown tips' keys and a quick lookup of all unknown tips
			var unknownTipMap = {};
			var unknownTipKeys = [];
			$.each(unknownTips, function(i, tip) {
				unknownTipKeys.push(tip.key);
				unknownTipMap[tip.key] = tip;
			});

			loadingTips = true;

			// get state of unknown tips from server
			model.list(unknownTipKeys)
				.then(function(response){
					loadingTips = false;

					// process the tips from the server
					$.each(response.TourTips, function(i, tip) {
						// locally cache the tip to avoid this lookup again
						contextStorage.set(tip.Key, {
							read: tip.Read
						});
						// if tip not read, find the DOM-referenced tip
						// and add it to unread list
						if(!tip.Read) {
							var unknownTip = unknownTipMap[tip.Key];
							if(unknownTip) {
								unreadTips.push(unknownTip);
							}
						}
					});
					// show unread tips
					raiseUnreadTips(unreadTips);
				});
		} else {
			// show unread tips
			raiseUnreadTips(unreadTips);
		}
	}

	function raiseUnreadTips(tips) {
		// sort tips by their index
		tips = tips.sort(function(a, b){
			return a.index - b.index;
		});
		$.telligent.evolution.messaging.publish('ui.tourtips', {
			tips: tips
		});
	}

	function mark(tipKey, read) {
		// update local storage
		contextStorage.set(tipKey, {
			read: read
		});
		// persist in db
		if(!$.telligent.evolution.user.accessing.isSystemAccount) {
			model.mark(tipKey, read);
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.tourTips = {
		register: registerTip,
		mark: mark
	};

    return {};
}, jQuery, window);
 
 
/// @name ui
/// @category JavaScript API Module
/// @description UI Component framework methods
///
/// ### jQuery.telligent.evolution.ui
///
/// Implements the UI component framework, and exposes a few helper methods for calling it explicitly.
///
/// ### About the UI Component Framework:
///
/// **What are UI components?**
///
/// UI components are simple JavaScript objects defined on the namespace `jQuery.telligent.evolution.ui.components`. They are automatically invoked against any DOM elements matching a CSS class name of `ui-COMPONENTNAME`, where *componentname* matches a known UI component.
///
/// For example, given an HTML snippet:
///
///     <span class="ui-car" data-make="honda" data-model="civic"></span>
///
/// And a pre-defined UI component named `car`...
///
///     jQuery.telligent.evolution.ui.components.car = {
/// 	    setup: function() {
/// 		    // setup is called once per page if at least one element matches this component
/// 	    },
///     	add: function(elm, options) {
///     		// add is called for each unique instance of an element matching the component
/// 			// elm is the matching element
///     		// options is an object containing all data attributes defined on the element
///     		$(elm).html('Car: ' + options.make + ' ' + options.model);
///         }
///     };
///
/// Then all instances of the span will be transformed on the client side to contain 'Car: [make] [model]'.
///
/// **What purpose do they serve?**
///
/// UI components allow the server-side to render a non-UI-specific instruction for the client to implement rendering. This allows hard-coded Widget API extensions to emit UI instructions while still allowing a theme to define how that UI looks and behaves.
///
/// Default implementations of the components are provided in Core, but they are designed to be overriden by themes as necessary.
///
/// **Automatic Behaviors**
///
/// Additionally, UI components are invoked against all matching elements when the page is modified too, not only after the page first loads. This makes UI components an easy way to embed interactive behaviors in content without having to specifically bind to events or set up handlers.
///
/// ### Methods
///
/// These are not often needed, and are usually invoked internally. They can be invoked explicitly as necessary.
///
/// #### render
///
/// Invokes all currently-known UI components against the page or a given selection within the page.
///
/// *As rendering is typically performed automatically, this is rarely needed.*
///
///     // invoke currently-defined UI components against all matching elements in div.mydiv
///     jQuery.telligent.evolution.ui.render('div.mydiv');
///
/// #### data
///
/// Given an element, parses its `data` attributes into an object. If an attribute exists named `data-configuration`, it parses its assumed querystring-encoded values as a separate object, `options.configuration`.
///
/// *As options are normally parsed by the UI component framework automatically, this is rarely needed.*
///
///     var data = jQuery.telligent.evolution.ui.data(elm);
define('module.ui', ['lib.util'], function(util, $, global, undef){

	var dataKey = '_telligent_evolution_ui_data',
		addRunKey = '_telligent_evolution_ui_render_add',
		setupRuns = {};
		parseData = function(elm) {
			elm = elm.get(0);
			var data = {};
			for(var i = 0; i < elm.attributes.length; i++) {
				var attr = elm.attributes[i];
				if(attr.name.indexOf('data-') === 0) {
					var name = attr.name.substring(5);
					if(name === 'configuration') {
						data[name] = $.telligent.evolution.url.parseQuery(attr.value);
					} else {
						data[name] = attr.value;
					}
				}
			}
			return data;
		},
		api = {
			components: {},
			render: function(selector) {
				var container = $(selector || document);
				for(var name in api.components) {
					var component = api.components[name];
					var componentInstances = $('.ui-' + name, container);
					if(container.hasClass('.ui-' + name)) {
						componentInstances.add(container);
					}
					// if there were any instances at all, run the component's setup
					if(componentInstances && componentInstances.length > 0 && (typeof component.setup !== 'undefined') && !setupRuns[name]) {
						component.setup.call(this);
						setupRuns[name] = true;
					}
					// if there was an add, run the component's 'add' for each instnace, never more than once for an item, passing in parsed data attributes
					if(componentInstances && componentInstances.length > 0 && (typeof component.add !== 'undefined')) {
						componentInstances.each(function(){
							var componentInstance = $(this);
							if(!componentInstance.data(addRunKey + '.' + name)) {
								component.add.call(componentInstance, componentInstance, api.data(componentInstance));
								componentInstance.data(addRunKey + '.' + name, true);
							}
						});
					}
				}
			},
			data: function(elm) {
				if(!elm) {
					return {};
				}
				elm = $(elm);
				var data = elm.data(dataKey);
				if(data === null || typeof data === 'undefined') {
					data = parseData(elm);
					elm.data(dataKey, data);
				}
				return data;
			}
		};
	if(!$.telligent) { $.telligent = {}; }
	if(!$.telligent.evolution) { $.telligent.evolution = {}; }
	$.telligent.evolution.ui = api;


	// wrap jQuery manipulation methods with automatic calls to $telligent.evolution.ui.render()
	$.each(['html','append','prepend'], function(i, fn) {
		$.fn[fn] = util.wrap($.fn[fn], {
			after: function() {
				$.telligent.evolution.ui.render(this);
			}
		});
	});
	$.each(['after','before'], function(i, fn) {
		$.fn[fn] = util.wrap($.fn[fn], {
			after: function() {
				$.telligent.evolution.ui.render(this.parent());
			}
		});
	});

	return api;

}, jQuery, window);

 
 
/// @name url
/// @category JavaScript API Module
/// @description Methods for parsing and manipulating urls, querystrings, and hashes
///
/// ### jQuery.telligent.evolution.url
///
/// Methods for parsing and manipulating URLs, query strings, and hashes.
///
/// ### Methods
///
/// #### parseQuery
///
/// Returns an object representation of the query strings key/value pairs.  `queryString` can optionally include '?' or '#' which will be ignored as bounds
///
///     $.telligent.evolution.url.parseQuery(queryString)
///
/// #### serializeQuery
///
/// Converts key/value pairs into a new query string
///
///     $.telligent.evolution.url.serializeQuery(data)
///
/// #### modifyUrl
///
/// Modifies a URL with the values from a given query string and hash.  If `url` is not specified, the current URL is used.  `query` and `hash` are optional and, if not provided, will result in no modifications to that component of the URL.
///
///     $.telligent.evolution.url.modifyUrl(url, query, hash)
///
/// #### hashData
///
/// Returns an object key/value pair of the existing querystring-encoded data that's in the current hash
///
///     $.telligent.evolution.url.hashData()
///
/// #### hashData
///
/// Adds/updates key/value pairs with the existing pairs in the hash and updates the current hash
///
///     $.telligent.evolution.url.hashData(data, options)
///
/// *options:*
///
///  * `overrideCurrent`: when true, replaces all items in the hash with only those provided
///  * `prefix`: prefixes each key in the serialized hash with the optional value provided
///
/// #### encode
///
/// Returns the URL-encoded version of text
///
///     $.telligent.evolution.url.encode(text)
///
/// #### decode
///
/// Returns the URL-decoded version of text
///
///     $.telligent.evolution.url.decode(text)
///
/// #### encodePathComponent
///
/// Returns the URL-path-component-encoded version of text. This is the lossless format used in Evolution for data within URL paths.
///
///     $.telligent.evolution.url.encodePathComponent(text)
///
/// #### decodePathComponent
///
/// Returns the URL-path-component-decoded version of text.
///
///     $.telligent.evolution.url.decodePathComponent(data)
///
/// #### encodeFileComponent
///
/// Returns the URL-file-component-encoded version of text. This is the lossless format used in Evolution for data within URL file name.
///
///     $.telligent.evolution.url.encodeFileComponent(text)
///
/// #### decodeFileComponent
///
/// Returns the URL-file-component-decoded version of text.
///
///     $.telligent.evolution.url.decodeFileComponent(data)
///
define('module.url', function($, global, undef){

	var _urlEncode =  function(val, pattern, spaceReplacement, periodReplacement, escapePrefix) {
		if (!val)
			return val;

		var escapeAllPeriods = /(?:\.config|\.ascx|\.asax|\.cs|\.vb)$/i.test(val);
		return val.replace(pattern, function(toReplace, $0, offset) {
			if (toReplace == ' ') {
				return spaceReplacement;
			} else if (toReplace == '.' && !escapeAllPeriods && offset != val.length -1 && val.substr(offset + 1, 1) != '.') {
				return periodReplacement;
			} else {
				var replacement = [];
				replacement[replacement.length] = escapePrefix;
				for (var i = 0; i < toReplace.length; i++)
				{
					var h = toReplace.charCodeAt(i).toString(16) + '';
					var l = h.length;
					if (l == 4) {
						replacement.push(h.substr(2,2).toUpperCase());
						replacement.push(h.substr(0,2).toUpperCase());
					} else if (l == 3) {
						replacement.push(h.substr(1,2).toUpperCase());
						replacement.push('0');
						replacement.push(h.substr(0,1).toUpperCase());
					} else if (l == 2) {
						replacement.push(h.toUpperCase());
						replacement.push('00');
					}
				}
				replacement[replacement.length] = escapePrefix;
				return replacement.join('');
			}
		});
	},
	_urlDecode = function(val, pattern, spaceReplacement, periodReplacement) {
		if (!val)
			return val;

		return val.replace(pattern, function(toReplace, $0, offset) {
			if (toReplace.length == 1) {
				if (toReplace == spaceReplacement) {
					return ' ';
				} else if (toReplace == periodReplacement) {
					return '.';
				}
			} else {
				toReplace = toReplace.substr(1, toReplace.length - 2);
				if (toReplace.length % 4 != 0) {
					return '';
				}
				var replacement = [];
				for (var i = 0; i < toReplace.length; i += 4) {
					replacement[replacement.length] = String.fromCharCode(parseInt(toReplace.substr(i + 2, 2) + toReplace.substr(i, 2), 16));
				}
				return replacement.join('');
			}
		});
	};

    var api = {
        parseQuery: function(queryString) {
            var parts = queryString.split('?'),
                raw = (parts.length > 1 ? parts[1] : queryString).split('#')[0],
                data = {},
                pairs = raw.split('&');

            $.each(pairs, function(i, pair) {
                pair = pair.split('=');
                if(pair.length === 2) {
                    data[pair[0]] = decodeURIComponent(pair[1].replace(/\+/gi,' '));
                }
            });

            return data;
        },
        serializeQuery: function(data) {
            data = data || {};
            var pairs = [];
            $.each(data, function(key, value) {
                pairs[pairs.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
            });
            return pairs.join('&');
        },
        modify: function(options) {
            var settings = $.extend({
                    url: global.location.href,
                    query: null,
                    hash: global.location.hash,
                    protocol: global.location.protocol
                }, options),
                newUrlParts = [ settings.url.split('?')[0].split('#')[0] ],
                newQuery;

            // get the current query and update it with newly-passed query
            if(typeof settings.query === 'string') {
                settings.query = api.parseQuery(settings.query);
            }
            newQuery = api.serializeQuery($.extend(api.parseQuery(settings.url), settings.query));
            if(newQuery && newQuery.length > 0) {
                newUrlParts[newUrlParts.length] = ('?' + newQuery);
            }

            // add in new or current hash
            if(settings.hash && settings.hash.length > 0) {
                newUrlParts[newUrlParts.length] = ((settings.hash.indexOf('#') !== 0 ? '#' : '') + settings.hash);
            }
            return newUrlParts.join('');
        },
        hashData: function(data, options) {
            var overrideCurrent = false,
                prefix = '';
            if (!$.isPlainObject(options)) {
                overrideCurrent = options;
            } else {
                overrideCurrent = options.overrideCurrent;
                prefix = options.prefix || '';
            }

            // apply prefix, if provided
            if(prefix) {
                for (var key in data) {
                    data[prefix + key] = data[key];
                    delete data[key];
                }
            }

            if(typeof data === 'undefined') {
                data = {};
                var urlParts = global.location.href.split("#"),
                    rejoinedParts = '';
                // firefox workaround
                if(urlParts.length > 2) {
                    $.each(urlParts, function(i, part) {
                        if(i > 0) {
                            if(i > 1) {
                                rejoinedParts += '#';
                            }
                            rejoinedParts += part;
                        }
                    });
                    urlParts = [ urlParts[0], rejoinedParts ];
                }
                if(urlParts.length === 2) {
                    data = api.parseQuery(urlParts[1]);
                }
                return data;
            } else {
                if(!overrideCurrent) {
                    data = $.extend(api.hashData(), data);
                }
                global.location.href = global.location.href.split('#')[0] + '#' + api.serializeQuery(data);
            }
        },
        encode: function(val) {
        	return encodeURIComponent(val);
        },
        decode: function(val) {
        	return decodeURIComponent(val);
        },
        encodePathComponent: function(val) {
        	return _urlEncode(val, /([^A-Za-z0-9 \.]+|\.| )/g, '+', '-', '_');
        },
        decodePathComponent: function(val) {
        	return _urlDecode(val, /((?:_(?:[0-9a-f][0-9a-f][0-9a-f][0-9a-f])+_)|\-|\+)/ig, '+', '-');
        },
        encodeFileComponent: function(val) {
        	return _urlEncode(val, /([^A-Za-z0-9 \.]+|\.| )/g, '-', '.', '_');
        },
        decodeFileComponent: function(val) {
        	return _urlDecode(val, /((?:_(?:[0-9a-f][0-9a-f][0-9a-f][0-9a-f])+_)|_|\-)/ig, '-', '.');
        }
    };

    if(!$.telligent) { $.telligent = {}; }
    if(!$.telligent.evolution) { $.telligent.evolution = {}; }
    $.telligent.evolution.url = api;

    return {};
}, jQuery, window);
 
 
// Stub module which does nothing but require module-wrapped jQuery
// plugins so that they can all be inited just by requiring this module
define('plugins', [
	'plugin.evolutionBookmark',
	'plugin.evolutionComposer',
	'plugin.evolutionHighlight',
	'plugin.evolutionInlineTagEditor',
	'plugin.evolutionLike',
	'plugin.evolutionModerate',
	'plugin.evolutionPager',
	'plugin.evolutionResize',
	'plugin.evolutionStarRating',
	'plugin.evolutionTagTextBox',
	'plugin.evolutionTheater',
	'plugin.evolutionToggleLink',
	'plugin.evolutionTransform',
	'plugin.evolutionUserFileTextBox',
	'plugin.validation',
	'plugin.evolutionTextEditor',
	'plugin.evolutionScrollSlider',
	'plugin.evolutionMasonry',
	'plugin.evolutionTip'
], function(){
	return {};
}); 
 
/// @name evolutionBookmark
/// @category jQuery Plugin
/// @description Renders a bookmark toggle link
///
/// ### jQuery.fn.evolutionBookmark
///
/// This plugin supports rendering a bookmark toggle link, allowing the user to bookmark or unbookmark content.
///
/// ### Usage
///
///     $('SELECTOR').evolutionBookmark(options)
///
/// where 'SELECTOR' is a span.
///
/// ### Options
///
///  * `contentId`: (string) content ID
///  * `contentTypeId`: (string) content type ID
///  * `typeId`: (string) bookmark type ID
///  * `contentTypeName`: (string) the name of the content type
///  * `initialState`: (boolean) content is bookmarked
///    * default `false`
///  * `onBookmark`: (function) callback function when a selection is made. The function is passed contentId, contentTypeId, typeId, and a callback function to call when processing is complete
///  * `onUnbookmark`: (function) callback function when a selection is made. The function is passed contentId, contentTypeId, typeId, and a callback function to call when processing is complete
///  * `deleteBookmarkText`: Label for the unbookmark link. `{content_type_name}` is replaced with the content's type name.
///    * default `'Unbookmark {content_type_name}'`
///  * `addBookmarkText`: Label for the bookmark link. `{content_type_name}` is replaced with the content's type name.
///    * default `'Bookmark this {content_type_name}'`
///  * `processingText`: Label for the link when it is processing. `{content_type_name}` is replaced with the content's type name.
///    * default `'...'`
///  * `addBookmarkCssClass`: CSS class to apply to the bookmark link.
///    * default `'internal-link favorite-off'`
///  * `deleteBookmarkCssClass`: CSS class to apply to the unbookmark link.
///    * default `'internal-link favorite-on'`
///  * `processingCssCLass`: CSS class to apply to the link when processing.
///    * default `'internal-link processing'`
///
/// ### Example
///
/// Given the following span to contain a bookmark control:
///
///     <span id="bookmarkControl"></span>
///
/// The following will initialize a bookmark control, using defaults for most options
///
///     var bookmarkControl = $('#bookmarkControl');
///     bookmarkControl.evolutionBookmark({
///         initialState: true,  // content is bookmarked
///     	contentId: 'C512D1A1-ED6C-442D-BC9d-3587CD711D35',
///     	contentTypeId: 'F7D226AB-D59F-475C-9D22-4A79E3F0EC07',
///     	contentTypeName: 'Blog Post',
///         onBookmark: function(contentId, contentTypeId, typeId, callback) {
///             alert(contentId + ' bookmarked!');
///
///             // ...perform AJAX-based saving of bookmark here...
///
///             // After a successful save, callback to notify the bookmark plugin
///     		callback();
///         },
///     	onUnbookmark: function(contentId, contentTypeId, typeId, callback) {
///             alert(contentId + ' unbookmarked!');
///
///             // ...perform AJAX-based saving of bookmark here...
///
///             // After a successful save, callback to notify the bookmark plugin
///     		callback();
///         }
///     });
///


/// @name ui.bookmark
/// @category Client Message
/// @description
///
/// ### ui.bookmark Message
///
/// [Client-side message](@messaging) raised and consumed by the [jQuery.evolutionBookmark plugin](@evolutionBookmark), allowing multiple instances of the plugin to stay in synchronization. The message is raised when the user bookmarks or unbookmarks a piece of content. Other scripts can also handle this event.
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('ui.bookmark', function(data) {
///         // handle the event
///     });
///
/// ### Data
///
///  * `contentId`: content id (string)
///  * `contentTypeId`: content type id (string)
///  * `typeId`: bookmark type id (optional string)
///  * `bookmarked`: if the content is bookmarked (boolean)
///
/* jQuery.evolutionBookmark plugin */

define('plugin.evolutionBookmark', function($, global, undef){

	var eventName = 'ui.bookmark',
		init = function(context) {
			context.toggle = $('<a></a>').attr({href: '#'});
        	context.element.append(context.toggle);

			context.toggle.evolutionToggleLink({
				onHtml: '<span></span>' + $.telligent.evolution.html.encode(applyTokens(context, context.settings.deleteBookmarkText)),
				offHtml: '<span></span>' + $.telligent.evolution.html.encode(applyTokens(context, context.settings.addBookmarkText)),
				processingHtml: '<span></span>' + $.telligent.evolution.html.encode(applyTokens(context, context.settings.processingText)),
				changeState: function(val) {
					toggleBookmark(val, context);
				},
				onTitle: applyTokens(context, context.settings.deleteBookmarkText),
            	offTitle: applyTokens(context, context.settings.addBookmarkText),
            	processingTitle: applyTokens(context, context.settings.processingText),
				onCssClass: context.settings.deleteBookmarkCssClass,
				offCssClass: context.settings.addBookmarkCssClass,
				processingCssClass: context.settings.processingCssClass,
				val: context.settings.initialState
			});
		},
		applyTokens = function(context, message) {
			return message.replace(/\{content_type_name\}/gi, context.settings.contentTypeName)
		},
		updateBookmark = function(context, isBookmarked) {
			$.telligent.evolution.messaging.publish(eventName, {
				contentId: context.settings.contentId,
				contentTypeId: context.settings.contentTypeId,
				typeId: context.settings.typeId,
				bookmarked: isBookmarked
			});
		},
		toggleBookmark = function(val, context) {
			if(val) {
				// bookmark
				context.settings.onBookmark(context.settings.contentId, context.settings.contentTypeId, context.settings.typeId, function(){
					updateBookmark(context, true);
				});
			} else {
				// unbookmark
				context.settings.onUnbookmark(context.settings.contentId, context.settings.contentTypeId, context.settings.typeId, function(){
					updateBookmark(context, false);
				});
			}
		},
		subscribeToUpdates = function(context) {
			$.telligent.evolution.messaging.subscribe(eventName, function(data) {
				if(data.contentId === context.settings.contentId
					&& data.contentTypeId === context.settings.contentTypeId
					&& data.typeId === context.settings.typeId)
				{
					if(context.toggle) {
						context.toggle.evolutionToggleLink('val', data.bookmarked);
					}
				}
			});
		};

	$.fn.evolutionBookmark = function(options) {
		var settings = $.extend({}, $.fn.evolutionBookmark.defaults, options || {});
		return this.each(function(){
			var context = {
				element: $(this),
				toggle: null,
				settings: settings
			};
			init(context);
			subscribeToUpdates(context);
		});
	};

	$.fn.evolutionBookmark.defaults = {
		// evolutionBookmark defaults
		contentId: '',
		contentTypeId: '',
		typeId: '',
		initialState: false,
		contentTypeName: '',
		onBookmark: function(contentId, contentTypeId, typeId, complete) {},
		onUnbookmark: function(contentId, contentTypeId, typeId, complete) {},
		deleteBookmarkText: 'Unbookmark {content_type_name}',
		addBookmarkText: 'Bookmark this {content_type_name}',
		processingText: '...',
		addBookmarkCssClass: 'internal-link favorite-off',
		deleteBookmarkCssClass: 'internal-link favorite-on',
		processingCssClass: 'internal-link processing'
	};

	return {};
}, jQuery, window);
 
 
/// @name evolutionComposer
/// @category jQuery Plugin
/// @description Textarea wrapper which can host separately-defined interactive textarea behaviors in a cooperative manner
///
/// ### jQuery.fn.evolutionComposer
///
/// The composer is a jQuery plugin which enhances a `textarea` element with a shell API, enabling plugins to add extra interactive functionality to the `textarea` in a cooperative manner. Composer plugins define when they should be activated and released based on states of the `textarea`, and can manipulate the `textarea`'s, text, size, highlights, and ultimately its value as returned to the client code.
///
/// Composer plugins enable [hashtag](@hashtags) and [@mention](@mentions) support on textareas via Evolution-provided plugins, though the composer is not limited to only these plugins.
///
/// Each composer instance also implements auto-resizing against the textarea via the [evolutionResize plugin](@evolutionResize).
///
/// ### Usage
///
/// Initializes a composer plugin against a `textarea`.
///
///     $('textarea.myTextArea').evolutionModerate(options)
///
/// Initialize a composer with [hashtags](@hashtags) and [@mentions](@mentions).
///
///     $('textarea.myTextArea').evolutionModerate({
///         plugins: ['hashtags', 'mentions']
///     });
///
/// Retrieves the current value of the Composer. In the case of usage of hashtags or mentions, the value will include the proper tokens for tags and mentions.
///
///     var value = $('textarea.myTextArea').evolutionModerate('val');
///
/// ### Options
///
///  * `plugins`: Array of Composer plugin objects or string names of Composer plugins
///
/// All other options are passed to Composer plugins.
///
/// ### Methods
///
/// #### val
///
/// Gets or sets the current value of the composer.
///
/// **Note:** This should be used instead of `$('textarea').val()`, as each Composer plugin gets the opportunity to mutate the value before it is returned to the caller.
///
///     // get a value
///     var value = $('textarea').evolutionComposer('val');
///
///     // set a value
///     $('textarea').evolutionComposer('val', 'new value');
///
/// #### onkeydown
///
/// Handles the keydown event within a Composer.
///
/// **Note**: This should be used instead of `$('textarea).on('keydown', fn)` as each Composer plugin gets the opportunity to conditionally interact and cancel this event.
///
///     $('textarea').evolutionComposer('onkeydown', function(e) {
///         // handle event
///     });
///
/// #### oninput
///
/// Handles the [input](https://developer.mozilla.org/en-US/docs/DOM/DOM_event_reference/input) event within a Composer.
///
/// **Note**: This should be used instead of `$('textarea).on('input', fn)` as each Composer plugin gets the opportunity to conditionally interact and cancel this event.  `Input` is shimmed in older browsers which do not natively support the event.
///
///     $('textarea').evolutionComposer('oninput', function(e) {
///         // handle event
///     });
///
///
/// #### resize
///
/// Resizes a Composer.
///
/// **Note**: This should be used instead of applying width and height directly to the `textarea` as each Composer plugin gets the opportunity to interact with this change.
///
///     var newWidth = 300,
///         newHeight = 200;
///     $('textarea').evolutionComposer('resize', newWidth, newHeight);
///
/// ### Composer Plugin API Methods
///
/// Composer plugins are objects defined within `jQuery.fn.evolutionComposer.plugins`. Composer plugins cooperate with each other, declaring when they should be active or inactive, and share in mutating the final state of the composer's value. Built-in plugins include [hashtags](@hashtags) and [@mentions](@mentions).
///
/// #### init
///
/// Called on each plugin passed to the Composer when the Composer is created.
///
/// *arguments*
///
///  * `context`: Composer plugin context
///
/// #### onTransform
///
/// Called on each plugin passed to the Composer whenever the value of the Composer changes, either through user interaction or through `evolutionComposer(`val`)`.
///
/// *arguments*:
///
///  * `context`: Composer plugin context
///
/// #### shouldActivate
///
/// When a plugin is not currently active, called on each plugin passed to the Composer on `input` events until one returns `true`. When a plugin returns `true`, that plugin is considered active and is passed key events exclusively (blocking other plugins) until the plugin releases control back to the composer.
///
/// An example usage of this technique is hashtag and @mention auto-complete selection mode, where typing '@' will trigger specific plugin-defined actions, UI, and event handlers to to run until a selection is made or cancelled.
///
/// *arguments*:
///
///  * `context`: Composer plugin context
///
/// *returns*:
///
///  * Boolean true or false
///
/// #### onActivate
///
/// Called on a plugin when it transitions to the active state due to user interaction and the `shouldActivate` method
///
/// *arguments*:
///
///  * `context`: Composer plugin context
///
/// #### onDeactivate
///
/// Called on a plugin when it transitions to the inactive state due to the plugin releasing itself via the `context`'s `release()` method.
///
/// *arguments*:
///
///  * `context`: Composer plugin context
///
/// #### val
///
/// Allows a plugin passed to the Composer an opportunity to mutate the value of the decorated `textarea` before it is returned to the caller of $('textarea').evolutionComposer('val'). In this manner, a Composer plugin can track internal state that is not visible to the user but is available as tokens within the final value returned to the caller, such as hashtag or @mention tokens.
///
/// *arguments*:
///
///  * `val`: Current raw value of the input
///  * `context`: Composer plugin context
///
/// *returns*:
///
///  * Transformed value, potentially modified by the plugin.
///
/// #### onkeydown
///
/// Handles `keydown` events on the Composer's `textarea`, but *only when the plugin defining the handler is active*.
///
/// *arguments*:
///
///  * `context`: Composer plugin context
///  * `event`: Event
///
/// #### onkeypress
///
/// Handles `keypress` events on the Composer's `textarea`, but *only when the plugin defining the handler is active*.
///
/// *arguments*:
///
///  * `context`: Composer plugin context
///  * `event`: Event
///
/// #### oninput
///
/// Handles `input` events on the Composer's `textarea`, but *only when the plugin defining the handler is active*.
///
/// *arguments*:
///
///  * `context`: Composer plugin context
///  * `event`: Event
///
/// ### Composer Plugin API Context
///
/// Each method of the Composer Plugin API is passed the current Composer context. The context exposes data to the plugin as well as enables manipulation of the composer via methods on the context.
///
/// #### settings
///
/// All options initially passed to Composer during its construction via `$('textarea').evolutionComposer(options)`.
///
/// #### input
///
/// The selected `textarea` elements decorated by the Composer instance.
///
/// #### data
///
/// Stores or retrieves contextual data against a plugin instance of the composer instance.
///
///     // store data
///     context.data(key, value);
///
///     // retrieve data
///     var value = context.data(key);
///
/// #### val
///
/// Returns the current raw value of the composer, not processed by other plugins.
///
///     var value = context.val()
///
/// #### release
///
/// When active, `context.release()` releases control back to the parent `evolutionComposer` plugin. Only when a plugin is active does it receive `keypress`, `keydown`, and `input` events.
///
///     context.release();
///
/// #### caretPosition
///
/// Returns the Composer's current caret position index.
///
///     var position = context.caretPosition();
///
/// #### currentWord
///
/// Returns an object regarding the current word surrounding a caret position.
///
///     var currentWord = context.currentWord();
///
/// Object contains the properties:
///
///  * `value`: word value
///  * `start`: word start index
///  * `stop`: word stop index
///
/// #### replace
///
/// Replaces text on the input.
///
/// *parameters*
///
///  * `start`: index at which to begin replacement
///  * `stop`: index at which to end replacement
///  * `newValue`: new value to splice in
///
/// #### clearHighlights
///
/// Clears any current highlights on the input.
///
///     context.clearHighlights();
///
/// #### addHighlight
///
/// Adds a highlight to the input. The highlight does not render immediately, but is instead tracked until `renderHighlights` is called.
///
///     context.addHighlight({ 5, 20, 'myClassName' });
///
/// *parameters*
///
///  * `start`: start index for the highlight
///  * `stop`: stop index for the highlight
///  * `className`: CSS class name to apply to the highlight
///
/// #### renderHighlights
///
/// Renders all highlights queued up by calls to `addHighlight`.
///
///

define('plugin.evolutionComposer', ['events.textinput'], function(textinput, $, global, undef){

	var KEY = '__COMPOSER_CONTEXT',
		getContextFor = function(input, options) {
			input = $(input);
			var context = input.data(KEY);
			if(!context && options) {
				context = initiateAndBuildComposerContext(input, options);
				input.data(KEY, context);
			}
			return context;
		},
		initiateAndBuildComposerContext = function(input, options) {
			var settings = $.extend({}, $.fn.evolutionComposer.defaults, options || {}),
				composerContext = {
					input: input,
					settings: settings,
					plugins: $.map(settings.plugins, function(plugin) {
						if(typeof plugin == 'string') {
							return $.fn.evolutionComposer.plugins[plugin];
						} else {
							return plugin;
						}
					}),
					ranges: [],
					activePlugin: false
				};
			composerContext.pluginContext = buildPluginContext(composerContext);
			composerContext.input.evolutionHighlight();
			bindKeys(composerContext);
			return composerContext;
		},
		buildPluginContext = function(composerContext) {
			var pluginContext = {
				settings: composerContext.settings,
				input: composerContext.input,
				data: function(key, newValue) {
					if(typeof newValue !== 'undefined') {
						return composerContext.input.data(key, newValue);
					} else {
						return composerContext.input.data(key);
					}
				},
				val: function(newvalue) {
					if(typeof newvalue !== 'undefined') {
						return composerContext.input.val(newvalue);
					} else {
						return composerContext.input.val();
					}
				},
				release: function() {
					if(composerContext.activePlugin.onDeactivate) {
						composerContext.activePlugin.onDeactivate.call(composerContext.input, composerContext.pluginContext);
					}
					composerContext.activePlugin = false;
				},
				caretPosition: function() {
					return getCaretPosition(composerContext.input);
				},
				currentWord: function(options) {
					return currentWord(composerContext, $.extend({
						allowedWhiteSpaceBeforeCaret: 0,
						allowedWhiteSpaceAfterCaret: 0
					}, options || {}));
				},
				replace: function(start, stop, newText) {
					var currentVal = composerContext.input.val();
					composerContext.input.val(currentVal.substring(0, start) + newText + currentVal.substring(stop));
				},
				clearHighlights: function(rangeClass) {
					var newRanges = [];
					$.each(composerContext.ranges, function(i, range) {
						if(!rangeClass || range.className !== rangeClass) {
							newRanges.push(range);
						}
					});
					composerContext.ranges = newRanges;
					composerContext.input.evolutionHighlight({
						ranges: composerContext.ranges
					});
				},
				addHighlight: function(range) {
					composerContext.ranges.push(range);
				},
				renderHighlights: function() {
					composerContext.input.evolutionHighlight({
						ranges: composerContext.ranges
					});
				}
			};
			return pluginContext;
		},
		bindKeys = function(composerContext) {
			composerContext.input.bind({
				keypress: function(e) {
					delegateToPlugin(composerContext, 'onkeypress', e);
				},
				keydown: function(e) {
					delegateToPlugin(composerContext, 'onkeydown', e);
				},
				textinput: function(e) {
					conditionallyActivatePlugin(composerContext, e);
					delegateToPlugin(composerContext, 'oninput', e);
					runTransforms(composerContext);
				}
			});
		},
		delegateToPlugin = function(composerContext, eventName, e) {
			var delegatedResponse = true;
			if(composerContext.activePlugin && composerContext.activePlugin[eventName]) {
				delegatedResponse = composerContext.activePlugin[eventName].call(e.target, composerContext.pluginContext, e);
			}
			if(!delegatedResponse) {
				e.preventDefault();
			} else if(composerContext[eventName]) {
				delegatedResponse = composerContext[eventName].call(e.target, e);
				if(!delegatedResponse) {
					e.preventDefault();
				}
			}
		},
		conditionallyActivatePlugin = function(composerContext, e) {
			if(!composerContext.activePlugin) {
				$.each(composerContext.plugins, function(i, plugin) {
					if(plugin.shouldActivate && plugin.shouldActivate.call(composerContext.input, composerContext.pluginContext) === true) {
						composerContext.activePlugin = plugin;
						if(plugin.onActivate) {
							plugin.onActivate.call(composerContext.input, composerContext.pluginContext);
						}
						return false;
					}
				});
			}
		},
		runTransforms = function(composerContext) {
			$.each(composerContext.plugins, function(i, plugin) {
				if(plugin.onTransform) {
					plugin.onTransform.call(composerContext.input, composerContext.pluginContext);
				}
			});
		},
		isWhiteSpace = function(character) {
			return character === '\n' || character === '\t';
		},
		currentWord = function(composerContext, options) {
			var caretPosition = options.caretPosition || getCaretPosition(composerContext.input),
				word = "",
				currentValue = $(composerContext.input).val(),
				remainder = "",
				whiteSpaceIndex = 0,
				start = caretPosition,
				i = 0,
				previousWhiteSpaceIndex,
				mextWhiteSpaceIndex;
			if(caretPosition < currentValue.length && !isWhiteSpace(currentValue[caretPosition])) {
				remainder = currentValue.substring(caretPosition),
				whiteSpaceIndex = getPositionOfFirstWhiteSpace(remainder);
				if(whiteSpaceIndex < 0) {
					whiteSpaceIndex = remainder.indexOf('\n');
				}
				if(whiteSpaceIndex < 0) {
					whiteSpaceIndex = remainder.indexOf('\t');
				}
				if(whiteSpaceIndex < 0) {
					whiteSpaceIndex = remainder.length;
				}
				for(i = 0; i < options.allowedWhiteSpaceAfterCaret; i++) {
					if(whiteSpaceIndex > 0) {
						var whiteSpaceRemainder = currentValue.substring(caretPosition + whiteSpaceIndex + 1);
						nextWhiteSpaceIndex = getPositionOfFirstWhiteSpace(whiteSpaceRemainder);
						nextWhiteSpaceIndex = nextWhiteSpaceIndex === -1 ? whiteSpaceRemainder.length : nextWhiteSpaceIndex;
						if(nextWhiteSpaceIndex > 0) {
							whiteSpaceIndex += (nextWhiteSpaceIndex + 1);
						} else {
							break;
						}
					}
				}
				if(whiteSpaceIndex > 0) {
					start = 0;
					word = word + remainder.substring(0, whiteSpaceIndex);
				}
			}
			if(caretPosition > 0 && !isWhiteSpace(currentValue[caretPosition - 1])) {
				remainder = currentValue.substring(0, caretPosition),
				whiteSpaceIndex = getPositionOfLatestWhiteSpace(remainder);
				for(i = 0; i < options.allowedWhiteSpaceBeforeCaret; i++) {
					if(whiteSpaceIndex > 0) {
						previousWhiteSpaceIndex = getPositionOfLatestWhiteSpace(currentValue.substring(0, whiteSpaceIndex));
						if(previousWhiteSpaceIndex !== whiteSpaceIndex) {
							whiteSpaceIndex = previousWhiteSpaceIndex;
						} else {
							break;
						}
					}
				}
				if(whiteSpaceIndex === remainder.length) {
					whiteSpaceIndex = remainder.lastIndexOf('\n');
				}
				if(whiteSpaceIndex === remainder.length) {
					whiteSpaceIndex = remainder.lastIndexOf('\t');
				}
				if(whiteSpaceIndex === remainder.length) {
					whiteSpaceIndex = remainder.length - 1;
				}
				if(whiteSpaceIndex < remainder.length - 1) {
					start = whiteSpaceIndex + 1;
					word = remainder.substring(start) + word;
				}
			}
			if (options.additionalWhiteSpaceSymbols) {
				for (var i = 0; i < word.length; i++) {
					if (options.additionalWhiteSpaceSymbols.indexOf(word[i]) == -1) {
						word = word.substring(i);
						start = start + i;
						break;
					}
				}
			}
			return { value: word, start: start, stop: start + word.length };
		},
		getPositionOfFirstWhiteSpace = function(value) {
			var whiteSpaceIndices = [];

			$.each([' ','\t','\n'], function(i, ws) {
				var whiteSpaceIndex = value.indexOf(ws);
				if(whiteSpaceIndex >= 0)
					whiteSpaceIndices.push(whiteSpaceIndex);
			});

			whiteSpaceIndices.sort();
			if(whiteSpaceIndices.length > 0) {
				return whiteSpaceIndices[0];
			} else {
				return -1;
			}
		},
		getPositionOfLatestWhiteSpace = function(value) {
			var whiteSpaceIndices = [],
				whiteSpaceIndex;

			$.each([' ','\t','\n'], function(i, ws) {
				var whiteSpaceIndex = value.lastIndexOf(ws);
				if(whiteSpaceIndex >= 0)
					whiteSpaceIndices.push(whiteSpaceIndex);
			});

			whiteSpaceIndices.sort();
			if(whiteSpaceIndices.length > 0) {
				return whiteSpaceIndices[whiteSpaceIndices.length - 1];
			} else {
				return -1;
			}
		},
		getCaretPosition = function(input) {
			input = input.get(0);
			if (input.selectionStart) {
				return input.selectionStart;
			} else if (document.selection) {
				var range = document.selection.createRange();
				if (range === null) { return 0; }
				var textRange = input.createTextRange(),
				textRangeClone = textRange.duplicate();
				textRange.moveToBookmark(range.getBookmark());
				textRangeClone.setEndPoint('EndToStart', textRange);
				return textRangeClone.text.length;
			}
			return 0;
		},
		autoResize = function(composerContext) {
			if(typeof $.fn.evolutionResize !== 'undefined') {
				composerContext.input.evolutionResize()
					.bind('evolutionResize', function(){
						composerContext.input.evolutionHighlight('resize',
							composerContext.input.width(),
							composerContext.input.height());
					});
			}
		};

	var methods = {
		init: function(options) {
			return this.filter('textarea').each(function(){
				var elm = $(this);
				var context = getContextFor(elm, options);
				autoResize(context);
				context.input.evolutionHighlight('resize',
					context.input.width(),
					context.input.height());
				if(context !== null) {
					$.each(context.plugins, function(i, plugin){
						if(plugin.init) {
							plugin.init.call(elm, context.pluginContext);
						}
					});
				}
				if (options.focus) {
					setTimeout(function(){
						elm.focus();
					}, 10);
				}
			});
		},
		val: function(newValue) {
			if(typeof newValue !== 'undefined') {
				var context = getContextFor(this);
				if(context) {
					context.input.val(newValue);
					runTransforms(context);
				}
			} else {
				var context = getContextFor(this),
					value = '';
				if(context) {
					value = context.input.val();
					$.each(context.plugins, function(i, plugin) {
						if(plugin.val) {
							value = plugin.val.call(context.input, value, context.pluginContext);
						}
					});
				}
				return value;
			}
			return this;
		},
		onkeydown: function(fn) {
			var context = getContextFor(this);
			if(context) {
				context.onkeydown = fn;
			}
			return this;
		},
		oninput: function(fn) {
			var context = getContextFor(this);
			if(context) {
				context.oninput = fn;
			}
			return this;
		},
		resize: function(width, height) {
			var context = getContextFor(this);
			if(context) {
				context.input.evolutionHighlight('resize',width,height);
			}
			return this;
		}
	};

	$.fn.evolutionComposer = function(method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +	 method + ' does not exist on jQuery.evolutionComposer');
		}
	};
	$.fn.evolutionComposer.defaults = {
		plugins: [],
		focus: true
	};
	$.fn.evolutionComposer.plugins = {}

	return {};
}, jQuery, window);
 
 
/// @name evolutionHighlight
/// @category jQuery Plugin
/// @description Enables highlighting ranges of text in a textarea
///
/// ### jQuery.fn.evolutionHighlight
///
/// This plugin decorates `<textarea>` elements to support highlighting of ranges with CSS class names. Internally, a mirror of the `textarea` is created behind it, and highlighted ranges are rendered as `span` elements with CSS classes applied. This is used by the [evolutionComposer](@evolutionComposer) plugin to support highlighting.
///
/// ### Usage
///
/// Highlights two ranges in a `textarea`:
///
///     $('textarea.myTextArea').evolutionHighlight({
///         ranges: [
///             { start: 5, stop: 10, className: 'myHighlightStyle' },
///             { start: 13, stop: 34, className: 'myHighlightStyle' }
///         ]
///     });
///
/// ### Options
///
///  * `ranges`: array of ranges to highlight. Each range requires
///    * `start`: Start Index
///    * `stop`: Stop Index
///    * `className`: CSS class name to apply to a wrapper `span`. The class should ideally only define a background color, and not any padding or margin.
///
/// ### Methods
///
/// #### clear
///
/// Clears highlights.
///
///     $('textarea.myTextArea').evolutionHighlight('clear');
///
/// #### resize
///
/// Safely resizes a `textarea` already decorated with `evolutionHighlight`.
///
///     $('textarea.myTextArea').evolutionHighlight('resize', width, height);
///
/// #### css
///
/// Safely applies CSS to a `textarea` already decorated with `evolutionHighlight`.
///
///     $('textarea.myTextArea').evolutionHighlight('css', {
///         border: '2px solid red',
///         fontSize: '15px'
///     });
///

define('plugin.evolutionHighlight', function($, global, undef){

    var highlighterKey = '_HIGHLIGHTER_CONTEXT',
        getContext = function(selection, options) {
            var context = selection.data(highlighterKey);
            if(typeof context === 'undefined' || context === null) {
                context = buildContext(selection, options);
                selection.data(highlighterKey, context);
            }
            return context;
        },
        buildContext = function(selection, options) {
            var context = {
                selection: selection.filter('textarea'),
                settings: $.extend({}, $.fn.evolutionHighlight.defaults, options || {})
            };
            buildHighlightingContainer(context);
            return context;
        },
        buildHighlightingContainer = function(context) {
			context.wrapper = $('<div></div>');
			context.mirror = $('<div></div>');

			// remove margins from textarea and apply to wrapper
			var wrapperStyle = {
				position: 'relative',
				width: context.selection.outerWidth(),
				height: context.selection.outerHeight()
			};
			$.each(['margin-left','margin-right','margin-top','margin-bottom'], function(i, styleName) {
				wrapperStyle[styleName] = context.selection.css(styleName);
				context.selection.css(styleName, 0);
			});

			// capture textarea styles to apply to mirror
            var mirrorStyle = {
				position: 'absolute',
				top: '0px',
				left: '0px',
				zIndex: '0',
				borderTopColor: 'transparent',
				borderBottomColor: 'transparent',
				borderLeftColor: 'transparent',
				borderRightColor: 'transparent',
				backgroundColor: context.selection.css('backgroundColor'),
				color: 'transparent',
				width: context.selection.width(),
				height: context.selection.height(),
				overflow: 'hidden',
				whiteSpace: 'normal'
			};
            $.each(context.settings.styles, function(i,styleName){
                mirrorStyle[styleName] = context.selection.css(styleName);
            });

			// new styles to apply to text area
			var textAreaStyle = {
				position: 'absolute',
				top: '0px',
				left: '0px',
				zIndex: '1',
				backgroundColor: 'transparent',
				width: context.selection.width(),
				height: context.selection.height()
			};

			// apply styles
			context.wrapper.css(wrapperStyle).addClass('highlighter');
			context.mirror.css(mirrorStyle);
			context.selection.css(textAreaStyle);

			// set background-color
			context.mirror.css('color', context.mirror.css('background-color'));

			// rearrange DOM
			context.selection.before(context.wrapper);
			context.wrapper.append(context.selection);
			context.wrapper.append(context.mirror);
        },
        rDoubleSpace = /\s\s/gi,
        rBreak = /\n/gi,
		highlight = function(context) {
			// prepare highlights
			var ranges = {};
			$.each(context.settings.ranges, function(i, range) {
				ranges[range.start] = ranges[range.start] || [];
	            ranges[range.start].push(range);
	            ranges[range.stop] = ranges[range.stop] || [];
	            ranges[range.stop].push(range);
			});

            var rawValue = context.selection.val();
                newValue = [],
                spanDepth = 0;
            for(var i = 0; i < rawValue.length; i++) {
                if(typeof ranges[i] !== 'undefined') {
                    $.each(ranges[i], function(h, range) {
                        if(range.start === i) {
                            newValue[newValue.length] = '<span class="'+range.className+'" style="white-space:normal;">';
                            spanDepth++;
                        } else {
                            newValue[newValue.length] = '</span>';
                            spanDepth--;
                        }
                    });
                }
                newValue[newValue.length] = rawValue.charAt(i);
            }
            if(spanDepth > 0) {
                newValue[newValue.length] = '</span>';
            }
            var newRawValue = newValue.join('').replace(rBreak,'<br />').replace(rDoubleSpace,'&nbsp; ');
            // not using .html() as it executes js.  Not using .innerHTML directly on mirror as it errors in IE
            var mirroredValueWrapper = document.createElement('span');
            mirroredValueWrapper.innerHTML = newRawValue;
            context.mirror.empty().get(0).appendChild(mirroredValueWrapper);
		};
		var methods = {
			init: function(options) {
		        var context = getContext(this, options);
				context.settings = $.extend({}, $.fn.evolutionHighlight.defaults, options || {});
				highlight(context);
		        return this;
			},
			clear: function() {
				var context = getContext(this, null);
				if(context === null)
					return;
				context.mirror.html('');
				return this;
			},
			resize: function(width, height) {
				var context = getContext(this, null);
				if(context === null)
					return;
				var newStyle = {
					width: width,
					height: height
				};
				context.mirror.css(newStyle);
				context.selection.css(newStyle);
				context.wrapper.css({
					width: context.selection.outerWidth(),
					height: context.selection.outerHeight()
				});
				return this;
			},
			css: function(css) {
				var context = getContext(this, null);
				if(context === null)
					return;
				context.wrapper.css(css);
				return this;
			}
		};
    $.fn.evolutionHighlight = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' +  method + ' does not exist on jQuery.evolutionHighlight');
        }
    };
    $.fn.evolutionHighlight.defaults = {
        ranges: [],
        styles: ['border-top-width','border-top-style','border-bottom-width',
            'border-bottom-style','border-right-width','border-right-width-value',
            'border-right-style','border-right-style-value','border-left-width',
            'border-left-width-value','border-left-style','border-left-style-value',
            'font-family','font-size','font-size-adjust','font-stretch',
            'font-style','font-variant','font-weight',
            'padding-bottom','padding-left','padding-right','padding-top',
            'letter-spacing','line-height','text-align','text-indent','word-spacing']
    };

	return {};
}, jQuery, window);
 
 
﻿/// @name evolutionInlineTagEditor
/// @category jQuery Plugin
/// @description Renders a tag editor
///
/// ### jQuery.fn.evolutionInlineTagEditor
///
/// This plugin supports rendering a tag editor supporing editing and selecting of tags.
///
/// ### Usage
///
///     $('SELECTOR').evolutionTagEditor(options)
///
/// where 'SELECTOR' is an a, span, or div tag.
///
/// ### Options
///
///  * `allTags`: (array of strings) List of all tags available in this context
///    * default `['']`
///  * `currentTags`: (array of strings) List of tags associated to the current content
///    * default `['']`
///  * `editorCssClass`: (string) CSS class applied to the editor pop-up
///    * default `'tags-editor'`
///  * `editButtonText`: (string) Label for the element identified by the selector, to open the editor pop-up
///    * default `'Edit'`
///  * `selectTagsText`: (boolean) Label to open the tag selector within the editor pop-up
///    * default `'Select Tags'`
///  * `saveTagsText`: Label for the save button on the editor pop-up
///    * default `'Save'`
///  * `cancelText`: Label for the cancel button on the editor pop-up
///    * default `'Cancel'`
///  * `onSave`: (function) callback function when tags are saved. The function is passed an array of strings (the list of tags) and a callback function to be called when saving is complete.
///
/// ### Example
///
/// Given the following span to contain a inline tag editor control:
///
///     <a id="inlineTagEditorControl"></a>
///
/// The following will initialize an inline tag editor control, using defaults for most options
///
///     var inlineTagEditorControl = $('#inlineTagEditorControl');
///     inlineTagEditorControl.evolutionInlineTagEditor({
///     	allTags: ['tag1', 'tag2', 'tag3'],
///     	currentTags: ['tag2']
///     	onSave: function(tags, callback) {
///     		alert('Saving tags: ' + tags.join(', '));
///
///             // ...perform AJAX-based saving of tags here...
///
///             // After a successful save, callback to notify the inline tag editor plugin
///     		callback();
///         }
///     });
///

define('plugin.evolutionInlineTagEditor', function($, global, undef){

	var api = {};

	var EVENT_NAMESPACE = '.evolutionInlineTagEditor',
		CONTEXT_KEY = 'evolutionTagInlineEditor_context',
		_saveTags = function (context, tags) {
			if (!context.internal.isInitialized)
				return;

			var inTags = tags.split(/[,;]/g);
			var outTags = [];
			for(var i = 0; i < inTags.length; i++)
			{
				var tag = $.trim(inTags[i]);
				if (tag)
					outTags[outTags.length] = tag;
			}

			var success = function() { context.settings.currentTags = outTags; };
			context.settings.onSave(outTags, success);
		},
		_init = function (options) {
			return this.each(function () {
				var context = {
					settings: $.extend({}, $.fn.evolutionInlineTagEditor.defaults, options || {}),
					internal: {
						state: $(this)
					}
				};

				$(this).data(CONTEXT_KEY, context);
				if (!$(this).html()) {
					$(this).text(context.settings.editButtonText);
				}

				_initialize(context);
			});
		},
		_initialize = function(context) {
			var editorContainer = $('<div></div>')
					.addClass(context.settings.editorCssClass)
					.attr('style', 'display: none;');

			var label = $('<label for="tag-area"></label>').hide();

			var editorTextArea = $('<textarea id="tag-area"></textarea>')
					.attr('cols', '40')
					.attr('rows', '2');

			if (context.settings.allTags && context.settings.allTags.length > 0)
				var selectTagsButton = $('<input type="button" />')
						.val(context.settings.selectTagsText);

			var saveButton = $('<input type="button" />')
					.val(context.settings.saveTagsText);

			var cancelButton = $('<input type="button" />')
					.val(context.settings.cancelText);

			var editorButtonsContainer = $('<div style="white-space: nowrap; padding-top: 4px;"><table width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><td align="left"></td><td align="right"></td></tr></tbody></table></div>');
			editorButtonsContainer.find('td:eq(1)').append(saveButton);
			editorButtonsContainer.find('td:eq(1)').append(cancelButton);
			if (selectTagsButton)
				editorButtonsContainer.find('td:first').append(selectTagsButton);

			editorContainer.append(label);
			editorContainer.append(editorTextArea);
			editorContainer.append(editorButtonsContainer);

			editorTextArea.evolutionTagTextBox({allTags:context.settings.allTags});
			editorContainer.glowPopUpPanel({
					'cssClass':context.settings.editorCssClass,
					'position':'updown',
					'zIndex':500,
					'hideOnDocumentClick':false
				});

			$(context.internal.state).bind('click' + EVENT_NAMESPACE, function(e){
						editorContainer.glowPopUpPanel('hide').glowPopUpPanel('show', $(this));
						editorTextArea.val(context.settings.currentTags.length > 0 ? context.settings.currentTags.join(', '): '');
						return false;
					});

			saveButton.bind('click' + EVENT_NAMESPACE, function(e){
						_saveTags(context, editorTextArea.attr('value'));
						editorContainer.glowPopUpPanel('hide');
						return false;
					});

			cancelButton.bind('click' + EVENT_NAMESPACE, function(e){
						editorContainer.glowPopUpPanel('hide');
						return false;
					});

			if (selectTagsButton)
				selectTagsButton.bind('click' + EVENT_NAMESPACE, function(e){
							editorTextArea.evolutionTagTextBox('openTagSelector');
							return false;
						});

			context.internal.state.after(editorContainer);
			context.internal.isInitialized = true;
		};

	$.fn.evolutionInlineTagEditor = function (method) {
		if (method in api) {
			return api[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return _init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.fn.evolutionInlineTagEditor');
		}
	};

	$.extend($.fn.evolutionInlineTagEditor, {
		defaults: {
			allTags: [''],
			currentTags: [''],
			editorCssClass: 'tags-editor',
			editButtonText: 'Edit',
			selectTagsText: 'Select Tags',
			saveTagsText: 'Save',
			cancelText: 'Cancel',
			onSave: function(tags, success) { }
		}
	});

	return {};
}, jQuery, window);
 
 
/// @name evolutionLike
/// @category jQuery Plugin
/// @description Renders a like indicator and toggle
///
/// ### jQuery.fn.evolutionLike
///
/// This plugin renders a templatable, interactive, like indicator and toggle. It is typically not called directly, but instead via usage of the [like UI component](@like). Raises and responds to [ui.like](@ui.like) messages.
///
/// ### Usage
///
/// Initializes a new plugin instance against a span:
///
///     $('span.mySelector').evolutionLike(options);
///
/// `jQuery.fn.evolutionLike` also defines a method for initializing "Who Liked?" modal popups to be bound to click events via event delegation. This is also not typically called directly, but instead via usage of the [like UI component](@like).
///
///     $.fn.evolutionLike.delegatePopups(options);
///
/// ### Options
///
/// #### Primary Options
///
///  * `contentId`: (string) Content Id
///  * `contentTypeId`: (string) Content Type Id
///  * `typeId`: (string) Like Type Id
///  * `initialState`: (boolean) Currently liked by the accessing user
///  * `initialMessage`: (string) Current like message
///  * `initialCount`: (number) Initial like count
///  * `format`: (string) text format defining the presentation of the like. While the string can contain any text, three specific tokens are replaced when they exist:
///    * `{count}`: Current like count (updated upon [ui.like](@ui.like) messages)
///    * `{message}`: Current message (updated upon [ui.like](@ui.like) messages)
///    * `{toggle}`: Link which toggles a like, calling `onLike` or `onUnlike`
///  * `onLike`: Function which implements what happens when a like `{toggle}` is toggled `on`. Automatically defined by Evolution within the [like UI component](@like), but can be overridden. Passed parameters:
///      * `contentId`: Content Id being liked
///      * `contentTypeId`: Content Type Id being liked
///      * `typeId`: Like Type Id
///      * `complete`: Callback to invoke when liking has completed.
///  * `onUnlike`: Function which implements what happens when a like `{toggle}` is toggled `off`. Automatically defined by Evolution within the [like UI component](@like), but can be overridden. Passed parameters:
///      * `contentId`: Content Id being liked
///      * `contentTypeId`: Content Type Id being liked
///      * `typeId`: Like Type Id
///      * `complete`: Callback to invoke when liking has completed.
///
/// #### Resource Options
///
/// Defined (and localized) globally by Evolution, but can be overridden.
///
///  * `likeText`: Like toggle text
///    * default: `'Like'`
///  * `unlikeText`: Unlike toggle text
///    * default: `'Unlike'`
///  * `whoLikesOtherText`: Like `{message}` value when only one (non-current) user likes the content
///    * default: `'<a href="{user_profile_url}" class="internal-link view-user-profile">{user_display_name}</a> likes this'`
///  * `whoLikesOtherTwoText`: Like `{message}` value when two users (not including the current user) like the content
///    * default: `'<a href="{user_profile_url}" class="internal-link view-user-profile">{user_display_name}</a> <span class="who-likes">and 1 other</span> like this.'`
///  * `whoLikesOtherMultipleText`: Like `{message}` value when three or more users (not including the current user) like the content
///    * default: `'<a href="{user_profile_url}" class="internal-link view-user-profile">{user_display_name}</a> and <span class="who-likes">{count} others</span> like this.'`
///  * `whoLikesAccessingText`: Like `{message}` value the current user likes the content
///    * default: `'You like this'
///  * `whoLikesAccessingTwoText`: Like `{message}` value when two users (including the current user) like the content
///    * default: `'You and <span class="who-likes">1 other</span> like this'`
///  * `whoLikesAccessingMultipleText`: Like `{message}` value when three or more users (including the current user) like the content
///    * default: `'You and <span class="who-likes">{count} others</span> like this'`
///
/// #### Delegated Popup Modal Options
///
/// For calls to `$.fn.evolutionLike.delegatePopups(options)`
///
///  * `modalTitleText`: Modal title
///    * default: `'People who like this'`
///  * `containerSelector`: Container elements on which to bind 'click' events to initiate modals
///    * default: '.content-fragment'
///  * `delegatedSelector`: Specific elements on which to delegate 'click' events.
///    * default: '.ui-like'
///  * `onList`: Function which returns a list of users who have liked a content item. Passed parameters:
///    * `contentId`: Content Id
///    * `contentTypeId`: Content Type Id
///    * `typeId`: Like Type Id
///    * `complete`: Callback to invoke when liking has completed.
///    * `pageSize`: Likes to return per page
///    * `pageIndex`: Page index
///  * `onOptions`: A function which parses an element for data to use in calls to `onList`. Passed the element which triggered the delegated event handler. Must return an object with `contentId`, `contentTypeId`, and `typeId`.
///  * `likersTemplate`: [Template](@template) defining the display of a page of likers within the modal
///  * `likersPopupTemplate`: [Template](@template) defining the modal
///
/// *default `likersTemplate`*:
///
///     <% foreach(likers, function(liker) { %>
///          <li class="content-item">
///              <div class="full-post-header"></div>
///              <div class="full-post">
///                  <span class="avatar">
///                      <a href="<%: liker.profileUrl %>"  class="internal-link view-user-profile">
///                          <img src="<%: liker.avatarUrl %>" alt="" border="0" width="32" height="32" style="width:32px;height:32px" />
///                      </a>
///                  </span>
///                  <span class="user-name">
///                      <a href="<%: liker.profileUrl %>" class="internal-link view-user-profile"><%= liker.displayName %></a>
///                  </span>
///              </div>
///              <div class="full-post-footer"></div>
///          </li>
///     <% }); %>
///
/// *default `likersPopupTemplate`*:
///
///     <div class="who-likes-list">
///          <div class="content-list-header"></div>
///          <ul class="content-list"><%= likers %></ul>
///          <div class="content-list-footer"></div>
///          <% if(hasMorePages) { %>
///              <a href="#" class="show-more"><%= showMoreText %></a>
///          <% } %>
///     </div>
///

/// @name ui.like
/// @category Client Message
/// @description Raised on user likes
///
/// ### ui.like Message
///
/// [Client-side message](@messaging) raised and consumed by the [jQuery.evolutionLike plugin](@evolutionLike), allowing multiple instances of the plugin to stay in synchronization. The message is raised when the user likes or unlikes a piece of content. Other scripts can also handle this event.
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('ui.like', function(data) {
///         // handle the event
///     });
///
/// ### Data
///
///  * `contentId`: content id (string)
///  * `contentTypeId`: content type id (string)
///  * `typeId`: content like type id (optional string)
///  * `count`: current count of likes for the item
///  * `liked`: when true, message represents a like being added
///  * `message`: text representation of current likes (e.g. X, Y, and Z others liked)
///

define('plugin.evolutionLike', function($, global, undef){

	var eventName = 'ui.like',
		popupsInited = false,
		init = function(context) {
			// initial pre-templating
			var initialContent = context.settings.format;
			if(context.hasCount) {
				initialContent = initialContent.replace(/\{count\}/gi, '<span class="like-count who-likes"></span>');
			}
			if(context.hasToggle) {
				initialContent = initialContent.replace(/\{toggle\}/gi, '<span class="like-toggle"><a href="#" class="internal-link"></a></span>');
			}
			if(context.hasMessage) {
				initialContent = initialContent.replace(/\{message\}/gi, '<span class="like-message"></span>');
			}

			context.element.html(initialContent);

			// apply template and grab ui elements from templated control
			if(context.hasCount) {
				context.countWrapper = context.element.find('span.like-count');
				context.countWrapper.html(context.settings.initialCount);
				context.countWrapper.attr('data-count',context.settings.initialCount);
			}
			if(context.hasToggle) {
				context.toggleLink = context.element.find('span.like-toggle a');
				context.toggleLink.evolutionToggleLink({
					onHtml: '<span></span>' + context.settings.unlikeText,
					offHtml: '<span></span>' + context.settings.likeText,
					onTitle: '',
					offTitle: '',
					processingHtml: '<span></span>...',
					changeState: function(val) {
						toggleLike(val, context);
					},
					onCssClass: 'internal-link like-on',
					offCssClass: 'internal-link like-off',
					processingCssClass: 'internal-link processing',
					val: (context.settings.initialState === 'true')
				});
			}
			if(context.hasMessage) {
				context.messageWrapper = context.element.find('span.like-message');
				context.messageWrapper.html(context.settings.initialMessage);
			}
		},
		updateLike = function(context, count, isNew) {
			var message = '';
			if(count.count > 0) {
				var offset = 0;
				if(isNew) {
					if(count.count === 1) {
						message = context.settings.whoLikesAccessingText;
					} else if(count.count === 2) {
						message = context.settings.whoLikesAccessingTwoText;
						offset = -1;
					} else if(count.count > 2) {
						message = context.settings.whoLikesAccessingMultipleText;
						offset = -1;
					}
				} else {
					if(count.count === 1) {
						message = context.settings.whoLikesOtherText;
					} else if(count.count === 2) {
						offset = -1;
						message = context.settings.whoLikesOtherTwoText;
					} else if(count.count > 2) {
						offset = -1;
						message = context.settings.whoLikesOtherMultipleText;
					}
				}
				message = message.replace(/\{count\}/gi, count.count + offset);
				message = message.replace(/\{user_profile_url\}/gi, count.latestLike.User.ProfileUrl);
				message = message.replace(/\{user_display_name\}/gi, count.latestLike.User.DisplayName);
			}

			$.telligent.evolution.messaging.publish(eventName, {
				contentId: context.settings.contentId,
				contentTypeId: context.settings.contentTypeId,
				typeId: context.settings.typeId,
				count: count.count,
				liked: isNew,
				message: message
			});
		},
		toggleLike = function(val, context) {
			if(val) {
				// like
				context.settings.onLike(context.settings.contentId, context.settings.contentTypeId, context.settings.typeId, function(data){
					updateLike(context, data, true);
				});
			} else {
				// unlike
				context.settings.onUnlike(context.settings.contentId, context.settings.contentTypeId, context.settings.typeId, function(data){
					updateLike(context, data, false);
				});
			}
		},
		subscribeToUpdates = function(context) {
			$.telligent.evolution.messaging.subscribe(eventName, function(data) {
				if(data.contentId === context.settings.contentId
					&& data.contentTypeId === context.settings.contentTypeId
					&& data.typeId === context.settings.typeId)
				{
					if(context.hasToggle) {
						context.toggleLink.evolutionToggleLink('val', data.liked);
					}
					if(context.hasCount) {
						context.countWrapper.html(data.count);
						context.countWrapper.attr('data-count', data.count);
					}
					if(context.hasMessage) {
						context.messageWrapper.html(data.message);
					}
				}
			});
		};

	$.fn.evolutionLike = function(options) {
		var settings = $.extend({}, $.fn.evolutionLike.defaults, options || {});
		return this.each(function(){
			var context = {
				element: $(this),
				settings: settings,
				hasCount: settings.format.indexOf('{count}') >= 0,
				hasToggle: settings.format.indexOf('{toggle}') >= 0,
				hasMessage: settings.format.indexOf('{message}') >= 0
			};
			init(context);
			subscribeToUpdates(context);
		});
	};

	$.fn.evolutionLike.delegatePopups = function(options) {
		if(popupsInited) { return; }
		popupsInited = true;

		var settings = $.extend({}, $.fn.evolutionLike.defaults, options || {}),
			likersTemplate = $.telligent.evolution.template.compile(settings.likersTemplate),
			likersPopupTemplate = $.telligent.evolution.template.compile(settings.likersPopupTemplate),
			getOptions = function(elm) {
				return settings.onOptions($(elm).closest(settings.delegatedSelector));
			},
			getLikers = function(options, pageIndex, complete) {
				settings.onList(options.contentId, options.contentTypeId, options.typeId, function(data){
					complete(data);
				}, options.pageSize, pageIndex);
			},
			showPopup = function(data, elm) {
				var currentPageIndex = 0,
					likersContent = $(likersTemplate(data)),
					likersPopup = $(likersPopupTemplate({
						likers: likersContent,
						hasMorePages: data.hasMorePages,
						showMoreText: settings.modalShowMoreText
					})),
					likersList = likersPopup.find('ul'),
					showMoreLink = likersPopup.find('.show-more'),
					queryOptions = getOptions(elm);

				likersList.html(likersContent);
				showMoreLink.on('click', function(e){
					e.preventDefault();
					currentPageIndex++;
					getLikers(queryOptions, currentPageIndex, function(data){
						likersList.append(likersTemplate(data));
						if(data.hasMorePages) {
							showMoreLink.show();
						} else {
							showMoreLink.hide();
						}
						var height = likersList[0].scrollHeight;
  						likersList.scrollTop(height);
					});
				});

				$.glowModal({
					title: settings.modalTitleText,
					html: likersPopup,
					width: 450
				});
			},
			delegateEvents = function() {
				$(settings.containerSelector).on('click', settings.delegatedSelector + ' .who-likes', function(e) {
					var elm = $(this);
					var queryOptions = getOptions(elm);
					getLikers(queryOptions, 0, function(data){
						showPopup(data, elm);
					});
				});
			};

		delegateEvents();
	};
	$.fn.evolutionLike.defaults = {
		// evolutionlike defaults
		contentId: '',
		contentTypeId: '',
		typeId: '',
		initialState: false,
		initialMessage: '',
		initialCount: 0,
		format: '',
		onLike: function(contentId, contentTypeId, typeId, complete) {},
		onUnlike: function(contentId, contentTypeId, typeId, complete) {},
		likeText: 'Like',
		unlikeText: 'Unlike',
		whoLikesOtherText: '<a href="{user_profile_url}" class="internal-link view-user-profile">{user_display_name}</a> likes this',
		whoLikesOtherTwoText: '<a href="{user_profile_url}" class="internal-link view-user-profile">{user_display_name}</a> <span class="who-likes">and 1 other</span> like this.',
		whoLikesOtherMultipleText: '<a href="{user_profile_url}" class="internal-link view-user-profile">{user_display_name}</a> and <span class="who-likes">{count} others</span> like this.',
		whoLikesAccessingText: 'You like this',
		whoLikesAccessingTwoText: 'You and <span class="who-likes">1 other</span> like this',
		whoLikesAccessingMultipleText: 'You and <span class="who-likes">{count} others</span> like this',
		modalTitleText: 'People who like this',
		modalShowMoreText: 'Show more',
		// evolutionlike.delegatepopups defaults
		onList: function(contentId, contentTypeId, typeId, complete) {},
		onOptions: function(elm) {},
		containerSelector: '',
		delegatedSelector: '',
		delay: 500,
        likersTemplate: '' +
            ' <% foreach(likers, function(liker) { %> ' +
            '     <li class="content-item"> ' +
            '         <div class="full-post-header"></div> ' +
            '         <div class="full-post"> ' +
            '             <span class="avatar"> ' +
            '                 <a href="<%: liker.profileUrl %>"  class="internal-link view-user-profile"> ' +
            '                     <img src="<%: liker.avatarUrl %>" alt="" border="0" width="32" height="32" style="width:32px;height:32px" /> ' +
            '                 </a> ' +
            '             </span> ' +
            '             <span class="user-name"> ' +
            '                 <a href="<%: liker.profileUrl %>" class="internal-link view-user-profile"><%= liker.displayName %></a> ' +
            '             </span> ' +
            '         </div> ' +
            '         <div class="full-post-footer"></div> ' +
            '     </li> ' +
            ' <% }); %> ',
        likersPopupTemplate: '' +
            ' <div class="who-likes-list"> ' +
            '     <div class="content-list-header"></div> ' +
            '     <ul class="content-list"><%= likers %></ul> ' +
            '     <div class="content-list-footer"></div> ' +
            '     <% if(hasMorePages) { %> ' +
            '         <a href="#" class="show-more"><%= showMoreText %></a>' +
            '     <% } %> ' +
            ' </div> '
	};

	return {};
}, jQuery, window);
 
 
/// @name evolutionMasonry
/// @category jQuery Plugin
/// @description Enables a multi-column left-to-right layout of variable-height elements.
///
/// ### jQuery.fn.evolutionMasonry
///
/// This plugin enables responsive, multi-column, left-to-right layout of variable-height elements.
///
/// ### Usage
///
/// Initializes the selected container to render its immediate children as
///
///     $(container).evolutionMasonry(options)
///
/// ### Options
///
///  * `columnClass`: CSS class name to apply to each rendered column. Should define, at minimum, a desired width. Through media queries, alternate widths can be defined for different targets.
///    * default: `masonry-column`
///  * `animate`: Whether to animate the reveal of new items
///    * default: `true`
///  * `animationDuration`: Animation duration in milliseconds
///    * default: `250`
///  * `threshold`: Minimum height change at which to consider a column as having new content
///    * default: `35`
///
/// ### Methods
///
/// #### append
///
/// Append items to the masonry layout
///
///     // append items
///     $('.container').evolutionMasonry('append', newItems);
///

define('plugin.evolutionMasonry', ['lib.util'], function(util, $, global, undef){

	var dataContextKey = '_evolutionMasonry_context';

	function sequence(promises) {
		var sequenceDeferred;

		function run(index) {
			if(promises.length <= index) {
				sequenceDeferred.resolve();
			} else {
				promises[index]().done(function(){
					run(index + 1);
				}).fail(function(){
					sequenceDeferred.reject();
				});
			}
		}

		sequenceDeferred = $.Deferred();
		run(0);
		return sequenceDeferred.promise();
	};

	function renderColumns(context) {
		var totalWidth = 0;
		var containerWidth = context.container.width();

		var limit = 50;
		while(totalWidth < containerWidth && limit > 0) {
			limit--;
			var column = $(document.createElement('div'))
				.html('&nbsp;')
				.addClass(context.columnClass)
				.css({ 'float': 'left', minHeight: '1px', overflow: 'hidden' })
				.appendTo(context.container);

			totalWidth += column.outerWidth(true);

			if(totalWidth < containerWidth) {
				context.columns.push(column);
			} else {
				column.remove();
			}
		}
	}

	function emptyColumns(context) {
		for(var i = 0; i < context.columns.length; i++) {
			$(context.columns[i]).empty();
		}
	}

	function getShortestColumn(context) {
		var shortestColumn = null;
		var shortestHeight = null;
		for(var i = 0; i < context.columns.length; i++) {
			if(shortestColumn === null || shortestHeight === null) {
				shortestColumn = context.columns[i];
				shortestHeight = context.columns[i].height();
			} else {
				var height = context.columns[i].height();
				if(height < shortestHeight) {
					shortestColumn = context.columns[i];
					shortestHeight = height;
				}
			}
		}
		return shortestColumn;
	}

	function renderItems(context, items) {
		var itemsToRender;

		// when given items, essentially is just an append of those items, not a re-render
		if(items) {
			itemsToRender = items;
		} else {
			// if not given specific items to render,
			// then re-render all items, clearing all existing first
			itemsToRender = context.children;
			emptyColumns(context);
		}

		// map a series of functions which return promies
		// which each wait for their affected column to be modified
		sequence($.map(itemsToRender, function(item){
			return function(){
				return $.Deferred(function(d){
					var column = getShortestColumn(context);
					if(column) {
						var initialHeight = column.height();

						if(context.animate) {
							$(item).appendTo(column)
								.css({ 'opacity': 0.01 })
								.evolutionTransform({ 'opacity': 0.99 },
									{ duration: context.animationDuration });
						} else {
							column.append(item);
						}

						// every 5 ms, see if the column now has new content yet
						var heightChangeInterval = setInterval(function(){
							if(column.height() - initialHeight > context.threshold) {
								clearInterval(heightChangeInterval);
								clearTimeout(heightChangeTimeout);
								d.resolve();
							}
						}, 5);
						// give up after 500 ms
						var heightChangeTimeout = setTimeout(function(){
							clearInterval(heightChangeInterval);
							clearTimeout(heightChangeTimeout);
							d.resolve();
						}, 500)
					} else {
						d.reject();
					}
				}).promise();
			}
		}));
	}

	function render(context) {
		context.container.empty();
		context.columns = [];

		renderColumns(context);
		renderItems(context);
	}

	function init(options) {
		return this.each(function(){
			var context = $.extend({}, $.fn.evolutionMasonry.defaults, options || {});
			context.container = $(this);
			context.children = context.container.children().detach();

			render(context);
			$(window).on('resized', function(){
				render(context);
			});
			context.container.data(dataContextKey, context);
		});
	}

	var api = {
		append: function(newItems) {
			if(!newItems || newItems.length == 0)
				return;
			var items = $(newItems).filter('div');
			return this.each(function(){
				var context = $(this).data(dataContextKey);
				if(!context)
					return;
				context.children = context.children.add(items);
				renderItems(context, items);
			});
		}
	};

	$.fn.evolutionMasonry = function(method) {
		if (method in api) {
			return api[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.fn.evolutionMasonry');
		}
	};
	$.fn.evolutionMasonry.defaults = {
		columnClass: 'masonry-column',
		animate: true,
		animationDuration: 250,
		threshold: 35
	};

	return {};

}, jQuery, window);

 
 
/// @name evolutionModerate
/// @category jQuery Plugin
/// @description Renders a configurable content moderation menu
///
/// ### jQuery.fn.evolutionModerate
///
/// This plugin implements a control which enables a user to report a piece of content as abusive via a drop-down menu which displays when hovered over. When reported, a [notification](@notifications) is displayed to the reporting user. It also supports displaying other actions alongside abuse reporting. Raises and responds to [ui.reportabuse](@ui.reportabuse) messages. It is typically not invoked directly, but rather by the [moderate UI component](@moderate).
///
/// ### Usage
///
/// Initializes the moderation plugin where `SELECTOR` is a `<span>`.
///
///     $('SELECTOR').evolutionModerate(options)
///
/// ### Options
///
///  * `contentId`: (string) Content Id
///  * `contentTypeId`: (string) Content Type Id
///  * `initialState`: (boolean) Currently reported by the accessing user
///  * `linkClassName`: (string) CSS class to apply to the link
///  * `onReport`: function which implements abuse reporting. Passed parameters:
///    * `contentId`: Content Id being reported
///    * `contentTypeId`: Content Type Id being reported
///    * `complete`: Callback to invoke when reporting has completed.
///  * `onGetAdditionalLinks`: function which, when invoked, can asynchronously provide additional links to display alongside abuse reporting within the same menu. Passed parameters:
///    * `complete`: Callback to invoke to pass an array of link objects back to the plugin. Each object should contain keys defining the link's `href` and `text`, and optionally the `className`.
///  * `notificationDuration`: (number) milliseconds to display notification after reporting abuse.
///    * default: `5000`
///  * `supportsAbuse`: (boolean) whether the content supports abuse and should embed abuse reporting within its menu
///    * default: `true`
///  * `reportLinkText`: (string) menu label to display when content is not reported. Evolution sets this automatically, localized.
///    * default: `'Flag as spam/abuse'`
///  * `reportedLinkText`:   (string) menu label to display when content has already been reported. Evolution sets this automatically, localized.
///    * default: `'Flagged as spam/abuse'`
///  * `reportedNotificationMessageText`: (string) message to display in the notification after reporting. Evolution sets this automatically, localized.
///    * default: `'{NAME}'s post has been flagged. <strong>Thank you for your feedback.</strong>'`
///  * `moderationLinkTemplate`: (string) Template to use when rendering a moderation link. Evolution sets this automatically.
///    * default: `'<a href="#" class="<%: linkClassName %>"><span></span><%= resources.moderateLinkText %></a>'`
///  * `notificationTemplate`: (string) Template to use when rendering a notification of reporting back to the reporting user. Evolution sets this automatically.
///    * default: `'<p><%= resources.reportedNotificationMessageText %></p>'`
///  * `moderationMenuTemplate`: (string) Template to use when rendering a moderation menu. Evolution sets this automatically.
///
/// *Default:*
///
///     <ul class="navigation-list">
///         <% foreach(links, function(link){ %>
///             <li class="navigation-item">
///                 <a href="<%: (link.href || "#") %>" class="<%: (link.className || "") %>"><%= link.text %></a>
///             </li>
///         <% }); %>
///     </ul>
///
///

/// @name ui.reportabuse
/// @category Client Message
/// @description Raised on abuse reports
///
/// ### ui.reportabuse Client Message
///
/// [Client-side message](@messaging) raised and consumed by the [jQuery.evolutionModerate plugin](@evolutionModerate), allowing multiple instances of the plugin to stay in synchronization. The message is raised when the user reports a piece of content as abusive. Other scripts can also handle this event.
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('ui.reportabuse', function(data) {
///         // handle the event
///     });
///
/// ### Data
///
///  * `contentId`: content id (string)
///  * `contentTypeId`: content type id (string)
///

/**
 * Moderation Menu
 *
 * Triggers event: evolutionModerateLinkClicked on any addditional link clicked in addition to moderation links
 * to allow other included links to have relevance
 * also raises 'ui.reportabuse'
 */

 define('plugin.evolutionModerate', function($, global, undef){

    var flagEvent = 'ui.reportabuse',
        TE = $.telligent.evolution,
        linkClickedEventName = 'evolutionModerateLinkClicked',
        flag = function(context) {
            context.settings.onReport(context.settings.contentId, context.settings.contentTypeId,
                function(response){
                    TE.messaging.publish(flagEvent, {
                        contentId: context.settings.contentId,
                        contentTypeId: context.settings.contentTypeId
                    });
                    showNotification(context, response.Report);
                });
        },
		clearHideTimer = function(context) {
			if (context.hideTimer) {
				clearTimeout(context.hideTimer);
				context.hideTimer = null;
			}
		}
        buildModerationLink = function(context) {
            context.moderationLink = $(TE.template.compile(context.settings.moderationLinkTemplate)({
				linkClassName: context.settings.linkClassName,
                resources: {
                    moderateLinkText: context.settings.moderateLinkText
                }
            })).appendTo(context.element);
        },
        buildModerationPopup = function(context) {
            context.popup = $('<div></div>').glowPopUpPanel({
                cssClass: 'content-moderation',
                position: 'downleft',
                zIndex: 1000,
                hideOnDocumentClick: true
            });
			context.popup.bind({
				glowPopUpPanelShown: function(e) {
					context.moderationLink.addClass('open');
				},
				glowPopUpPanelHidden: function(e){
					context.moderationLink.removeClass('open');
				}
			});
        },
        buildModerationMenuContent = function(context, complete) {
            context.settings.onGetAdditionalLinks(function(additionalLinks) {
                var links = [];
				if(context.settings.supportsAbuse) {
					if(context.settings.initialState) {  // show unflag link
						links = additionalLinks.concat([
							{ href:'#', className:'evolutionModerateFlagged', text:context.settings.reportedLinkText }
						]);
					} else {  // show flag link
						links = additionalLinks.concat([
							{ href:'#', className:'evolutionModerateFlag', text:context.settings.reportLinkText }
						]);
					}
				} else {
					links = additionalLinks;
				}
                var menuContent = $(TE.template.compile(context.settings.moderationMenuTemplate)({ links: links }));
                menuContent.bind('mouseleave',function(e){
                    hideMenu(context);
                });
				menuContent.bind('mouseenter',function(e){
					clearHideTimer(context);
				});
                menuContent.delegate('a','click', function(e) {
                    var target= $(e.target);
                    if(target.hasClass('evolutionModerateFlag')) {
                        e.preventDefault();
                        flag(context);
                    } else if(target.hasClass('evolutionModerateFlagged')) {
                        e.preventDefault();
                    } else {
                        if(target.attr('href') === '#') {
                            e.preventDefault();
                        }
                        context.element.trigger(linkClickedEventName, e.target);
                    }
                });
                complete(menuContent);
            });
        },
        showMenu = function(context) {
            if(!context.popup) {
                buildModerationPopup(context);
            }
            buildModerationMenuContent(context, function(moderationMenuContent) {
				clearHideTimer(context);
                context.popup.glowPopUpPanel('html',moderationMenuContent)
                    .glowPopUpPanel('show',context.moderationLink);
            });
        },
		hideMenu = function(context) {
			if (!context.hideTimer)
				context.hideTimer = setTimeout(function() {
					context.popup.glowPopUpPanel('hide');
					context.hideTimer = null;
				}, 200);
		},
        formatNotificationMessage = function(context, report) {
            return context.settings.reportedNotificationMessageText.replace(/\{NAME\}/gi,
                report && report.AuthorUser && report.AuthorUser.DisplayName ? report.AuthorUser.DisplayName : '');
        },
        showNotification = function(context, report) {
            var notificationContent = TE.template.compile(context.settings.notificationTemplate)({
                resources: {
                    reportedNotificationMessageText: formatNotificationMessage(context, report),
                    undoLinkText: context.settings.undoLinkText
                },
                contextId: context.contextId
            });
            TE.notifications.show(notificationContent, {
                type: 'moderation',
                duration: context.settings.notificationDuration,
				cssClass: ''
            });
        },
        handleFlagMessages = function(context) {
            TE.messaging.subscribe(flagEvent, function(e) {
                if(context.settings.contentId === e.contentId && context.settings.contentTypeId === e.contentTypeId) {
                    context.settings.initialState = true // change the state to flagged for showing subsequent menus
                }
            });
        },
        init = function(context) {
            buildModerationLink(context);
            context.moderationLink.bind({
                mouseenter: function(e) {
                    e.preventDefault();
                    if(context.popup && context.popup.glowPopUpPanel('isShown')) {
                        hideMenu(context);
                    } else {
                        showMenu(context);
                    }
					clearHideTimer(context);
                },
                mouseleave: function(e) {
                    if(!$(e.relatedTarget).is('.content-moderation') && $(e.relatedTarget).closest('.content-moderation').length === 0) {
                        hideMenu(context);
                    }
                }
            });
            handleFlagMessages(context);
        };

    $.fn.evolutionModerate = function(options) {
        var settings = $.extend({}, $.fn.evolutionModerate.defaults, options || {});
        return this.each(function(){
            var context = {
                element: $(this),
                settings: settings
            };
            init(context);
        });
    };
    $.fn.evolutionModerate.defaults = {
        contentId: '',
        contentTypeId: '',
        initialState: false,
		linkClassName: '',
        onReport: function(contentId, contentTypeId, complete) { },
        onGetAdditionalLinks: function(complete) { complete([]); },
        notificationDuration: 5000,
        moderateLinkText: 'moderate',
		supportsAbuse: true,
        reportLinkText: 'Flag as spam/abuse',
        reportedLinkText: 'Flagged as spam/abuse',
        reportedNotificationMessageText: "{NAME}'s post has been flagged. <strong>Thank you for your feedback.</strong>",
        undoLinkText: 'Undo',
        moderationLinkTemplate: '<a href="#" class="<%: linkClassName %>"><span></span><%= resources.moderateLinkText %></a>',
        moderationMenuTemplate: '' +
        '<ul class="navigation-list">' +
        '   <% foreach(links, function(link){ %>' +
        '       <li class="navigation-item">' +
        '           <a href="<%: (link.href || "#") %>" class="<%: (link.className || "") %>"><%= link.text %></a>' +
        '       </li>' +
        '   <% }); %>' +
        '</ul>',
        notificationTemplate: '<p><%= resources.reportedNotificationMessageText %></p>'
    };

    return {};
}, jQuery, window);
 
 
/// @name evolutionPager
/// @category jQuery Plugin
/// @description Renders a pager UI, supporting both ajax and non-ajax paging
///
/// ### jQuery.fn.evolutionPager
///
/// This plugin renders a paging UI, supporting both ajax and non-ajax based paging. It is typically not called directly, but rather by the [page UI component](@page), which is also not typically used directly, but rather by calls to the `$core_v2_ui.Pager()` Widget API method.
///
/// ### Usage
///
/// Initializes a pager where `SELECTOR` is a `<span>`.
///
///     $('SELECTOR').evolutionPager(options)
///
/// By default, this will render a set of paging links which navigate the browser.
///
/// If `onPage` and the other ajax-related options are provided, links will not navigate the browser, but publish paging event [messages](@messages). The plugin will also subscribe to these same messages and use the supplied `onPage` function to request a new page of content to replace within the `pagedContentContainer`.
///
/// ### Options
///
///  * `currentPage`: Current page index
///    * default: 0
///  * `pageSize`: Items per page
///    * default: 10
///  * `totalItems`: Total items
///    * default: 0
///  * `showPrevious`: (boolean) Whether 'previous' links should be shown
///    * default: false
///  * `showNext`: (boolean) Whether 'next' links should be shown
///    * default: false
///  * `showFirst`: (boolean) Whether 'first' links should be shown
///    * default: true
///  * `showLast`: (boolean) Whether 'last' links should be shown
///    * default: true
///  * `showIndividualPages`: Whether individual pages should be shown
///    * default: true
///  * `numberOfPagesToDisplay`: Number of individual pages to show
///    * default: 5
///  * `pageKey`: Name of the query string key to use to hold page index
///    * default: 'pi'
///  * `hash`: Explicit hash target for links
///    * default: ''
///  * `baseUrl`: Base URL
///    * default: current URL (window.location.href)
///  * `template`: [template](@template) for rendering links
///
/// ### Ajax-Related Options
///
/// When provided, performs paging via usage of `onPage` (which will typically be defined to perform an ajax request) instead of navigation. Most of these are usually not necessary to define specifically, but are defined by usage of `$core_v2_ui.Pager()` where `PagedContentFile` or `PagedContentUrl` are passed.
///
///  * `onPage`: function callback which is invoked to load a new page of content asynchronously. Passed parameters:
///    * `pageIndex`: page index of content to load
///    * `complete`: callback function to invoke when content is ready to be passed back to the plugin. Must be passed the content.
///    * `hash`: object of other key/value pairs serialized in the current url's hash
///  * `pagedContentContainer`: selector of element to update with newly received content
///  * `pagedContentPagingEvent`: message to publish and subscribe to about a requested page change. Typically unique per widget and defined by `$core_v2_ui.Pager()`.
///  * `pagedContentPagedEvent`: message to publish and subscribe to about a requested page change. Typically unique per widget and defined by `$core_v2_ui.Pager()`.
///  * `refreshOnAnyHashChange`: when true, triggers an onPage for any change of the hash, not just the page key
///    * default: `false`
///  * `transition`: 'slide', 'fade', or 'null
///    * default: `null`
///  * `transitionDuration`: transition duration
///    * default: `250`
///
/// #### Default Template
///
///     <% foreach(links, function(link, i) { %>
///         <% if(link.type === "first") { %>
///             <a href="<%: link.url %>" class="first" data-type="first" data-page="<%= link.page %>" data-selected="false">
///                 <span>&#171;</span>
///             </a>
///         <% } else if(link.type === "previous") { %>
///             <a href="<%: link.url %>" class="previous" data-type="previous" data-page="<%= link.page %>" data-selected="false">
///                 <span>&#60;</span>
///             </a>
///         <% } else if(link.type === "page") { %>
///             <a href="<%: link.url %>" class="page<%= link.selected ? " selected" : "" %>" data-type="page" data-page="<%= link.page %>" data-selected="<%= link.selected ? "true" : "false" %>">
///                 <span><%= link.page %></span>
///             </a>
///         <% } else if(link.type === "next") { %>
///             <a href="<%: link.url %>" class="next" data-type="next" data-page="<%= link.page %>" data-selected="false">
///                 <span>&#62;</span>
///             </a>
///         <% } else if(link.type === "last") { %>
///             <a href="<%: link.url %>" class="last" data-type="last" data-page="<%= link.page %>" data-selected="false">
///                 <span>&#187;</span>
///             </a>
///         <% } %>
///         <% if(i < (links.length - 1)) { %>
///             <span class="separator"></span>
///         <% } %>
///     <% }); %>
///

define('plugin.evolutionPager', function($, global, undef){

    var boundHashChanges = {},
        subscribedPagingMessages = {},
        currentPageLoads = {},
        buildLinks = function(context) {
            var links = [],
                settings = context.settings,
                totalPages,
                modifyUrl = function(page) {
                    var query = {};
                    query[settings.pageKey] = page;
                    var mod = {
                        url: settings.baseUrl,
                        query: query
                    };
                    if(settings.hash && settings.hash.length > 0) {
                        mod[settings.hash] = settings.hash;
                    }
                    return $.telligent.evolution.url.modify(mod);
                };
            if(settings.totalItems === 0 || settings.pageSize === 0) {
                totalPages = 0;
            } else {
                totalPages = Math.floor(settings.totalItems / settings.pageSize);
                if(settings.totalItems % settings.pageSize > 0) {
                    totalPages = totalPages + 1;
                }
            }

            if(totalPages > 1) {
                // first
                if(settings.showFirst) {
                    if(settings.currentPage >= 3 && totalPages > settings.numberOfPagesToDisplay) {
                        links[links.length] = {
                            type: 'first',
                            selected: false,
                            page: 1,
                            url: modifyUrl(1)
                        };
                    }
                }
                // previous
                if(settings.showPrevious) {
                    if(settings.currentPage > 0) {
                        links[links.length] = {
                            type: 'previous',
                            selected: false,
                            page: settings.currentPage,
                            url: modifyUrl(settings.currentPage)
                        };
                    }
                }

                // individual page links
                if(settings.showIndividualPages) {
                    // determine lower bound
                    var start;
                    if(totalPages < settings.numberOfPagesToDisplay || settings.currentPage - Math.floor(settings.numberOfPagesToDisplay / 2) < 0) {
                        start = 0;
                    } else if(settings.currentPage + Math.floor(settings.numberOfPagesToDisplay / 2) >= totalPages) {
                        start = totalPages - settings.numberOfPagesToDisplay;
                    } else {
                        start = settings.currentPage - Math.floor(settings.numberOfPagesToDisplay / 2);
                    }

                    // determine upper bound
                    var end;
                    var lastBuffer = Math.floor(settings.numberOfPagesToDisplay / 2);
                    if(settings.numberOfPagesToDisplay % 2 === 0) {
                        lastBuffer = lastBuffer - 1;
                    }
                    if(totalPages < settings.numberOfPagesToDisplay || settings.currentPage + lastBuffer >= totalPages) {
                        end = totalPages - 1;
                    } else if(settings.currentPage - Math.floor(settings.numberOfPagesToDisplay / 2) < 0) {
                        end = settings.numberOfPagesToDisplay - 1;
                    } else {
                        end = settings.currentPage + lastBuffer;
                    }
                    // add links
                    var i;
                    for(i = start; i <= end; i++) {
                        links[links.length] = {
                            type: 'page',
                            selected: (settings.currentPage === i),
                            page: i + 1,
                            url: modifyUrl(i+1)
                        };
                    }
                }

                // next
                if(settings.showNext) {
                    if(settings.currentPage + 1 < totalPages) {
                        links[links.length] = {
                            type: 'next',
                            selected: false,
                            page: settings.currentPage + 2,
                            url: modifyUrl(settings.currentPage + 2)
                        };
                    }
                }

                // last
                if(settings.showLast) {
                    if(settings.currentPage + 3 < totalPages && totalPages > settings.numberOfPagesToDisplay) {
                        links[links.length] = {
                            type: 'last',
                            selected: false,
                            page: totalPages,
                            url: modifyUrl(totalPages)
                        };
                    }
                }
            }

            return links;
        },
        renderLinks = function(context) {
            var pagerHtml = context.template({ links: context.links });
            context.selection.html(pagerHtml);
        },
        initAjaxPaging = function(context) {
            subscribeToPagingMessages(context);
            bindToHashChanges(context);
            changeHashOnNavigation(context);
            loadInitialPage(context);
        },
        getPagedContentSpecificHashdata = function(context) {
            if(!context.settings.refreshOnAnyHashChange)
                return null;
            // build a new object of only hash items whose keys are prefixed with
            // the page key. remove the prefix in the new object
            var hashData = $.telligent.evolution.url.hashData();
            var pagedContentSpecificHashdata = null;
            for(var key in hashData) {
                if(key != context.settings.pageKey && key.indexOf(context.settings.pageKey) == 0) {
                    pagedContentSpecificHashdata = pagedContentSpecificHashdata || {};
                    pagedContentSpecificHashdata[key.substr(context.settings.pageKey.length)] = hashData[key];
                }
            }
            return pagedContentSpecificHashdata;
        },
        loadInitialPage = function(context) {
            // if there was already a page key in this query string's hash, pre-load that page
            var initialPage = parseInt($.telligent.evolution.url.hashData()[context.settings.pageKey], 10);
            // if paging refreshes on any hash change, force an initial load by assuming page of 1 if not provided
            var contentSpecificHashData = getPagedContentSpecificHashdata(context);
            if(contentSpecificHashData)
                initialPage = initialPage || 1;
            if(!isNaN(initialPage) && initialPage !== context.settings.currentPage) {
                // don't allow page loads to stack up infinitely in case a pager was included on a callback
                if(currentPageLoads[context.settings.pageKey]) { return; }
                currentPageLoads[context.settings.pageKey] = true;

                // call the implementation of the paged content requestor
                context.settings.onPage(initialPage, function(response){
                    context.currentPageIndex = initialPage;
                    renderNewlyPagedContent(context, initialPage, 0, response, false);
                }, (contentSpecificHashData || {}));
            };
        },
        changeHashOnNavigation = function(context) {
            // intercept paging link clicks and update the hash data
            $(context.selection).delegate('a','click',function(e){
                e.preventDefault();
                var link = $(this),
                    hashModification = {};
                hashModification[context.settings.pageKey] = link.data('page');
                $.telligent.evolution.url.hashData(hashModification);
            });
        },
        bindToHashChanges = function(context) {
            // only bind to a hash change once for a given key
            if(boundHashChanges[context.settings.pageKey]) { return; }
            boundHashChanges[context.settings.pageKey] = true;

            // listen for relevant hash changes related to page changes
            context.currentPageIndex = parseInt($.telligent.evolution.url.hashData()[context.settings.pageKey], 10);
            if(isNaN(context.currentPageIndex)) {
                context.currentPageIndex = context.settings.currentPage;
            }
            $(window).bind('hashchange', function(e){
                var newPageIndex = parseInt($.telligent.evolution.url.hashData()[context.settings.pageKey], 10);

                var contentSpecificHashData = getPagedContentSpecificHashdata(context);

                if(contentSpecificHashData || (!isNaN(newPageIndex) && context.currentPageIndex != newPageIndex)) {
                    context.newPageIndex = newPageIndex;
                    var dataToTrigger = {
                        currentPage: context.currentPageIndex || 1,
                        newPage: context.newPageIndex || 1,
                        container: context.settings.pagedContentContainer
                    };
                    // publish global message
                    $.telligent.evolution.messaging.publish(context.settings.pagedContentPagingEvent, dataToTrigger);
                    // raise local event on this plugin
                    context.selection.trigger('evolutionPagerPaging', dataToTrigger)
                    context.currentPageIndex = newPageIndex;
                }
            });
        },
        subscribeToPagingMessages = function(context) {
            // unsubscribe from previous subscriptions for this widget, if there were any
            if(subscribedPagingMessages[context.settings.pagedContentPagingEvent]) {
                context.currentPageIndex = parseInt($.telligent.evolution.url.hashData()[context.settings.pageKey], 10);
                $.telligent.evolution.messaging.unsubscribe(subscribedPagingMessages[context.settings.pagedContentPagingEvent]);
            }
            // subscribe to paging messages
            subscribedPagingMessages[context.settings.pagedContentPagingEvent] =
                $.telligent.evolution.messaging.subscribe(context.settings.pagedContentPagingEvent, function(data) {
                    // don't allow page loads to stack up infinitely in case a pager was included on a callback
                    if(currentPageLoads[context.settings.pageKey]) { return; }
                    currentPageLoads[context.settings.pageKey] = true;
                    // call the implementation of the paged content requestor
                    context.settings.onPage(data.newPage, function(response){
                        context.currentPageIndex = data.newPage;
                        renderNewlyPagedContent(context, data.newPage, data.currentPage, response, true);
                    }, (getPagedContentSpecificHashdata(context) || {}));
                });
        },
        renderNewlyPagedContent = function(context, page, oldPage, content, shouldAnimate) {
            var publishPagedMessage = function() {
                var dataToTrigger = {
                    page: page,
                    container: context.settings.pagedContentContainer
                };
                // publish global message
                $.telligent.evolution.messaging.publish(context.settings.pagedContentPagedEvent, dataToTrigger);
                // raise local event on this plugin
                context.selection.trigger('evolutionPagerPaged', dataToTrigger)
            };
            // render content
            if(shouldAnimate && (context.settings.transition === 'slide' || context.settings.transition === 'fade')) {
                var transition = 'fade';
                if(context.settings.transition === 'slide') {
                    transition = page < oldPage ? 'slideRight' : 'slideLeft';
                }
                var container = $(context.settings.pagedContentContainer);
                var newContent = $('<div></div>')
                    .attr('id',container.attr('id'))
                    .html(content)
                    .hide()
                    .insertAfter(context.settings.pagedContentContainer);

                container.glowTransition(newContent, {
                    type: transition,
                    duration: context.settings.transitionDuration,
                    complete: function() {
                        $(context.settings.pagedContentContainer).css({width:'',height:'',overflow:'hidden'});
                        publishPagedMessage();
                        currentPageLoads[context.settings.pageKey] = false;
                    }
                });
            } else {
                $(context.settings.pagedContentContainer).html(content);
                publishPagedMessage();
                currentPageLoads[context.settings.pageKey] = false;
            }

            // update links
            context.settings.currentPage = page - 1;
            context.links = buildLinks(context);
            renderLinks(context);
        };

    $.fn.evolutionPager = function(options) {
        var settings = $.extend({}, $.fn.evolutionPager.defaults, options || {}),
            context = {
                selection: this,
                settings: settings,
                template: $.telligent.evolution.template.compile(settings.template)
            };
        context.links = buildLinks(context);

        renderLinks(context);

        if(settings.onPage && settings.pagedContentContainer &&
            settings.pagedContentContainer.length > 0)
        {
            initAjaxPaging(context);
        }

        return this;
    };
    $.fn.evolutionPager.defaults = {
        // normal options
        currentPage: 0,
        pageSize: 10,
        totalItems: 0,
        showPrevious: false,
        showNext: false,
        showFirst: true,
        showLast: true,
        showIndividualPages: true,
        numberOfPagesToDisplay: 5,
        pageKey: 'pi',
        hash: '',
        baseUrl: window.location.href,
        // ajax-specific options
        onPage: function(pageIndex, complete) { },
        pagedContentContainer: '',
        pagedContentPagingEvent: 'ui.page.paging',
        pagedContentPagedEvent: 'ui.page.paged',
        transition: null, // slide|fade|null
        transitionDuration: 250,
        refreshOnAnyHashChange: false,
        // template
        template: '' +
        ' <% foreach(links, function(link, i) { %> ' +
        '     <% if(link.type === "first") { %> ' +
        '         <a href="<%: link.url %>" class="first" data-type="first" data-page="<%= link.page %>" data-selected="false"><span>&#171;</span></a> ' +
        '     <% } else if(link.type === "previous") { %> ' +
        '         <a href="<%: link.url %>" class="previous" data-type="previous" data-page="<%= link.page %>" data-selected="false"><span>&#60;</span></a>' +
        '     <% } else if(link.type === "page") { %> ' +
        '         <a href="<%: link.url %>" class="page<%= link.selected ? " selected" : "" %>" data-type="page" data-page="<%= link.page %>" data-selected="<%= link.selected ? "true" : "false" %>"><span><%= link.page %></span></a> ' +
        '     <% } else if(link.type === "next") { %> ' +
        '         <a href="<%: link.url %>" class="next" data-type="next" data-page="<%= link.page %>" data-selected="false"><span>&#62;</span></a>' +
        '     <% } else if(link.type === "last") { %> ' +
        '         <a href="<%: link.url %>" class="last" data-type="last" data-page="<%= link.page %>" data-selected="false"><span>&#187;</span></a> ' +
        '     <% } %> ' +
        '     <% if(i < (links.length - 1)) { %> ' +
        '         <span class="separator"></span> ' +
        '     <% } %> ' +
        ' <% }); %> '
    };

    return {};
}, jQuery, window);
 
 
/// @name evolutionResize
/// @category jQuery Plugin
/// @description Enables a textarea to dynamically resize to fit its contents
///
/// ### jQuery.fn.evolutionResize
///
/// This plugin enables automatic, live resizing of textarea elements to contain text.
///
/// ### Usage
///
/// Initializes the selected `<textarea>` to automatically resize
///
///     $('textarea').evolutionResize()
///
///

define('plugin.evolutionResize', function($, global, undef){

	var offsetOverride = null,
		inited = false,
		resize = function(context) {
			context.area.css({ height: 'auto' })
						.css({ height: (context.area.prop('scrollHeight') - (offsetOverride === null ? context.offset : offsetOverride)) });
			var newHeight = context.area.outerHeight();
			if(newHeight !== context.oldHeight) {
				if(newHeight >= context.maxHeight) {
					context.area.css({ overflow: 'visible' });
				} else {
					context.area.css({ overflow: 'hidden' });
				}
				context.area.trigger('evolutionResize', { newHeight: newHeight, oldHeight: context.oldHeight });
				context.oldHeight = newHeight;
			}
		},
		parsePixelValue = function(value) {
			return parseInt(value.replace('px',''),10);
		};

	function init() {
		if(inited)
			return;
		inited = true;
		var ta = $('<textarea>test</textarea>')
			.css({overflow: 'hidden', resize: 'none', visible: 'none' })
			.appendTo('body');
		if(Math.abs(ta.prop('scrollHeight') - ta.height()) <= 1)
			offsetOverride = 0;
		ta.remove();
	}

	$.fn.evolutionResize = function() {
		init();
		return this.filter('textarea').each(function(){
			var area = $(this).css({ resize: 'none', overflow: 'hidden' }),
				context = {
					area: area,
					oldHeight: area.height(),
					maxHeight: parsePixelValue(area.css('max-height')),
					offset: area.innerHeight() !== area.height() ? (parsePixelValue(area.css('padding-top')) + parsePixelValue(area.css('padding-bottom'))) : 0
				};
			area.bind('input keydown keyup', function(){ resize(context); });
			resize(context);
		});
	};

	return {};
}, jQuery, window);

 
 
/**
 * jQuery.evolutionScrollSlider
 *
 * when the page scrolls past a certain point (80% by default), executes a callback to fetch
 * any potentially related content, and if it exists, loads that content in an animated panel
 * that slides in from the bottom left
 *
 * usage:
 *
 * $.evolutionScrollSlider(options)  // where options is an optional object
 *
 * options:
 *
 * load: function which will be called to fetch related content.  passed a callback
 *   which should be called by the implementation of 'load', passing any fetched content
 * width: width of overlay.  default 400
 * height: height of overlay.  default 75
 * className: class applied to overlay.  default: 'slider-content'
 * revealAt: decimal percentage of page scroll at which to reveal. default: 0.8
 * animationDuration: duration in ms of slide animation.  default: 250
 *
 * events
 *
 * evolutionScrollSliderShow - raised on document when panel is revealed
 * evolutionScrollSliderHide - raised on document when panel is hidden
 */
define('plugin.evolutionScrollSlider', function($, global, undef){

	var eventNameSpace = '.evolutionScrollSlider',
		showEvent = 'evolutionScrollSliderShow',
		hideEvent = 'evolutionScrollSliderHide',
		revealed = false,
		reset = function(context) {
			context.document.unbind(eventNameSpace);
			context.window.unbind(eventNameSpace);
		},
		// set up efficient checks of current scroll position and raise events
		// when the slider should be revealed or hidden
		setupEvents = function(context) {
			var scrolled = false,
				getPercentageScroll = function() {
					var documentHeight = context.document.height();
					var windowHeight = context.window.height();
					var scrollTop = context.window.scrollTop();
					return (documentHeight - scrollTop - windowHeight) / documentHeight;
				};
			context.window.bind('scroll' + eventNameSpace, function () {
					scrolled = true;
				});
			setInterval(function() {
				if(scrolled) {
					scrolled = false;
					if(!revealed && (1 - getPercentageScroll()) >= context.revealAt) {
						revealed = true;
						context.document.trigger(showEvent);
					} else if(revealed && (1 - getPercentageScroll()) < context.revealAt) {
						revealed = false;
						context.document.trigger(hideEvent);
					}
				}
			}, context.bounceDelay);
		},
		setupUI = function(context) {
			var panel = $('<div></div>')
				.hide()
				.addClass(context.className)
				.css({
					width: context.width,
					minHeight: context.height,
					maxHeight: (context.window.height() * .7),
					position: 'fixed',
					bottom: '100px',
					right: '0px'
				})
				.appendTo('body');
			var loadAndShowPanel = function() {
					context.load(function(content){
						if(content) {
							panel.html(content);
							showPanel();
						}
					});
				},
				showPanel = function() {
					panel.css({
							right: -panel.width()
						})
						.show()
						.animate({
							right: 25
						}, {
							duration: context.animationDuration
						});
				},
				hidePanel = function() {
					panel.animate({
						right: -panel.width()
					}, {
						duration: context.animationDuration,
						complete: function() {
							panel.hide();
						}
					});
				};
			context.document
				.on(showEvent + eventNameSpace, function() {
					loadAndShowPanel();
				})
				.on(hideEvent + eventNameSpace, function() {
					hidePanel();
				});
		};

	$.evolutionScrollSlider = function(options) {
		var context = $.extend({}, $.evolutionScrollSlider.defaults, options || {}, {
			window: $(window),
			document: $(document)
		});
		reset(context);
		setupEvents(context);
		setupUI(context);
	};
	$.evolutionScrollSlider.hide = function() {
		$(document).trigger(hideEvent);
	};

	$.evolutionScrollSlider.defaults = {
		load: function(loaded) { loaded(null); },
		width: 400,
		height: 75,
		className: 'slider-content',
		animationDuration: 250,
		bounceDelay: 150, // how long to delay polling of whether scrolling occurred
		revealAt: 0.8 // percentage of page height at which next reveals
	};

	return {};
}, jQuery, window);
 
 
/// @name evolutionStarRating
/// @category jQuery Plugin
/// @description Renders a star rating control
///
/// ### jQuery.fn.evolutionStarRating
///
/// This plugin supports rendering a rating value as stars, along with allowing the user to select a new rating.
///
/// ### Usage
///
///     $('SELECTOR').evolutionStarRating(options)
///
/// where 'SELECTOR' is a span.
///
/// ### Options
///
///  * `value`: (number) initial value to render
///    * default `0`
///  * `maxRating`: (number) number of stars to render
///    * default `5`
///  * `imagesPathUrl`: (string) path to star images with a trailing slash.
///  * `useHalfStars`: (bool) whether or not to support halves
///   * default `false`
///  * `starClass`: class to apply to stars
///    * default `'rating'`
///  * `overClass`: css class to apply to a star when mouse is over it
///   * default `'active'`
///  * `readOnlyClass`: css class to apply to a star it is read-only
///   * default `'readonly'`
///  * `titles`: array of string titles to use for stars
///   * default `['Terrible','Poor','Fair','Average','Good','Excellent']`
///  * `isReadOnly`: (bool) read only status
///  * `allowMultipleSelections`: (bool) whether to allow multiple selections
///  * `onRate`: (function) callback function when a selection is made. is passed selected value.
///
/// ### Methods
///
/// #### val
///
/// Returns (and sets if passed a second optional value) the current value of the rating
///
/// 	// get the value
///     var value = $('SELECTOR').evolutionStarRating('val');
///
///     // set the value
/// 	$('SELECTOR').evolutionStarRating('val', .5);
///
/// #### readOnly
///
/// Returns (and/or sets if passed a second optional Boolean value) the read-only state of the control
///
///     // get the readonly status
///     $('SELECTOR').evolutionStarRating('readOnly')
///
///     // set the readonly status
///     $('SELECTOR').evolutionStarRating('readOnly', true)
///
/// ### Example
///
/// Given the following span to contain a rating control:
///
///     <span id="ratingControl" title="Rated Good [4 out of 5]."></span>
///
/// The following will initialize a star rating control, using defaults for most options
///
///     var ratingControl = $('#ratingControl');
///     ratingControl.evolutionStarRating({
///         value: 4,  //  initial value of rating
///         isReadOnly: false,
///         onRate: function(value) {
///             alert(value + ' selected!');
///
///             // Temporarily disable editing of rating during saving
///             ratingControl.evolutionStarRating('readOnly', true);
///
///             // ...perform AJAX-based saving of rating here...
///
///             // After a successful save, turn off the read-only state of the control
///             ratingControl.evolutionStarRating('readOnly', false);
///         }
///     });
///

define('plugin.evolutionStarRating', function($, global, undef){

	var EVENT_NAMESPACE = '.evolutionStarRating',
		CONTEXT_KEY = 'evolutionStarRating_context',
		_cachedImages = [],
		_imageExtension = /MSIE 6/i.test(navigator.userAgent) ? 'gif' : 'png',
		_getItemsOnSrc = function (context, index) {
			if (index % 2 == 1) {
				return context.settings.imagesPathUrl + 'star-right-on.' + _imageExtension;
			} else {
				return context.settings.imagesPathUrl + 'star-left-on.' + _imageExtension;
			}
		},
		_getItemsOffSrc = function (context, index) {
			if (index % 2 == 1) {
				return context.settings.imagesPathUrl + 'star-right-off.' + _imageExtension;
			} else {
				return context.settings.imagesPathUrl + 'star-left-off.' + _imageExtension;
			}
		},
		_cacheImages = function(context) {
			var image;
			var url;
			var i;
			var j = 2;

			for (i = 0; i < j; i++)
			{
				url = _getItemsOnSrc(context, i);
				if (!_isImageCached(url))
				{
					image = new Image();
					image.src = url;
					_cachedImages[_cachedImages.length] = image;
				}

				url = _getItemsOffSrc(context, i);
				if (!_isImageCached(url))
				{
					image = new Image();
					image.src = url;
					_cachedImages[_cachedImages.length] = image;
				}
			}
		},
		_isImageCached = function (context, url) {
			var i;
			for (i = 0; i < _cachedImages.length; i++)
			{
				if (_cachedImages[i].src == url) {
					return true;
				}
			}

			return false;
		},
		_getItemTitle = function (context, index, value) {
			if (typeof(context.settings.titles) == "object") {
				return context.settings.titles[index].replace("{0}", (value));
			} else if (context.settings.titles) {
				return context.settings.titles.replace("{0}", (value));
			} else {
				return value;
			}
		},
		_getValue = function(context) {
			if(typeof context.internal.value !== 'undefined') {
				return context.internal.value;
			} else {
				return context.settings.value;
			}
		},
		_setValue = function (context, value) {
			if (!context.internal.isInitialized || context.settings.isReadOnly) {
				return;
			}

			context.internal.value = value;

			if (!context.settings.allowMultipleSelections) {
				context.settings.isReadOnly = true;
			}

			context.internal.savingValue = true;
			context.settings.onRate(value);
		},
		_showValue = function (context, value) {
			var i, j = context.settings.maxRating * 2;
			value = (value * 2) - 1;

			for (i = 0; i < j; i++) {
				if (i <= value) {
					$(context.internal.state.find('img').get(i)).attr('src', _getItemsOnSrc(context, i));
				} else {
					$(context.internal.state.find('img').get(i)).attr('src', _getItemsOffSrc(context, i));
				}
			}
		},
		_mouseOver = function (context, value) {
			if (!context.internal.isInitialized || context.settings.isReadOnly) {
				return;
			}

			context.internal.state.addClass(context.settings.overClass);

			_showValue(context, value);
		},
		_mouseOut = function (context, value) {
			if (!context.internal.isInitialized || context.settings.isReadOnly) {
				return;
			}

			context.internal.state.removeClass(context.settings.overClass);

			_showValue(context, value);
		},
		_init = function (options) {
			return this.each(function () {
				var context = {
					settings: $.extend({}, $.fn.evolutionStarRating.defaults, options || {}),
					internal: {
						state: $(this)
					}
				};

				if (!context.settings.imagesPathUrl)
					context.settings.imagesPathUrl = $.telligent.evolution.site.getBaseUrl() + 'utility/images/';

				_cacheImages(context);

				$(this).data(CONTEXT_KEY, context);

				_initialize(context);
			});
		},
		_initialize = function(context) {

			// first reset
			context.internal.state
				.addClass(context.settings.starClass)
				.css('white-space', 'nowrap')
				.find('a').unbind(EVENT_NAMESPACE)
				.empty()
				.end()
				// when mouse leaves the control, reset it to current rating value
				.bind('mouseleave', function() {
					_showValue(context, _getValue(context));
				});

			if (context.settings.isReadOnly) {
				context.internal.state.addClass(context.settings.readOnlyClass);
			}

			var i, j = context.settings.maxRating * 2;

			var showLabels = typeof context.settings.ratingCount === 'undefined';

			for (i = 0; i < j; i++)
			{
				(function(){
					var a, e;
					e = $('<img />').css({
						borderLeftWidth: '0px',
						borderTopWidth: '0px',
						borderRightWidth: '0px',
						borderBottomWidth: '0px'
					});

					if (!context.settings.isReadOnly) {
						a = $('<a href="#" />')
							.css({ textDecoration: 'none' })
							.append(e);
					}

					var value = (i + 1) / 2;

					if (value <= context.settings.value) {
						e.attr('src', _getItemsOnSrc(context, i));
					} else {
						e.attr('src', _getItemsOffSrc(context, i));
					}

					if (!context.settings.isReadOnly) {
						if (!context.settings.useHalfStars) {
							value = Math.ceil(value);
							var title = _getItemTitle(context, value, value);
							if (showLabels) { a.attr('title', title); }
							e.attr('alt', title);
						} else {
							var title = _getItemTitle(context, i, value);
							if (showLabels) { a.attr('title', title); }
							e.attr('alt', title);
						}

						a.data('rating-value', value)
							.bind('click' + EVENT_NAMESPACE, function(e){
								_setValue(context, a.data('rating-value'));
								return false;
							})
							.bind('focus' + EVENT_NAMESPACE, function(e){
								_mouseOver(context, a.data('rating-value'));
							})
							.bind('mouseover' + EVENT_NAMESPACE, function(e){
								_mouseOver(context, a.data('rating-value'));
							})
							.bind('blur' + EVENT_NAMESPACE, function(e){
								_mouseOut(context, a.data('rating-value'));
							})
							.bind('mouseout' + EVENT_NAMESPACE, function(e) {
								_mouseOut(context, a.data('rating-value'));
							});
					}

					e.attr('align', 'absmiddle').attr('border', 0);

					if (a) {
						context.internal.state.append(a);
					} else {
						context.internal.state.append(e);
					}
				})();
			}

			_setMessage(context);

			context.internal.isInitialized = true;
		},
		_setMessage = function(context) {
			if (context.settings.ratingMessageFormat && !isNaN(parseInt(context.settings.ratingCount)) && !isNaN(parseInt(context.settings.value))) {
				context.internal.state.attr('title', context.settings.ratingMessageFormat.replace(/\{rating\}/gi, (Math.round(context.settings.value * 10) / 10)).replace(/\{count\}/gi, context.settings.ratingCount));
			}
		};

	var api = {
		val: function(value) {
			var context = this.data(CONTEXT_KEY);
			if(context !== null) {
				if(typeof value !== 'undefined') {
					context.internal.value = value;
					_showValue(context, value);
					return value;
				} else {
					return _getValue(context);
				}
			}
			return 0;
		},
		readOnly: function(readOnly) {
			var context = this.data(CONTEXT_KEY);
			if(context !== null) {
				if(typeof readOnly !== 'undefined') {
					context.settings.isReadOnly = readOnly;
					if (readOnly) {
						context.internal.state.find('a').css({ cursor: 'default' });
					} else {
						context.internal.state.find('a').css({ cursor: 'pointer' });
					}
				} else {
					return context.settings.isReadOnly;
				}
			}
			return true;
		},
		option: function(name, value) {
			if (typeof name === 'object') {
				return this.each(function() {
					var context = $(this).data(CONTEXT_KEY);
					if (context != null) {
						context.settings = 	$.extend({}, context.settings, name);
						_init.apply($(this), [context.settings]);
					}
				});
			} else if (typeof name !== 'undefined' && typeof value !== 'undefined') {
				return this.each(function() {
            		var context = $(this).data(CONTEXT_KEY);
            		if (context != null) {
            			context.settings[name] = value;
            			_init.apply($(this), [context.settings]);
            		}
            	});
			}
			else if (typeof name !== 'undefined') {
				var context = this.data(CONTEXT_KEY);
				if (context !== null) {
					return context.settings[name];
				} else {
					return null;
				}
			}
		}
	};

	$.fn.evolutionStarRating = function (method) {
		if (method in api) {
			return api[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return _init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.fn.evolutionStarRating');
		}
	};

	$.extend($.fn.evolutionStarRating, {
		defaults: {
			value: 0,				//	default rating value
			maxRating: 5,		//	number of stars
			imagesPathUrl: '',		//	path to star images
			useHalfStars: false,
			starClass: 'rating',
			overClass: 'active',
			readOnlyClass: 'readonly',
			titles: ['Terrible','Poor','Fair','Average','Good','Excellent'],
			isReadOnly: false,
			allowMultipleSelections: true,
			ratingCount: undefined,
			ratingMessageFormat: 'Average rating: {rating} out of {count} ratings.',
			onRate: function(value) { }
		}
	});

	return {};
}, jQuery, window);
 
 
﻿/// @name evolutionTagTextBox
/// @category jQuery Plugin
/// @description Renders a tag-editor
///
/// ### jQuery.fn.evolutionTagTextBox
///
/// This plugin implements the type-ahead suggestions within a text input field for a set of tags.  It also automates the opening of the tag selection modal.
///
/// ### Usage
///
/// Initializes the tag text box plugin.  Options include:
///
///     $('SELECTOR').evolutionTagTextBox(options)
///
/// ### Options
///
///  * `allTags`: An array of HTML unencoded tags that can be used for auto-completing and selecting.
///
/// ### Methods
///
/// #### openTagSelector
///
/// Opens the tag selector modal.
///
///     $('SELECTOR').evolutionTagTextBox('openTagSelector')
///

define('plugin.evolutionTagTextBox', function($, global, undef){

    var api =
	{
        'openTagSelector': function()
        {
            var context = this.data('evolutionTagTextBox');
            if (!context)
                return;

            window.__tagEditor = {
                SetSelectedTags: function(tags)
                {
                    _setSelectedTags(context, tags);
                },
                GetAllTagsWithEncoding: function()
                {
                    var out = [];
	                var all = _getAllTags(context);
	                var e = $('<div></div>');
	                for (var i = 0; i < all.length; i++)
	                {
	                    e.text(all[i]);
	                    out[i] = [all[i], e.html()];
	                }
	                return out;
                },
                GetSelectedTags: function()
                {
                return _getSelectedTags(context);
                }
            }

			var modalUrl = $.telligent.evolution.ensureRemoteUrlEncoding(context.settings.selectTagsModalUrl);
			if (modalUrl.substr(0, 2) == '~/')
				modalUrl = $.telligent.evolution.site.getBaseUrl() + modalUrl.substr(2);

            if (window.Telligent_Modal)
                window.Telligent_Modal.Open(modalUrl, 400, 350, null);
            else if ($.glowModal)
                $.glowModal(modalUrl, { width: 400, height: 350 });
        }
	};

    var _init = function (options)
    {
        return this.each(function ()
        {
            var context = {
                settings: $.extend({}, $.fn.evolutionTagTextBox.defaults, options || {}),
                internal: {
                    state: this,
                    suggestionTimeoutHandle: null,
                    previousTags: [],
                    previousValue: '',
                    currentTag: '',
                    currentTagPosition: 0
                }
            };

            $(this).data('evolutionTagTextBox', context);

            _getCurrentTag(context);
            $(this).bind('keyup.evolutionTagTextBox', function (event) { return _editorKeyUp(context, event); });
            $(this).bind('keydown.evolutionTagTextBox', function (event) { return _editorKeyDown(context, event); });
            $(this).bind('onblur.evolutionTagTextBox', function (event) { return _editorBlur(context, event); });
        });
    },
	_getAllTags = function (context)
	{
	    return context.settings.allTags;
	},
	_setSelectedTags = function (context, tags)
	{
	    var newTags = new Array();
	    var selTags = _getSelectedTags(context);
	    var allTags = _getAllTags(context);

	    // add tags that were new (not in GetAllTags())
	    var found;
	    for (var i = 0; i < selTags.length; i++)
	    {
	        found = false;
	        for (var j = 0; j < allTags.length; j++)
	        {
	            if (selTags[i].toUpperCase() == allTags[j].toUpperCase())
	            {
	                found = true;
	                break;
	            }
	        }

	        if (!found)
	            newTags[newTags.length] = selTags[i];
	    }

	    // add tags that were selected from GetAllTags())
	    for (i = 0; i < tags.length; i++)
	    {
	        newTags[newTags.length] = tags[i];
	    }

	    $(context.internal.state).val(newTags.join(', '));
	},
	_getSelectedTags = function (context)
	{
	    var tTags = $(context.internal.state).val().split(/;|,/);
	    var tags = [];

	    // filter out blank items
	    for (var i = 0; i < tTags.length; i++)
	    {
	        tTags[i] = _trim(context, tTags[i]);
	        if (tTags[i] != "")
	            tags[tags.length] = tTags[i];
	    }

	    return tags;
	},
	_trim = function (context, text)
	{
	    return text.replace(/^\s+|\s+$/g, '');
	},
	_editorKeyDown = function (context, event)
	{
	    window.clearTimeout(context.internal.suggestionTimeoutHandle);

	    if (!event)
	        event = window.event;

	    if (!event)
	        return;

	    if (event.keyCode == 13)
	    {
	        context.internal.state.focus();

	        if (document.selection)
	        {
	            var sel = window.document.selection.createRange();
	            if (sel.text && sel.text.length > 0)
	            {
	                sel.moveStart('character', sel.text.length);
	                sel.select();
	            }
	        }
	        else if (context.internal.state.selectionStart || context.internal.state.selectionStart == '0')
	        {
	            context.internal.state.selectionStart = context.internal.state.selectionEnd;
	        }

	        event.cancelBubble = true;
	        event.returnValue = false;
	        return false;
	    }
	    else if (event.keyCode == 8)
	    {
	        context.internal.state.focus();

	        if (document.selection)
	        {
	            var sel = window.document.selection.createRange();
	            if (sel)
	            {
	                sel.moveStart('character', -1);
	                sel.text = "";

	                event.cancelBubble = true;
	                event.returnValue = false;
	                return false;
	            }
	        }
	        else if (context.internal.state.selectionStart || context.internal.state.selectionStart == '0')
	        {
	            var start = context.internal.state.selectionStart;
	            var end = context.internal.state.selectionEnd;

	            if (start == end)
	                return true;

	            if (start > 0)
	                start--;

	            context.internal.state.value = context.internal.state.value.substring(0, start) + context.internal.state.value.substring(end);
	            context.internal.state.selectionStart = start;
	            context.internal.state.selectionEnd = start;

	            event.cancelBubble = true;
	            event.returnValue = false;
	            return false;
	        }
	    }

	    return true;
	},
	_editorKeyUp = function (context, event)
	{
	    window.clearTimeout(context.internal.suggestionTimeoutHandle);

	    context.internal.suggestionTimeoutHandle = window.setTimeout(function () { _suggest(context); }, 249);

	    return true;
	},
	_editorBlur = function (context, event)
	{
	    window.clearTimeout(context.internal.suggestionTimeoutHandle);

	    return true;
	},
	_suggest = function (context)
	{
	    if (!document.selection && !context.internal.state.selectionStart && context.internal.state.selectionStart != '0')
	        return true;

	    if ($(context.internal.state).val() == context.internal.previousValue)
	        return true;

	    context.internal.previousValue = $(context.internal.state).val();

	    _getCurrentTag(context);
	    if (context.internal.currentTag == "")
	        return true;

	    var suggestion = _getTagSuggestion(context, context.internal.currentTag);
	    if (!suggestion || suggestion.length == context.internal.currentTag.length)
	        return true;

	    suggestion = suggestion.substr(context.internal.currentTag.length);

	    $(context.internal.state).val($(context.internal.state).val().substr(0, context.internal.currentTagPosition + context.internal.currentTag.length) + suggestion + $(context.internal.state).val().substr(context.internal.currentTagPosition + context.internal.currentTag.length));
	    context.internal.state.focus();

	    if (document.selection)
	    {
	        var textrange = context.internal.state.createTextRange();
	        textrange.select();

	        textrange.moveStart('character', context.internal.currentTagPosition + context.internal.currentTag.length);
	        textrange.moveEnd('character', -($(context.internal.state).val().length - (context.internal.currentTagPosition + context.internal.currentTag.length + suggestion.length)));
	        textrange.select();
	    }
	    else if (context.internal.state.selectionStart || context.internal.state.selectionStart == '0')
	    {
	        context.internal.state.selectionStart = context.internal.currentTagPosition + context.internal.currentTag.length;
	        context.internal.state.selectionEnd = context.internal.currentTagPosition + context.internal.currentTag.length + suggestion.length;
	    }
	},
	_getCurrentTag = function (context)
	{
	    var newTags = $(context.internal.state).val().toLowerCase().split(/;|,/);
	    var i, j, matched;
	    context.internal.currentTag = "";
	    var position = 0;
	    var tempTag;
	    var hasCurrentTag = true;
	    for (i = 0; i < newTags.length; i++)
	    {
	        tempTag = newTags[i].replace(/^\s+/g, '');
	        position += newTags[i].length - tempTag.length;
	        newTags[i] = tempTag;

	        matched = false;
	        for (j = 0; j < context.internal.previousTags.length && !matched; j++)
	        {
	            if (newTags[i] == context.internal.previousTags[j])
	            {
	                context.internal.previousTags.splice(j, 1);
	                matched = true;
	            }
	        }

	        if (!matched)
	        {
	            if (context.internal.currentTag != "")
	                hasCurrentTag = false;
	            else
	            {
	                context.internal.currentTag = newTags[i];
	                context.internal.currentTagPosition = position;
	            }
	        }

	        position += newTags[i].length + 1;
	    }

	    if (!hasCurrentTag)
	        context.internal.currentTag = "";

	    context.internal.previousTags = newTags;
	},
	_getTagSuggestion = function (context, tag)
	{
	    var i, j, match;
	    var tags = _getAllTags(context);

	    for (i = 0; i < tags.length; i++)
	    {
	        if (tags[i].toLowerCase().indexOf(tag) == 0)
	        {
	            match = false;

	            for (j = 0; j < context.internal.previousTags.length && !match; j++)
	            {
	                if (context.internal.previousTags[j] == tags[i].toLowerCase())
	                    match = true;
	            }

	            if (!match)
	                return tags[i];
	        }
	    }

	    return null;
	};

    $.fn.evolutionTagTextBox = function (method)
    {
        if (method in api)
        {
            return api[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method)
        {
            return _init.apply(this, arguments);
        } else
        {
            $.error('Method ' + method + ' does not exist on jQuery.fn.evolutionTagTextBox');
        }
    };

    $.extend($.fn.evolutionTagTextBox, {
        defaults: {
            allTags: [],
            selectTagsModalUrl: '~/utility/tagselector?TagEditor=__tagEditor'
        }
    });

	return {};
}, jQuery, window);
 
 
/// @name evolutionTextEditor
/// @category jQuery Plugin
/// @description Renders a plain text editor capable of editing HTML
///
/// ### jQuery.fn.evolutionTextEditor
///
/// This plugin supports enhancing a text area with support for editing HTML suitable for use as a primary content editor.
///
/// ### Usage
///
///     $('SELECTOR').evolutionTextEditor(options)
///
/// where 'SELECTOR' is a textarea.
///
/// ### Options
///
///  * `plugins`: (array) list of evolutionComposer plugins to enable for this text editor
///    * default `[]`
///  * `readOnlyMessage`: (string) message to show when a user attempts to edit content that cannot be edited in plain text mode
///    * default ``
///
/// ### Methods
///
/// #### val
///
/// Returns (and sets if passed a second optional value) the current HTML result of the text editor
///
/// 	// get the value
///     var value = $('SELECTOR').evolutionTextEditor('val');
///
///     // set the value
/// 	$('SELECTOR').evolutionTextEditor('val', '<p>New content</p>');
///
/// #### focus
///
/// Focuses on the editor.
///
///     $('SELECTOR').evolutionTextEditor('focus');
///
/// #### resize
///
/// Resizes the editor to a specific width/height.
///
///     $('SELECTOR').evolutionTextEditor('resize', width, height);
///


define('plugin.evolutionTextEditor', function($, global, undefined){

	var KEY = '__EVOLUTIONTEXTEDITOR_CONTEXT';

    var getContext = function(input) {
        return $(input).data(KEY);
    },
    getContent = function(context) {
        var html = '';
        if (context.isReadOnly) {
            html = context.readOnlyView.html();
        } else {
            $.telligent.evolution.put({
                url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/html/fromtext.json',
            	data: { text: context.editor.evolutionComposer('val') },
            	dataType: 'json',
                async: false,
            	success: function(response)
            	{
            		html = response.Html;
            	}
            });
        }
        return html;
    },
    setContent = function(context, html) {
        $.telligent.evolution.put({
        	url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/text/fromhtml.json',
        	data: { html: html },
        	dataType: 'json',
            async: false,
        	success: function(response)
        	{
                if (response.TextConversion.IsDataLost) {
                    if (!context.isReadOnly) {
                        context.readOnlyView.css('height', context.editor.height() + 'px');
                        context.readOnlyView.css('width', context.editor.width() + 'px');
                        context.isReadOnly = true;
                        context.readOnlyView.show();
                        context.editorWrapper.hide();
                    }
                    context.readOnlyView.html(html);
                    context.editor.val('<!html>' + html);
                } else {
                    if (context.isReadOnly) {
                        context.isReadOnly = false;
                        context.readOnlyView.hide();
                        context.editorWrapper.show();
                    }
        		    context.editor.evolutionComposer('val', response.TextConversion.Text);
        		    context.editor.trigger('input');
                }
        	}
        });
    },
    focus = function(context) {
    	if (!context.isReadOnly) {
        	context.editor.focus();
        }
    },
    insertContent = function(context, html) {
        setContent(context, getContent(context) + html);
    },
    resize = function(context, width, height) {
        context.evolutionComposer('resize', width, height);

        if (!isNaN(parseInt(width, 10))) {
            context.readOnlyView.css('width', width + 'px');
        }
        if (!isNaN(parseInt(height, 10))) {
            context.readOnlyView.css('height', height + 'px');
        }
    };

    var methods = {
    	init: function(options) {
    		return this.each(function(){
    			var elm = $(this);
                // only init once
                if(elm.data(KEY))
                    return;
                var width = elm.innerWidth() - parseInt(elm.css('padding-left'), 10) - parseInt(elm.css('padding-right'), 10);
                var height = elm.innerHeight() - parseInt(elm.css('padding-top'), 10) - parseInt(elm.css('padding-bottom'), 10);
                var initialValue = elm.val();
                var wrapper = $('<div class="text-editor-wrapper"></div>');
                wrapper.insertAfter(elm);
                wrapper.append(elm);
                var ro = $('<div class="text-editor-read-only" style="overflow: auto; padding: 2px; border: 1px solid; box-sizing: border-box"></div>').hide();
                ro.on('click', function() {
                   if (options.readOnlyMessage) {
                       alert(options.readOnlyMessage);
                   }
                });
                ro.insertAfter(wrapper);
                elm.evolutionComposer({
                    plugins: options.plugins,
                    focus: false
                })
                .data(KEY, {
                    editorWrapper: wrapper,
                    editor: elm,
                    readOnlyView: ro,
                    isReadOnly: false
                });
                setTimeout(function(){
                    elm.evolutionComposer('resize', width, height);
                }, 50);
                if ($.trim(initialValue).length > 0) {
                    setContent(getContext(elm), initialValue);
                }
    		});
    	},
    	val: function(newValue) {
    		if(typeof newValue !== 'undefined') {
    			var context = getContext(this);
    			if(context) {
    				return setContent(context, newValue);
    			}
    		} else {
    			var context = getContext(this);
    			if(context) {
    				return getContent(context);
    			} else {
    			    return '';
    			}
    		}
    		return this;
    	},
    	focus: function(fn) {
    		var context = getContext(this);
    		if(context) {
    			focus(context);
    		}
    		return this;
    	},
    	resize: function(width, height) {
    		var context = getContext(this);
    		if(context) {
    			resize(context, width, height);
    		}
    		return this;
    	}
    };

    $.fn.evolutionTextEditor = function(method) {
    	if (methods[method]) {
    		return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    	} else if (typeof method === 'object' || !method) {
    		return methods.init.apply(this, arguments);
    	} else {
    		$.error('Method ' +	 method + ' does not exist on jQuery.evolutionTextEditor');
    	}
    };

	return {};
}, jQuery, window); 
 
/// @name evolutionTheater
/// @category jQuery Plugin
/// @description Renders a theater UI with optional injectable next/previous logic
/// *documentation in progress*

define('plugin.evolutionTheater', function($, global, undef){

	var eventNameSpace = '_evolution_theater';

	var api = {
		show: function(options) {
			var settings = $.extend({}, api.defaults, options || {});

			// build elements
			var mask = $('<div class="theater-mask"></div>').hide().appendTo('body'),
				contentWrapper = $('<div class="theater-container"></div>').hide().appendTo('body'),
				contentInnerWrapper = $('<div class="theater-content-container"></div>').appendTo(contentWrapper),
				content = $('<div class="theater-content"></div>').appendTo(contentInnerWrapper),
				nextButton = $('<a href="#" class="theater-next">&rarr;</a>').appendTo(contentWrapper),
				backButton = $('<a href="#" class="theater-back">&larr;</a>').appendTo(contentWrapper),
				closeButton = $('<a href="#" class="theater-close">X</a>').appendTo(contentInnerWrapper);

			// implementation for loading/showing/hiding
			var currentLoader = null,
				nextLoader = null,
				previousLoader = null,
				show = function(contentLoader, renderer) {
					$('body').css({ overflow: 'hidden' });
					currentLoader = contentLoader;
					contentLoader(function(response){
						// hide the next/prev buttons
						nextButton.hide();
						backButton.hide();
						// show the just-loaded content
						if(renderer) {
							renderer(content, response)
						} else {
							content.hide().html(response);
						}
						if(!mask.is(':visible')) {
							mask.show();
							contentWrapper.show();
						}
						// raise events on the loaded content
						settings.loaded(content);
						nextLoader = settings.nextContent(content);
						previousLoader = settings.previousContent(content);
						content.show();
						// show navigation buttons if there is content to navigate to
						if(nextLoader && nextLoader !== null) {
							nextButton.show();
						}
						if(previousLoader && previousLoader !== null) {
							backButton.show();
						}
					});
				},
				hide = function() {
					$('body').css({ overflow: 'auto' });
					// unbind modal handlers
					nextButton.unbind(eventNameSpace);
					backButton.unbind(eventNameSpace);
					closeButton.unbind(eventNameSpace);
					contentWrapper.unbind(eventNameSpace);
					// remove from DOM
					mask.hide().remove();
					contentWrapper.hide().remove();
					// unbind global handlers
					$(document).unbind(eventNameSpace);
				},
				showNext = function() {
					if(nextLoader && nextLoader !== null) {
						show(nextLoader);
					}
				},
				showPrev = function() {
					if(previousLoader && previousLoader !== null) {
						show(previousLoader);
					}
				};

			api.refresh = function(renderer) {
				show(currentLoader, renderer);
			};
			api.hide = function() {
				hide();
			};

			// handle ui events

			// move next
			nextButton.bind('click.' + eventNameSpace, function(e){
				e.preventDefault();
				showNext();
			});
			// move previous
			backButton.bind('click.' + eventNameSpace, function(e){
				e.preventDefault();
				showPrev();
			});
			// close button
			closeButton.bind('click.' + eventNameSpace, function(e){
				e.preventDefault();
				hide();
			});
			// close on click of background
			contentWrapper.bind('click.' + eventNameSpace, function(e){
				if(e.target === contentWrapper.get(0)) {
					hide();
				}
			});

			// shorcut keys
			$(document).bind('keydown.' + eventNameSpace, function(e){
				if(mask.is(':visible')) {
					// right (next)
					if(e.which === 39) {
						if(!$(e.target).is('input,textarea')) {
							showNext();
							nextButton.addClass('pressed');
						}
					// left (previous)
					} else if(e.which === 37) {
						if(!$(e.target).is('input,textarea')) {
							showPrev();
							backButton.addClass('pressed');
						}
					// escape (exit)
					} else if(e.which === 27) {
						hide();
					}
				}
			});
			// shorcut keys
			$(document).bind('keyup.' + eventNameSpace, function(e){
				if(mask.is(':visible')) {
					// right (next)
					if(e.which === 39) {
						nextButton.removeClass('pressed');
					// left (previous)
					} else if(e.which === 37) {
						backButton.removeClass('pressed');
					}
				}
			});

			// show content
			show(settings.content);
		},
		hide: function() { },
		refresh: function() { },
		defaults: {
			content: function() { return null; },
			nextContent: function() { return null; },
			previousContent: function() { return null; },
			loaded: function() { }
		}
	};

	$.evolutionTheater = api;

	return {};
}, jQuery, window);
 
 
define('plugin.evolutionTip', function($, global, undef){

	var nameSpace = '._evolutionTip',
		currentTip,
		offset = 30,
		horizontalPosition = {
			left: 'left',
			center: 'center',
			right: 'right'
		},
		verticalPosition = {
			above: 'above',
			below: 'below'
		};

	function showTip(elm, options) {
		hideTip();

		var target = $(elm);

		var possibleAttributes = ['data-' + options.attribute, 'title', 'alt'],
			possibleAttribute,
			content;
		for(var i = 0; i < possibleAttributes.length; i++) {
			possibleAttribute = possibleAttributes[i];
			var attr = target.attr(possibleAttribute);
			if(attr && $.trim(attr).length >0) {
				content = attr;
				break;
			}
		}
		if(!content || content.length == 0)
			return;

		// create tip
		currentTip = {
			attribute: possibleAttribute,
			content: content,
			element: target,
			ui: $(options.template({
				content: content
			})).css({
				'position': 'absolute',
				'top': -500,
				'left': -500
			}).appendTo('body')
		}

		// remove the alt/title text
		if(currentTip.attribute == 'title' || currentTip.attribute == 'alt') {
			currentTip.element.attr(currentTip.attribute, '');
		}


		// measure where the tip should render
		var win = $(window),
			scrollTop = $(document).scrollTop(),
			targetPosition = target.offset();
			targetWidth = target.outerWidth(),
			targetHeight = target.outerHeight(),
			windowWidth = win.outerWidth(),
			windowHeight = win.outerHeight(),
			tipWidth = currentTip.ui.outerWidth(),
			tipHeight = currentTip.ui.outerHeight(true);

		// determine tip alignment relative to target
		var horz = horizontalPosition.center,
			vert = verticalPosition.above;
		if(targetHeight + targetPosition.top - tipHeight - scrollTop <= offset)
			vert = verticalPosition.below;
		if(targetPosition.left - (tipWidth / 2) <= offset)
			horz = horizontalPosition.left;
		else if(windowWidth - (targetPosition.left + targetWidth + (tipWidth / 2)) <= offset)
			horz = horizontalPosition.right;

		// determine rendering position based on alignment
		var left, top;

		if(horz == horizontalPosition.right) {
			left = targetPosition.left + targetWidth - tipWidth;
		} else if(horz == horizontalPosition.left) {
			left = targetPosition.left;
		} else {
			left = targetPosition.left + (targetWidth / 2) - (tipWidth / 2);
		}

		if(vert == verticalPosition.above) {
			top = targetPosition.top - tipHeight;
		} else {
			top = targetPosition.top + targetHeight;
		}

		// position tip
		currentTip.ui.addClass(vert).addClass(horz).css({
			'left': left,
			'top': top
		});
	}

	function hideTip() {
		if(currentTip) {
			currentTip.ui.remove();
			// restore the alt/title text if removed
			if(currentTip.attribute == 'title' || currentTip.attribute == 'alt') {
				currentTip.element.attr(currentTip.attribute, currentTip.content);
			}
		}
 	}

	$.fn.evolutionTip = function(options) {
		var settings = $.extend({}, $.fn.evolutionTip.defaults, options || {});
		settings.template = $.telligent.evolution.template.compile(settings.template);
		return this.off(nameSpace)
			.on('mouseenter' + nameSpace, function(e){
				showTip(this, settings);
			})
			.on('mouseleave' + nameSpace, function(){
				hideTip();
			});
	}
	$.fn.evolutionTip.defaults = {
		template: '<div class="tip"><%= content %></div>',
		attribute: 'tip'
	}

    return {};
}, jQuery, window);
 
 
﻿/// @name evolutionToggleLink
/// @category jQuery Plugin
/// @description Renders a togglable link with a change callback
///
/// ### jQuery.fn.evolutionToggleLink
///
/// This plugin automates behavior associated to links that toggle state and are generally control state that is updated via an AJAX callback.
///
/// ### Usage
///
/// Initializes the selected &lt;a /&gt; tag(s) as toggle links
///
///     $('SELECTOR').evolutionToggleLink(options)
///
/// ### Options
///
///  * `onHtml`: the HTML to render within the &lt;a /&gt; tag when the toggle link is in the "on" state.
///  * `offHtml`: the HTML to render within the &lt;a /&gt; tag when the toggle link is in the "off" state.
///  * `processingHtml`:  the HTML to render within the &lt;a /&gt; tag when the toggle link is processing.
///  * `changeState`: the function, taking the state boolean as a parameter, that performs the requested state change.  It is expected that this function, when the state change is complete, will change the rendered value of the toggle link via the val method.  The toggle link will remain in the processing state until this callback occurs.
///  * `onCssClass`: the CSS class to apply to the &lt;a /&gt; tag when it is in the "on" state.
///  * `offCssClass`: the CSS class to apply to the &lt;a /&gt; tag when it is in the "off" state.
///  * `processingCssClass`: the CSS class to apply to the &lt;a /&gt; tag when it is processing.
///  * `onTitle`: the value for the title attribute when the toggle link is in the "on" state.
///  * `offTitle`: the value for the title attribute when the toggle link is in the "off" state.
///  * `processingTitle`: the value for the title attribute when the toggle link is processing.
///  * `val`: the initial value for the toggle link.
///
/// ### Methods
///
/// #### val
///
/// Retrieves and/or sets the current value of the toggle link.
///
///     // Returns the current state of the toggle link as a Boolean.
///     $('SELECTOR').evolutionToggleLink('val')
///
///     // Sets the rendered state of the toggle link to the specified Boolean state.
///     $('SELECTOR').evolutionToggleLink('val', state)
///

define('plugin.evolutionToggleLink', function($, global, undef){

    var api =
    {
    	val: function(val)
    	{
    		if (val === undefined)
    		{
    			var context = this.data('evolutionToggleLink');
    			if (context)
    				return context.settings.val;

    			return false;
    		}
    		else
    		{
    			return this.each(function()
    			{
    				var context = $(this).data('evolutionToggleLink');
    				if (context)
    					_setVal(context, val);
    			});
    		}
    	}
    };

    var _init = function (options)
    {
        return this.each(function ()
        {
            var context = {
                settings: $.extend({}, $.fn.evolutionToggleLink.defaults, options || {}),
                internal: {
                    state: $(this),
                    processing: false
                }
            };

            context.internal.state
            	.data('evolutionToggleLink', context)
            	.click(function(e) { return _click(context, e); });

            _updateUi(context);
        });
    },
    _click = function(context)
    {
    	if (!context.internal.processing && context.settings.changeState)
    	{
    		context.internal.processing = true;
    		_updateUi(context);
    		context.settings.changeState(!context.settings.val);
    	}

    	return false;
    },
    _setVal = function(context, val)
    {
   		context.settings.val = val;
   		context.internal.processing = false;
   		_updateUi(context);
    },
    _updateUi = function(context)
    {
    	if (context.internal.processing)
    	{
    		context.internal.state
        		.attr('class',context.settings.processingCssClass)
        		.attr('title',context.settings.processingTitle)
        		.html(context.settings.processingHtml);
    	}
    	else if (context.settings.val)
        {
        	context.internal.state
        		.attr('class',context.settings.onCssClass)
        		.attr('title',context.settings.onTitle)
        		.html(context.settings.onHtml);
        }
        else
        {
        	context.internal.state
        		.attr('class',context.settings.offCssClass)
        		.attr('title',context.settings.offTitle)
        		.html(context.settings.offHtml);
        }
    }

    $.fn.evolutionToggleLink = function (method)
    {
        if (method in api)
            return api[method].apply(this, Array.prototype.slice.call(arguments, 1));
        else if (typeof method === 'object' || !method)
            return _init.apply(this, arguments);
        else
            $.error('Method ' + method + ' does not exist on jQuery.fn.evolutionToggleLink');
    };

    $.extend($.fn.evolutionToggleLink, {
        defaults: {
            onHtml: '',
            offHtml: '',
            processingHtml: '',
            changeState: null,
            onCssClass: '',
            offCssClass: '',
            processingCssClass: '',
            onTitle: '',
            offTitle: '',
            processingTitle: '',
            val: false
        }
    });

    return {};
}, jQuery, window);
 
 
/// @name evolutionTransform
/// @category jQuery Plugin
/// @description Performs CSS-based transforms and transitions
///
/// ### jQuery.fn.evolutionTransform
///
/// This plugin performs a CSS-based transforms and transitions on an element, optionally with animation. Uses GPU acceleration where available.
///
/// ### Usage
///
/// Transforms an element
///
///     $('selector').evolutionTransform(settings, options);
///
/// ### Settings
///
/// Settings is an object of CSS keys and values which are transitioned on the element. The following specific keys are applied as CSS transformations:
///
///  * `x`: x offset
///  * `y`: y offset
///  * `left`: alias for x offset (not to be confused with the standard CSS `left` property)
///  * `top`: alias for y offset (not to be confused with the standard CSS `top` property)
///  * `scale`: zoom scale
///
/// ### Options
///
///  * `duration`: CSS animation duration, default 0
///  * `easing`: CSS animation easing, default 'linear'
///
/// ### Enabling or Disabling Animation
///
/// CSS animation can be globally disabled or enabled through:
///
///     $.fn.evolutionTransform.animationEnabled = false|true
///
/// When disabled, duration and easing options are ignored.

define('plugin.evolutionTransform', function($, global, undef) {

	// non-transition fallback detction and support
	function supportsTransitions() {
		var bodyStyle = (document.body || document.documentElement).style,
			vendors = ['Moz', 'webkit', 'Webkit', 'Khtml', 'O', 'ms'];

		if(typeof bodyStyle['transition'] == 'string')
			return true;

		for(var i=0; i<bodyStyle.length; i++) {
			if(typeof bodyStyle[vendors[i] + 'Transition'] == 'string')
				return true;
		}
		return false;
	}

	// native support

	var x = 'x',
		y = 'y',
		left = 'left',
		top = 'top',
		scale = 'scale',
		undef,
		body,
		vendorPrefix = (function () {
			var styles = window.getComputedStyle(document.documentElement, ''),
				pre = (Array.prototype.slice
					.call(styles)
					.join('')
					.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1];
			return '-' + pre + '-';
		}());

	function transform(settings, options) {
		var settings = settings || {},
			options = options || {},
			props = [],
			transX,
			transY,
			transRot = null,
			transRotX = null,
			transRotY = null,
			transScale = null,
			transforms = [],
			elm = this.get(0);

		for(var opt in transform.defaults) {
			if(!options[opt]) {
				options[opt] = transform.defaults[opt];
			}
		}

		for(var key in settings) {
			var val = settings[key];
			if(key === x || key === left) {
				transX = val;
				delete settings[key];
			} else if(key === y || key === top) {
				transY = val;
				delete settings[key];
			} else if(key === scale) {
				transScale = val;
				delete settings[key];
			} else {
				// change int (n) values to Npx
				if(typeof val === 'number' && val % 1 == 0) {
					settings[key] = (val + 'px');
				}
				props[props.length] = key;
			}
		}

		if(transX != undef && transY != undef) {
			transforms[transforms.length] = ('translate3d(' + transX + 'px, ' + transY + 'px, 0px)');
		}

		if(transScale != undef) {
			transforms[transforms.length] = ('scale(' + transScale + ')');
		}

		if(transforms.length > 0) {
			var propName = vendorPrefix + 'transform';
			mergedTransforms = transforms.join(' ');
			props[props.length] = propName;
			settings[propName] = mergedTransforms;
			settings['transform'] = mergedTransforms;
		}

		// only animate transitions if animationEnabled
		var transitionPart = $.fn.evolutionTransform.animationEnabled
				? ((options.duration / 1000) + 's ' + options.easing)
				: '';
			transition = props.join(' ' + transitionPart + ', ') + ' ' + transitionPart;

		// force a redraw to avoid batched CSS by accessing offsetHeight
		// pass it to noop to keep the closure compiler happy by not
		// removing the access due to being not used
		$.noop(elm.offsetHeight);

		elm.style[vendorPrefix + 'transition'] = transition;
		elm.style['transition'] = transition;
		for(var key in settings) {
			elm.style[key] = settings[key];
		}
		return this;
	};
	transform.defaults = {
		duration: 0,
		easing: 'linear',
		perspective: 250
	};

	$.fn.evolutionTransform = transform;
	$.fn.evolutionTransform.animationEnabled = true;

	return {};

}, jQuery, window); 
 
﻿/// @name evolutionUserFileTextBox
/// @category jQuery Plugin
/// @description Renders a user file text box
///
/// ### jQuery.fn.evolutionUserFileTextBox
///
/// This plugin converts a text input field accepting a URL into a user file browser with a preview and buttons to select or remove the selected file.
///
/// ### Usage
///
/// Initialize the plugin
///
///     $('SELECTOR').evolutionUserFileTextBox(options)
///
/// ### Options
///
///  * `removeText`: The text to show on the remove button.  This is automatically defaulted by Evolution.
///  * `selectText`: The text to show on the select button.  This is automatically defaulted by Evolution.
///  * `noFileText`: The text to show when no file is selected.  This is automatically defaulted by Evolution.
///  * `cssClass`: The CSS class of the &lt;div&gt; tag wrapping the selection area.  This is automatically defaulted by Evolution.
///  * `previewCssClass`: The CSS Class of the &lt;div&gt; tag wrapping the preview area.  This is automatically defaulted by Evolution.
///  * `initialPreviewHtml`: The HTML to show in the preview area when loaded.  This should be set to the appropriate output from the $core_media extension within scripted widgets.
///
define('plugin.evolutionUserFileTextBox', function($, global, undef){

    var api = {};
    var iterator = 1;

    var _init = function (options)
    {
        return this.each(function ()
        {
            var context = {
                settings: $.extend({}, $.fn.evolutionUserFileTextBox.defaults, options || {}),
                internal: {
                    state: this,
                    preview: null,
                    select: null,
                    remove: null
                }
            };
            
            $.telligent.evolution.post({
				url: context.settings.endpoint,
				data: { 
					m: 'c'
				},
                success: function(response) {
                	context.internal.contextid = response.uploadContextId;
                	context.internal.uploadurl = response.uploadUrl;
                	
                    var outer = $('<div></div>').attr('class',context.settings.cssClass);

		            context.internal.preview = $('<div></div>')
		            	.attr('class',context.settings.previewCssClass);
		            outer.append(context.internal.preview);

		            context.internal.select = $('<a href="#" class="upload"></a>')
		            	.attr('id', 'userfiletextbox_' + (new Date()).getTime() + '_' + (iterator++))
		            	.html(context.settings.selectText)
		            	.glowUpload({
							fileFilter: null,
							uploadUrl: context.internal.uploadurl,
							renderMode: 'link'
						})
						.bind('glowUploadBegun', function(e) {
				            context.uploading = true;
				            context.internal.select.html('0%');
				        })
				        .bind('glowUploadComplete', function(e, file) {
				        	context.internal.select.html(context.settings.selectText);
				        	if (file && file.name.length > 0) {
				        		$.telligent.evolution.post({
				        			url: context.settings.endpoint,
				        			data: {
				        				m: 'f',
				        				ContextId: context.internal.contextid,
				        				FileName: file.name
				        			},
				        			success: function(response) {
										context.internal.state.value = response.url;
							            context.uploading = false;
							            context.internal.preview.html(response.previewHtml).slideDown(100);
							            context.internal.remove.show();
							        }
							    });
					    	}
				        })
				        .bind('glowUploadProgress', function(e, details) {
				        	context.internal.select.html(details.percent + '%');
				        });
				        
		            outer.append(context.internal.select);

		            context.internal.remove = $('<a href="#" class="remove" style="margin-left: 1em;"></a>')
		            	.html(context.settings.removeText)
		            	.click(function() { 
		            		context.internal.preview.html('').slideUp(100);
		            		context.internal.state.value = '';
		            		context.internal.remove.hide();
		            		return false;
		            	})
		            	.hide();
		            	
		           	outer.append(context.internal.remove);

		           	var url = $(context.internal.state).val();
		           	if (url) {
		           		context.internal.remove.show();
		           		$.telligent.evolution.post({
		           			url: context.settings.endpoint,
		           			data: { 
		           				m: 'p',
		           				Url: url
		           			},
		           			success: function(response) {
		           				context.internal.preview.html(response.previewHtml).slideDown(100);
		           			}
		           		});
		           	}
		           	else
		           		context.internal.preview.html('').hide();

		            $(context.internal.state)
		            	.data('evolutionUserFileTextBox', context)
		            	.before(outer)
		            	.hide();
		                }
            });
        });
    };

    $.fn.evolutionUserFileTextBox = function (method)
    {
        if (method in api)
            return api[method].apply(this, Array.prototype.slice.call(arguments, 1));
        else if (typeof method === 'object' || !method)
            return _init.apply(this, arguments);
        else
            $.error('Method ' + method + ' does not exist on jQuery.fn.evolutionUserFileTextBox');
    };

    $.extend($.fn.evolutionUserFileTextBox, {
        defaults: {
            removeText: '',
            selectText: '',
            noFileText: '',
            initialPreviewHtml: '',
            cssClass: 'user-file-url',
            previewCssClass: 'user-file-url-preview',
            endpoint: ''
        }
    });

    return {};
}, jQuery, window);
 
 
﻿/// @name evolutionValidation
/// @category jQuery Plugin
/// @description Supports validation related to click events.
///
/// ### jQuery.fn.evolutionValidation
///
/// Supports validation related to one or more button/link click events.
///
/// ### Usage
///
/// Initializes validation.
///
///     $('SELECTOR').evolutionValidation(options)
///
/// Initializes validation.  The selector should represent one or more links/buttons that can submit the form being validated.
///
/// ### Options
///
///  * `validateOnLoad`: True/false/null.  If true, validation will be performed when the page loads.  If false, it will not.  If null, the form will be validated on load if any textual input fields have values.
///  * `onValidated`: Function called when validation is performed.  Parameters are: validationSuccessful (bool), submitButtonClicked (bool), failedValidationContext (object).
///  * `onSuccessfulClick`: Function called when a submit button is clicked and validation was successful.  Parameters are: event.
///
/// ### Methods
///
/// #### addField
///
/// Registers an input field for validation associated to the selected submit buttons/links given:
///
///     $('SELECTOR').evolutionValidation('addField', inputSelector, validationRules, errorMessageSelector, validationContext)
///
///  * `inputSelector`: the jQuery selector for the input field.
///  * `validationRules`: the jQuery validation-based validation rules definition.
///  * `errorMessageSelector`: the jQuery selector for the element(s) to be populated with validation information associated to this field.
///  * `validationContext`: any object providing context for this field.  This value is passed to the onValidated function associated to this set of submission links/buttons.
///
/// #### addCustomValidation
///
/// Registers a custom validation function for validation associated to the selected submit buttons/links given:
///
///     $('SELECTOR').evolutionValidation('addCustomValidation', id, validationFunction, errorMessage, errorMessageSelector, validationContext)
///
///  * `id`: the identifier for this validation rule
///  * `validationFunction`: the function that, when called, returns a boolean identifying whether the test is valid or not.
///  * `errorMessage`: the text to show when this custom validation fails.
///  * `errorMessageSelector`: the jQuery selector for the element(s) to be populated with validation information associated to this custom rule.
///  * `validationContext`: any object providing context for this rule.  This value is passed to the onValidated function associated to this set of submission links/buttons.
///
/// This method returns a function reference that can be called to execute this custom validation rule.  For example, the returned function could be attached to an onchange event for another jQuery plugin.
///
/// #### isValid
///
/// Returns whether the set of fields and custom rules are valid for the selected submit button/link set.  This does not force validation to occur, but returns the current state of the form.
///
///     $('SELECTOR').evolutionValidation('isValid')
///
/// #### validate
///
/// Forces validation to occur on all fields and custom rules associated to the selected submit button/link set.  The result of the validation is returned.
///
///     $('SELECTOR').evolutionValidation('validate')
///
/// #### validateField
///
/// Forces validation on the field or fields identified by the fieldSelector within the context of the selected submit button/link set.  The result of the validation is returned.
///
///     $('SELECTOR').evolutionValidation('validateField', fieldSelector)
///
/// #### validateCustom
///
/// Forces validation on the custom validation rule referenced by the given ID within the context of the selected submit button/link set.  The result of the validation is returned.
///
///     $('SELECTOR').evolutionValidation('validateCustom', id)
///
/// #### reset
///
/// Resets the validation state for all registered fields as if the form was completely reloaded.  This is suitable for resetting the form after an AJAX submission and clearing of the form's values.
///
///     $('SELECTOR').evolutionValidation('reset')
///
///
define('plugin.validation', function($, global, undef){

	if (!$.telligent)
		$.telligent = {};

	if (!$.telligent.evolution)
		$.telligent.evolution = {};

	$.telligent.evolution.validation = {
		registerExtensions: function(options)
		{
			if ($.validator)
			{
				$.validator.addMethod("passwordvalid", function(value, element)
				{
				    return this.optional(element) || value.match(options.passwordRegex);
				}, options.passwordInvalidMessage);

				$.validator.addMethod("email", function(value, element)
				{
				    return this.optional(element) || value.match(new RegExp(options.emailRegex));
				}, options.emailInvalidMessage);

				$.validator.addMethod("url", function(value, element)
				{
				    if (this.optional(element))
				    {
				    	return true;
				    }

				    if(value.match(options.urlRegex))
				    {
				    	return true;
				    }

				    if (('http://' + value).match(options.urlRegex))
				    {
				    	$(element).val('http://' + value);
				    	return true;
				    }

				    return false;
				}, options.urlInvalidMessage);

				$.validator.addMethod("emails", function(value, element)
				{
				    var emailValues = value.split(/[;,]/);
				    var isValid = true;
				    var emailRegex = new RegExp(options.emailRegex);
				    for (var i = 0; i < emailValues.length; i++)
				    {
				        if (!jQuery.trim(emailValues[i]).match(emailRegex))
				            isValid = false;
				    }
				    return this.optional(element) || isValid;
				}, options.emailsInvalidMessage);

				$.validator.addMethod("username", function(value, element)
				{
				    return this.optional(element) || value.match(options.usernameRegex);
				}, options.usernameInvalidMessage);

				$.validator.addMethod("usernameexists", function(value, element, param)
				{
				    if (this.optional(element))
				        return "dependency-mismatch";

				    var previous = this.previousValue(element);
				    if (!this.settings.messages[element.name])
				        this.settings.messages[element.name] = {};
				    previous.originalMessage = this.settings.messages[element.name].remote;
				    this.settings.messages[element.name].remote = previous.message;

				    param = typeof param == "string" && { url: param} || param;
				    var url = $.telligent.evolution.site.getBaseUrl() + 'Utility/Validation/Core_Validator.asmx/IsUsernameAvailable';
				    if (param.url)
				        url = param.url;

				    if (previous.old !== value) {
				        previous.old = value;
				        var validator = this;
				        this.startRequest(element);

				        var message = '{"username":"' + value + '","elementName":"' + element.name + '"}';

				        $.telligent.evolution.post({
				            url: url,
				            dataType: "json",
				            contentType: "application/json; charset=utf-8",
				            data: message,
				            success: function(response) {
				                element = validator.findByName(response.d.ElementName)[0];
				                validator.settings.messages[element.name].remote = previous.originalMessage;
				                var valid = response.d.IsValid === true;
				                if (valid) {
				                    var submitted = validator.formSubmitted;
				                    validator.prepareElement(element);
				                    validator.formSubmitted = submitted;
				                    validator.successList.push(element);
				                    validator.showErrors();
				                } else {
				                    var errors = {};
				                    var errormessage = (previous.message = response.d.ErrorMessage || validator.defaultMessage(element, "usernameexists"));
				                    errors[element.name] = $.isFunction(errormessage) ? message(value) : errormessage;
				                    validator.showErrors(errors);
				                }
				                previous.valid = valid;
				                validator.stopRequest(element, valid);
				            }
				        });
				        return "pending";
				    }
				    else if (this.pending[element.name])
				    {
				        return "pending";
				    }
				    return previous.valid;
				}, undefined);

				$.validator.addMethod("emailexists", function(value, element, param)
				{
				    if (this.optional(element))
				        return "dependency-mismatch";

				    var previous = this.previousValue(element);
				    if (!this.settings.messages[element.name])
				        this.settings.messages[element.name] = {};
				    previous.originalMessage = this.settings.messages[element.name].remote;
				    this.settings.messages[element.name].remote = previous.message;

				    param = typeof param == "string" && { url: param} || param;
				    var url = $.telligent.evolution.site.getBaseUrl() + 'Utility/Validation/Core_Validator.asmx/IsEmailAvailable';
				    if (param.url)
				        url = param.url;

				    if (previous.old !== value)
				    {
				        previous.old = value;
				        var validator = this;
				        this.startRequest(element);

				        var message = '{"email":"' + value + '","elementName":"' + element.name + '"}';

				        $.telligent.evolution.post({
				            url: url,
				            dataType: "json",
				            contentType: "application/json; charset=utf-8",
				            data: message,
				            success: function(response) {
				                element = validator.findByName(response.d.ElementName)[0];
				                validator.settings.messages[element.name].remote = previous.originalMessage;
				                var valid = response.d.IsValid === true;
				                if (valid)
				                {
				                    var submitted = validator.formSubmitted;
				                    validator.prepareElement(element);
				                    validator.formSubmitted = submitted;
				                    validator.successList.push(element);
				                    validator.showErrors();
				                } else
				                {
				                    var errors = {};
				                    var errormessage = (previous.message = validator.customMessage(element.name, "emailexists") || response.d.ErrorMessage || validator.defaultMessage(element, "emailexists"));
				                    errors[element.name] = $.isFunction(errormessage) ? message(value) : errormessage;
				                    validator.showErrors(errors);
				                }
				                previous.valid = valid;
				                validator.stopRequest(element, valid);
				            }
				        });
				        return "pending";
				    }
				    else if (this.pending[element.name])
				    {
				        return "pending";
				    }
				    return previous.valid;
				}, undefined);

				$.validator.addMethod("groupnameexists", function(value, element, param)
				{
				    if (this.optional(element))
				        return "dependency-mismatch";

				    var groupName = encodeURIComponent($.trim(value));
				    if (groupName.length == 0)
				        return true;

				    var previous = this.previousValue(element);
				    if (!this.settings.messages[element.name])
				        this.settings.messages[element.name] = {};
				    previous.originalMessage = this.settings.messages[element.name].remote;
				    this.settings.messages[element.name].remote = previous.message;

				    var parentGroupId = param.getParentId();
				    var data = '{"groupName":"' + groupName + '","parentGroupId":' + parentGroupId + ',"elementName":"' + element.name + '"}';

				    if (previous.old !== data)
				    {
				        previous.old = data;
				        var validator = this;
				        this.startRequest(element);

				        var url = $.telligent.evolution.site.getBaseUrl() + 'Utility/Validation/Core_Validator.asmx/IsGroupNameAvailable';

				        $.telligent.evolution.post({
				            url: url,
				            dataType: "json",
				            contentType: "application/json; charset=utf-8",
				            data: data,
				            success: function(response) {
				                element = validator.findByName(response.d.ElementName)[0];
				                validator.settings.messages[element.name].remote = previous.originalMessage;
				                var valid = response.d.IsValid === true;
				                if (valid) {
				                    var submitted = validator.formSubmitted;
				                    validator.prepareElement(element);
				                    validator.formSubmitted = submitted;
				                    validator.successList.push(element);
				                    validator.showErrors();
				                } else {
				                    var errors = {};
				                    var errormessage = (previous.message = response.d.ErrorMessage || validator.defaultMessage(element, "groupnameexists"));
				                    errors[element.name] = $.isFunction(errormessage) ? message(value) : errormessage;
				                    validator.showErrors(errors);
				                }
				                previous.valid = valid;
				                validator.stopRequest(element, valid);
				            }
				        });
				        return "pending";
				    }
				    else if (this.pending[element.name])
				    {
				        return "pending";
				    }
				    return previous.valid;
				}, undefined);

				$.validator.addMethod("wikipageexists", function(value, element, param)
				{
				    if (this.optional(element))
				        return "dependency-mismatch";

				    var pageName = encodeURIComponent($.trim(value));
				    if (pageName.length == 0)
				        return true;

				    var previous = this.previousValue(element);
				    if (!this.settings.messages[element.name])
				        this.settings.messages[element.name] = {};
				    previous.originalMessage = this.settings.messages[element.name].remote;
				    this.settings.messages[element.name].remote = previous.message;

				    var data = '{"pageName":"' + pageName + '","wikiId":' + param.wikiId + ',"pageId":' + param.pageId + ',"parentPageId":' + param.parentPageId() + ',"elementName":"' + element.name + '"}';

				    if (previous.old !== data)
				    {
				        previous.old = data;
				        var validator = this;
				        this.startRequest(element);

				        var url = $.telligent.evolution.site.getBaseUrl() + 'Utility/Validation/Core_Validator.asmx/IsWikiPageNameAvailable';

				        $.telligent.evolution.post({
				            url: url,
				            dataType: "json",
				            contentType: "application/json; charset=utf-8",
				            data: data,
				            success: function(response)
				            {
				                element = validator.findByName(response.d.ElementName)[0];
				                validator.settings.messages[element.name].remote = previous.originalMessage;
				                var valid = response.d.IsValid === true;
				                if (valid)
				                {
				                    var submitted = validator.formSubmitted;
				                    validator.prepareElement(element);
				                    validator.formSubmitted = submitted;
				                    validator.successList.push(element);
				                    validator.showErrors();
				                }
				                else
				                {
				                    var errors = {};
				                    var errormessage = (previous.message = response.d.ErrorMessage || validator.defaultMessage(element, "wikipageexists"));
				                    errors[element.name] = $.isFunction(errormessage) ? message(value) : errormessage;
				                    validator.showErrors(errors);
				                }
				                previous.valid = valid;
				                validator.stopRequest(element, valid);
				            }
				        });
				        return "pending";
				    }
				    else if (this.pending[element.name])
				    {
				        return "pending";
				    }
				    return previous.valid;
				}, undefined);

				$.validator.addMethod("mailinglistnameexists", function(value, element, param)
				{
				    if ($.trim(value) == '')
				        return this.optional(element);

				    var previous = this.previousValue(element);
				    if (!this.settings.messages[element.name])
				        this.settings.messages[element.name] = {};
				    previous.originalMessage = this.settings.messages[element.name].remote;
				    this.settings.messages[element.name].remote = previous.message;

				    param = typeof param == "string" && { url: param} || param;
				    var url = $.telligent.evolution.site.getBaseUrl() + 'Utility/Validation/Core_Validator.asmx/IsMailingListNameAvailable';
				    if (param.url)
				        url = param.url;

				    if (previous.old !== value)
				    {
				        previous.old = value;
				        var validator = this;
				        this.startRequest(element);

				        var message = '{"mailingListName":"' + value + '","elementName":"' + element.name + '"}';

				        $.telligent.evolution.post({
				            url: url,
				            dataType: "json",
				            contentType: "application/json; charset=utf-8",
				            data: message,
				            success: function(response)
				            {
				                element = validator.findByName(response.d.ElementName)[0];
				                validator.settings.messages[element.name].remote = previous.originalMessage;
				                var valid = response.d.IsValid === true;
				                if (valid)
				                {
				                    var submitted = validator.formSubmitted;
				                    validator.prepareElement(element);
				                    validator.formSubmitted = submitted;
				                    validator.successList.push(element);
				                    validator.showErrors();
				                }
				                else
				                {
				                    var errors = {};
				                    var errormessage = (previous.message = response.d.ErrorMessage || validator.defaultMessage(element, "mailinglistnameexists"));
				                    errors[element.name] = $.isFunction(errormessage) ? message(value) : errormessage;
				                    validator.showErrors(errors);
				                }
				                previous.valid = valid;
				                validator.stopRequest(element, valid);
				            }
				        });
				        return "pending";
				    }
				    else if (this.pending[element.name])
				    {
				        return "pending";
				    }
				    return previous.valid;
				}, undefined);
			}
		}
	}


    var api =
    {
    	addField : function(input_selector, rules, message_selector, validationContext)
		{
			var context = this.data('evolutionValidation');
			if(typeof context !== 'undefined')
			{
			    context.internal.fields[context.internal.fields.length] = { selector: input_selector, messageSelector: message_selector, isValid: true, context: validationContext, initialized: false };
			    var i = $(input_selector);
			    i.data('_evolutionValidation', context).data('_evolutionValidationFieldIndex', context.internal.fields.length - 1).data('_evolutionValidationOldValue', '$$$$$NULL$$$$$').rules("add", rules);

			    try
			    {
			        i.keydown(function()
			        {
			            if (context.internal.hasAttemptedSubmit)
			            {
			                window.clearTimeout(context.internal.keyPressValidationHandle);
			                var e = this;
			                context.internal.keyPressValidationHandle = window.setTimeout(function() { _validateField(context, $(e)); }, 499);
			            }
			        });
			    } catch (e) { }

			    i.blur(function() { _validateField(context, $(this)); });
			}

			return this;
		},
		addCustomValidation : function(id, validation_function, message, message_selector, validationContext)
		{
			var context = this.data('evolutionValidation');
			if(typeof context !== 'undefined')
			{
				var index = context.internal.customValidations.length;
			    context.internal.customValidations[index] = { id: id, validationFunction: validation_function, message: message, messageSelector: message_selector, isValid: true, context: validationContext, initialized: false };

			    return function()
			    {
			    	return _validateCustomByIndex(context, index);
			    };
	    	}
		},
		isValid : function()
		{
			var context = this.data('evolutionValidation');

		    for (var i = 0; i < context.internal.fields.length; i++)
		    {
		        if (!context.internal.fields[i].initialized)
		            _validateField(context, $(context.internal.fields[i].selector));
		    }

		    for (var i = 0; i < context.internal.customValidations.length; i++)
		    {
		        if (!context.internal.customValidations[i].initialized)
		            _validateCustomByIndex(context, i);
		    }

		    return _isValid(context);
		},
		validate : function()
		{
			var context = this.data('evolutionValidation');

		    for (var i = 0; i < context.internal.fields.length; i++)
		    {
		        _validateField(context, $(context.internal.fields[i].selector));
		    }

		    for (var i = 0; i < context.internal.customValidations.length; i++)
		    {
		        _validateCustomByIndex(context, i);
		    }

		    return api.isValid.apply($(context.internal.state),[]);
		},
		validateField : function(selector)
		{
		    try
		    {
		    	var context = this.data('evolutionValidation');
				$(selector).data('_evolutionValidationOldValue', '$$$$$NULL$$$$$');
		        return _validateField(context, $(selector));
		    }
		    catch (e) { }
		},
		validateCustom : function(id)
		{
			var context = this.data('evolutionValidation');

		    for (var i = 0; i < context.internal.customValidations.length; i++)
		    {
		        if (context.internal.customValidations[i].id == id)
		            return _validateCustomByIndex(context, i);
		    }

		    return true;
		},
		reset: function()
		{
			var context = this.data('evolutionValidation');

			for (var i = 0; i < context.internal.customValidations.length; i++)
			{
				$(context.internal.customValidations[i].messageSelector).hide();
				context.internal.customValidations[i].isValid = true;
				context.internal.customValidations[i].initialized = false;
			}

			for (var i = 0; i < context.internal.fields.length; i++)
			{
				$(context.internal.fields[i].messageSelector).hide();
				context.internal.fields[i].errorMessage = null;
				context.internal.fields[i].isValid = true;
				context.internal.fields[i].initialized = false;
				$(context.internal.fields[i].selector).data('_evolutionValidationOldValue', '$$$$$NULL$$$$$');
			}

			context.internal.submitButtonClicked = false;
			context.internal.hasAttemptedSubmit = false;

			window.clearTimeout(context.internal.initialValidationHandle);
			context.internal.initialValidationHandle = window.setTimeout(function() { _initialValidation(context); }, 249);
		}
    };

    var _init = function (options)
    {
        return this.each(function ()
        {
            var context = {
                settings: $.extend({}, $.fn.evolutionValidation.defaults, options || {}),
                internal: {
                    state: this,
                    submitButtonClicked: false,
                    hasAttemptedSubmit: false,
                    fields: [],
                    customValidations: [],
                    initialValidationHandle: null
                }
            };

            $(this).data('evolutionValidation', context);

            $(this).click(function(e) { return _buttonClick(context, e); });
            this._isValid = function() { return _buttonClick(context, {}); };

            window.clearTimeout(context.internal.initialValidationHandle);
            context.internal.initialValidationHandle = window.setTimeout(function() { _initialValidation(context); }, 499);
        });
    },
	_initialValidation = function(context)
	{
		window.clearTimeout(context.internal.initialValidationHandle);

	    try
	    {
	        var validate = false;

	        if (context.settings.validateOnLoad === true)
	            validate = true;
	        else if (context.settings.validateOnLoad !== false)
	        {
	            for (var i = 0; i < context.internal.fields.length; i++)
	            {
	                var jElement = $(context.internal.fields[i].selector);
	                var eType = jElement.attr('type');
	                if (eType != 'checkbox' && eType != 'radio' && eType != 'select' && eType != 'submit' && eType != 'button' && eType != 'reset' && _getValue(context, jElement) != '')
	                {
	                    validate = true;
	                    break;
	                }
	            }
	        }
	        if (validate)
	        {
	            context.internal.hasAttemptedSubmit = true;
	            var isValid = api.validate.apply($(context.internal.state));
	            _showHiddenErrorMessages(context);
	            if (context.settings.onValidated)
	            	context.settings.onValidated(isValid, false, null);
	        }
	        else if (!context.internal.hasAttemptedSubmit)
	        {
	        	if(context.settings.onValidated)
	            	context.settings.onValidated(true, false, null);
	        }
	    }
	    catch (e)
	    {
	        context.internal.initialValidationHandle = window.setTimeout(function() { _initialValidation(context); }, 499);
	    }
	},
	_errorPlacement = function(context, error, element)
	{
	    var index = parseInt($(element).data('_evolutionValidationFieldIndex'), 10);
	    if (index < 0 || index >= context.internal.fields.length)
	        return;

	    if (context.internal.hasAttemptedSubmit)
	        $(context.internal.fields[index].messageSelector).html(error).show();
	    else
	        context.internal.fields[index].errorMessage = error;
	},
	_highlight = function(context, element, errorClass, validClass)
	{
	    var wasValid = _isValid(context);

	    var index = $(element).data('_evolutionValidationFieldIndex');
	    if (index < 0 || index >= context.internal.fields.length)
	        return;

	    context.internal.fields[index].isValid = false;
	    context.internal.fields[index].initialized = true;

	    if ((context.internal.submitButtonClicked || wasValid) && context.internal.hasAttemptedSubmit && context.settings.onValidated)
	        context.settings.onValidated(false, context.internal.submitButtonClicked, context.internal.fields[index].context);
	},
	_unhighlight = function(context, element, errorClass, validClass)
	{
	    var index = $(element).data('_evolutionValidationFieldIndex');
	    if (index < 0 || index >= context.internal.fields.length)
	        return;

	    context.internal.fields[index].isValid = true;
	    context.internal.fields[index].initialized = true;

	    if (_isValid(context) && context.internal.hasAttemptedSubmit && context.settings.onValidated)
	        context.settings.onValidated(true, context.internal.submitButtonClicked, context.internal.fields[index].context);
	},
	_isValid = function(context)
	{
	    for (var i = 0; i < context.internal.fields.length; i++)
	    {
	        if (!context.internal.fields[i].isValid)
	            return false;
	    }

	    for (var i = 0; i < context.internal.customValidations.length; i++)
	    {
	        if (!context.internal.customValidations[i].isValid)
	            return false;
	    }

	    return true;
	},
	_validateField = function(context, jElement)
	{
	    var currentValue = _getValue(context, jElement);

	    if (currentValue != jElement.data('_evolutionValidationOldValue'))
	    {
	        jElement.data('_evolutionValidationOldValue', currentValue);
	        return jElement.valid();
	    }
	    else
	    {
	        var index = jElement.data('_evolutionValidationFieldIndex');
	        if (index < 0 || index >= context.internal.fields.length)
	            return false;

	        return context.internal.fields[index].isValid;
	    }
	},
	_getValue = function(context, jElement)
	{
	    if (jElement.attr('type') == 'checkbox' || jElement.attr('type') == 'radio')
	        return jElement.get(0).checked ? jElement.val() : '';
	    else
	        return jElement.val();
	},
	_validateCustomByIndex = function(context, index)
	{
	    if (index < 0 || index >= context.internal.customValidations.length)
	        return true;

	    var result = context.internal.customValidations[index].validationFunction();
		context.internal.customValidations[index].initialized = true;

	    if (result === true)
	    {
	        context.internal.customValidations[index].isValid = true;
            $(context.internal.customValidations[index].messageSelector).hide();

	        if (_isValid(context) && context.internal.hasAttemptedSubmit && context.settings.onValidated)
	            context.settings.onValidated(true, context.internal.submitButtonClicked, context.internal.customValidations[index].context);

	        return true;
	    }
	    else
	    {
	        var wasValid = _isValid(context);
	        context.internal.customValidations[index].isValid = false;

	        if (context.internal.hasAttemptedSubmit)
				$(context.internal.customValidations[index].messageSelector).html(context.internal.customValidations[index].message).show();

	        if ((context.internal.submitButtonClicked || wasValid) && context.internal.hasAttemptedSubmit && context.settings.onValidated)
	            context.settings.onValidated(false, context.internal.submitButtonClicked, context.internal.customValidations[index].context);

	        return false;
	    }
	},
	_buttonClick = function(context, e)
	{
	    var isFirstAttempt = !context.internal.hasAttemptedSubmit;
	    context.internal.hasAttemptedSubmit = true;
	    context.internal.submitButtonClicked = true;

	    api.validate.apply($(context.internal.state), []);
	    var isValid = api.isValid.apply($(context.internal.state), []);

	    if (isFirstAttempt && !isValid)
	        _showHiddenErrorMessages(context);

		var returnVal = true;
	    if (isValid && context.settings.onSuccessfulClick)
	        returnVal = context.settings.onSuccessfulClick(e);

	    context.internal.submitButtonClicked = false;
	    if (!isValid && e)
	    {
	        e.cancelBubble = true;
	        e.returnValue = false;
	    }

	    return isValid && (returnVal !== false);
	},
	_showHiddenErrorMessages = function(context)
	{
	    for (var i = 0; i < context.internal.fields.length; i++)
	    {
	        if (!context.internal.fields[i].isValid && context.internal.fields[i].errorMessage != null)
	        {
	            $(context.internal.fields[i].messageSelector).html(context.internal.fields[i].errorMessage).show();
	            context.internal.fields[i].errorMessage = null;
	        }
	    }

	    for (var i = 0; i < context.internal.customValidations.length; i++)
	    {
	        if (!context.internal.customValidations[i].isValid)
	            $(context.internal.customValidations[i].messageSelector).html(context.internal.customValidations[i].message).show();
	    }
	}

    $.fn.evolutionValidation = function (method)
    {
        if (method in api)
            return api[method].apply(this, Array.prototype.slice.call(arguments, 1));
        else if (typeof method === 'object' || !method)
            return _init.apply(this, arguments);
        else
            $.error('Method ' + method + ' does not exist on jQuery.fn.evolutionValidation');
    };

    $.extend($.fn.evolutionValidation, {
        defaults: {
            validateOnLoad: null,
            onValidated: null,
            onSuccessfulClick: null
        },
        init: function() {
			if(!$.fn.validate)
				return;

		    $("form").validate({
		        errorPlacement: function(error, element)
		        {
		            var tv = $(element).data('_evolutionValidation');
		            if (tv)
		                _errorPlacement(tv, error, element);
		        },
		        highlight: function(element, errorClass, validClass)
		        {
		            var tv = $(element).data('_evolutionValidation');
		            if (tv)
		                _highlight(tv, element, errorClass, validClass);
		        },
		        unhighlight: function(element, errorClass, validClass)
		        {
		            var tv = $(element).data('_evolutionValidation');
		            if (tv)
		                _unhighlight(tv, element, errorClass, validClass);
		        },
		        onsubmit: false,
		        onkeyup: false,
		        onfocusout: false
		    });
        }
    });

	global.Telligent_Validation = function(submit_button_selector, options)
	{
		this._jq = $(submit_button_selector);

		if (options.onValidatedFunction)
			options.onValidated = options.onValidatedFunction;

		if (options.onSuccessfulClickFunction)
			options.onSuccessfulClick = options.onSuccessfulClickFunction;

		this._jq.evolutionValidation(options);
	}

	Telligent_Validation.prototype.AddField = function(input_selector, rules, message_selector, context)
	{
		this._jq.evolutionValidation('addField', input_selector, rules, message_selector, context);
	}

	Telligent_Validation.prototype.AddCustomValidation = function(id, validation_function, message, message_selector, context)
	{
		return this._jq.evolutionValidation('addCustomValidation', id, validation_function, message, message_selector, context);
	}

	Telligent_Validation.prototype.IsValid = function()
	{
		return this._jq.evolutionValidation('isValid');
	}

	Telligent_Validation.prototype.Validate = function()
	{
		return this._jq.evolutionValidation('validate');
	}

	Telligent_Validation.prototype.ValidateField = function(selector)
	{
		return this._jq.evolutionValidation('validateField', selector);
	}

	Telligent_Validation.prototype.ValidateCustom = function(id)
	{
		return this._jq.evolutionValidation('validateCustom', id);
	}

	return {};

}, jQuery, window);









 
 
/*
    json2.js
    2012-10-08

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
 
 
/*1.5.4*/
(function(){var f=0,k=[],m={},i={},a={"<":"lt",">":"gt","&":"amp",'"':"quot","'":"#39"},l=/[<>&\"\']/g,b,c=window.setTimeout,d={},e;function h(){this.returnValue=false}function j(){this.cancelBubble=true}(function(n){var o=n.split(/,/),p,r,q;for(p=0;p<o.length;p+=2){q=o[p+1].split(/ /);for(r=0;r<q.length;r++){i[q[r]]=o[p]}}})("application/msword,doc dot,application/pdf,pdf,application/pgp-signature,pgp,application/postscript,ps ai eps,application/rtf,rtf,application/vnd.ms-excel,xls xlb,application/vnd.ms-powerpoint,ppt pps pot,application/zip,zip,application/x-shockwave-flash,swf swfl,application/vnd.openxmlformats-officedocument.wordprocessingml.document,docx,application/vnd.openxmlformats-officedocument.wordprocessingml.template,dotx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,xlsx,application/vnd.openxmlformats-officedocument.presentationml.presentation,pptx,application/vnd.openxmlformats-officedocument.presentationml.template,potx,application/vnd.openxmlformats-officedocument.presentationml.slideshow,ppsx,application/x-javascript,js,application/json,json,audio/mpeg,mpga mpega mp2 mp3,audio/x-wav,wav,audio/mp4,m4a,image/bmp,bmp,image/gif,gif,image/jpeg,jpeg jpg jpe,image/photoshop,psd,image/png,png,image/svg+xml,svg svgz,image/tiff,tiff tif,text/plain,asc txt text diff log,text/html,htm html xhtml,text/css,css,text/csv,csv,text/rtf,rtf,video/mpeg,mpeg mpg mpe,video/quicktime,qt mov,video/mp4,mp4,video/x-m4v,m4v,video/x-flv,flv,video/x-ms-wmv,wmv,video/avi,avi,video/webm,webm,video/vnd.rn-realvideo,rv,application/vnd.oasis.opendocument.formula-template,otf,application/octet-stream,exe");var g={VERSION:"1.5.4",STOPPED:1,STARTED:2,QUEUED:1,UPLOADING:2,FAILED:4,DONE:5,GENERIC_ERROR:-100,HTTP_ERROR:-200,IO_ERROR:-300,SECURITY_ERROR:-400,INIT_ERROR:-500,FILE_SIZE_ERROR:-600,FILE_EXTENSION_ERROR:-601,IMAGE_FORMAT_ERROR:-700,IMAGE_MEMORY_ERROR:-701,IMAGE_DIMENSIONS_ERROR:-702,mimeTypes:i,ua:(function(){var r=navigator,q=r.userAgent,s=r.vendor,o,n,p;o=/WebKit/.test(q);p=o&&s.indexOf("Apple")!==-1;n=window.opera&&window.opera.buildNumber;return{windows:navigator.platform.indexOf("Win")!==-1,ie:!o&&!n&&(/MSIE/gi).test(q)&&(/Explorer/gi).test(r.appName),webkit:o,gecko:!o&&/Gecko/.test(q),safari:p,opera:!!n}}()),typeOf:function(n){return({}).toString.call(n).match(/\s([a-z|A-Z]+)/)[1].toLowerCase()},extend:function(n){g.each(arguments,function(o,p){if(p>0){g.each(o,function(r,q){n[q]=r})}});return n},cleanName:function(n){var o,p;p=[/[\300-\306]/g,"A",/[\340-\346]/g,"a",/\307/g,"C",/\347/g,"c",/[\310-\313]/g,"E",/[\350-\353]/g,"e",/[\314-\317]/g,"I",/[\354-\357]/g,"i",/\321/g,"N",/\361/g,"n",/[\322-\330]/g,"O",/[\362-\370]/g,"o",/[\331-\334]/g,"U",/[\371-\374]/g,"u"];for(o=0;o<p.length;o+=2){n=n.replace(p[o],p[o+1])}n=n.replace(/\s+/g,"_");n=n.replace(/[^a-z0-9_\-\.]+/gi,"");return n},addRuntime:function(n,o){o.name=n;k[n]=o;k.push(o);return o},guid:function(){var n=new Date().getTime().toString(32),o;for(o=0;o<5;o++){n+=Math.floor(Math.random()*65535).toString(32)}return(g.guidPrefix||"p")+n+(f++).toString(32)},buildUrl:function(o,n){var p="";g.each(n,function(r,q){p+=(p?"&":"")+encodeURIComponent(q)+"="+encodeURIComponent(r)});if(p){o+=(o.indexOf("?")>0?"&":"?")+p}return o},each:function(q,r){var p,o,n;if(q){p=q.length;if(p===b){for(o in q){if(q.hasOwnProperty(o)){if(r(q[o],o)===false){return}}}}else{for(n=0;n<p;n++){if(r(q[n],n)===false){return}}}}},formatSize:function(n){if(n===b||/\D/.test(n)){return g.translate("N/A")}if(n>1073741824){return Math.round(n/1073741824,1)+" GB"}if(n>1048576){return Math.round(n/1048576,1)+" MB"}if(n>1024){return Math.round(n/1024,1)+" KB"}return n+" b"},getPos:function(o,s){var t=0,r=0,v,u=document,p,q;o=o;s=s||u.body;function n(B){var z,A,w=0,C=0;if(B){A=B.getBoundingClientRect();z=u.compatMode==="CSS1Compat"?u.documentElement:u.body;w=A.left+z.scrollLeft;C=A.top+z.scrollTop}return{x:w,y:C}}if(o&&o.getBoundingClientRect&&((navigator.userAgent.indexOf("MSIE")>0)&&(u.documentMode<8))){p=n(o);q=n(s);return{x:p.x-q.x,y:p.y-q.y}}v=o;while(v&&v!=s&&v.nodeType){t+=v.offsetLeft||0;r+=v.offsetTop||0;v=v.offsetParent}v=o.parentNode;while(v&&v!=s&&v.nodeType){t-=v.scrollLeft||0;r-=v.scrollTop||0;v=v.parentNode}return{x:t,y:r}},getSize:function(n){return{w:n.offsetWidth||n.clientWidth,h:n.offsetHeight||n.clientHeight}},parseSize:function(n){var o;if(typeof(n)=="string"){n=/^([0-9]+)([mgk]?)$/.exec(n.toLowerCase().replace(/[^0-9mkg]/g,""));o=n[2];n=+n[1];if(o=="g"){n*=1073741824}if(o=="m"){n*=1048576}if(o=="k"){n*=1024}}return n},xmlEncode:function(n){return n?(""+n).replace(l,function(o){return a[o]?"&"+a[o]+";":o}):n},toArray:function(p){var o,n=[];for(o=0;o<p.length;o++){n[o]=p[o]}return n},inArray:function(p,q){if(q){if(Array.prototype.indexOf){return Array.prototype.indexOf.call(q,p)}for(var n=0,o=q.length;n<o;n++){if(q[n]===p){return n}}}return -1},addI18n:function(n){return g.extend(m,n)},translate:function(n){return m[n]||n},isEmptyObj:function(n){if(n===b){return true}for(var o in n){return false}return true},hasClass:function(p,o){var n;if(p.className==""){return false}n=new RegExp("(^|\\s+)"+o+"(\\s+|$)");return n.test(p.className)},addClass:function(o,n){if(!g.hasClass(o,n)){o.className=o.className==""?n:o.className.replace(/\s+$/,"")+" "+n}},removeClass:function(p,o){var n=new RegExp("(^|\\s+)"+o+"(\\s+|$)");p.className=p.className.replace(n,function(r,q,s){return q===" "&&s===" "?" ":""})},getStyle:function(o,n){if(o.currentStyle){return o.currentStyle[n]}else{if(window.getComputedStyle){return window.getComputedStyle(o,null)[n]}}},addEvent:function(s,n,t){var r,q,p,o;o=arguments[3];n=n.toLowerCase();if(e===b){e="Plupload_"+g.guid()}if(s.addEventListener){r=t;s.addEventListener(n,r,false)}else{if(s.attachEvent){r=function(){var u=window.event;if(!u.target){u.target=u.srcElement}u.preventDefault=h;u.stopPropagation=j;t(u)};s.attachEvent("on"+n,r)}}if(s[e]===b){s[e]=g.guid()}if(!d.hasOwnProperty(s[e])){d[s[e]]={}}q=d[s[e]];if(!q.hasOwnProperty(n)){q[n]=[]}q[n].push({func:r,orig:t,key:o})},removeEvent:function(s,n){var q,t,p;if(typeof(arguments[2])=="function"){t=arguments[2]}else{p=arguments[2]}n=n.toLowerCase();if(s[e]&&d[s[e]]&&d[s[e]][n]){q=d[s[e]][n]}else{return}for(var o=q.length-1;o>=0;o--){if(q[o].key===p||q[o].orig===t){if(s.removeEventListener){s.removeEventListener(n,q[o].func,false)}else{if(s.detachEvent){s.detachEvent("on"+n,q[o].func)}}q[o].orig=null;q[o].func=null;q.splice(o,1);if(t!==b){break}}}if(!q.length){delete d[s[e]][n]}if(g.isEmptyObj(d[s[e]])){delete d[s[e]];try{delete s[e]}catch(r){s[e]=b}}},removeAllEvents:function(o){var n=arguments[1];if(o[e]===b||!o[e]){return}g.each(d[o[e]],function(q,p){g.removeEvent(o,p,n)})}};g.Uploader=function(r){var o={},u,t=[],q,p=false;u=new g.QueueProgress();r=g.extend({chunk_size:0,multipart:true,multi_selection:true,file_data_name:"file",filters:[]},r);function s(){var w,x=0,v;if(this.state==g.STARTED){for(v=0;v<t.length;v++){if(!w&&t[v].status==g.QUEUED){w=t[v];w.status=g.UPLOADING;if(this.trigger("BeforeUpload",w)){this.trigger("UploadFile",w)}}else{x++}}if(x==t.length){this.stop();this.trigger("UploadComplete",t)}}}function n(){var w,v;u.reset();for(w=0;w<t.length;w++){v=t[w];if(v.size!==b){u.size+=v.size;u.loaded+=v.loaded}else{u.size=b}if(v.status==g.DONE){u.uploaded++}else{if(v.status==g.FAILED){u.failed++}else{u.queued++}}}if(u.size===b){u.percent=t.length>0?Math.ceil(u.uploaded/t.length*100):0}else{u.bytesPerSec=Math.ceil(u.loaded/((+new Date()-q||1)/1000));u.percent=u.size>0?Math.ceil(u.loaded/u.size*100):0}}g.extend(this,{state:g.STOPPED,runtime:"",features:{},files:t,settings:r,total:u,id:g.guid(),init:function(){var A=this,B,x,w,z=0,y;if(typeof(r.preinit)=="function"){r.preinit(A)}else{g.each(r.preinit,function(D,C){A.bind(C,D)})}r.page_url=r.page_url||document.location.pathname.replace(/\/[^\/]+$/g,"/");if(!/^(\w+:\/\/|\/)/.test(r.url)){r.url=r.page_url+r.url}r.chunk_size=g.parseSize(r.chunk_size);r.max_file_size=g.parseSize(r.max_file_size);A.bind("FilesAdded",function(C,F){var E,D,H=0,I,G=r.filters;if(G&&G.length){I=[];g.each(G,function(J){g.each(J.extensions.split(/,/),function(K){if(/^\s*\*\s*$/.test(K)){I.push("\\.*")}else{I.push("\\."+K.replace(new RegExp("["+("/^$.*+?|()[]{}\\".replace(/./g,"\\$&"))+"]","g"),"\\$&"))}})});I=new RegExp(I.join("|")+"$","i")}for(E=0;E<F.length;E++){D=F[E];D.loaded=0;D.percent=0;D.status=g.QUEUED;if(I&&!I.test(D.name)){C.trigger("Error",{code:g.FILE_EXTENSION_ERROR,message:g.translate("File extension error."),file:D});continue}if(D.size!==b&&D.size>r.max_file_size){C.trigger("Error",{code:g.FILE_SIZE_ERROR,message:g.translate("File size error."),file:D});continue}t.push(D);H++}if(H){c(function(){A.trigger("QueueChanged");A.refresh()},1)}else{return false}});if(r.unique_names){A.bind("UploadFile",function(C,D){var F=D.name.match(/\.([^.]+)$/),E="tmp";if(F){E=F[1]}D.target_name=D.id+"."+E})}A.bind("UploadProgress",function(C,D){D.percent=D.size>0?Math.ceil(D.loaded/D.size*100):100;n()});A.bind("StateChanged",function(C){if(C.state==g.STARTED){q=(+new Date())}else{if(C.state==g.STOPPED){for(B=C.files.length-1;B>=0;B--){if(C.files[B].status==g.UPLOADING){C.files[B].status=g.QUEUED;n()}}}}});A.bind("QueueChanged",n);A.bind("Error",function(C,D){if(D.file){D.file.status=g.FAILED;n();if(C.state==g.STARTED){c(function(){s.call(A)},1)}}});A.bind("FileUploaded",function(C,D){D.status=g.DONE;D.loaded=D.size;C.trigger("UploadProgress",D);c(function(){s.call(A)},1)});if(r.runtimes){x=[];y=r.runtimes.split(/\s?,\s?/);for(B=0;B<y.length;B++){if(k[y[B]]){x.push(k[y[B]])}}}else{x=k}function v(){var F=x[z++],E,C,D;if(F){E=F.getFeatures();C=A.settings.required_features;if(C){C=C.split(",");for(D=0;D<C.length;D++){if(!E[C[D]]){v();return}}}F.init(A,function(G){if(G&&G.success){A.features=E;A.runtime=F.name;A.trigger("Init",{runtime:F.name});A.trigger("PostInit");A.refresh()}else{v()}})}else{A.trigger("Error",{code:g.INIT_ERROR,message:g.translate("Init error.")})}}v();if(typeof(r.init)=="function"){r.init(A)}else{g.each(r.init,function(D,C){A.bind(C,D)})}},refresh:function(){this.trigger("Refresh")},start:function(){if(t.length&&this.state!=g.STARTED){this.state=g.STARTED;this.trigger("StateChanged");s.call(this)}},stop:function(){if(this.state!=g.STOPPED){this.state=g.STOPPED;this.trigger("CancelUpload");this.trigger("StateChanged")}},disableBrowse:function(){p=arguments[0]!==b?arguments[0]:true;this.trigger("DisableBrowse",p)},getFile:function(w){var v;for(v=t.length-1;v>=0;v--){if(t[v].id===w){return t[v]}}},removeFile:function(w){var v;for(v=t.length-1;v>=0;v--){if(t[v].id===w.id){return this.splice(v,1)[0]}}},splice:function(x,v){var w;w=t.splice(x===b?0:x,v===b?t.length:v);this.trigger("FilesRemoved",w);this.trigger("QueueChanged");return w},trigger:function(w){var y=o[w.toLowerCase()],x,v;if(y){v=Array.prototype.slice.call(arguments);v[0]=this;for(x=0;x<y.length;x++){if(y[x].func.apply(y[x].scope,v)===false){return false}}}return true},hasEventListener:function(v){return !!o[v.toLowerCase()]},bind:function(v,x,w){var y;v=v.toLowerCase();y=o[v]||[];y.push({func:x,scope:w||this});o[v]=y},unbind:function(v){v=v.toLowerCase();var y=o[v],w,x=arguments[1];if(y){if(x!==b){for(w=y.length-1;w>=0;w--){if(y[w].func===x){y.splice(w,1);break}}}else{y=[]}if(!y.length){delete o[v]}}},unbindAll:function(){var v=this;g.each(o,function(x,w){v.unbind(w)})},destroy:function(){this.stop();this.trigger("Destroy");this.unbindAll()}})};g.File=function(q,o,p){var n=this;n.id=q;n.name=o;n.size=p;n.loaded=0;n.percent=0;n.status=0};g.Runtime=function(){this.getFeatures=function(){};this.init=function(n,o){}};g.QueueProgress=function(){var n=this;n.size=0;n.loaded=0;n.uploaded=0;n.failed=0;n.queued=0;n.percent=0;n.bytesPerSec=0;n.reset=function(){n.size=n.loaded=n.uploaded=n.failed=n.queued=n.percent=n.bytesPerSec=0}};g.runtimes={};window.plupload=g})(); 
 
(function(f,b,d,e){var a={},g={};function c(){var h;try{h=navigator.plugins["Shockwave Flash"];h=h.description}catch(j){try{h=new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable("$version")}catch(i){h="0.0"}}h=h.match(/\d+/g);return parseFloat(h[0]+"."+h[1])}d.flash={trigger:function(j,h,i){setTimeout(function(){var m=a[j],l,k;if(m){m.trigger("Flash:"+h,i)}},0)}};d.runtimes.Flash=d.addRuntime("flash",{getFeatures:function(){return{jpgresize:true,pngresize:true,maxWidth:8091,maxHeight:8091,chunks:true,progress:true,multipart:true,multi_selection:true}},init:function(m,o){var k,l,h=0,i=b.body;if(c()<10){o({success:false});return}g[m.id]=false;a[m.id]=m;k=b.getElementById(m.settings.browse_button);l=b.createElement("div");l.id=m.id+"_flash_container";d.extend(l.style,{position:"absolute",top:"0px",background:m.settings.shim_bgcolor||"transparent",zIndex:99999,width:"100%",height:"100%"});l.className="plupload flash";if(m.settings.container){i=b.getElementById(m.settings.container);if(d.getStyle(i,"position")==="static"){i.style.position="relative"}}i.appendChild(l);(function(){var p,q;p='<object id="'+m.id+'_flash" type="application/x-shockwave-flash" data="'+m.settings.flash_swf_url+'" ';if(d.ua.ie){p+='classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" '}p+='width="100%" height="100%" style="outline:0"><param name="movie" value="'+m.settings.flash_swf_url+'" /><param name="flashvars" value="id='+escape(m.id)+'" /><param name="wmode" value="transparent" /><param name="allowscriptaccess" value="always" /></object>';if(d.ua.ie){q=b.createElement("div");l.appendChild(q);q.outerHTML=p;q=null}else{l.innerHTML=p}}());function n(){return b.getElementById(m.id+"_flash")}function j(){if(h++>5000){o({success:false});return}if(g[m.id]===false){setTimeout(j,1)}}j();k=l=null;m.bind("Destroy",function(p){var q;d.removeAllEvents(b.body,p.id);delete g[p.id];delete a[p.id];q=b.getElementById(p.id+"_flash_container");if(q){i.removeChild(q)}});m.bind("Flash:Init",function(){var r={},q;try{n().setFileFilters(m.settings.filters,m.settings.multi_selection)}catch(p){o({success:false});return}if(g[m.id]){return}g[m.id]=true;m.bind("UploadFile",function(s,u){var v=s.settings,t=m.settings.resize||{};n().uploadFile(r[u.id],v.url,{name:u.target_name||u.name,mime:d.mimeTypes[u.name.replace(/^.+\.([^.]+)/,"$1").toLowerCase()]||"application/octet-stream",chunk_size:v.chunk_size,width:t.width,height:t.height,quality:t.quality,multipart:v.multipart,multipart_params:v.multipart_params||{},file_data_name:v.file_data_name,format:/\.(jpg|jpeg)$/i.test(u.name)?"jpg":"png",headers:v.headers,urlstream_upload:v.urlstream_upload})});m.bind("CancelUpload",function(){n().cancelUpload()});m.bind("Flash:UploadProcess",function(t,s){var u=t.getFile(r[s.id]);if(u.status!=d.FAILED){u.loaded=s.loaded;u.size=s.size;t.trigger("UploadProgress",u)}});m.bind("Flash:UploadChunkComplete",function(s,u){var v,t=s.getFile(r[u.id]);v={chunk:u.chunk,chunks:u.chunks,response:u.text};s.trigger("ChunkUploaded",t,v);if(t.status!==d.FAILED&&s.state!==d.STOPPED){n().uploadNextChunk()}if(u.chunk==u.chunks-1){t.status=d.DONE;s.trigger("FileUploaded",t,{response:u.text})}});m.bind("Flash:SelectFiles",function(s,v){var u,t,w=[],x;for(t=0;t<v.length;t++){u=v[t];x=d.guid();r[x]=u.id;r[u.id]=x;w.push(new d.File(x,u.name,u.size))}if(w.length){m.trigger("FilesAdded",w)}});m.bind("Flash:SecurityError",function(s,t){m.trigger("Error",{code:d.SECURITY_ERROR,message:d.translate("Security error."),details:t.message,file:m.getFile(r[t.id])})});m.bind("Flash:GenericError",function(s,t){m.trigger("Error",{code:d.GENERIC_ERROR,message:d.translate("Generic error."),details:t.message,file:m.getFile(r[t.id])})});m.bind("Flash:IOError",function(s,t){m.trigger("Error",{code:d.IO_ERROR,message:d.translate("IO error."),details:t.message,file:m.getFile(r[t.id])})});m.bind("Flash:ImageError",function(s,t){m.trigger("Error",{code:parseInt(t.code,10),message:d.translate("Image error."),file:m.getFile(r[t.id])})});m.bind("Flash:StageEvent:rollOver",function(s){var t,u;t=b.getElementById(m.settings.browse_button);u=s.settings.browse_button_hover;if(t&&u){d.addClass(t,u)}});m.bind("Flash:StageEvent:rollOut",function(s){var t,u;t=b.getElementById(m.settings.browse_button);u=s.settings.browse_button_hover;if(t&&u){d.removeClass(t,u)}});m.bind("Flash:StageEvent:mouseDown",function(s){var t,u;t=b.getElementById(m.settings.browse_button);u=s.settings.browse_button_active;if(t&&u){d.addClass(t,u);d.addEvent(b.body,"mouseup",function(){d.removeClass(t,u)},s.id)}});m.bind("Flash:StageEvent:mouseUp",function(s){var t,u;t=b.getElementById(m.settings.browse_button);u=s.settings.browse_button_active;if(t&&u){d.removeClass(t,u)}});m.bind("Flash:ExifData",function(s,t){m.trigger("ExifData",m.getFile(r[t.id]),t.data)});m.bind("Flash:GpsData",function(s,t){m.trigger("GpsData",m.getFile(r[t.id]),t.data)});m.bind("QueueChanged",function(s){m.refresh()});m.bind("FilesRemoved",function(s,u){var t;for(t=0;t<u.length;t++){n().removeFile(r[u[t].id])}});m.bind("StateChanged",function(s){m.refresh()});m.bind("Refresh",function(s){var t,u,v;n().setFileFilters(m.settings.filters,m.settings.multi_selection);t=b.getElementById(s.settings.browse_button);if(t){u=d.getPos(t,b.getElementById(s.settings.container));v=d.getSize(t);d.extend(b.getElementById(s.id+"_flash_container").style,{top:u.y+"px",left:u.x+"px",width:v.w+"px",height:v.h+"px"})}});m.bind("DisableBrowse",function(s,t){n().disableBrowse(t)});o({success:true})})}})})(window,document,plupload); 
 
(function(h,k,j,e){var c={},g;function m(o,p){var n;if("FileReader" in h){n=new FileReader();n.readAsDataURL(o);n.onload=function(){p(n.result)}}else{return p(o.getAsDataURL())}}function l(o,p){var n;if("FileReader" in h){n=new FileReader();n.readAsBinaryString(o);n.onload=function(){p(n.result)}}else{return p(o.getAsBinary())}}function d(r,p,n,v){var q,o,u,s,t=this;m(c[r.id],function(w){q=k.createElement("canvas");q.style.display="none";k.body.appendChild(q);o=q.getContext("2d");u=new Image();u.onerror=u.onabort=function(){v({success:false})};u.onload=function(){var B,x,z,y,A;if(!p.width){p.width=u.width}if(!p.height){p.height=u.height}s=Math.min(p.width/u.width,p.height/u.height);if(s<1||(s===1&&n==="image/jpeg")){B=Math.round(u.width*s);x=Math.round(u.height*s);q.width=B;q.height=x;o.drawImage(u,0,0,B,x);if(n==="image/jpeg"){y=new f(atob(w.substring(w.indexOf("base64,")+7)));if(y.headers&&y.headers.length){A=new a();if(A.init(y.get("exif")[0])){A.setExif("PixelXDimension",B);A.setExif("PixelYDimension",x);y.set("exif",A.getBinary());if(t.hasEventListener("ExifData")){t.trigger("ExifData",r,A.EXIF())}if(t.hasEventListener("GpsData")){t.trigger("GpsData",r,A.GPS())}}}if(p.quality){try{w=q.toDataURL(n,p.quality/100)}catch(C){w=q.toDataURL(n)}}}else{w=q.toDataURL(n)}w=w.substring(w.indexOf("base64,")+7);w=atob(w);if(y&&y.headers&&y.headers.length){w=y.restore(w);y.purge()}q.parentNode.removeChild(q);v({success:true,data:w})}else{v({success:false})}};u.src=w})}j.runtimes.Html5=j.addRuntime("html5",{getFeatures:function(){var s,o,r,q,p,n;o=r=p=n=false;if(h.XMLHttpRequest){s=new XMLHttpRequest();r=!!s.upload;o=!!(s.sendAsBinary||s.upload)}if(o){q=!!(s.sendAsBinary||(h.Uint8Array&&h.ArrayBuffer));p=!!(File&&(File.prototype.getAsDataURL||h.FileReader)&&q);n=!!(File&&(File.prototype.mozSlice||File.prototype.webkitSlice||File.prototype.slice))}g=j.ua.safari&&j.ua.windows;return{html5:o,dragdrop:(function(){var t=k.createElement("div");return("draggable" in t)||("ondragstart" in t&&"ondrop" in t)}()),jpgresize:p,pngresize:p,multipart:p||!!h.FileReader||!!h.FormData,canSendBinary:q,cantSendBlobInFormData:!!(j.ua.gecko&&h.FormData&&h.FileReader&&!FileReader.prototype.readAsArrayBuffer),progress:r,chunks:n,multi_selection:!(j.ua.safari&&j.ua.windows),triggerDialog:(j.ua.gecko&&h.FormData||j.ua.webkit)}},init:function(p,r){var n,q;function o(w){var u,t,v=[],x,s={};for(t=0;t<w.length;t++){u=w[t];if(s[u.name]){continue}s[u.name]=true;x=j.guid();c[x]=u;v.push(new j.File(x,u.fileName||u.name,u.fileSize||u.size))}if(v.length){p.trigger("FilesAdded",v)}}n=this.getFeatures();if(!n.html5){r({success:false});return}p.bind("Init",function(w){var G,F,C=[],v,D,t=w.settings.filters,u,B,s=k.body,E;G=k.createElement("div");G.id=w.id+"_html5_container";j.extend(G.style,{position:"absolute",background:p.settings.shim_bgcolor||"transparent",width:"100px",height:"100px",overflow:"hidden",zIndex:99999,opacity:p.settings.shim_bgcolor?"":0});G.className="plupload html5";if(p.settings.container){s=k.getElementById(p.settings.container);if(j.getStyle(s,"position")==="static"){s.style.position="relative"}}s.appendChild(G);no_type_restriction:for(v=0;v<t.length;v++){u=t[v].extensions.split(/,/);for(D=0;D<u.length;D++){if(u[D]==="*"){C=[];break no_type_restriction}B=j.mimeTypes[u[D]];if(B&&j.inArray(B,C)===-1){C.push(B)}}}G.innerHTML='<input id="'+p.id+'_html5"  style="font-size:999px" type="file" accept="'+C.join(",")+'" '+(p.settings.multi_selection&&p.features.multi_selection?'multiple="multiple"':"")+" />";G.scrollTop=100;E=k.getElementById(p.id+"_html5");if(w.features.triggerDialog){j.extend(E.style,{position:"absolute",width:"100%",height:"100%"})}else{j.extend(E.style,{cssFloat:"right",styleFloat:"right"})}E.onchange=function(){o(this.files);this.value=""};F=k.getElementById(w.settings.browse_button);if(F){var z=w.settings.browse_button_hover,A=w.settings.browse_button_active,x=w.features.triggerDialog?F:G;if(z){j.addEvent(x,"mouseover",function(){j.addClass(F,z)},w.id);j.addEvent(x,"mouseout",function(){j.removeClass(F,z)},w.id)}if(A){j.addEvent(x,"mousedown",function(){j.addClass(F,A)},w.id);j.addEvent(k.body,"mouseup",function(){j.removeClass(F,A)},w.id)}if(w.features.triggerDialog){j.addEvent(F,"click",function(H){var y=k.getElementById(w.id+"_html5");if(y&&!y.disabled){y.click()}H.preventDefault()},w.id)}}});p.bind("PostInit",function(){var s=k.getElementById(p.settings.drop_element);if(s){if(g){j.addEvent(s,"dragenter",function(w){var v,t,u;v=k.getElementById(p.id+"_drop");if(!v){v=k.createElement("input");v.setAttribute("type","file");v.setAttribute("id",p.id+"_drop");v.setAttribute("multiple","multiple");j.addEvent(v,"change",function(){o(this.files);j.removeEvent(v,"change",p.id);v.parentNode.removeChild(v)},p.id);s.appendChild(v)}t=j.getPos(s,k.getElementById(p.settings.container));u=j.getSize(s);if(j.getStyle(s,"position")==="static"){j.extend(s.style,{position:"relative"})}j.extend(v.style,{position:"absolute",display:"block",top:0,left:0,width:u.w+"px",height:u.h+"px",opacity:0})},p.id);return}j.addEvent(s,"dragover",function(t){t.preventDefault()},p.id);j.addEvent(s,"drop",function(u){var t=u.dataTransfer;if(t&&t.files){o(t.files)}u.preventDefault()},p.id)}});p.bind("Refresh",function(s){var t,u,v,x,w;t=k.getElementById(p.settings.browse_button);if(t){u=j.getPos(t,k.getElementById(s.settings.container));v=j.getSize(t);x=k.getElementById(p.id+"_html5_container");j.extend(x.style,{top:u.y+"px",left:u.x+"px",width:v.w+"px",height:v.h+"px"});if(p.features.triggerDialog){if(j.getStyle(t,"position")==="static"){j.extend(t.style,{position:"relative"})}w=parseInt(j.getStyle(t,"z-index"),10);if(isNaN(w)){w=0}j.extend(t.style,{zIndex:w});j.extend(x.style,{zIndex:w-1})}}});p.bind("DisableBrowse",function(s,u){var t=k.getElementById(s.id+"_html5");if(t){t.disabled=u}});p.bind("CancelUpload",function(){if(q&&q.abort){q.abort()}});p.bind("UploadFile",function(s,u){var v=s.settings,y,t;function x(A,D,z){var B;if(File.prototype.slice){try{A.slice();return A.slice(D,z)}catch(C){return A.slice(D,z-D)}}else{if(B=File.prototype.webkitSlice||File.prototype.mozSlice){return B.call(A,D,z)}else{return null}}}function w(A){var D=0,C=0,z=("FileReader" in h)?new FileReader:null;function B(){var I,M,K,L,H,J,F,E=s.settings.url;function G(V){var T=0,N="----pluploadboundary"+j.guid(),O,P="--",U="\r\n",R="";q=new XMLHttpRequest;if(q.upload){q.upload.onprogress=function(W){u.loaded=Math.min(u.size,C+W.loaded-T);s.trigger("UploadProgress",u)}}q.onreadystatechange=function(){var W,Y;if(q.readyState==4&&s.state!==j.STOPPED){try{W=q.status}catch(X){W=0}if(W>=400){s.trigger("Error",{code:j.HTTP_ERROR,message:j.translate("HTTP Error."),file:u,status:W})}else{if(K){Y={chunk:D,chunks:K,response:q.responseText,status:W};s.trigger("ChunkUploaded",u,Y);C+=J;if(Y.cancelled){u.status=j.FAILED;return}u.loaded=Math.min(u.size,(D+1)*H)}else{u.loaded=u.size}s.trigger("UploadProgress",u);V=I=O=R=null;if(!K||++D>=K){u.status=j.DONE;s.trigger("FileUploaded",u,{response:q.responseText,status:W})}else{B()}}}};if(s.settings.multipart&&n.multipart){L.name=u.target_name||u.name;q.open("post",E,true);j.each(s.settings.headers,function(X,W){q.setRequestHeader(W,X)});if(typeof(V)!=="string"&&!!h.FormData){O=new FormData();j.each(j.extend(L,s.settings.multipart_params),function(X,W){O.append(W,X)});O.append(s.settings.file_data_name,V);q.send(O);return}if(typeof(V)==="string"){q.setRequestHeader("Content-Type","multipart/form-data; boundary="+N);j.each(j.extend(L,s.settings.multipart_params),function(X,W){R+=P+N+U+'Content-Disposition: form-data; name="'+W+'"'+U+U;R+=unescape(encodeURIComponent(X))+U});F=j.mimeTypes[u.name.replace(/^.+\.([^.]+)/,"$1").toLowerCase()]||"application/octet-stream";R+=P+N+U+'Content-Disposition: form-data; name="'+s.settings.file_data_name+'"; filename="'+unescape(encodeURIComponent(u.name))+'"'+U+"Content-Type: "+F+U+U+V+U+P+N+P+U;T=R.length-V.length;V=R;if(q.sendAsBinary){q.sendAsBinary(V)}else{if(n.canSendBinary){var S=new Uint8Array(V.length);for(var Q=0;Q<V.length;Q++){S[Q]=(V.charCodeAt(Q)&255)}q.send(S.buffer)}}return}}E=j.buildUrl(s.settings.url,j.extend(L,s.settings.multipart_params));q.open("post",E,true);q.setRequestHeader("Content-Type","application/octet-stream");j.each(s.settings.headers,function(X,W){q.setRequestHeader(W,X)});q.send(V)}if(u.status==j.DONE||u.status==j.FAILED||s.state==j.STOPPED){return}L={name:u.target_name||u.name};if(v.chunk_size&&u.size>v.chunk_size&&(n.chunks||typeof(A)=="string")){H=v.chunk_size;K=Math.ceil(u.size/H);J=Math.min(H,u.size-(D*H));if(typeof(A)=="string"){I=A.substring(D*H,D*H+J)}else{I=x(A,D*H,D*H+J)}L.chunk=D;L.chunks=K}else{J=u.size;I=A}if(s.settings.multipart&&n.multipart&&typeof(I)!=="string"&&z&&n.cantSendBlobInFormData&&n.chunks&&s.settings.chunk_size){z.onload=function(){G(z.result)};z.readAsBinaryString(I)}else{G(I)}}B()}y=c[u.id];if(n.jpgresize&&s.settings.resize&&/\.(png|jpg|jpeg)$/i.test(u.name)){d.call(s,u,s.settings.resize,/\.png$/i.test(u.name)?"image/png":"image/jpeg",function(z){if(z.success){u.size=z.data.length;w(z.data)}else{if(n.chunks){w(y)}else{l(y,w)}}})}else{if(!n.chunks&&n.jpgresize){l(y,w)}else{w(y)}}});p.bind("Destroy",function(s){var u,v,t=k.body,w={inputContainer:s.id+"_html5_container",inputFile:s.id+"_html5",browseButton:s.settings.browse_button,dropElm:s.settings.drop_element};for(u in w){v=k.getElementById(w[u]);if(v){j.removeAllEvents(v,s.id)}}j.removeAllEvents(k.body,s.id);if(s.settings.container){t=k.getElementById(s.settings.container)}t.removeChild(k.getElementById(w.inputContainer))});r({success:true})}});function b(){var q=false,o;function r(t,v){var s=q?0:-8*(v-1),w=0,u;for(u=0;u<v;u++){w|=(o.charCodeAt(t+u)<<Math.abs(s+u*8))}return w}function n(u,s,t){var t=arguments.length===3?t:o.length-s-1;o=o.substr(0,s)+u+o.substr(t+s)}function p(t,u,w){var x="",s=q?0:-8*(w-1),v;for(v=0;v<w;v++){x+=String.fromCharCode((u>>Math.abs(s+v*8))&255)}n(x,t,w)}return{II:function(s){if(s===e){return q}else{q=s}},init:function(s){q=false;o=s},SEGMENT:function(s,u,t){switch(arguments.length){case 1:return o.substr(s,o.length-s-1);case 2:return o.substr(s,u);case 3:n(t,s,u);break;default:return o}},BYTE:function(s){return r(s,1)},SHORT:function(s){return r(s,2)},LONG:function(s,t){if(t===e){return r(s,4)}else{p(s,t,4)}},SLONG:function(s){var t=r(s,4);return(t>2147483647?t-4294967296:t)},STRING:function(s,t){var u="";for(t+=s;s<t;s++){u+=String.fromCharCode(r(s,1))}return u}}}function f(s){var u={65505:{app:"EXIF",name:"APP1",signature:"Exif\0"},65506:{app:"ICC",name:"APP2",signature:"ICC_PROFILE\0"},65517:{app:"IPTC",name:"APP13",signature:"Photoshop 3.0\0"}},t=[],r,n,p=e,q=0,o;r=new b();r.init(s);if(r.SHORT(0)!==65496){return}n=2;o=Math.min(1048576,s.length);while(n<=o){p=r.SHORT(n);if(p>=65488&&p<=65495){n+=2;continue}if(p===65498||p===65497){break}q=r.SHORT(n+2)+2;if(u[p]&&r.STRING(n+4,u[p].signature.length)===u[p].signature){t.push({hex:p,app:u[p].app.toUpperCase(),name:u[p].name.toUpperCase(),start:n,length:q,segment:r.SEGMENT(n,q)})}n+=q}r.init(null);return{headers:t,restore:function(y){r.init(y);var w=new f(y);if(!w.headers){return false}for(var x=w.headers.length;x>0;x--){var z=w.headers[x-1];r.SEGMENT(z.start,z.length,"")}w.purge();n=r.SHORT(2)==65504?4+r.SHORT(4):2;for(var x=0,v=t.length;x<v;x++){r.SEGMENT(n,0,t[x].segment);n+=t[x].length}return r.SEGMENT()},get:function(x){var y=[];for(var w=0,v=t.length;w<v;w++){if(t[w].app===x.toUpperCase()){y.push(t[w].segment)}}return y},set:function(y,x){var z=[];if(typeof(x)==="string"){z.push(x)}else{z=x}for(var w=ii=0,v=t.length;w<v;w++){if(t[w].app===y.toUpperCase()){t[w].segment=z[ii];t[w].length=z[ii].length;ii++}if(ii>=z.length){break}}},purge:function(){t=[];r.init(null)}}}function a(){var q,n,o={},t;q=new b();n={tiff:{274:"Orientation",34665:"ExifIFDPointer",34853:"GPSInfoIFDPointer"},exif:{36864:"ExifVersion",40961:"ColorSpace",40962:"PixelXDimension",40963:"PixelYDimension",36867:"DateTimeOriginal",33434:"ExposureTime",33437:"FNumber",34855:"ISOSpeedRatings",37377:"ShutterSpeedValue",37378:"ApertureValue",37383:"MeteringMode",37384:"LightSource",37385:"Flash",41986:"ExposureMode",41987:"WhiteBalance",41990:"SceneCaptureType",41988:"DigitalZoomRatio",41992:"Contrast",41993:"Saturation",41994:"Sharpness"},gps:{0:"GPSVersionID",1:"GPSLatitudeRef",2:"GPSLatitude",3:"GPSLongitudeRef",4:"GPSLongitude"}};t={ColorSpace:{1:"sRGB",0:"Uncalibrated"},MeteringMode:{0:"Unknown",1:"Average",2:"CenterWeightedAverage",3:"Spot",4:"MultiSpot",5:"Pattern",6:"Partial",255:"Other"},LightSource:{1:"Daylight",2:"Fliorescent",3:"Tungsten",4:"Flash",9:"Fine weather",10:"Cloudy weather",11:"Shade",12:"Daylight fluorescent (D 5700 - 7100K)",13:"Day white fluorescent (N 4600 -5400K)",14:"Cool white fluorescent (W 3900 - 4500K)",15:"White fluorescent (WW 3200 - 3700K)",17:"Standard light A",18:"Standard light B",19:"Standard light C",20:"D55",21:"D65",22:"D75",23:"D50",24:"ISO studio tungsten",255:"Other"},Flash:{0:"Flash did not fire.",1:"Flash fired.",5:"Strobe return light not detected.",7:"Strobe return light detected.",9:"Flash fired, compulsory flash mode",13:"Flash fired, compulsory flash mode, return light not detected",15:"Flash fired, compulsory flash mode, return light detected",16:"Flash did not fire, compulsory flash mode",24:"Flash did not fire, auto mode",25:"Flash fired, auto mode",29:"Flash fired, auto mode, return light not detected",31:"Flash fired, auto mode, return light detected",32:"No flash function",65:"Flash fired, red-eye reduction mode",69:"Flash fired, red-eye reduction mode, return light not detected",71:"Flash fired, red-eye reduction mode, return light detected",73:"Flash fired, compulsory flash mode, red-eye reduction mode",77:"Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",79:"Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",89:"Flash fired, auto mode, red-eye reduction mode",93:"Flash fired, auto mode, return light not detected, red-eye reduction mode",95:"Flash fired, auto mode, return light detected, red-eye reduction mode"},ExposureMode:{0:"Auto exposure",1:"Manual exposure",2:"Auto bracket"},WhiteBalance:{0:"Auto white balance",1:"Manual white balance"},SceneCaptureType:{0:"Standard",1:"Landscape",2:"Portrait",3:"Night scene"},Contrast:{0:"Normal",1:"Soft",2:"Hard"},Saturation:{0:"Normal",1:"Low saturation",2:"High saturation"},Sharpness:{0:"Normal",1:"Soft",2:"Hard"},GPSLatitudeRef:{N:"North latitude",S:"South latitude"},GPSLongitudeRef:{E:"East longitude",W:"West longitude"}};function p(u,C){var w=q.SHORT(u),z,F,G,B,A,v,x,D,E=[],y={};for(z=0;z<w;z++){x=v=u+12*z+2;G=C[q.SHORT(x)];if(G===e){continue}B=q.SHORT(x+=2);A=q.LONG(x+=2);x+=4;E=[];switch(B){case 1:case 7:if(A>4){x=q.LONG(x)+o.tiffHeader}for(F=0;F<A;F++){E[F]=q.BYTE(x+F)}break;case 2:if(A>4){x=q.LONG(x)+o.tiffHeader}y[G]=q.STRING(x,A-1);continue;case 3:if(A>2){x=q.LONG(x)+o.tiffHeader}for(F=0;F<A;F++){E[F]=q.SHORT(x+F*2)}break;case 4:if(A>1){x=q.LONG(x)+o.tiffHeader}for(F=0;F<A;F++){E[F]=q.LONG(x+F*4)}break;case 5:x=q.LONG(x)+o.tiffHeader;for(F=0;F<A;F++){E[F]=q.LONG(x+F*4)/q.LONG(x+F*4+4)}break;case 9:x=q.LONG(x)+o.tiffHeader;for(F=0;F<A;F++){E[F]=q.SLONG(x+F*4)}break;case 10:x=q.LONG(x)+o.tiffHeader;for(F=0;F<A;F++){E[F]=q.SLONG(x+F*4)/q.SLONG(x+F*4+4)}break;default:continue}D=(A==1?E[0]:E);if(t.hasOwnProperty(G)&&typeof D!="object"){y[G]=t[G][D]}else{y[G]=D}}return y}function s(){var v=e,u=o.tiffHeader;q.II(q.SHORT(u)==18761);if(q.SHORT(u+=2)!==42){return false}o.IFD0=o.tiffHeader+q.LONG(u+=2);v=p(o.IFD0,n.tiff);o.exifIFD=("ExifIFDPointer" in v?o.tiffHeader+v.ExifIFDPointer:e);o.gpsIFD=("GPSInfoIFDPointer" in v?o.tiffHeader+v.GPSInfoIFDPointer:e);return true}function r(w,u,z){var B,y,x,A=0;if(typeof(u)==="string"){var v=n[w.toLowerCase()];for(hex in v){if(v[hex]===u){u=hex;break}}}B=o[w.toLowerCase()+"IFD"];y=q.SHORT(B);for(i=0;i<y;i++){x=B+12*i+2;if(q.SHORT(x)==u){A=x+8;break}}if(!A){return false}q.LONG(A,z);return true}return{init:function(u){o={tiffHeader:10};if(u===e||!u.length){return false}q.init(u);if(q.SHORT(0)===65505&&q.STRING(4,5).toUpperCase()==="EXIF\0"){return s()}return false},EXIF:function(){var v;v=p(o.exifIFD,n.exif);if(v.ExifVersion&&j.typeOf(v.ExifVersion)==="array"){for(var w=0,u="";w<v.ExifVersion.length;w++){u+=String.fromCharCode(v.ExifVersion[w])}v.ExifVersion=u}return v},GPS:function(){var u;u=p(o.gpsIFD,n.gps);if(u.GPSVersionID){u.GPSVersionID=u.GPSVersionID.join(".")}return u},setExif:function(u,v){if(u!=="PixelXDimension"&&u!=="PixelYDimension"){return false}return r("exif",u,v)},getBinary:function(){return q.SEGMENT()}}}})(window,document,plupload); 
 
// define namespace
$.telligent = $.telligent || {};
$.telligent.evolution = $.telligent.evolution || {};

/*
 * Main entry point for script
 * Initiates any defined dependencies (and thereby initiating any of
 * those dependencies' dependencies) and runs any initiation logic
 * provided in the callback immediately
 */
require([
    'components',
    'composers',
    'events',
    'lib',
    'modules',
    'plugins',
	'lib.messageLinks',
	'lib.sheetProvider',
    'lib.sheet',
    'lib.actionSheet',
    'module.maxlength',
    'lib.touchEventAdapter'
], function(
    components,
    composers,
    events,
    lib,
    modules,
    plugins,
	MessageLinkHandler,
    sheetProvider,
    Sheet,
    ActionSheet,
    maxLength,
    touchEventAdapter,
	$, global)
{
    // adapt touch events for mobile
    touchEventAdapter.adapt();

	// initiation code
	$(document).ready(function(){

		// set up sheet instances
		sheetProvider.sheet = new Sheet({
            parent: $('body'),
            maxHeightPerent: 0.7,
            cssClass: 'sheet',
            backgroundColor: '#333',
            backgroundOpacity: 0.75,
            animationDuration: 250,
            //animationEasing: 'cubic-bezier(0.160, 0.060, 0.450, 0.940)',
            onOpening: function(){
                $.telligent.evolution.messaging.publish('sheet.opening');
            },
            onClosing: function(){
                $.telligent.evolution.messaging.publish('sheet.closing');
            },
            onOpened: function(){
                $.telligent.evolution.messaging.publish('sheet.opened');
            },
            onClosed: function(){
                $.telligent.evolution.messaging.publish('sheet.closed');
            }
        });
        sheetProvider.actionSheet = new ActionSheet({
            sheet: sheetProvider.sheet
        });

		// initiate message links body-wide
		new MessageLinkHandler({
			parent: 'body'
		}).handle('click');

		// initiate UI components
		$.telligent.evolution.ui.render();

        // shim maxlength in textareas in older browsers
        maxLength.shim();

        // init validation
        $.fn.evolutionValidation.init();
	});

}, jQuery, window); 
}()); 
