(function(){ 
var require, define;
(function (undef){
	var modules = {},
		resolve = function(name) {
			var module = modules[name];
			if(module == undef)
				return null;

			if(module.compiled)
				return module.compiled;

			var resolvedDependencies = [];
			if(module.dependencies && module.dependencies.length > 0) {
				for(var i = 0; i < module.dependencies.length; i++) {
					resolvedDependencies.push(resolve(module.dependencies[i]));
				}
			}

			module.compiled = module.factory.apply(this, resolvedDependencies.concat(module.extraArguments));

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
define('actionSheet', function($, global, undef) {

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
 * var auth = new Authenticator(context)
 * context:
 *   controller: Controller instance
 *   isNative: bool
 *   useDeviceBrowserForLogin: bool
 *
 * auth.login(returnUrl)
 * auth.logout()
 * auth.handleLoginLogout(data)
 */
define('authentication', ['transport', 'environment', 'messaging'],
	function(transport, environment, messaging, $, global){

	function setAuthorizationCookie(value) {
		return transport.load('callback.ashx?authenticate=' + encodeURIComponent(value), {
			async: false
		});
	}

	function unSetAuthorizationCookie() {
		return transport.load('callback.ashx?deauthenticate=deauthenticate', {
			async: false
		});
	}

	var Authenticator = function(context) {

		var hasChildBrowser = false;
		var loginOrLogout = function(data) {
			if (data['native'] == 'logout') {
				unSetAuthorizationCookie();
				messaging.publish('user.logout', {});
				context.controller.reset(true);
			} else if (data['native'] == 'login') {
				setAuthorizationCookie(data.token);
				messaging.publish('user.login', {});
				context.controller.reset(true);
			}
		};

		return {
			handleLoginLogout: function(data) {
				loginOrLogout(data);
			},
			login: function(returnUrl) {
				var t = this;
				returnUrl = returnUrl || global.location.href;

				var state = 'client=';
				// native
				if (context.isNative) {
					state += 'native';
				// homescreened web parage
				} else if (environment.type == 'webapp') {
					state += 'standalone';
				// web
				} else {
					state += 'unknown';
				}

				state += '&url=' + encodeURIComponent(returnUrl);

				if(context.isNative) {
					if (context.useDeviceBrowserForLogin) {
						global.open(transport.baseUrl()  + 'callback.ashx?login=login&state=' + encodeURIComponent(state), '_system', '');
						if (environment.device == 'android') {
							navigator.app.exitApp();
						}
					} else if (!hasChildBrowser) {
						hasChildBrowse = true;

						// native
						var cb = global.open(transport.baseUrl()  + 'callback.ashx?login=login&state=' + encodeURIComponent(state), '_blank', '');
						cb.addEventListener('loadstop', function (event) {
							if (event.url.indexOf(transport.baseUrl()) >= 0 && event.url.indexOf('callback.ashx') > -1) {
								var keyValues = event.url.substr(event.url.indexOf('?') + 1).split('&');
								var data = {};
								for (var i = 0; i < keyValues.length; i++) {
									var keyAndValue = keyValues[i].split('=');
									if (keyAndValue.length == 2) {
										var key = decodeURIComponent(keyAndValue[0]);
										var value = decodeURIComponent(keyAndValue[1]);
										data[key] = value;
									}
								}

								cb.close();
								loginOrLogout(data);
							}
						});
						cb.addEventListener('exit', function (event) {
							hasChildBrowser = false;
						});
					}
				} else {
					var authUrl = transport.baseUrl() + 'callback.ashx?login=login&state=' + encodeURIComponent(state);
					// homescreened web app
					if (environment.type == 'webapp') {
						var headerHeight = ($('#header').is(':visible') ? $('#header').outerHeight() : 0);
						var modalBrowser = $('<div></div>').css({
							position: 'fixed',
							width: $(document).width() + 'px',
							height: $(document).height() + 'px',
							top: $(document).height() + 'px',
							left: '0px',
							'z-index': 100,
							'transition': '-webkit-transform 0.4s cubic-bezier(0.455, 0.03, 0.515, 0.955)'
						});

						$('<a href="#">&nbsp;</a>')
							.css({
								display: 'block',
								height: headerHeight + 'px',
								overflow: 'hidden'
							})
							.on('click', function() {
								modalBrowser.remove();
								return false;
							})
							.appendTo(modalBrowser);

						$('<div></div>')
							.css({
								'-webkit-overflow-scrolling': 'touch',
								'overflow': 'scroll',
								'background-color': '#fff',
								width: $(document).width() + 'px',
								height: ($(document).height() - headerHeight) + 'px'
							})
							.appendTo(modalBrowser)
							.append(
								$('<iframe src="' + authUrl + '" frameborder="0"></iframe>')
									.css({
										width: $(document).width() + 'px',
										'min-height': ($(document).height() - headerHeight) + 'px'
									})
							);

						$('body').append(modalBrowser);
						modalBrowser.css({
							'-webkit-transform': 'translateY(-' + $(document).height() + 'px)'
						});

					// web browser
					} else {
						global.location.href = authUrl;
					}
				}
			},
			logout: function() {
				transport.load('callback.ashx?logout=logout').done(function(data, status){
					if (context.isNative) {
						messaging.publish('user.logout', {});
						unSetAuthorizationCookie();
					}
					context.controller.reset(true);
				});
			}
		}
	};

	return Authenticator;

}, jQuery, window); 
 
/// @name evolutionMobileComments
/// @category jQuery Plugin
/// @description Renders a mobile commenting interface
///
/// ### jQuery.fn.evolutionMobileComments
///
/// This plugin renders a templatable, interactive, commenting interface complete with viewing comments, loading more comments, liking, moderating, deleting, and adding more comments. It is typically not called directly, but instead via usage of the [comment UI component](@commenting).
///
/// ### Usage
///
/// Initializes a new plugin instance against a span:
///
///     $('span.selector').evolutionMobileComments(options);
///
/// ### Options
///
///  * `contentId`: Content Id of commentable content
///  * `contentTypeId`: Content Type Id of commentable content
///  * `typeId`: Optional Comment Type Id of commentable comment
///  * `pageSize`: Comments to load per page
///  * `canLike`: Declares whether like indicators should be shown
///  * `canFlagAsAbusive`: Declares whether the 'flag as abuse' should be shown
///  * `accessingUserId`: Accessing User ID
///  * `loadMoreResource`: 'Load More' label text
///  * `postResource`: Post button label text
///  * `commentResource`: Placeholder label text for the comment form
///  * `deleteConfirmationResource`: Comment deletion confirmation text
///  * `reportAbuseConfirmationResource`: Abuse flagging confirmation text
///  * `approvalRequiredResource`: Moderation required text
///  * `postTemplate`: Client-side sub-template which defines only the post button as rendered in the header while commenting
///
/// *default*
///
///     <a href="#" class="submit"><%= postResource %></a>
///
///  * `template`: Client-side commenting UI template
///
/// *default*
///
///     <div class="comments">
///         <a href="#" class="view-more" style="display: none"><%: resources.more %></a>
///         <div class="post-list">
///         </div>
///         <div class="comment-form" style="display: none;">
///             <fieldset>
///                 <div class="form-field">
///                     <textarea placeholder="<%: resources.comment %>"></textarea>
///                 </div>
///             </fieldset>
///         </div>
///     </div>
///
///  * `commentsTemplate`: Client-side sub-template which defines only a list of comments
///
/// *default*
///
///     <% foreach(comments, function(comment){ %>
///         <div class="post-list-item content-item" data-commentid="<%= comment.CommentId %>">
///             <div class="post">
///                 <div class="avatar">
///                     <img class="ui-resizedimage" data-src="<%= comment.User.AvatarUrl %>" data-width="40" data-height="40" />
///                 </div>
///                 <span class="date ui-formatteddate" data-date="<%= comment.CreatedDate %>" data-format="ago"></span>
///                 <span class="author">
///                     <% if(comment.User.ProfileUrl) { %>
///                         <a href="<%= comment.User.ProfileUrl %>"><%= comment.User.DisplayName %></a>
///                     <% } else { %>
///                         <%= comment.User.DisplayName %>
///                     <% } %>
///                 </span>
///                 <div class="content">' +
///                     <%= jQuery.telligent.evolution.mobile.detectData(comment.Body || "") %>' +
///                 </div>
///                 <ul class="actions ui-links">
///                     <% if(canLike && comment.CanBeLiked) { %>
///                         <li class="action-like">
///                             <span class="ui-like" data-contentid="<%= comment.CommentId %>" data-contenttypeid="<%= comment.CommentContentTypeId %>" data-format="{toggle} {count}" data-initialcount="<%: comment.TotalLikes %>" data-initialstate="<%: comment.Liked %>" data-configuration="" ></span>' +
///                         </li>
///                     <% } else if(comment.TotalLikes > 0) { %>
///                         <li class="action-like">
///                             <span class="ui-like" data-contentid="<%= comment.CommentId %>" data-contenttypeid="<%= comment.CommentContentTypeId %>" data-format="{count}" data-initialcount="<%: comment.TotalLikes %>" data-initialstate="<%: comment.Liked %>" data-configuration="" ></span>' +
///                         </li>
///                     <% } %>
///                     <% if(canFlagAsAbusive || comment.UserCanDelete) { %>
///                         <li class="action-more">
///                             <a class="comment-actions init" href="#" data-commentid="<%= comment.CommentId %>" data-commentcontenttypeid="<%= comment.CommentContentTypeId %>" <% if(comment.UserCanDelete) { %> data-candelete="true" <% } %> >test</a>
///                         </li>
///                     <% } %>
///                 </ul>
///             </div>
///         </div>
///     <% }); %>
///
define('evolutionMobileComments', ['messaging'], function(messaging, $, global, undef) {

	var template,
		commentsTemplate,
		postTemplate;

	var model = {
		// load comments with their like states
		loadComments: function(contentId, contentTypeId, typeId, pageIndex, pageSize) {
			var data = {
				ContentId: contentId,
				ContentTypeId: contentTypeId,
				PageIndex: pageIndex,
				PageSize: pageSize,
				IsApproved: 'true',
				SortBy: 'CreatedUtcDate',
				SortOrder: 'Descending'
			};
			if(typeId) {
				data.CommentTypeId = typeId
			}
			return $.telligent.evolution.mobile.showLoading($.Deferred(function(d){
				var commentsResponse = {};
				// load comments
				$.telligent.evolution.get({
					url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/comments.json',
					data: data,
					cache: false,
					dataType: 'json'
				}).done(function(commentsResponse) {

					// load like states in a REST batch
					// results in each Comment object also containing
					//   TotalLikes
					//   Liked
					//   CanBeLiked
					$.telligent.evolution.batch(function(){
						$.each(commentsResponse.Comments, function(i, comment){

							// get like state for accessing user if not anonymous
							if(!$.telligent.evolution.user.accessing.isSystemAccount) {
								comment.CanBeLiked = true;
								$.telligent.evolution.get({
									url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/like.json',
									data: {
										ContentId: comment.CommentId
									},
									cache: false,
									dataType: 'json'
								}).done(function(liked) {
									comment.Liked = liked.Like !== null;
								}).fail(function(){
									d.reject();
								});
							} else {
								comment.CanBeLiked = false;
								comment.Liked = false;
							}

							// get like count for the comment
							$.telligent.evolution.get({
								url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/likes.json',
								data: {
									ContentId: comment.CommentId,
									ContentTypeId: comment.CommentContentTypeId,
									PageSize: 1,
									PageIndex: 0
								},
								dataType: 'json'
							}).done(function(likes) {
								comment.TotalLikes = likes.TotalCount || 0;
							}).fail(function(){
								d.reject();
							})
						});
					}).done(function(){
						d.resolve(commentsResponse);
					}).fail(function(){
						d.reject();
					})
				}).fail(function(){
					d.reject();
				});
			}).promise());
		},
		addComment: function(contentId, contentTypeId, typeId, body) {
			var data = {
				ContentId: contentId,
				ContentTypeId: contentTypeId,
				Body: body
			};
			if(typeId) {
				data.CommentTypeId = typeId
			}
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.post({
				url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/comments.json',
				data: data,
				cache: false,
				dataType: 'json'
			}).done(function(response){
				if(response.Comment) {
					$.extend(response.Comment, {
						CanBeLiked: true,
						Liked: false,
						TotalLikes: 0
					});
				}
				return response;
			}));
		},
		del: function(commentId) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.del({
				url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/comments/{CommentId}.json',
				data: {
					CommentId: commentId
				},
				cache: false,
				dataType: 'json'
			}));
		},
		listAbuseReports: function(contentId, reportingUserId) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.get({
				url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/abusereports.json',
				data: {
					AbusiveContentId: contentId,
					ReportingUserId: reportingUserId,
					PageSize: 1,
					PageIndex: 0
				},
				cache: false,
				dataType: 'json'
			}));
		},
		addAbuseReport: function(contentId, contentTypeId) {
			return $.telligent.evolution.mobile.showLoading($.telligent.evolution.post({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/abusereports.json',
				data: {
					ContentId: contentId,
					ContentTypeId: contentTypeId
				},
				cache: false,
				dataType: 'json'
			}));
		}
	}

	function attachHandlers(context) {
		context.viewMore.on('click', function(e){
			e.preventDefault();
			handleViewMore(context);
			return false;
		});
		context.commentsWrapper.on('click', 'a.comment-actions', function(e){
			e.preventDefault();
			handleShowActions(context, $(e.target).closest('a'));
			return false;
		});
		context.postCommentLink.on('click', function(e){
			e.preventDefault();
			handleAddComment(context);
			context.postCommentLink.hide();
			return false;
		});
		// show/hide the post link depending on focus
		var hideTimeout;
		context.postCommentLink.hide();
		context.commentInput.on({
			focus: function(){
				clearTimeout(hideTimeout);
				context.postCommentLink.show();
			},
			blur: function() {
				hideTimeout = setTimeout(function(){
					context.postCommentLink.hide();
				}, 10);
			}
		});

		context.commentInput.one('focus', function(){
			context.commentInput.evolutionComposer({
				plugins: ['hashtags', 'mentions'],
				focus: false
			}).focus();
		});
	}

	function handleViewMore(context) {
		loadComments(context);
	}

	function handleShowActions(context, link) {
		var actionLinks = [];
		var deferredLinks = [];

		// delete link
		if(link.data('candelete')) {
			deferredLinks.push($.Deferred(function(dfd){
				var deleteLink = $('<a href="#">Delete</a>');
				deleteLink.on('tap', function(){
					handleDelete(context, link.data('commentid'), link.closest('.post-list-item'));
				});
				actionLinks[0] = deleteLink;
				dfd.resolve();
			}).promise());
		}

		// flag link
		if(context.canFlagAsAbusive) {
			// first figure out if this is already flagged
			deferredLinks.push($.Deferred(function(dfd){
				model.listAbuseReports(link.data('commentid'), context.accessingUserId)
					.done(function(response){
						// if no reports, allow it to be flaged
						if(response.TotalCount == 0) {
							var flagLink = $('<a href="#">Flag as spam/abuse</a>');
							flagLink.on('click', function(){
								handleFlagAsAbusive(context, link.data('commentid'), link.data('commentcontenttypeid'));
							});
							actionLinks[1] = flagLink;
						// otherwise show flagged indicator
						} else {
							var flagLink = $('<a href="#">Flagged as spam/abuse</a>');
							flagLink.on('click', function(){ });
							actionLinks[1] = flagLink;
						}
						dfd.resolve();
					})
					.fail(function(){
						dfd.resolve(null);
					});
			}));
		}

		// cancel link
		deferredLinks.push($.Deferred(function(dfd){
			var cancelLink = $('<a href="#">Cancel</a>');
			cancelLink.on('click', function(){
				$.telligent.evolution.mobile.hideSheet();
			})
			actionLinks[(context.canFlagAsAbusive ? 2 : 1)] = cancelLink;
			dfd.resolve();
		}).promise());


		// when links are ready, show them in a sheet
		$.when.apply($, deferredLinks).then(function() {
			// show links
			$.telligent.evolution.mobile.displaySheet({
				links: actionLinks
			});
		});
	}

	function handleAddComment(context) {
		// only post non-empty comments
		//var commentValue = $.trim(context.commentInput.val());
		var commentValue = context.commentInput.evolutionComposer('val');
		if(!commentValue || commentValue.length == 0)
			return;

		context.commentInput.blur();
		// clear the inpput
		context.commentInput.evolutionComposer('val','');
		model.addComment(context.contentId, context.contentTypeId, context.typeId, commentValue)
			.done(function(response){
				context.commentFieldSet.addClass('with-comments');
				// show message if requires approval
				if(!response.Comment.IsApproved) {
					$.telligent.evolution.mobile.displayMessage(context.approvalRequiredResource, {
						disappearAfter: 5000,
						cssClass: 'info'
					});
				// otherwise render the new comment
				} else {
					context.commentsList.append(commentsTemplate({
						canLike: context.canLike,
						canFlagAsAbusive: context.canFlagAsAbusive,
						comments: [ response.Comment ]
					}));
				}
			})
			.fail(function(){

			});
	}

	function handleDelete(context, commentId, commentListItem) {
		$.telligent.evolution.mobile.confirm(context.deleteConfirmationResource, function(result) {
			if (result) {
				model.del(commentId).then(function(){
					commentListItem.remove();
					$.telligent.evolution.mobile.hideSheet();
				});
			} else {
				$.telligent.evolution.mobile.hideSheet();
			}
		});
	}

	function handleFlagAsAbusive(context, commentId, commentContentTypeId) {
		if(confirm(context.reportAbuseConfirmationResource)) {
			model.addAbuseReport(commentId, commentContentTypeId).then(function(){
				messaging.publish('ui.reportabuse', {
					contentId: commentId,
					contentTypeId: commentContentTypeId
				});
			});
		} else {
			$.telligent.evolution.mobile.hideSheet();
		}
	}

	function loadComments(context) {
		model.loadComments(context.contentId, context.contentTypeId,
			context.typeId, context.pageIndex, context.pageSize)
			.done(function(response){
				// show comment form if user can add comments
				if(response.UserCanCreateComment) {
					context.commentForm.show();
				} else {
					context.commentForm.hide();
				}

				if(response.TotalCount > 0)
					context.commentFieldSet.addClass('with-comments');

				// show 'view more' if there are more comments to see
				if(((response.PageIndex + 1) * response.PageSize) < response.TotalCount) {
					context.viewMore.show();
					context.pageIndex++;
				} else {
					context.viewMore.hide();
				}

				// render new comments
				context.commentsList.prepend(commentsTemplate({
					canLike: context.canLike,
					canFlagAsAbusive: context.canFlagAsAbusive,
					comments: (response.Comments || []).reverse()
				}));
			})
			.fail(function(){

			});
	}

	$.fn.evolutionMobileComments = function(options) {
		var context = $.extend({}, $.fn.evolutionMobileComments.defaults, options || {}),
			selection = this;

		// compile templates
		template = template || $.telligent.evolution.template.compile(context.template);
		commentsTemplate = commentsTemplate || $.telligent.evolution.template.compile(context.commentsTemplate);
		postTemplate = postTemplate || $.telligent.evolution.template.compile(context.postTemplate);

		// render template
		context.commentsWrapper = $(template({
			resources: {
				more: context.loadMoreResource,
				comment: context.commentResource
			}
		}));

		// show template
		context.commentsWrapper.appendTo(selection);
		context.viewMore = context.commentsWrapper.find('a.view-more:first');
		context.commentsList = context.commentsWrapper.find('div.post-list:first');
		context.commentInput = context.commentsWrapper.find('textarea:first');
		context.postCommentLink = $(postTemplate({ postResource: context.postResource })).hide();
		context.commentFieldSet = context.commentsWrapper.find('fieldset:first');
		context.commentForm = context.commentsWrapper.find('div.comment-form:first');
		$.telligent.evolution.mobile.setHeaderButton(context.postCommentLink);

		// attach handlers
		attachHandlers(context);

		// load first page
		context.pageIndex = 0;
		loadComments(context);

		return selection;
	}

	$.fn.evolutionMobileComments.defaults = {
		contentId: '',
		contentTypeId: '',
		typeId: '',
		pageSize: 5,
		canLike: !$.telligent.evolution.user.accessing.isSystemAccount,
		canFlagAsAbusive: false,
		accessingUserId: 0,
		template: ('' +
			' <div class="comments">' +
			'     <a href="#" class="view-more" style="display: none"><%: resources.more %></a>' +
			'     <div class="post-list">' +
			'     </div>' +
			'     <div class="comment-form" style="display: none;"> ' +
			'         <fieldset> ' +
			'             <div class="form-field"> ' +
			'                 <textarea placeholder="<%: resources.comment %>"></textarea>' +
			'             </div> ' +
			'         </fieldset> ' +
			'     </div> ' +
			' </div> '),
		postTemplate: '<a href="#" class="submit"><%= postResource %></a>',
		commentsTemplate: ('' +
			' <% foreach(comments, function(comment){ %> ' +
			'     <div class="post-list-item content-item" data-commentid="<%= comment.CommentId %>"> ' +
			'         <div class="post"> ' +
			'             <div class="avatar"> ' +
			'                 <img class="ui-resizedimage" data-src="<%= comment.User.AvatarUrl %>" data-width="40" data-height="40" /> ' +
			'             </div> ' +
			'             <span class="date ui-formatteddate" data-date="<%= comment.CreatedDate %>" data-format="ago"></span> ' +
			'             <span class="author"> ' +
			'                 <% if(comment.User.ProfileUrl) { %> ' +
			'                     <a href="<%= comment.User.ProfileUrl %>"><%= comment.User.DisplayName %></a> ' +
			'                 <% } else { %> ' +
			'                     <%= comment.User.DisplayName %> ' +
			'                 <% } %> ' +
			'             </span> ' +
			'             <div class="content">' +
			'                 <%= jQuery.telligent.evolution.mobile.detectData(comment.Body || "") %>' +
			'             </div> ' +
			'             <ul class="actions ui-links"> ' +
			'                 <% if(canLike && comment.CanBeLiked) { %> ' +
			'                     <li class="action-like"> ' +
			'                         <span class="ui-like" data-contentid="<%= comment.CommentId %>" data-contenttypeid="<%= comment.CommentContentTypeId %>" data-format="{toggle} {count}" data-initialcount="<%: comment.TotalLikes %>" data-initialstate="<%: comment.Liked %>" data-configuration="" ></span>' +
			'                     </li> ' +
			'                 <% } else if(comment.TotalLikes > 0) { %> ' +
			'                     <li class="action-like"> ' +
			'                         <span class="ui-like" data-contentid="<%= comment.CommentId %>" data-contenttypeid="<%= comment.CommentContentTypeId %>" data-format="{count}" data-initialcount="<%: comment.TotalLikes %>" data-initialstate="<%: comment.Liked %>" data-configuration="" ></span>' +
			'                     </li> ' +
			'                 <% } %> ' +
			'                 <% if(canFlagAsAbusive || comment.UserCanDelete) { %> ' +
			'                     <li class="action-more"> ' +
			'                         <a class="comment-actions init" href="#" data-commentid="<%= comment.CommentId %>" data-commentcontenttypeid="<%= comment.CommentContentTypeId %>" <% if(comment.UserCanDelete) { %> data-candelete="true" <% } %> >test</a> ' +
			'                     </li> ' +
			'                 <% } %> ' +
			'             </ul> ' +
			'         </div> ' +
			'     </div> ' +
			' <% }); %> '),
		loadMoreResource: 'Load More Comments',
		postResource: 'Post',
		commentResource: 'Leave a comment',
		deleteConfirmationResource: 'Are you sure you want to delete this comment?',
		reportAbuseConfirmationResource: 'Are you sure you want to report this comment?',
		approvalRequiredResource: 'Thank you, your comment requires moderation so it may take a while to appear'
	}

}, jQuery, window);
 
 
/* Controller (Internal API)
 *
 * Coordinates navigation, UI, transport, and authentication
 * Exposes an API which is ultimately exposed as the Public Mobile API by the API module
 *
 * Additionally, triggers messages
 *
 * var controller = new Controller(options)
 *
 * Options:
 *
 *	 allowAnonymous: false,
 *	 isHttpAuth: false,
 *
 *   // navigation settings
 *   defaultContentUrl: 'default',
 *   navigationContentUrl: 'navigation',
 *
 *   // shell settings
 *   enableRefreshButton: true
 *   enablePan: true
 *   enableSoftBackButton: true
 *   doubleTapHeaderToScroll: true
 *	 focusInputsOnLabelTap: false,
 *
 *   // loading overlay settings
 *   loadingCssClass: 'loading',
 *   loadingContent: '<span class="icon cw"></span>',
 *   loadingOpacity: 0.7,
 *
 *   // animation settings
 *   easing: 'cubic-bezinavigationOpenPercenter(0.160, 0.060, 0.450, 0.940)',
 *   navigationOpenPercent: 0.8,
 *   navigationOpenDuration: 275,
 *   navigationClosedOffsetPercent: -.02
 *   navigationClosedZoom: 0
 *
 *   // Sheet Settings
 *   sheetMaxHeightPerent: 0.7
 *   sheetCssClass: 'sheet'
 *   sheetBackgroundColor: '#333'
 *   sheetBackgroundOpacity: 0.7
 *
 *   // pull to refresh options
 *   refreshOverflow: 10 // extra pixels needed to pull past indicator's height to trigger refresh (default 20)
 *   refreshRevealThrottle: 10 // min milliseconds between 'reveal' callbacks (default 10)
 *
 *   // how long to leave page content in the cache (doesn't affect how long history is cached)
 *   // also reflects the maximum amount of time between pause and resume where the app does not refresh upon resuming (to support fast switching back and forth)
 *   cacheDuration: 10 * 60 * 1000 // 10 minutes
 *
 * 	 telephonePattern: null
 *
 * Methods:
 *   refreshable: function(isRefreshable)
 *   navigable: function(isNavigable)
 *   load: function(url, options)
 *   refresh: function()
 *   back: function(refresh)
 *   navigationVisible: function(isVisible)
 *   navigationScrollTop: function(to)
 *   contentScrollTop: function(to)
 *   displayMessage: function()
 *   alert()
 *   confirm()
 *   setHeaderButton: function(buttonElement)
 *   setHeaderContent: function(buttonElement)
 *   refreshNavigation: function()
 *   setClass: function(className)
 *   debug: function(message)
 *   reset: function(shouldReload) // when shouldReload is defined and true, also performs a window.location.reload
 *   addRefreshParameter: function(key, value)
 *   displaySheet(options) // displays either a list of links/actions (with optional cancel) or arbitrary contnent
 *     options
 *       links: array of link objects
 *       content: when links aren't provided, arbitrary content can be shown. string, DOM, or jQuery selection.
 *   hideSheet()
 *   alert(message, callback)
 *     displays the provided message and executes the callback when the message has been dismissed
 *   confirm(message, callback)
 *     displays the message and executes the callback with a single boolean parameter identifying if the message was accepted positively
 *   scrollable(options) // sets a region to be endlessly scrollable
 *     options:
 *       region: 'content' || 'navigation'  // required
 *       load: function(pageIndex, complete, error)    // required
 *       complete: function(content)    // required
 *       initialpageIndex: 0
 *       preFillAttempts: 5
 *   clearContent(url)
 *     clears the currently-cached content for a url (or current page when not provided) to force a refresh on next load or navigation back to it
 *   excludeFromHistory()
 *   setExpiration(data, url)
 *   showLoading(promise)
 *     Shows the loading indicator. If passed an optional promise parameter, shows the loading indicator until the promise resolves or rejects, then automatically hiding it. Returns the
 *   hideLoading()
 *   excludeFromHistory()
 *   setExpiration(date, url)
 *   detectData
 *
 * Messages:
 *   mobile.content.refreshing
 *   mobile.content.refreshed
 *   mobile.content.loading   data: url
 *   mobile.content.loaded 		   data: url
 *   mobile.content.rendered 		   data: url
 *   mobile.navigation.loading
 *   mobile.navigation.loaded
 *   mobile.navigation.opening
 *   mobile.navigation.opened
 *   mobile.navigation.closing
 *   mobile.navigation.closed
 *   mobile.navigation.rendered 		   data: url
 *   mobile.sheet.opening
 *   mobile.sheet.opened
 *   mobile.sheet.closing
 *   mobile.sheet.closed
 *   mobile.keyboard.open
 *   mobile.keyboard.close
 *   mobile.orientationchange
 *   mobile.online
 *   mobile.offline
 *   mobile.start
 *   mobile.pause
 *   mobile.resume
 */

/// @name mobile
/// @category JavaScript API Module
/// @description Mobile shell API methods
///
/// ### jQuery.telligent.evolution.mobile
///
/// This module provides methods for interacting with the mobile shell.
///
/// ### Methods
///
/// #### addRefreshParameter
///
/// Adds a parameter(s) to the query string for the next call to `refresh()`. Added parameters are not persisted in the stack nor retained after the refresh, though they can be read out of the querystring by the widget (either in Velocity or JavaScript) and re-applied. Combined with calls to `refresh()`, this can be useful for implementing filters within a widget.
///
///     $.telligent.evolution.mobile.addRefreshParameter(key, value)
///
/// #### alert
///
/// Displays the provided message and executes the callback when the message has been dismissed
///
///     $.telligent.evolution.mobile.alert(message, callback)
///
/// #### back
///
/// Navigates back in the navigation stack.
///
///     $.telligent.evolution.mobile.back()
///     $.telligent.evolution.mobile.back(refresh) // clears cache of previous URL forcing its refresh
///
/// #### clearContent
///
/// Clears the currently-cached content for a url (or current page if not provided). This is useful to force a refresh of its content on next load or navigation back to it.
///
///     // Clear current page's content
///     $.telligent.evolution.mobile.clearContent()
///
///     // Clear explicit page's content
///     $.telligent.evolution.mobile.clearContent(url)
///
/// #### confirm
///
/// Displays the message and executes the callback with a single boolean parameter identifying if the message was accepted positively
///
///     $.telligent.evolution.mobile.confirm(message, callback)
///
/// #### contentScrollTop
///
/// Scrolls the content to an offset or element, and returns current scroll position.
///
///     // scroll to an element
///     $.telligent.evolution.mobile.contentScrollTop(element)
///
///     // scroll to a position
///     $.telligent.evolution.mobile.contentScrollTop(yOffset)
///
///     // get the current content scroll position
///     var currentContentScrollTop = $.telligent.evolution.mobile.contentScrollTop()
///
/// #### debug
///
/// Displays a message in a semi-transparent fixed overlay for debugging.
///
///     $.telligent.evolution.mobile.debug(message)
///
/// #### displayMessage
///
/// Displays a non-modal message.
///
///     $.telligent.evolution.mobile.displayMessage(message, options)
///
/// *options*
///
///  * `cssClass`: CSS Class to apply to the message. Can be 'info', 'warning', or any other class name.
///  * `disappearAfter`: Milliseconds after which the message disappears. Default: 5000
///
/// #### displaySheet
///
/// Displays an overlay of either links or arbitrary content.
///
/// *options*
///
///  * `links`: When provided, an array of anchor elements rendered as a list.
///  * `content`: When links are not provided, arbitrary content (HTML fragment, DOM element, or jQuery selection) can be provided
///
/// #### hideLoading
///
/// Hides the loading animation
///
///     $.telligent.evolution.mobile.hideLoading()
///
/// #### excludeFromHistory
///
/// Excludes the current content from the navigation history
///
///     $.telligent.evolution.mobile.excludeFromHistory()
///
/// #### hideSheet
///
/// Hides the overlay sheet if visible.
///
///     $.telligent.evolution.mobile.hideSheet()
///
/// #### init
///
/// Initiates the mobile shell. This is to only be called once. By default, the shell is initiated from a script resource..
///
///     $.telligent.evolution.mobile.init(options)
///
/// *options*
///
/// *navigation*
///
///  * `defaultContentUrl`: Default content page to load when starting *default*: `'default'`
///  * `navigationContentUrl`: Navigation page *default*: `'navigation'`
///  * `cacheDuration`: Client-side cache duration *default*: `600000`
///
/// *shell*
///
///  * `enableRefreshButton`: Whether the explicit refresh button should be enabled in addition to pull-to-refresh. *default*: `($.telligent.evolution.mobile.environment.device != 'ios')`
///  * `enablePan`: Whether panning should be enabled *default*: `($.telligent.evolution.mobile.environment.device == 'ios')`
///  * `enableSoftBackButton`: Whether a soft back button should be enabled *default*: `($.telligent.evolution.mobile.environment.device == 'ios' && $.telligent.evolution.mobile.environment.type != 'browser')`
///  * `doubleTapHeaderToScroll`: Whether double tapping the header should scroll to the top *default*: `true`
///  * `focusInputsOnLabelTap`: Whether tapping a label should focus on its input *default*: `false`
///  * `telephonePattern`: Regular Expression used when matching telephone numbers in text *default*:  `"(?:(?:\\(?(?:00|\\+)?(?:[1-4]\\d\\d|[1-9]\\d?)\\)?)?[\\-\\.\\s\\\\\\/]?)?(?:(?:\\(?\\d{3,}\\)?[\\-\\.\\s\\\\\\/]?){2,})"`
///
/// *loading overlay*
///
///  * `loadingCssClass`: CSS class applied to loading indicator *default*: `'loading'`
///  * `loadingContent`: Content shown within loading indicator *default*: `'<span class="icon cw"></span>'`
///  * `loadingOpacity`: Opacity of loading indicator *default*: `0.7`
///
/// *animation*
///
///  * `easing`: Default global animation easing *default*: `'cubic-bezier(0.160, 0.060, 0.450, 0.940)'`
///  * `navigationOpenPercent`: Window percentage to open the navigation by default *default*: `0.8`
///  * `navigationOpenDuration`: Navigation animation duration *default*: `275`
///  * `navigationClosedOffsetPercent`: Navigation position offset when closed *default*: `0.1`
///  * `navigationClosedZoom`: Navigation zoom transform when closed *default*: `0.05`
///
/// *sheet*
///
///  * `sheetMaxHeightPerent`: Max sheet height as a percentage of the window *default*: `0.7`
///  * `sheetCssClass`: Sheet CSS class *default*: `'sheet'`
///  * `sheetBackgroundColor`: Sheet background color *default*: `'#333'`
///  * `sheetBackgroundOpacity`: Sheet opacity *default*: `0.7`
///
/// #### load
///
/// Loads a URL. Persists URL and its contents in the stack. If the URL being loaded already exists in the stack, navigates back to it. Persists current content's scroll position. Optionally supports refreshing a URL before loading it.
///
///     $.telligent.evolution.mobile.load(url)
///     $.telligent.evolution.mobile.load(url, options)
///
/// *options*
///
///  * `refresh`: When true, does not load from cache. *default: false*
///
/// #### navigable
///
/// Returns and/or sets whether the navigation menu can currently be opened via swiping or panning.
///
///     $.telligent.evolution.mobile.navigable(isNavigable)
///
/// #### navigationScrollTop
///
/// Scrolls the navigation to an offset or element, and returns current scroll position.
///
///     // scroll to an element
///     $.telligent.evolution.mobile.navigationScrollTop(element)
///
///     // scroll to a position
///     $.telligent.evolution.mobile.navigationScrollTop(yOffset)
///
///     // get the current navigation scroll position
///     var currentContentScrollTop = $.telligent.evolution.mobile.navigationScrollTop()
///
/// #### navigationVisible
///
/// Returns and/or sets whether the navigation menu is currently visible.
///
///     var isVisible = $.telligent.evolution.mobile.navigationVisible()
///     $.telligent.evolution.mobile.navigationVisible(shouldBeVisible)
///
/// #### refresh
///
/// Refreshes the current content URL.
///
///     $.telligent.evolution.mobile.refresh()
///
/// #### refreshable
///
/// Returns and/or sets whether pull-to-refresh is currently enabled. This is reset to true when content is loaded or refreshed.
///
///     var isRefreshable = $.telligent.evolution.mobile.refreshable();
///     $.telligent.evolution.mobile.refreshable(shouldBeRefreshable);
///
/// #### refreshNavigation
///
/// Refreshes the navigation page
///
///     $.telligent.evolution.mobile.refreshNavigation()
///
/// #### reset
///
/// Clears the history stack, refreshes the navigation page, and loads the default content URL. When `reload` is true, also performs a complete `window.location.reload()`
///
///     $.telligent.evolution.mobile.reset(reload);
///
/// #### scrollable
///
/// Sets a region to be endlessly scrollable. Handles scroll events, page indexes, pre-filling, scroll indicators, and context clearing on navigation or refreshing
///
///     $.telligent.evolution.mobile.scrollable(options)
///
/// *options*
///
///   * `region`: 'content' or 'navigation' *required*
///   * `load`: callback to load a page. Passed page index to load, and `complete` and `error` callbacks. Either `complete` or `error` must be called. `Complete` should be passed the new page of content.
///   * `complete`: callback to render a new page. Passed content successfully loaded from `load`. Only called when the scrollable region is still in context of the currently-loaded page
///   * `initialpageIndex`: 0 *optional*
///   * `preFillAttempts`: 5 *optional* Attempts, after which, the initial rendering of a scrollable should quit attempting to fill the visible vertical space
///
/// #### setClass
///
/// Applies a class name to the entire shell for as long as the current content is loaded
///
///     $.telligent.evolution.mobile.setClass('class')
///
/// #### setExpiration
///
/// Sets a custom expiration for the cache of the current (or explicitly provided) URL
///
///     // set the current page's cache to expire at the provided date
///     $.telligent.evolution.mobile.setExpiration(date);
///
///     // set the provided URL's cache to expire at the provided date
///     $.telligent.evolution.mobile.setExpiration(date, url);
///
/// #### setHeaderButton
///
/// Sets a widget-defined element to render in the top right of the header area. The element is removed upon the next load or refresh of content. There is no restriction on the behavior of this element. It can have its own event handlers bound to it.
///
///     $.telligent.evolution.mobile.setHeaderButton(buttonElement)
///
/// #### setHeaderContent
///
/// Sets a widget-defined element to render in the top center of the header area. The element is not removed upon the next load or refresh of content. There is no restriction on the behavior of this element. It can have its own event handlers bound to it.
///
///     $.telligent.evolution.mobile.setHeaderContent(content)
///
/// #### showLoading
///
/// Shows the loading animation over the content. If passed an optional `promise` argument, then only shows the animation while the promise is pending, hiding it upon resolution or rejection. Returns the same promise when a promise is passed.
///
///     $.telligent.evolution.mobile.showLoading()
///     // when passed a promise, hides the indicator as soon as the promise completes
///     promise = $.telligent.evolution.mobile.showLoading(promise);
///

/// @name mobile.content.refreshing
/// @category Client Message
/// @description Published before content refreshes
///
/// ### mobile.content.refreshing Message
///
/// [Client-side message](@messaging) published before content refreshes
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.refreshing', function(data) {
///         // handle the event
///     });
///

/// @name mobile.content.refreshed
/// @category Client Message
/// @description Published after content refreshes
///
/// ### mobile.content.refreshed Message
///
/// [Client-side message](@messaging) published after content refreshes
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.refreshed', function(data) {
///         // handle the event
///     });
///

/// @name mobile.content.loading
/// @category Client Message
/// @description Published before content loads, either from navigation or refreshing
///
/// ### mobile.content.loading Message
///
/// [Client-side message](@messaging) Published before content loads, either from navigation or refreshing
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.loading', function(data) {
///         // handle the event
///     });
///

/// @name mobile.content.loaded
/// @category Client Message
/// @description Published after content loads, either from navigation or refreshing
///
/// ### mobile.content.loaded Message
///
/// [Client-side message](@messaging) Published after content loads, either from navigation or refreshing
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.loaded', function(data) {
///         // handle the event
///     });
///

/// @name mobile.content.rendered
/// @category Client Message
/// @description Published after content is rendered, either from navigation or refreshing.
///
/// ### mobile.content.rendered Message
///
/// [Client-side message](@messaging) published after content is rendered, either from navigation or refreshing. This occurs after [mobile.content.loaded](@mobile.content.loaded) and any animation involved in exposing the content.
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.rendered', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.loading
/// @category Client Message
/// @description Published when the navigation bar's content is loading
///
/// ### mobile.navigation.loading Message
///
/// [Client-side message](@messaging) Published when the navigation bar's content is loading
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.loading', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.loaded
/// @category Client Message
/// @description Published when the navigation bar's content has completed loading
///
/// ### mobile.navigation.loaded Message
///
/// [Client-side message](@messaging) Published when the navigation bar's content has completed loading
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.loaded', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.rendered
/// @category Client Message
/// @description Published when the navigation bar's content has completed rendering
///
/// ### mobile.navigation.rendered Message
///
/// [Client-side message](@messaging) Published when the navigation bar's content has rendered
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.rendered', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.opening
/// @category Client Message
/// @description Published when the navigation bar is opening
///
/// ### mobile.navigation.opening Message
///
/// [Client-side message](@messaging) Published when the navigation bar is opening
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.opening', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.opened
/// @category Client Message
/// @description Published when the navigation bar has finished opening
///
/// ### mobile.navigation.opened Message
///
/// [Client-side message](@messaging) Published when the navigation bar has finished opening
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.opened', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.closing
/// @category Client Message
/// @description Published when the navigation bar is closing
///
/// ### mobile.navigation.closing Message
///
/// [Client-side message](@messaging) Published when the navigation bar is closing
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.closing', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.closed
/// @category Client Message
/// @description Published when the navigation bar has finished closing
///
/// ### mobile.navigation.closed Message
///
/// [Client-side message](@messaging) Published when the navigation bar has finished closing
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.closed', function(data) {
///         // handle the event
///     });
///

/// @name mobile.sheet.opening
/// @category Client Message
/// @description Published when a sheet is opening
///
/// ### mobile.sheet.opening Message
///
/// [Client-side message](@messaging) Published when a sheet is opening
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.sheet.opening', function(data) {
///         // handle the event
///     });
///

/// @name mobile.sheet.opened
/// @category Client Message
/// @description Published when a sheet has completed opening
///
/// ### mobile.sheet.opened Message
///
/// [Client-side message](@messaging) Published when a sheet has completed opening
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.sheet.opened', function(data) {
///         // handle the event
///     });
///

/// @name mobile.sheet.closing
/// @category Client Message
/// @description Published when a sheet is closing
///
/// ### mobile.sheet.closing Message
///
/// [Client-side message](@messaging) Published when a sheet is closing
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.sheet.closing', function(data) {
///         // handle the event
///     });
///

/// @name mobile.sheet.closed
/// @category Client Message
/// @description Published when a sheet has completed closing
///
/// ### mobile.sheet.closed Message
///
/// [Client-side message](@messaging) Published when a sheet has completed closing
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.sheet.closed', function(data) {
///         // handle the event
///     });
///

/// @name mobile.keyboard.open
/// @category Client Message
/// @description Published when the keyboard has opened
///
/// ### mobile.keyboard.open Message
///
/// [Client-side message](@messaging) Published when the keyboard has opened
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.keyboard.open', function(data) {
///         // handle the event
///     });
///

/// @name mobile.keyboard.close
/// @category Client Message
/// @description Published when the keyboard has closed
///
/// ### mobile.keyboard.close Message
///
/// [Client-side message](@messaging) Published when the keyboard has closed
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.keyboard.close', function(data) {
///         // handle the event
///     });
///

/// @name mobile.orientationchange
/// @category Client Message
/// @description Cross-platform message published when the orientation of the device has changed
///
/// ### mobile.orientationchange Message
///
/// [Client-side message](@messaging) Cross-platform message published when the orientation of the device has changed
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.orientationchange', function(data) {
///         // handle the event
///     });
///

/// @name mobile.online
/// @category Client Message
/// @description Cross-platform message published when the device's state switches to online
///
/// ### mobile.online Message
///
/// [Client-side message](@messaging) Cross-platform message published when the device's state switches to online
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.online', function(data) {
///         // handle the event
///     });
///

/// @name mobile.offline
/// @category Client Message
/// @description Cross-platform message published when the device's state switches to offline
///
/// ### mobile.offline Message
///
/// [Client-side message](@messaging) Cross-platform message published when the device's state switches to offline
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.offline', function(data) {
///         // handle the event
///     });
///

/// @name mobile.start
/// @category Client Message
/// @description Cross-platform message published when the app is launched
///
/// ### mobile.start Message
///
/// [Client-side message](@messaging) Cross-platform message published when the app is started on the device
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.start', function(data) {
///         // handle the event
///     });
///

/// @name mobile.pause
/// @category Client Message
/// @description Cross-platform message published when the app's state is paused by the device
///
/// ### mobile.pause Message
///
/// [Client-side message](@messaging) Cross-platform message published when the app's state is paused by the device
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.pause', function(data) {
///         // handle the event
///     });
///

/// @name mobile.resume
/// @category Client Message
/// @description Cross-platform message published when the app's state is resumed by the device
///
/// ### mobile.resume Message
///
/// [Client-side message](@messaging) Cross-platform message published when the app's state is resumed by the device
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.resume', function(data) {
///         // handle the event
///     });
///

define('controller', ['shell', 'transport', 'navigator', 'authentication', 'uilinks', 'messaging', 'environment', 'storage', 'postlisthandler', 'dataDetector', 'scrollfix'],
	function(Shell, transport, Navigator, Authenticator, uilinks, messaging, environment, storage, PostListHandler, DataDetector, scrollfix, $, global, undef)
{
	var messages = {
		contentRefreshing: 'mobile.content.refreshing',
		contentRefreshed: 'mobile.content.refreshed',
		contentLoading: 'mobile.content.loading',
		contentLoaded: 'mobile.content.loaded',
		contentRendered: 'mobile.content.rendered',
		navigationLoading: 'mobile.navigation.loading',
		navigationLoaded: 'mobile.navigation.loaded',
		navigationOpening: 'mobile.navigation.opening',
		navigationOpened: 'mobile.navigation.opened',
		navigationClosing: 'mobile.navigation.closing',
		navigationClosed: 'mobile.navigation.closed',
		navigationRendered: 'mobile.navigation.rendered',
		sheetOpening: 'mobile.sheet.opening',
		sheetOpened: 'mobile.sheet.opened',
		sheetClosing: 'mobile.sheet.closing',
		sheetClosed: 'mobile.sheet.closed',
		orientationChange: 'mobile.orientationchange',
		keyboardOpen: 'mobile.keyboard.open',
		keyboardClose: 'mobile.keyboard.close',
		keyboardOpened: 'mobile.keyboard.opened',
		keyboardClosed: 'mobile.keyboard.closed',
		online: 'mobile.online',
		offline: 'mobile.offline',
		start: 'mobile.start',
		pause: 'mobile.pause',
		resume: 'mobile.resume'
	};

	function captureElements(context) {
		context.gutterContent = $('#gutter-content');
		context.refreshIndicator = $('#refresh-indicator');
		context.refreshableContent = $('#refreshable-content');
		context.header = $('#header');
		context.content = $('#content');
		context.window = $(window);
		context.viewport = $('#viewport');
	}

	function showLoading(context) {
		context.shell.showLoading({
			cssClass: context.loadingCssClass,
			content: context.loadingContent,
			opacity: context.loadingOpacity
		});
	}

	function hideLoading(context) {
		context.postListHandler.clearHighlights();
		context.shell.hideLoading();
	}

	function buildShell(context) {
		context.refreshIndicatorPull = context.refreshIndicatorPull ||
			$('<span class="icon pull down-circled"></span>')
				.hide()
				.appendTo(context.refreshIndicator);
		context.refreshIndicatorPullVisible = false;
		context.refreshIndicatorRelease = context.refreshIndicatorRelease ||
			$('<span class="icon release cw"></span>')
				.hide()
				.appendTo(context.refreshIndicator);
		context.refreshIndicatorReleaseVisible = false;

		context.shell = new Shell({
			// animation settings
			easing: context.easing,
			navigationOpenPercent: context.navigationOpenPercent,
			navigationOpenDuration: context.navigationOpenDuration,
			navigationClosedOffsetPercent: context.navigationClosedOffsetPercent,
			navigationClosedZoom: context.navigationClosedZoom,
			// Sheet Settings
			sheetMaxHeightPerent: context.sheetMaxHeightPerent,
			sheetCssClass: context.sheetCssClass,
			sheetBackgroundColor: context.sheetBackgroundColor,
			sheetBackgroundOpacity: context.sheetBackgroundOpacity,
			// refresh settings
			refreshOverflow: context.refreshOverflow,
			refreshRevealThrottle: context.refreshRevealThrottle,

			doubleTapHeaderToScroll: context.doubleTapHeaderToScroll,
			enablePan: context.enablePan,
			header: context.header,
			viewport: context.viewport,
			gutter: '#gutter',
			content: context.content,
			contentWrapper: '#content-wrapper',
			gutterWrapper: '#gutter-wrapper',
			gutterContent: context.gutterContent,
			refreshIndicator: context.refreshIndicator,
			refreshableContent: context.refreshableContent,
			debugContainer: '#debug',
			onRefreshRevealStart: function() {
				context.refreshIndicatorPull.evolutionTransform({
					opacity: 0,
					duration: 20
				});
			},
			onRefreshRevealing: function(percent) {
				if(percent >= 1) {
					percent = 1;
					context.refreshIndicatorPull.addClass('ready');
				} else{
					context.refreshIndicatorPull.removeClass('ready');
				}
				if(context.refreshIndicatorReleaseVisible) {
					context.refreshIndicatorRelease.hide();
					context.refreshIndicatorReleaseVisible = false;
				}
				if(!context.refreshIndicatorPullVisible) {
					context.refreshIndicatorPull.show();
					context.refreshIndicatorPullVisible = true;
				}
				if(context.refreshIndicatorPullVisible) {
					percent = Math.round(percent * 100) / 100;
					if(context.lastRefreshOpacity == undef || context.lastRefreshOpacity != percent) {
						context.lastRefreshOpacity = percent;
						context.refreshIndicatorPull.evolutionTransform({
							rotate: (percent == 1 ? 180 : 0),
							opacity: percent
						}, {
							duration: context.refreshRevealThrottle
						});
					}
				}
			},
			onRefreshing: function(complete) {
				context.refreshing = true;
				messaging.publish(messages.contentRefreshing);
				// store ref to method to call when completed
				context.refreshIndicatorPull.hide();
				context.refreshIndicatorPullVisible = false;
				context.refreshIndicatorRelease.show();
				context.refreshIndicatorReleaseVisible = true;
				context.refreshComplete = function() {
					context.refreshIndicatorPull.hide();
					context.refreshIndicatorPullVisible = false;
					context.refreshIndicatorRelease.hide();
					context.refreshIndicatorReleaseVisible = false;
					scrollfix.isScrolling(false);
					complete();
					context.refreshing = false;
					messaging.publish(messages.contentRefreshed);
				}
				context.navigator.refresh(context.refreshParams);
			},
			onNavigationOpening: function() {
				messaging.publish(messages.navigationOpening);
			},
			onNavigationOpened: function() {
				messaging.publish(messages.navigationOpened);
			},
			onNavigationClosing: function() {
				messaging.publish(messages.navigationClosing);
			},
			onNavigationClosed: function() {
				messaging.publish(messages.navigationClosed);
			},
			onSheetOpening: function() {
				messaging.publish(messages.sheetOpening);
			},
			onSheetOpened: function() {
				messaging.publish(messages.sheetOpened);
			},
			onSheetClosing: function() {
				messaging.publish(messages.sheetClosing);
			},
			onSheetClosed: function() {
				messaging.publish(messages.sheetClosed);
			},
			onKeyboardOpening: function() {
				messaging.publish(messages.keyboardOpen);
			},
			onKeyboardClosing: function() {
				messaging.publish(messages.keyboardClose);
			},
			onKeyboardOpened: function() {
				messaging.publish(messages.keyboardOpened);
			},
			onKeyboardClosed: function() {
				messaging.publish(messages.keyboardClosed);
			}
		});
	}

	function getLastPausedTime() {
		var storedPause = storage.get('last_paused_at');
		if(storedPause) {
			return parseFloat(storedPause);
		} else {
			return new Date().getTime();
		}
	}

	function updateLastPausedTime(date) {
		storage.set('last_paused_at', (date || new Date()).getTime());
	}

	function handleAndRaiseDeviceMessages(context) {
		$(global).on('orientationchange', function(){
			messaging.publish(messages.orientationChange);
		})

		document.addEventListener('deviceready', function () {
			context.navigator.refresh(context.refreshParams);
			messaging.publish(messages.start);
		}, false);

		document.addEventListener('offline', function() {
			messaging.publish(messages.offline);
		}, false);

		document.addEventListener('online', function() {
			messaging.publish(messages.online);
		}, false);

		document.addEventListener('resume', function() {
			// refresh the current page if resuming after a while
			// don't refresh if quickly switching back and forth between apps
			var lastPausedAt = getLastPausedTime();
			if((new Date().getTime() - lastPausedAt) >= context.cacheDuration) {
				context.navigator.refresh(context.refreshParams);
			}
			messaging.publish(messages.resume);
		}, false);

		document.addEventListener('pause', function() {
			updateLastPausedTime(new Date());
			messaging.publish(messages.pause);
		}, false);
	}

	// prevents focusing on inputs in regions not shown
	function handleFocusPreventionWithinRegion(context) {

		context.shell.contentWrapper().on({
			focusin: function(e) {
				if(context.shell.navigationVisible()) {
					$(e.target).blur();
					context.shell.navigationContent().find('input,select,textarea').last().focus();
					return false;
				}
			}
		});

		context.shell.navigationContent().on({
			focusin: function(e) {
				if(!context.shell.navigationVisible()) {
					$(e.target).blur();
					context.shell.contentWrapper().find('input,select,textarea').first().focus();
					return false;
				}
			}
		});
	}

	function preventLabelFocusing(context) {
		if(!context.focusInputsOnLabelTap) {
			context.refreshableContent.on('tap', 'label', function(e){
				e.preventDefault();
				return false;
			});
		}
	}

	function handleHijackedLinkActivation(context, link, replace, e) {
		var href = link.attr('href') ||
			link.closest('[href]').attr('href');

		// don't block message links
		if(link.data('messagename')) {
			return true;
		}

		// ignore empty links
		var trimedHref = $.trim(href);
		if(trimedHref == '#') {
			return false;
		} else if (trimedHref.indexOf('http:') < 0 && trimedHref.indexOf('https:') < 0 && trimedHref.indexOf(':') >= 0) {
			window.location.href = trimedHref;
			return false;
		}

		e.stopPropagation();
		loadUrl(context, href, replace, false);

		return true;
	}

	function loadUrl(context, url, replace, refresh) {
		// specific links
		if(url.indexOf('#login') >= 0) {
			context.authenticator.login();
		} else if(url.indexOf('#logout') >= 0) {
			context.authenticator.logout();
		} else if(url.indexOf('#') === 0) {
			// anchor links
			context.shell.contentScrollTop($('a[name='+url.substr(1)+'],a[id='+url.substr(1)+']').first());
		// actual links
		} else {
			context.navigator.navigateTo(url, {
				replace: replace,
				refresh: refresh,
				currentContentScrollTop: context.shell.contentScrollTop()
			});
		}
	}

	function hijackLinks(context) {
		context.refreshableContent.on('click', 'a', function(e){
			e.preventDefault();
			if(scrollfix.isScrolling()) {
				return false;
			} else {
				return handleHijackedLinkActivation(context, $(e.target), false, e);
			}
		});
		context.gutterContent.on('click', 'a', function(e){
			e.preventDefault();
			context.shell.navigationVisible(false);
			return handleHijackedLinkActivation(context, $(e.target), true, e);
		});
		context.header.on('click', 'a', function(e){
			e.preventDefault();
			return handleHijackedLinkActivation(context, $(e.target), false, e);
		});
	}

	function showNavigationButtons(context) {
		if(context.enableSoftBackButton) {
			global.setTimeout(function(){
				// conditionally enable/disable menu/back buttons
				if(context.navigator.canNavigateBack()) {
					show(context.backButton);
					hide(context.menuButton);
					hide(context.closeKeyboardButton);
				} else {
					hide(context.backButton);
					hide(context.closeKeyboardButton);
					if(context.shell.navigable())
						show(context.menuButton);
				}
			}, 10)
		} else {
			hide(context.backButton);
			hide(context.closeKeyboardButton);
			if(context.shell.navigable())
				show(context.menuButton);
		}
	}

	function buildNavigator(context) {
		context.navigator = new Navigator({
			authenticator: context.authenticator,
			defaultUrl: context.defaultContentUrl,
			initFromStorage: environment.type == 'webapp',
			cacheDuration: context.cacheDuration,
			useDeviceBrowserForExternalUrls: context.isHttpAuth,
			onDetermineRedirect: function() {
				global.clearTimeout(context.hideLoadingIndicatorTimeout);
				showLoading(context);
			},
			onDeterminedRedirect: function() {
				// hide the loading indicator after a brief delay
				// to give the actual content load a chance to cancel this so that
				// it's loader shows
				global.clearTimeout(context.hideLoadingIndicatorTimeout);
				context.hideLoadingIndicatorTimeout = global.setTimeout(function(){
					global.clearTimeout(context.hideLoadingIndicatorTimeout);
					hideLoading(context);
				}, 100);
			},
			onLoad: function(url) {
				global.clearTimeout(context.contentRenderedMessageTimeout);
				// clear any current header button
				if(context.currentHeaderButton)
					hide(context.currentHeaderButton, true);
				// show modal loading indicator if not the resul tof refreshing
				if(!context.refreshing) {
					global.clearTimeout(context.hideLoadingIndicatorTimeout);
					showLoading(context);
				}
				context.shell.hideSheet();
				messaging.publish(messages.contentLoading, {
					url: url
				});
				return transport.load(url);
			},
			onLoadError: function() {
				hideLoading(context);
				context.shell.displayMessage('An error has occurred', {
					cssClass: 'warning',
					disappearAfter: 10 * 1000
				});
			},
			onLoadFromCache: function(url) {
				messaging.publish(messages.contentLoading, {
					url: url
				});
			},
			onNavigated: function(url, content, direction, scrollTop) {
				global.clearTimeout(context.contentRenderedMessageTimeout);

				// clear any current header button
				if(context.currentHeaderButton)
					hide(context.currentHeaderButton, true);
				context.shell.setClass();
				// clear any previously used refresh params
				context.refreshParams = null;
				// if this was from a refresh, tell the shell we're done
				if(context.refreshComplete) {
					context.refreshComplete();
					delete context.refreshComplete;
				}

				// figure out which way to display it
				var animation = 'dissolve';
				if(direction == 'forward')
					animation = 'left';
				else if(direction == 'back')
					animation = 'right';

				// display the content
				context.shell.setContent(content, {
					animate: animation
				}).then(function(){
					//context.shell.contentScrollTop(scrollTop || 0);
				})
				context.shell.contentScrollTop(scrollTop || 0);

				context.refreshing = false;
				hideLoading(context);

				// raise an event that the content has been loaded
				messaging.publish(messages.contentLoaded, {
					url: url
				});

				// raise an event that the content has been shown
				context.contentRenderedMessageTimeout = global.setTimeout(function(){
					global.clearTimeout(context.contentRenderedMessageTimeout);
					messaging.publish(messages.contentRendered, {
						url: url
					});
				}, context.navigationOpenDuration * 2);

				showNavigationButtons(context);
			}
		});
	}

	function buildAuthenticator(context, controllerInstance) {
		context.authenticator = new Authenticator({
			controller: controllerInstance,
			isNative: transport.isNative(),
			useDeviceBrowserForLogin: context.isHttpAuth
		});
	}

	// buttonElement: jQuery selection or DOM element
	// alignment: 'left' or 'right'
	function addHeaderButton(context, buttonElement, region, animate) {
		$(buttonElement)
			.addClass('header-button')
			.css({ opacity: (animate ? 0.01 : 1) })
			.appendTo(region == 'shell' ? context.headerShellArea : context.headerButtonArea);
		if(animate)
			show(buttonElement);
	}

	function hide(el, remove, animate) {
		if(!animate) {
			if(remove === true || remove === 'remove') {
				el.remove();
			} else if(remove === 'detach') {
				el.detach();
			} else {
				el.css({
					display: 'none'
				});
			}
		} else {
			el.evolutionTransform({
				opacity: 0.01
			}, {
				duration: 200,
				complete: function() {
					if(remove === true || remove === 'remove') {
						el.remove();
					} else if(remove === 'detach') {
						el.detach();
					} else {
						el.css({
							display: 'none'
						});
					}
				}
			});
		}
		return el;
	}

	function show(el) {
		el.css({
			opacity: 0.01,
			display: 'block'
		});
		el.evolutionTransform({
			opacity: 0.99
		}, { duration: 200 } );
		return el;
	}

	// add default set of toolbar buttons
	function addDefaultButtons(context) {
		var leftMostButtonStyle = { position: 'absolute', top: 0, left: 0 };
		context.menuButton = $('<span class="icon menu"></span>');
		context.backButton = $('<span class="icon left-open"></span>');
		context.closeKeyboardButton = $('<span class="icon down-open"></span>');

		// menu button to open/close the nav gutter
		context.menuButton.on('click', function(e){
			// mobile safari is slow to figure out that this tap was *not* a click to a div that gets
			// slid in underneath it so set a flag telling it to ignore
			if(context.shell.navigationVisible()) {
				clearTimeout(context.openTimeout);
				context.shell.navigationVisible(false);
				context.refreshIndicatorPull.show().hide();
			} else {
				if(environment.device == 'android') {
					context.openTimeout = global.setTimeout(function(){
						context.shell.navigationVisible(true);
						context.gutterContent.find('input,textarea').blur();
					}, 350);
				} else {
					context.shell.navigationVisible(true);
					context.gutterContent.find('input,textarea').blur();
				}
			}
		});

		context.closeKeyboardButton.on('tap', function(e){
			e.preventDefault();
			if(environment.device == 'android') {
				context.openTimeout = global.setTimeout(function(){
					$(document.activeElement).blur();
				}, 350);
			} else {
				$(document.activeElement).blur();
			}
			return false;
		});

		// nav back button
		context.backButton.on('click', function(e){
			context.navigator.navigateBack({
				currentContentScrollTop: context.shell.contentScrollTop()
			});
		});

		context.headerShellArea = $(document.createElement('div')).addClass('shell').appendTo(context.header);
		context.headerUserArea = $(document.createElement('div')).addClass('user').appendTo(context.header);
		context.headerButtonArea = $(document.createElement('div')).addClass('button').appendTo(context.header);

		if(context.enableRefreshButton) {
			context.refreshButton = $('<a href="#" class="refresh"><span class="icon cw"></span></a>');
			context.refreshButton.on('click', function(e){
				context.shell.refresh();
			});
			addHeaderButton(context, context.refreshButton, 'shell');
		}

		addHeaderButton(context, context.menuButton.hide(), 'shell', false);
		addHeaderButton(context, context.backButton.hide(), 'shell', false);
		addHeaderButton(context, context.closeKeyboardButton.hide(), 'shell', false);
	}

	function loadNav(context) {
		// only load navigation if authenticated, or anonymous allowed
		if(!$.telligent.evolution.user.accessing.isSystemAccount || context.allowAnonymous) {
			messaging.publish(messages.navigationLoading);
			transport.load(context.navigationContentUrl)
				.done(function(content) {
					// clear any navigation-scoped messaging subscriptions before changing navigation
					messaging.clear(messaging.NAVIGATION_SCOPE);
					context.gutterContent.empty().append(content);
					messaging.publish(messages.navigationLoaded);
					messaging.publish(messages.navigationRendered);
				});
		}
	}

	function reset(context, reloadWindow) {
		context.headerUserArea.empty();
		context.headerButtonArea.empty();
		storage.empty();

		if (reloadWindow === true) {
			global.location.reload();
		} else {
			context.navigator.reset();
			loadNav(context);
		}
	}

	function addRefreshParameter(context, key, value) {
		context.refreshParams = context.refreshParams || {};
		context.refreshParams[key] = value;
	}

	function handleHardwareBackButton(context) {
		document.addEventListener("backbutton", function () {
			// if navigation currently open, just close it
			if(context.shell.navigationVisible()) {
				context.shell.navigationVisible(false);
			} else {
			// otherwise navigate back
				context.navigator.navigateBack({
					currentContentScrollTop: context.shell.contentScrollTop()
				});
			}
		}, false);
	}

	function handlePostLists(context) {
		context.postListHandler = new PostListHandler({
			parent: $(context.content),
			highlightClassName: 'post-list-item-loading',
			onTap: function(url) {
				context.navigator.navigateTo(url, {
					currentContentScrollTop: context.shell.contentScrollTop()
				});
			}
		});
		context.postListHandler.handleTargetedTaps();
	}

	function refreshable(context, isRefreshable) {

		if(context.enableRefreshButton) {
			if (isRefreshable === true) {
				if(context.shell.navigable())
					show(context.refreshButton);
			} else if (isRefreshable === false) {
				hide(context.refreshButton);
			}
		}

		return context.shell.refreshable(isRefreshable);
	}

	function handleShowingKeyboardCloseButton(context) {
		// android already has os-level keyboard hiding/closing
		if(environment.device == 'android')
			return;
		messaging.subscribe(messages.keyboardOpen, messaging.GLOBAL_SCOPE, function(){
			hide(context.backButton);
			hide(context.menuButton);
			show(context.closeKeyboardButton);
		});
		messaging.subscribe(messages.keyboardClose, messaging.GLOBAL_SCOPE, function() {
			hide(context.closeKeyboardButton);
			showNavigationButtons(context);
		});
	}

	// parses a URL passed via scheme handler into a path string and data object
	function parsePathAndDataFromSchemeUrl(url) {
		var context = {};

		// parse path
		context.path = url.substr(url.indexOf('://') + 3);
		if (context.path.indexOf('?') > -1) {
			context.path = context.path.substr(0, context.path.indexOf('?'));
		}

		// parse data
		var keyValues = url.substr(url.indexOf('?') + 1).split('&');
		context.data = {};
		for (var i = 0; i < keyValues.length; i++) {
			var keyAndValue = keyValues[i].split('=');
			if (keyAndValue.length == 2) {
				var key = decodeURIComponent(keyAndValue[0]);
				var value = decodeURIComponent(keyAndValue[1]);
				context.data[key] = value;
			}
		}

		return context;
	}

	function handleSchemeBasedRequests(context, routes) {
		// define the handler called by PhoneGap when opened via custom scheme
		global.handleOpenURLInternal = function(url) {
			global.setTimeout(function() {
				var req = parsePathAndDataFromSchemeUrl(url);

				if(routes[req.path] !== undef) {
					routes[req.path](req.data);
				}
			}, 1);
		};
	}

	function registerSchemeBasedRoutes(context) {
		handleSchemeBasedRequests(context, {
			auth: function(data) {
				context.authenticator.handleLoginLogout(data);
			},
			redirect: function(data) {
				transport.adjustUrl(data.url).done(function(adjusted){
					if(adjusted && adjusted.redirectUrl) {
						context.navigator.navigateTo(adjusted.redirectUrl, {
							currentContentScrollTop: context.shell.contentScrollTop(),
							refresh: true
						});
					}
				});
			}
		});
	}

	var defaults = {
		allowAnonymous: false,
		isHttpAuth: false,

		defaultContentUrl: 'default',
		navigationContentUrl: 'navigation',
		// shell settings
		enableRefreshButton: false,
		enablePan: true,
		enableSoftBackButton: true,
		doubleTapHeaderToScroll: true,
		focusInputsOnLabelTap: false,
		// loading overlay settings
		loadingCssClass: 'loading',
		loadingContent: '<span class="icon cw"></span>',
		loadingOpacity: 0.7,
		// animation settings
		easing: 'cubic-bezier(0.160, 0.060, 0.450, 0.940)',
		navigationOpenPercent: 0.8,
		navigationOpenDuration: 275,
		navigationClosedOffsetPercent: -0.2,
		navigationClosedZoom: 0.00,
		// Sheet Settings
		sheetMaxHeightPerent: 0.7,
		sheetCssClass: 'sheet',
		sheetBackgroundColor: '#333',
		sheetBackgroundOpacity: 0.7,
		// pull to refresh options
		refreshOverflow: 10,
		refreshRevealThrottle: 200,
		// cache duration
		cacheDuration: 10 * 60 * 1000, // 10 minutes

		telephonePattern: null
	};

	var Controller = function(options) {
		var context = $.extend({}, defaults, options || {});

		var api = {
			refreshable: function(isRefreshable) {
				return refreshable(context, isRefreshable);
			},
			navigable: function(isNavigable) {
				if(isNavigable !== undef) {
					if(isNavigable) {
						showNavigationButtons(context);
					} else {
						hide(context.menuButton);
						if(context.refreshButton)
							hide(context.refreshButton);
					}
				}
				return context.shell.navigable(isNavigable)
			},
			load: function(url, options) {
				loadUrl(context, url, options && options.replace, options && options.refresh);
			},
			refresh: function() {
				context.navigator.refresh(context.refreshParams);
			},
			back: function(refresh) {
				context.navigator.navigateBack({
					currentContentScrollTop: context.shell.contentScrollTop(),
					refresh: refresh
				});
			},
			navigationVisible: function(isVisible) {
				return context.shell.navigationVisible(isVisible);
			},
			navigationScrollTop: function(to) {
				return context.shell.navigationScrollTop(to);
			},
			contentScrollTop: function(to) {
				return context.shell.contentScrollTop(to);
			},
			displayMessage: function(message, options) {
				context.shell.displayMessage(message, options);
			},
			alert: function(message, callback) {
				context.shell.alert(message, callback);
			},
			confirm: function(message, callback) {
				context.shell.confirm(message, callback);
			},
			setHeaderButton: function(buttonElement) {
				if(context.currentHeaderButton)
					hide(context.currentHeaderButton, 'detach', true);
				addHeaderButton(context, buttonElement, 'button', true);
				context.currentHeaderButton = buttonElement;
			},
			setHeaderContent: function(content) {
				context.headerUserArea.empty().append(content);
			},
			refreshNavigation: function() {
				loadNav(context);
			},
			debug: function(message) {
				context.shell.debug(message);
			},
			reset: function(reloadWindow) {
				reset(context, reloadWindow);
			},
			addRefreshParameter: function(key, value) {
				addRefreshParameter(context, key, value);
			},
			displaySheet: function(options) {
				context.shell.displaySheet(options);
			},
			hideSheet: function() {
				context.shell.hideSheet();
			},
			scrollable: function(options){
				context.shell.scrollable(options);
			},
			clearContent: function(url){
				context.navigator.clearContent(url);
			},
			excludeFromHistory: function() {
				context.navigator.excludeFromHistory();
			},
			setExpiration: function(date, url) {
				context.navigator.setExpiration(date, url);
			},
			setClass: function(className) {
				context.shell.setClass(className);
			},
			showLoading: function(promise) {
				if(promise) {
					if(promise.state() == 'pending') {
						showLoading(context);
						promise.then(function(){
							hideLoading(context);
						});
					}
					return promise;
				} else {
					showLoading(context);
				}
			},
			hideLoading: function() {
				hideLoading(context);
			},
			detectData: function(value) {
				if(!context.dataDetector) {
					context.dataDetector = new DataDetector({
						patterns: {
							telephone: context.telephonePattern
						}
					});
				}
				return context.dataDetector.detect(value);
			}
		};

		captureElements(context);
		buildShell(context);
		handlePostLists(context);
		addDefaultButtons(context);
		buildAuthenticator(context, api);
		buildNavigator(context);
		loadNav(context);
		hijackLinks(context);
		preventLabelFocusing(context);
		handleAndRaiseDeviceMessages(context);
		handleHardwareBackButton(context);
		handleFocusPreventionWithinRegion(context);
		registerSchemeBasedRoutes(context);
		handleShowingKeyboardCloseButton(context);
		scrollfix.monitorEffectiveScrollState(context.content);

		messaging.subscribe('mobile.content.loading', messaging.GLOBAL_SCOPE, function() {
			refreshable(context, true);
		});

		return api;
	}
	Controller.defaults = defaults;

	return Controller;

}, jQuery, window);
 
 
/*
 * DataDetector
 * Internal API
 *
 * Not exposed publicly, directly
 *
 * Use:
 *
 * var detector = new DataDetector(options);
 *
 * options:
 *
 *   patterns: object of name/regex pattern
 *
 * Methods:
 *
 *   var transformed = detector.detect(html)
 *
 * Adjusts text in raw html to be converted to support rich interactions on devices, such as phone number texts transformed to telephone links.
 *
 * Currently supported patterns: 'telephone'
 *
 */
define('dataDetector', function($, global, undef) {

	function encode(val) {
		return $('<div/>').text(val || '').html();
	}

	function getTextNodes(el, parentFilter) {
		return $(el).find(":not(iframe)").addBack().contents().filter(function() {
			return this.nodeType == 3 && $(this).closest(parentFilter).length == 0;
		});
	}

	function buildNode(text) {
		return $('<div></div>').append(text);
	}

	function getText( obj ) {
		return obj.textContent ? obj.textContent : obj.innerText;
	}

	function transformHtmlTextNodes(value, excludedParents, convertor) {
		var node = buildNode(value);
		getTextNodes(node, excludedParents).each(function() {
			$(this).replaceWith(convertor(getText(this)));
		});
		return node.html();
	}

	var rRonNumbers = /[^\d]+/ig;
	var handlers = {
		telephone: function(match) {
			return (' <a href="tel:' + $.trim(encode(match.replace(rRonNumbers, ''))) + '">' + $.trim(encode(match)) + '</a> ');
		}
	};

	function DataDetector(options){
		var context = $.extend({}, DataDetector.defaults, options || {});
		context.patterns = $.extend({}, DataDetector.defaults.patterns, (options != null ? (options.patterns || {}) : {}));
		$.each(context.patterns, function(name, pattern) {
			context.patterns[name] = new RegExp(pattern, 'gi');
		});

		return {
			detect: function(html) {
				return transformHtmlTextNodes(html, 'a,script,style,textarea', function(value){
					var transformedTextNodeValue = value;
					$.each(handlers, function(name, handler) {
						if(context.patterns[name]) {
							transformedTextNodeValue = transformedTextNodeValue.replace(context.patterns[name], handler);
						}
					});
					return transformedTextNodeValue;
				});
			}
		};
	}
	DataDetector.defaults = {
		patterns: {
			telephone: "(?:(?:\\(?(?:00|\\+)?(?:[1-4]\\d\\d|[1-9]\\d?)\\)?)?[\\-\\.\\s\\\\\\/]?)?(?:(?:\\(?\\d{3,}\\)?[\\-\\.\\s\\\\\\/]?){2,})"
		}
	};

	return DataDetector;

}, jQuery, window); 
 
/*
 * DynamicLinks
 * Internal API
 *
 * Accepts a set of links within a container with given boundaries
 * and decides to render them as a slider (tray) or to expand them with a 'more' link
 *
 * Not exposed publicly, but used as the mobile implementation for the ui-links UI Component
 *
 * var dynamicLinks = new DynamicLinks(options)
 *
 * options:
 *   minLinks: 50  // minimum required to be visible (will make it scrollable to that limit)
 *   maxLinks: 50  // maximum before it shows a show-more link
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
 */
define('dynamicLinks', ['scrollfix', 'actionSheet'], function(scrollFix, ActionSheet, $, global, undef) {

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
			'float': 'left',
			'white-space': 'nowrap'
		};

	function getFullWidth(el) {
		return (el.outerWidth(true) + parseInt(el.css('marginLeft'), 10) + parseInt(el.css('marginRight'), 10));
	}

	function setupContainer(context) {
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

	function processLinks(context) {
		context.additionalLinks = [];
		context.accumulatedWidth = 0;
		context.preScrollTo = 0;

		context.moreLinkWidth = 0;
		if(context.moreLink != undef) {
			context.moreLink.element.css(linkStyle);
			context.list.append(context.moreLink.element);
			context.moreLinkWidth = getFullWidth(context.moreLink.element);
			context.moreLink.element.detach();
		}

		for(var i = 0; i < context.links.length; i++) {
			var link = context.links[i],
				listItem = $(document.createElement('li')).append(link.element);
			listItem.css({ display: 'inline' }).addClass(link.className);
			// add link to list so it can be measured, and then measure it
			listItem.appendTo(context.list);
			link.element.css(linkStyle);
			var linkWidth = getFullWidth(link.element);

			// if selected, capture current width to know where to scroll to after
			if(link.selected)
				context.preScrollTo = context.accumulatedWidth;

			// contiue to accumulate width if it's still under the min links length and this would otherwise be wider than the container
			if(context.accumulatedWidth + linkWidth > context.parentWidth && (i + 1) <= context.minLinks) {
				context.accumulatedWidth += linkWidth;
			// add the link to the additional links and remove it from display if this would be wider than the container and defined to do so
			} else if(
				context.additionalLinks.length > 0 ||
				(
					(
						(context.accumulatedWidth + linkWidth + context.moreLinkWidth > context.parentWidth) ||
						((i + 1) > context.maxLinks)
					)
					&& (i + 1) > context.minLinks
				)
			){
				listItem.detach();
				context.additionalLinks.push(link);
			// otherwise, continue to just add to the container
			} else {
				context.accumulatedWidth += linkWidth;
			}
		}
	}

	function finalizeContainer(context) {
		if(context.additionalLinks.length > 0 && context.moreLink && context.onShowMore) {
			$(document.createElement('li')).css({ display: 'inline' }).append(context.moreLink.element).addClass(context.moreLink.className).appendTo(context.list);
			context.accumulatedWidth += context.moreLinkWidth;
			context.moreLink.element.off(moreEventNameSpace).on('click' + moreEventNameSpace, function(e) {
				context.onShowMore(context.additionalLinks, context.cancelLink);
				return false;
			});
		}

		var isClipped = context.accumulatedWidth > context.parentWidth;

		// apply total width to list so that it will scroll horizontally
		context.list.css({
			'width': (isClipped ? context.accumulatedWidth : context.parentWidth),
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
		// animate horizontally scrolled links when they first appear
		if(isClipped && context.animate) {
			$(context.listWrapper.get(0))
				.evolutionTransform({ left: 100, opacity: 0 }, { duration: 0 })
				.evolutionTransform({ left: 0, opacity: 1 }, { duration: 400, easing: 'cubic-bezier(0.250, 0.460, 0.450, 0.940)' });
		}
		// monitor horizontal scroll state to enable links to still be clicked after an inertial scroll, and not on an inertial scroll interruption.
		scrollFix.monitorEffectiveScrollState(context.list);
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
			}
		}
	};
	DynamicLinks.defaults = {
		preScrollOffset: 10,
		minLinks: 0,
		maxLinks: 50,
		parent: null,
		animate: false,
		links: [],
		moreLink: null,
		cancelLink: null,
		onShowMore: function(links, cancelLink) { }
	}
	return DynamicLinks;

}, jQuery, window); 
 
/*
 * Environment Information
 * Internal API
 *
 * Exposes information about the host environment
 *
 * environment.device  ios|android|windows|unknown
 * environment.type  browser|webapp|native|unknown
 */

/// @name environment
/// @category JavaScript API Module
/// @description Environment details
///
/// ### jQuery.telligent.evolution.mobile.environment
///
/// This module provides data about the host device.
///
/// ### Methods
///
/// #### isOnline
///
/// Returns whether the app is currently online
///
///     $.telligent.evolution.mobile.environment.isOnline()
///
/// ### Properties
///
/// #### device
///
/// Device type: `ios`, `android`, `windows`, or `unknown`
///
///     $.telligent.evolution.mobile.environment.device
///
/// #### type
///
/// Environment type: `browser`, `webapp` (iOS homescreen web page), `native`, or `unknown`
///
///     $.telligent.evolution.mobile.environment.type
///

define('environment', ['messaging'], function(messaging, global, undef) {

	var unknown = 'unknown',
		windows = 'windows',
		ios = 'ios',
		android = 'android',
		browser = 'browser',
		webapp = 'webapp',
		_native = 'native',
		type = unknown,
		manuallyTrackedFallbackOnlineState = true,
		device = unknown;

	function isOnline() {
		// if native (Connection is provided by Cordova)
		if(navigator && navigator.connection && navigator.connection.type && global.Connection !== undef) {
			return navigator.connection.type != global.Connection.NONE;
		} else if(navigator.onLine !== undef) {
			return navigator.onLine;
		} else {
			return manuallyTrackedFallbackOnlineState;
		}
	}

	// native
	if(global.mobileNativeConfig) {
		type = _native;

		// device
		var deviceIdentifier = (global.device.platform || '').toLowerCase();
		switch(deviceIdentifier) {
			case 'iphone':
			case 'ios':
				device = ios;
				break;
			case 'android':
				device = android;
				break;
			case 'windows':
				device = windows;
				break;
			default:
				device = unknown;
		}
	} else {
		// web
		if(global.navigator.standalone) {
			type = webapp;
		} else {
			type = browser;
		}

		// device
		if(navigator.userAgent.match(/Android/i)) {
			device = android;
		} else if(navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
			device = ios;
		} else if(navigator.userAgent.match(/IEMobile/i)) {
			device = windows;
		} else {
			device = unknown;
		}
	}

	// manually track online/offline events to change the fallback state
	messaging.subscribe('mobile.online', messaging.GLOBAL_SCOPE, function(){
		manuallyTrackedFallbackOnlineState = true;
	});
	messaging.subscribe('mobile.offline', messaging.GLOBAL_SCOPE, function(){
		manuallyTrackedFallbackOnlineState = false;
	});

	var environment = {
		type: type,
		device: device,
		isOnline: isOnline
	};

	return environment;

}, window); 
 
/*
 * Mobile-specific override of evolutionTransform
 * Adds the ability to accept an onComplete callback.
 * This should ideally be ported back to core
 */

/// @name evolutionTransform
/// @category jQuery Plugin
/// @description Performs CSS-based transforms and transitions
///
/// ### jQuery.fn.evolutionTransform
///
/// This plugin performs a CSS-based transforms and transitions on an element, optionally with animation. Uses GPU acceleration where available. Falls back to immediately-applied CSS when not available.
///
/// This is a mobile-specific override of the platform-defined version, adding support for the `complete` callback.
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
///  * `rotate`: z rotation
///  * `rotateX`: x rotation
///  * `rotateY`: y rotation
///  * `scale`: zoom scale
///  * `opacity`: opacity
///  * `complete`: function called when transition completes
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

define('evolutionTransform', function($, global, undef) {

	// non-transition fallback detction and support
	function detectTransitionSupport() {
		var bodyStyle = (document.body || document.documentElement).style,
			vendors = ['Moz', 'webkit', 'Webkit', 'Khtml', 'O', 'ms'];

		if(typeof bodyStyle['transition'] == 'string')
			return true;

		for(var i=0; i<vendors.length; i++) {
			if(typeof bodyStyle[vendors[i] + 'Transition'] == 'string')
				return true;
		}
		return false;
	}

	function applyStyle(elm, name, value) {
		elm.style[name] = value;
	}

	// native support

	var x = 'x',
		y = 'y',
		left = 'left',
		top = 'top',
		rotate = 'rotate',
		rotateX = 'rotateX',
		rotateY = 'rotateY',
		scale = 'scale',
		opacity = 'opacity',
		undef,
		body,
		supportsCssTransition = null,
		vendorPrefix = (function () {
			if(!('getComputedStyle' in window))
				return '';
			var styles = window.getComputedStyle(document.documentElement, ''),
				pre = (Array.prototype.slice.call(styles).join('')
					.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1];
			return '-' + pre + '-';
		}());

	function transform(transforms, options) {
		if(!this || this.length == 0)
			return this;

		var settings = transforms || {},
			options = options || {},
			props = [],
			transX,
			transY,
			transRot = null,
			transRotX = null,
			transRotY = null,
			transScale = null,
			transforms = [];

		if(supportsCssTransition === null)
			supportsCssTransition = detectTransitionSupport();

		this.each(function(){
			if(this.nodeType === 3)
				return

			var elm = this,
				$elm = $(elm);

			$elm.off('.evolutionTransform');
			if(options.complete) {
				$elm.on('transitionend.evolutionTransform', options.complete);
				$elm.on('webkitTransitionEnd.evolutionTransform', options.complete);
				$elm.on('oTransitionEnd.evolutionTransform', options.complete);
				$elm.on('MSTransitionEnd.evolutionTransform', options.complete);
			}

			if(!supportsCssTransition) {
				if(settings.x)
					settings['left'] = settings.x;
				if(settings.y)
					settings['y'] = settings.y;
				return $elm.css(settings);
			}

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
				} else if(key === rotate) {
					transRot = val;
					delete settings[key];
				} else if(key === rotateX) {
					transRotX = val;
					delete settings[key];
				} else if(key === rotateY) {
					transRotY = val;
					delete settings[key];
				} else if(key === scale) {
					transScale = val;
					delete settings[key];
				} else if(key == opacity) {
					if(val === 0) {
						settings[key] = 0.00001;
					} else if(val === 1) {
						settings[key] = 0.99999;
					}
					props[props.length] = key;
				} else {
					// change int (n) values to Npx
					if(typeof val === 'number' && val % 1 == 0) {
						settings[key] = (val + 'px');
					}
					props[props.length] = key;
				}
			}

			if(transX != undef || transY != undef) {
				transforms[transforms.length] = ('translate3d(' + (transX || 0) + 'px, ' + (transY || 0) + 'px, 0px)');
			}

			if(transRot != undef) {
				transforms[transforms.length] = ('rotateZ(' + transRot + 'deg)');
			}

			if(transRotX != undef) {
				transforms[transforms.length] = ('rotateX(' + transRotX + 'deg)');
			}

			if(transRotY != undef) {
				transforms[transforms.length] = ('rotateY(' + transRotY + 'deg)');
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

			// if rotating 3d, make sure there's a perspective on the body
			if(transRotY || transRotX) {
				body = body || $('body').get(0);
				body.style[vendorPrefix + 'perspective'] = options.perspective;
				body.style['perspective'] = options.perspective;
			}
			applyStyle(elm, vendorPrefix + 'transition', transition);
			applyStyle(elm, 'transition', transition);
			for(var key in settings) {
				applyStyle(elm, key, settings[key]);
			}
		});

		return this;
	};
	transform.defaults = {
		duration: 0,
		easing: 'linear',
		perspective: 250,
		complete: null
	};

	$.fn.evolutionTransform = transform;
	$.fn.evolutionTransform.animationEnabled = true;

	return {};

}, jQuery, window); 
 
/*
 * Mobile-friendly override of $.fn.evolutionResize
 * Doesn't support overrides or max-height.
 */
define('evolutionResize', function($, global, undef){

	var win = $(global);
	var resize = function(context) {
			var maxHeight = win.height() * context.maxHeightPercent;
			var scrolls = false;
			context.area.css({ height: 'auto' });

			var newHeight = context.area.prop('scrollHeight');
			if(newHeight > maxHeight) {
				scrolls = true;
				newHeight = maxHeight;
			}

			context.area.css({ height: newHeight });

			newHeight = context.area.outerHeight();
			if(newHeight !== context.oldHeight) {
				context.area.css({ overflow: (scrolls ? 'auto': 'hidden') });
				context.area.trigger('evolutionResize', { newHeight: newHeight, oldHeight: context.oldHeight });
				context.oldHeight = newHeight;
			}
		};

	$.fn.evolutionResize = function(options) {
		var settings = $.extend({}, $.fn.evolutionResize.defaults, options || {});
		return this.filter('textarea').each(function(){
			var area = $(this)
					.css({ width: '100%', resize: 'none', overflow: 'hidden' });
			var originalHeight = area.height();
			var context = {
					area: area,
					oldHeight: area.height(),
					maxHeightPercent: settings.maxHeightPercent
				};
			setTimeout(function(){
				resize(context);
				area.bind('input', function(){ resize(context); });
			}, 500);
		});
	};
	$.fn.evolutionResize.defaults = {
		maxLength: 250,
		maxHeightPercent: .25
	};

	return {};

}, jQuery, window);
 
 
/// @name glowUpload
/// @category jQuery Plugin
/// @description Renders a single file upload form supporting chunked uploads with a visual progress bar
///
/// ### jQuery.fn.glowUpload
///
/// Renders a single file upload form supporting chunked uploads
///
/// Mobile override of the platform-defined `glowUpload`
///
/// ### Usage
///
///     $('SELECTOR').glowUpload(options)
///
/// where 'SELECTOR' is a div element containing file input
///
/// ### Options
///
///  * `takePhotoOrVideoText`: (string) *default*: 'Take a photo'
///  * `chooseExistingText`: (string) *default*: 'Choose existing'
///  * `cancelText`: (string) *default*: 'Cancel'
///
/// ### Methods
///
/// #### val
///
/// Returns the file name of the uploaded file
///
///     var fileName = $('SELECTOR').glowUpload('val');
///
define('glowUpload', ['environment'],
function(environment, $, global, undef) {
	if (environment.type != 'native' || !global.navigator.camera || !global.FileTransfer) {
		return;
	}

    // public api
    var api = {
        val: function() {
            var context = $(this).data(_dataKey);
            if(context !== null && typeof context.file !== 'undefined' && context.file !== null) {
                return { name: context.file.name };
            } else {
                return null;
            }
        }
    };

    // private methods
    var _dataKey = '_glowUpload',
        _eventNames = {
            begun: 'glowUploadBegun',
            complete: 'glowUploadComplete',
            error: 'glowUploadError',
            progress: 'glowUploadFileProgress'
        },
        _init = function(options) {
            return this.each(function()
            {
                var elm = $(this);

                var context = $.extend({}, $.fn.glowUpload.defaults, options || {}, {
                    file: null,
                    fileOffset: 0,
                    fileState: '',
                    isUploading: false,
                    currentUploadPercent: 0,
                    fileContainer: null
                });

                $.extend(context, {
                    container: elm,
                    initialized: false
                });

                $(this).data(_dataKey, context);

                context.container.find('input[type="file"]')
                .bind('change', function(){
                    _inputChange(context);
                }).hide();

				if (context.renderMode != 'link' && context.renderMode != 'dragdrop') {
	            	$('<div></div>')
	                .css({
	                    fontSize: '11px',
	                    borderWidth: '1px',
	                    borderStyle: 'solid',
	                    borderColor: '#999',
	                    width: context.width,
	                    overflow: 'auto',
	                    overflowX: 'hidden',
	                    backgroundColor: '#eee',
	                    textAlign: 'center',
	                    padding: '.25em'
	                })
	                .append($('<input type="Button" value="Loading..." />')
	                	.attr('disabled','disabled')
	                	.css({
	                		borderColor: 'Transparent',
	                		backgroundColor: 'Transparent'
	                	})
	                )
	                .appendTo(context.container)
		        }

                _determineUploadSpeed(context);
            });
        },
        _determineUploadSpeed = function(context) {
        	var testStrings = ["1234567890", "0987654321", "0192837465", "5647382910"];
        	var testData = [];
        	for (var i = 0; i < 2500; i++) { testData[testData.length] = testStrings[Math.floor((Math.random()*testStrings.length))]; }
        	var startMs = (new Date()).getTime();

        	jQuery.ajax({
        		type: 'POST',
        		url: context.uploadUrl,
        		data: {
        			test: testData.join('')
        		},
        		success: function() {
        			var endMs = (new Date()).getTime();
       				_initialize(context, ((25000 * 8) / ((endMs - startMs) / 1000)) * 45);
        		},
        		error: function() {
        			// test failed: default to max upload of 1mb
       				_initialize(context, 1000000);
        		}
        	});
        },
        _initialize = function(context, maxUploadSpeed) {
        	var browseButton = null;

        	var chunkSize = '15000000';
            if (maxUploadSpeed < 15000000)
            {
            	chunkSize = Math.floor(maxUploadSpeed);
            	if (chunkSize < 100000)
            	{
            		chunkSize = 100000
            	}
            }

            // remove the non-plupload control
            if (context.renderMode != 'link' && context.renderMode != 'dragdrop') {
            	context.container.children().remove();

            	context.container.addClass('glow-upload');

	            var innerContainer = $('<div></div>')
	                .css({
	                    fontSize: '11px',
	                    borderWidth: '1px',
	                    borderStyle: 'solid',
	                    borderColor: '#999',
	                    width: context.width,
	                    overflow: 'auto',
	                    overflowX: 'hidden',
	                    backgroundColor: '#fff'
	                })
	                .appendTo(context.container);

	            var table = $('<table></table>')
	                .attr('border', 0)
	                .attr('cellSpacing', 0)
	                .attr('cellPadding', 0)
	                .css({
	                    width: '100%'
	                });

	            var tbody = $('<tbody></tbody>')
	                .appendTo(table);

	            var tr = $('<tr></tr>')
	                .appendTo(tbody);

	            context.fileContainer = $('<td></td>')
	                .appendTo(tr)
	                .css({ width: '100%' });

	            var td = $('<td></td>')
	                .css({
	                    backgroundColor: '#eee',
	                    borderLeftWidth: '1px',
	                    borderLeftStyle: 'solid',
	                    borderLeftColor: '#999',
	                    padding: '.25em'
	                })
	                .attr('vAlign', 'top')
	                .appendTo(tr);

	            browseButton = $('<input type="Button" value="' + context.selectFileLabel + '" id="' + context.container.attr('id') + '_browseButton" />')
	                .appendTo(td);

	            innerContainer.append(table);

	            _updateFileUi(context);

	            context.pluploader.settings.browse_button = context.container.attr('id') + '_browseButton';
            } else if (context.renderMode == 'link') {
            	browseButton = $('#' + context.container.attr('id'));
            } else {
            	var button = $('<div></div>').css({
            		position: 'absolute',
            		left: '-10000px',
            		top: '-10000px',
            		height: '1px',
            		width: '1px',
            		overflow: 'hidden'
            	}).attr('id', context.container.attr('id') + '_browseButton');
            	context.container.append(button);

            	browseButton = $('#' + button.attr('id'));
            }

            browseButton.on('click', function(e) {
            	e.stopPropagation();
            	e.preventDefault();

            	var cameraLink = $('<a href="#" class="link"></a>').text(context.takePhotoOrVideoText);
            	cameraLink.on('click', function() {
            		e.stopPropagation();
            		e.preventDefault();
            		$.telligent.evolution.mobile.hideSheet();
            		global.navigator.camera.getPicture(
	            		function(imageUri) {
	            			setTimeout(function() {
		            			_selectFileByUri(context, imageUri, chunkSize);
							}, 9);
	            		},
	            		function(errorMessage) {
	            			setTimeout(function() {
	            				_error(context, { message: errorMessage, id: -1 });
	            			}, 9);
	            		},
	            		{
	            			destinationType: Camera.DestinationType.FILE_URI,
	            			sourceType: Camera.PictureSourceType.CAMERA,
	            			quality: 85,
	            			encodingType: Camera.EncodingType.JPEG
	            		}
	            	);
	            	return false;
            	});

            	var galleryLink = $('<a href="#" class="link"></a>').text(context.chooseExistingText);
            	galleryLink.on('click', function() {
            		e.stopPropagation();
            		e.preventDefault();
            		$.telligent.evolution.mobile.hideSheet();
            		global.navigator.camera.getPicture(
	            		function(imageUri) {
	            			setTimeout(function() {
		            			_selectFileByUri(context, imageUri, chunkSize);
							}, 9);
	            		},
	            		function(errorMessage) {
	            			setTimeout(function() {
	            				_error(context, { message: errorMessage, id: -1 });
	            			}, 9);
	            		},
	            		{
	            			destinationType: Camera.DestinationType.FILE_URI,
	            			sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
	            			quality: 85,
	            			encodingType: Camera.EncodingType.JPEG
	            		}
	            	);
	            	return false;
            	});

            	var cancelLink = $('<a href="#" class="action-cancel"></a>').text(context.cancelText);
            	cancelLink.on('click', function() {
            		$.telligent.evolution.mobile.hideSheet();
            	});

            	$.telligent.evolution.mobile.displaySheet({
					links: [
						cameraLink,
            			galleryLink,
            			cancelLink
					]
				});

            	return false;
            });

            context.initialized = true;
        },
        _selectFileByUri = function(context, fileUri, chunkSize) {
        	var error = function() {
            	context.isUploading = false;
        		context.fileState = 'error';
        		_updateFileUi(context);
        		global.navigator.camera.cleanup(function() { }, function() { });
				context.container.trigger('glowUploadError');
            };

            var uploadFile = function(fileEntry) {
    			context.file = {
    				name: fileName
    			};
    			context.fileState = '';
    			_updateFileUi(context);

    			if (!context.isUploading)
                {
                    var execEvent = !context.isUploading;
                    context.isUploading = true;
                    context.currentUploadPercent = 0;
                    _updateFileUi(context);
                    if (execEvent) {
                        context.container.trigger(_eventNames.begun);
                    }
                }

    			fileEntry.file(function(file) {
    				var chunk = -1;
    				var chunks = Math.ceil(file.size / chunkSize);

    				var uploadNext = function() {
    					chunk++;
    					if (chunk >= chunks) {
    						context.isUploading = false;
		            		context.fileState = 'uploaded';
		            		_updateFileUi(context);
		            		global.navigator.camera.cleanup(function() { }, function() { });
		            		context.container.trigger(_eventNames.complete, { name: fileName });
		            		return;
    					}

    					var chunkFile = file.slice(Math.floor(chunk * chunkSize), Math.min(Math.floor((chunk + 1) * chunkSize), file.size));

    					global.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function(fileSystem) {
    						fileSystem.root.getFile('zimbra-' + chunk + '.chunk', { create: true, exclusive: false }, function(chunkTempFile) {
    							var reader = new FileReader();
    							reader.onloadend = function(readEvent) {
        							chunkTempFile.createWriter(function(chunkTempWriter) {
        								chunkTempWriter.onwriteend = function() {
        									var chunkTransfer = new FileTransfer();
            								var immediateProgress = 0;
            								chunkTransfer.onprogress = function(progressEvent) {
            									if (progressEvent.lengthComputable) {
            										immediateProgress = progressEvent.loaded / progressEvent.total;
            									} else {
            										immediateProgress += .01;
            										if (immediateProgress > 1) {
            											immediateProgress = 1;
            										}
            									}

            									try {
        											context.currentUploadPercent = Math.round(((chunk / chunks) + (immediateProgress / chunks)) * 100);
									                _updateFileUi(context);
									                context.container.trigger(_eventNames.progress, { name: fileName, percent: context.currentUploadPercent });
        										} catch (err) {
        										}
            								};

            								chunkTransfer.upload(
            									chunkTempFile.toURL(),
            									context.uploadUrl,
            									function() {
            										context.currentUploadPercent = Math.round(((chunk + 1) / chunks) * 100);
            										chunkTempFile.remove(null, null);
		            								global.setTimeout(function() { uploadNext(); }, 9);
									                _updateFileUi(context);
									                context.container.trigger(_eventNames.progress, { name: fileName, percent: context.currentUploadPercent });
            									},
            									function() {
            										chunkTempFile.remove(null, null);
            										error();
            									},
            									{
            										fileKey: 'file',
            										fileName: fileName,
            										params: {
            											name: fileName,
            											chunk: chunk,
            											chunks: chunks
            										},
            										chunkedMode: false
            									});
        								};
        								chunkTempWriter.write(readEvent.target.result);
        							}, function() {
        								chunkTempFile.remove(null, null);
        								error();
        							});
        						};
        						reader.readAsArrayBuffer(chunkFile);
    						}, error);
    					}, error);
    				}

    				uploadNext();
		    	}, error);
            }

            var fileName = 'image' + (new Date()).getTime() + '.jpg';

            if (fileUri.indexOf('file://') == 0) {
            	// resolve the local file
            	global.resolveLocalFileSystemURI(fileUri,
					uploadFile,
			    	error
			    	);
            } else {
            	// attempt to download the file first
            	global.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function(fileSystem) {
            		fileSystem.root.getFile(
            			'download.tmp',
            			{
            				create: true,
            				exclusive: false
            			},
            			function (fileEntry) {
		            		var path = fileEntry.toURL();
		        			var fileTransfer = new FileTransfer();
		        			fileTransfer.download(
		        				fileUri,
		        				path,
		        				uploadFile,
	        					error,
		        				true,
		        				{ }
		        			);
		        		},
		        		error);
            	}, error);
            }
        },
        _updateFileUi = function(context)
        {
        	if (context.renderMode != 'link' && context.renderMode != 'dragdrop') {
	            var ui = '';

	            if (context.file)
	            {
	                if (context.fileState === 'uploaded') {
	                    ui = context.uploadedFormat.replace('{0}', context.file.name);
	                }
	                else if (context.fileState === 'error') {
	                    ui = context.errorFormat.replace('{0}', context.file.name);
	                }
	                else if (context.isUploading) {
	                    ui = context.uploadingFormat.replace('{0}', context.file.name).replace('{1}', context.currentUploadPercent);
	                }
	                else {
	                    ui = context.toUploadFormat.replace('{0}', context.file.name);
	                }
	            }

	            context.fileContainer.html(ui);
			}
        },
        _error = function(context, err)
        {
            if (!context.initialized) {
            	context.container.children().hide();
            }

            if (err.file)
            {
                context.isUploading = false;
                context.fileState = 'error';
                _updateFileUi(context);

                context.container.trigger(_eventNames.error);
            }
        };

    var defaults = ($.fn.glowUpload || {}).defaults || {};
    defaults = $.extend({}, defaults, {
    	takePhotoOrVideoText: 'Take a photo',
    	chooseExistingText: 'Choose existing',
    	cancelText: 'Cancel'
    });

    $.fn.glowUpload = function(method) {
        if(method in api) {
            return api[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return _init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.fn.glowUpload');
        }
    };

    $.extend($.fn.glowUpload, {
        defaults: defaults
    });

	return {};
}, jQuery, window);

 
 
/*
 * KeyboardShim
 * Internal API
 *
 * Raises keyboard visibility messages and provides an API around knowing whether the keyboard is opened
 * and decides to render them as a slider (tray) or to expand them with a 'more' link

 * When available, uses native keyboard events raised by Cordova Keyboard. Otherwise, falls back to
 * listening for focus/blur and debouncing their change for field switching
 *
 * https://github.com/martinmose/cordova-keyboard/blob/master/README.md
 *
 * Not exposed publicly.
 *
 * Use:
 *
 * keyboard.handleVisibilityChange(options)
 *
 * options:
 *   container: selector of parent element(s) to listen for focus events
 *   onShow: function called when keyboard is showing
 *   onHide: function called when keyboard is hiding
 *   onShown: function called when keyboard is shown
 *   onHidden: function called when keyboard is hidden
 *
 * keyboard.isVisible()
 *
 * Returns whether keyboard is currently visible.
 *
 */
define('keyboardShim', ['environment'], function(environment, $, global, undef) {

	// potential Keyboard event sources...
	var keyboards = [{
		// cordova Keyboard plugin
		test: function() {
			return global.cordova && global.cordova.plugins && global.cordova.plugins.Keyboard;
		},
		build: function() {
			var nativeKeyboard = global.cordova.plugins.Keyboard;
			return {
				handleVisibilityChange: function(options) {
					var hideTimeout;

					global.addEventListener('native.keyboardshow', function(){
						global.clearTimeout(hideTimeout);
						if(options.onShow) {
							options.onShow();
						}
					});

					global.addEventListener('native.keyboardhide', function(){
						global.clearTimeout(hideTimeout);
						hideTimeout = global.setTimeout(function(){
							if(options.onHide) {
								options.onHide();
							}
						}, 5);

					});

				},
				isVisible: function() {
					return nativeKeyboard.isVisible;
				}
			};
		}
	}, {
		// Keyboard plugin
		test: function() {
			return global.Keyboard;
		},
		build: function(){
			var nativeKeyboard = global.Keyboard;
			return {
				handleVisibilityChange: function(options) {
					var hideTimeout;

					nativeKeyboard.onshowing = function() {
						global.clearTimeout(hideTimeout);
						if(options.onShow) {
							options.onShow();
						}
					};
					nativeKeyboard.onhiding = function() {
						global.clearTimeout(hideTimeout);
						hideTimeout = global.setTimeout(function(){
							if(options.onHide) {
								options.onHide();
							}
						}, 5);
					};
					nativeKeyboard.onshow = function() {
						global.clearTimeout(hideTimeout);
						if(options.onShown) {
							options.onShown();
						}
					};
					nativeKeyboard.onhide = function() {
						//Keyboard.shrinkView(false);
						global.clearTimeout(hideTimeout);
						if(options.onHidden) {
							options.onHidden();
						}
					};
				},
				isVisible: function() {
					return nativeKeyboard.isVisible;
				}
			};
		}
	}, {
		// web-based shim
		test: function() {
			return true;
		},
		build: function(){
			var shimmedKeyboardOpenState = false;

			// detect visiblity changes through listening for focus/blur and de-bouncing
			function handleVisibilityChange(options) {
				var unfocusedTimeout;
				var lastFocusTime = new Date().getTime();
				$(options.container).on({
					// when focused on an input,
					// add a extra vertical padding to the content
					// to allow there to be enough space to scroll the input to
					// the top of the viewport so as to not push the menu bar off
					// if this is the first focus and not a refocus, call the onKeyboardOpening callback
					focusin: function(e){
						global.clearTimeout(unfocusedTimeout);

						if(!unfocusedTimeout && options.onShow) {
							options.onShow();
						}

						shimmedKeyboardOpenState = true;
					},
					// when focusing out, remove
					// add a extra vertical padding to the content
					// to allow there to be enough space to scroll the input to
					// the top of the viewport so as to not push the menu bar off
					// if this is a complete blur and not a refocus, call the onKeyboardClosing callback
					focusout: function(e){
						global.clearTimeout(unfocusedTimeout);
						unfocusedTimeout = global.setTimeout(function(){
							global.clearTimeout(unfocusedTimeout);
							unfocusedTimeout = null;

							if(options.onHide) {
								options.onHide();
							}
							shimmedKeyboardOpenState = false;
						}, 5);
					}
				});
			}

			function isVisible() {
				return shimmedKeyboardOpenState;
			}

			return {
				handleVisibilityChange: function(options) {
					handleVisibilityChange(options);
				},
				isVisible: function() {
					return isVisible();
				}
			};
		}
	}];

	var keyboardApi = null;
	$.each(keyboards, function(i, k) {
		if(!keyboardApi && k.test()) {
			keyboardApi = k.build();
		}
	});

	return keyboardApi;

}, jQuery, window);
 
 
/*
 * Keyboard Fixing for Mobile Browsers to close keyboard when not needed
 * Private API
 *
  */
define('keyboardfix', ['messaging'], function(messaging, $, global, undef){

	var handle = null;

	function blurCurrentElement() {
		if ($(document.activeElement).is('input, textarea')) {
			document.activeElement.blur();
		}
	}

	function blurCurrentElementsOnShellUpdates() {
		messaging.subscribe('mobile.navigation.opening', messaging.GLOBAL_SCOPE, function(data) {
			blurCurrentElement();
		});

		messaging.subscribe('mobile.navigation.closing', messaging.GLOBAL_SCOPE, function(data) {
			blurCurrentElement();
		});

		messaging.subscribe('mobile.content.loading', messaging.GLOBAL_SCOPE, function(data) {
			blurCurrentElement();
		});
	}

	if (global.cordova && global.cordova.plugins && global.cordova.plugins.Keyboard) {
		global.cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
	}

	return {
		fix: function() {
			blurCurrentElementsOnShellUpdates();
		}
	}

}, jQuery, window);
 
 
/*
 * LruCache (Internal API)
 *
 * Statically-sized Persistent Least-Recently-Used Cache
 * Stores items in a cache, persisted locally bounded by a max size. When max size reached,
 * deletes items least-recently-read or set.
 *
 * options:
 *   size: // 10 default
 *   load: function() // defines how to return cache object from persistence
 *   persist: function(obj) // defiens how to persist cache object
 *
 * methods:
 *
 *   size()
 *   get(key)
 *   set(key, val)
 *   del(key)
 *
 */
define('lrucache', function($, undef){

	var defaults = {
		size: 10,
		load: function() { },
		persist: function(obj) { }
	};

	var LruCache = function(options) {
		var localStorageInstance;
		var context = $.extend({}, defaults, options || {
			load: function() {
				return localStorageInstance;
			},
			persist: function(obj) {
				localStorageInstance = obj;
			}
		});

		function getCache() {
			var cache = context.load();
			if(!cache) {
				cache = {};
				context.persist(cache);
			}
			return cache;
		}

		function persistCache(cache) {
			context.persist(cache);
		}

		return {
			size: function() {
				return context.size;
			},
			get: function(key) {
				// get the current cache from storage
				var cache = getCache();

				// if in cache, update its last access time, and return its value
				if(cache[key] !== undef) {
					cache[key].lastAccess = (new Date().getTime());
					persistCache(cache);
					return cache[key].value;
				// if not in cache, just return null
				} else {
					return null;
				}
			},
			set: function(key, value) {
				// get the current cache from storage
				var cache = getCache();

				// key already in cache, so update value and last access
				if(cache[key] !== undef) {

					cache[key].lastAccess = (new Date().getTime());
					cache[key].value = value;

				// not yet cached, so clean up cache if necessary and add new item
				} else {

					// if over the max size, evict least-recently-used item
					if(Object.keys(cache).length >= context.size) {
						var oldestKey = null;
						for(var cacheKey in cache) {
							if(oldestKey == null) {
								oldestKey = cacheKey;
							} else if(cache[cacheKey].lastAccess < cache[oldestKey].lastAccess) {
								oldestKey = cacheKey;
							}
						}
						if(oldestKey !== null) {
							delete cache[oldestKey];
						}
					}

					// set the new item
					cache[key] = {
						lastAccess: (new Date().getTime()),
						value: value
					};
				}

				// persist cache
				persistCache(cache);
			},
			del: function(key) {
				// get the current cache from storage
				var cache = getCache();

				delete cache[key];

				persistCache(cache);
			}
		}
	};

	return LruCache;

}, jQuery); 
 
/*
 * Overrides $.telligent.evolution.media.previewHtml
 *
 * For image URLs, short-circuits to support client-side resized image HTML generation
 *
 * In addition to standard $.telligent.evolution.media.previewHtml parameters, also supports
 * resizeMethdo: 'ZoomAndCrop' | 'ScaleDown' and all unknown options are transformed into html attributes
 * scaleFactor: 2.0 (defaults to 2.0 for retina)
 *
 */

/// @name media
/// @category JavaScript API Module
/// @description Mobile-specific methods for retrieving server-side generated previews of files
///
/// ### jQuery.telligent.evolution.media
///
/// This module provides a mobile-specific superset to Evolution's media module, which allows server-side file viewers to be invoked for URLs from the client side.
///
/// In mobile, `previewHtml` also supports generating resized image HTML purely from the client side for known image formats with support for resize methods. The [resizedimage UI Component](@resizedimage) relies on `previewHtml`.
///
/// ### Methods
///
/// #### previewHtml
///
/// Returns the FileViewer-provided Preview HTML for a given URL. When the URL is a known image format, produces resized image HTML without using the FileViewer.
///
///     $.telligent.evolution.media.previewHtml(url, options)
///
/// *options:*
///
///  * `width`: max viewer width
///  * `height`: max viewer height
///  * `success`: callback function which is invoked when the preview html is returned from an ajax request. The function is passed the response.
///  * `error`: callback function which is invoked if the preview html could not be generated
///  * `resizeMethod`: Used when producing resized image HTML on the client side. 'ZoomAndCrop' or 'ScaleDown'
///  * `scaleFactor`: Used when producing retina-friendly images on the client side. Defaults to 2.
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
define('media', function($, global, undef) {

	var originalMediaPreview = $.telligent.evolution.media.previewHtml,
		locationParts = global.location.href.split("/"),
		root = locationParts[0] + "//" + locationParts[2],
		encodeContainer = $('<span/>');

	function encode(val){
		return encodeContainer.text(val).html();
	}

	function isCfsUrl(normalizedPath) {
		return normalizedPath.indexOf('/cfs-file') === 0;
	}

	function hasExtension(url, extension) {
		return url.indexOf(extension, url.length - extension.length) !== -1;
	}

	function isImage(url) {
		url = url.toLowerCase();
		return hasExtension(url, '.jpg') ||
			hasExtension(url, '.jpeg') ||
			hasExtension(url, '.png') ||
			hasExtension(url, '.gif');
	}

	function parseUrl(url) {
		var parts = url.split('~', 2);
		return {
			prefix: parts[0] + '~',
			normalized: parts[1]
		};
	}

	function getCfsPath(normalizedPath) {
		return normalizedPath.substr(normalizedPath.indexOf('/', 1));
	}

	function getExtraAttributeString(options) {
		var attributes = [];
		for (var key in options) {
			if(key != 'success' &&
				key != 'error' &&
				key != 'width' &&
				key != 'height' &&
				key != 'resizeMethod' &&
				key != 'scaleFactor')
			{
				attributes.push(encode(key));
				attributes.push('="');
				attributes.push(encode(options[key]));
				attributes.push('" ');
			}
		}
		return attributes.join('');
	}

	function getResizedImageHtml(url, options) {
		var parsedUrl = parseUrl(url);

		var maxWidth = options.width || 0,
			maxHeight = options.height || 0;

		var extraAttributes = getExtraAttributeString(options);

		var response = { type: 'Image' };

		// CFS
		if(parsedUrl.prefix && parsedUrl.normalized && isCfsUrl(parsedUrl.normalized)) {
			var resizeMethod = 1;
			if(options.resizeMethod == 'ZoomAndCrop') {
				resizeMethod = 2;
			}

			var scaleFactor = 2.0;
			if(options.scaleFactor) {
				scaleFactor = parseFloat(options.scaleFactor);
			}

			var scaledWidth = scaleFactor * maxWidth,
				scaledHeight = scaleFactor * maxHeight;

			// apply non-scaled width and height as client-resized width/height of potentially larger server-scaled image
			options['style'] = (options['style'] || "") + (' width:' + maxWidth + 'px;height:auto;');
			extraAttributes = getExtraAttributeString(options);

			response.html =  '<img src="' + parsedUrl.prefix + '/resized-image.ashx/__size/' + scaledWidth + 'x' + scaledHeight + 'x' + resizeMethod + getCfsPath(parsedUrl.normalized) + '" ' + extraAttributes + ' />';
		// Remote with ZooomAndCrop
		} else if(options.resizeMethod == 'ZoomAndCrop' && maxWidth > 0 && maxHeight > 0) {
			var encodedUrl = encode(url);
			response.html =  '<img src="' + encodedUrl + '" style="width: ' + maxWidth + 'px;height:0;padding:' + maxHeight + 'px 0 0 0;overflow:hidden;background:url(\'' + encodedUrl + '\') center center no-repeat;background-size:cover;" ' + extraAttributes + ' />';
		// Remote
		} else {
			response.html =  '<img src="' + encode(url) + '" style="max-height: ' + maxHeight + 'px;max-width: ' + maxWidth + 'px;" ' + extraAttributes + ' />';
		}

		return response;
	}

	$.telligent.evolution.media.previewHtml = function(url, options) {
		if(isImage(url) && options.success) {
			options.success(getResizedImageHtml(url, options));
		} else {
			originalMediaPreview(url, options);
		}
	}

	return {};

}, jQuery, window);


 
 
/*
 * Message Bus
 * Internal API that is an override of $.telligent.evolution.messaging to support scopes.
 * Shell clears content and navigation scopes as they're refreshed
 *
 * var subscriptionId = messaging.subscribe(messageName, [scope], handler) // scope is optional and defaults to 'content'
 * messaging.publish(messageName, data)
 * messaging.unsubscribe(subscriptionId)
 * messaging.clear(scope)
 *
 * Exposed as an override of $.telligent.evolution.messaging, but without clear()
 *
 */

/// @name messaging
/// @category JavaScript API Module
/// @description Mobile-specific client-side bus for publishing and subscribing to messages
///
/// ### jQuery.telligent.evolution.messaging
///
/// This module provides a mobile-specific superset of the Evolution client side message bus, a simple, generic publish/subscribe message bus for client code to use. This enables easy cross-widget communication without relying on expectation of specifc DOM elements or events. Additionally, the platform uses messages for coordinating synchronization between separate UI components related to the same piece of content.
///
/// In mobile, message handlers can be scoped to define their lifetime relative to other events occurring in the shell.
///
/// ### Methods
///
/// #### subscribe
///
/// Subscribes to a message, optionally passing a scope. Returns a subscription handle.
///
///     var subscriptionId = $.telligent.evolution.messaging.subscribe(messageName, function(data) {
///         // handle message
///     });
///
///     var subscriptionId = $.telligent.evolution.messaging.subscribe(messageName, scope, function(data) {
///         // handle message
///     });
///
/// * `messageName`: message to subscribe to
/// * `scope`: mobile scope - 'content', 'navigation', or 'global'. Scope defines handlers' lifetime. When the scope is navigation, a refresh of the navigation unsubscribes any previously-subscribed handlers. When the scope is content, a refresh of the content or any other navigation-triggered content loading unsubscribes previously-subscribed handlers. When the scope is global, handlers remain subscribed persistently. *default when not provided: content*
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
/// Unsubcribes a specific message handler by subscription handle
///
///     $.telligent.evolution.messaging.unsubscribe(subscriptionId);
///
/// ### Automatic Message Links
///
/// Anchors which define the attribute, `data-messagename` raise a message named according to the value of the attribute when clicked without the need for explicitly binding. Message links' binding is delegated to support links being added or modified dynamically.
///
///     // Register a message link on an anchor
///     <a href="#" data-messagename="action.occurred">My Link</a>
///
///     // handle the message
///     $.telligent.evolution.messaging.subscribe('action.occurred', function(data) {
///         // handle the message
///         // data.target is the link which raised the message
///     });

define('messaging', ['util'], function(util, $, global, undef) {

	var subscriptionsByName = {},  // for fast publishing and subsscribing
		subscriptionsById = {},    // for fast unsubscribing
		subscriptionsByScope = {}; // each scope tracks a list of subscription ids registered against it

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

	function subscribe(messageName, scope, handler) {
		if(!messageName) {
			throw 'messageName is required when subscribing to a message';
		}
		if(messageName === null || messageName.length === 0) {
			return 0;
		}
		if(typeof subscriptionsByName[messageName] === 'undefined') {
			subscriptionsByName[messageName] = [];
		}

		// default to content scope if scope not defined
		var messageScope = scope;
		if(handler == undef) {
			handler = scope;
			messageScope = 'content';
		}

		var subscription = {
			message: messageName,
			handler: handler,
			scope: messageScope,
			id: util.guid()
		};
		subscriptionsByName[messageName][subscriptionsByName[messageName].length] = subscription;
		subscriptionsById[String(subscription.id)] = subscription;

		// add this subscription reference to the scope it was registered with
		if(!subscriptionsByScope[messageScope])
			subscriptionsByScope[messageScope] = [];
		subscriptionsByScope[messageScope][subscriptionsByScope[messageScope].length] = subscription.id;

		return subscription.id;
	}

	function unsubscribe(subscriptionId) {
		if(!subscriptionId) {
			throw 'subscriptionId is required when unsubscribing a message';
		}
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

	function clear(scope) {
		if(!scope || !subscriptionsByScope[scope])
			return;
		// unsubscribe each subscription for this scope
		for(var i = 0; i < subscriptionsByScope[scope].length; i++ ) {
			unsubscribe(subscriptionsByScope[scope][i]);
		}
		// clear the array of scoped subscriptions
		subscriptionsByScope[scope].length = 0;
	}

	var messaging = {
		publish: publish,
		subscribe: subscribe,
		unsubscribe: unsubscribe,
		clear: clear,
		CONTENT_SCOPE: 'content',
		NAVIGATION_SCOPE: 'navigation',
		GLOBAL_SCOPE: 'global'
	};

	return messaging;

}, jQuery, window);
 
 
/*
 * NavigationStack (Internal API)
 *
 * Stores history of past navigation urls and content in local storage
 * Garbage-collects history
 * Allows navigating back and in the history
 * Keeps in-memory cache of stack, but only the stack's URLs, not the content
 *
 * var stack = new NavigationStack(options)
 *   maxDepth: default 100
 *   cacheDuration: default 600000 (10 minutes)
 * methods:
 *   stack.push(url, content)
 *   stack.replaceCurrent(url, content)
 *   stack.setCurrentScrollTop(currentScrollTop)
 *   stack.getCurrent()  			returns Page instance
 *   stack.canMoveBack([toUrl]) 	returns previous url
 *   stack.moveBack([toUrl])    	returns Page instance
 *   stack.empty()
 *   stack.clearContent(url) 		if not provided, assumes current url
 *   stack.peekBack(toUrl) 			returns the previous Page without navigating to it
 *   stack.expireAll()			/	clears content of all that are past expiration if online
 *   stack.exclude() 				excludes current url from stack (marking it for exclusion)
 *   stack.setExpiration(date, [url])  sets the (custom) expirate date for a page in stack. defaults to curent if url not provided
 *
 * Page
 *   url
 *   exclude // whether it's excluded
 *   getContent() // lazily-load the persisted content
 */
define('navigationStack', ['storage', 'util', 'environment'], function(storage, util, environment, undef){

	var stackKey = '_navigation_stack',
		contentPrefixKey = '_navigation_stack_content_';

	function getStackFromStorage() {
		var stack = storage.get(stackKey);
		if(!stack) {
			stack = [];
			persistStack(stack);
		}
		return stack;
	}

	function persistStack(stack) {
		storage.set(stackKey, stack);
	}

	function getContent(id) {
		return storage.get(contentPrefixKey + id);
	}

	function setContent(id, content) {
		storage.set(contentPrefixKey + id, content);
	}

	function delContent(id) {
		storage.del(contentPrefixKey + id);
	}

	function setCurrentScrollTop(stack, scrollTop) {
		if(stack != undef && scrollTop != undef && stack.length > 0) {
			stack[0].scrollTop = scrollTop;
		}
	}

	// Type returned for current representation of place in the stack
	function Page(url, id, scrollTop, exclude, expiration) {
		this.url = url;
		this.id = id;
		this.scrollTop = scrollTop;
		this.exclude = exclude;
		this.expiration = expiration;
	}
	// Loads the place's content
	Page.prototype.getContent = function() {

		// if online and the page expires, and has already expired
		if(environment.isOnline() && this.expiration && this.expiration <= new Date().getTime()) {
			// go ahead and delete its current content to clean it up
			delContent(this.id);
			// and return no content
			return null;
		} else {
			return getContent(this.id);
		}
	};

	var NavigationStack = function(options) {
		var maxDepth = 100;
		var cacheDuration = 10 * 60 * 1000; // 60 seconds
		if(options) {
			maxDepth = options.maxDepth || maxDepth;
			cacheDuration = options.cacheDuration || cacheDuration;
		}

		// keep in-memory representation of stack of urls, but not the content
		var stack = getStackFromStorage();

		return {
			setCurrentScrollTop: function(currentScrollTop) {
				setCurrentScrollTop(stack, currentScrollTop);
				persistStack(stack);
			},
			push: function(url, content) {
				// add this new content to the stack
				var newId = util.guid();

				stack.unshift({
					url: url,
					id: newId,
					scrollTop: 0,
					exclude: false,
					expiration: new Date(new Date().getTime() + cacheDuration).getTime()
				});
				setContent(newId, content);

				// if longer than the max, remove the last one
				if(stack.length > maxDepth) {
					var last = stack.pop();
					delContent(last.id);
				}

				persistStack(stack);
			},
			replaceCurrent: function(url, content) {
				if(stack && stack.length > 0) {
					setContent(stack[0].id, content);
					stack[0].url = url;
					stack[0].expiration = new Date(new Date().getTime() + cacheDuration).getTime();

					persistStack(stack);
				}
			},
			getCurrent: function() {
				if(stack && stack.length > 0) {
					return new Page(stack[0].url, stack[0].id, stack[0].scrollTop, stack[0].exclude, stack[0].expiration);
				} else {
					return null;
				}
			},
			canMoveBack: function(toUrl) {
				// if can't move back at all, short circuit
				var canMoveBackAtAll = stack && stack.length > 1;
				if(!canMoveBackAtAll) {
					return null;
				}

				// if can move back and we don't care to where, then short circuit to first non excluded
				if(!toUrl) {
					for (var i = 1; i < stack.length; i++) {
						if (!stack[i].exclude) {
							return stack[i].url;
						}
					}
				}

				// otherwise, see if the stack contains the non-excluded URL anywhere after the current index
				var backToUrl = null;
				for(var i = 0; i < stack.length; i++) {
					if(stack[i].url == toUrl && !stack[i].exclude) {
						backToUrl = toUrl;
						break;
					}
				}

				return backToUrl;
			},
			peekBack: function(toUrl) {
				var currentUrl = null,
					index = 0;

				while(currentUrl !== toUrl && index < maxDepth && index < stack.length) {
					currentUrl = stack[index].url;
					if(currentUrl != toUrl) {
						index++;
					}
					// if not passed a toUrl, stop it after one iteration
					if(toUrl == undef) {
						toUrl = currentUrl;
					}
				}
				// sanity check
				if(!stack || !stack[index])
					return null;

				return new Page(stack[index].url, stack[index].id, stack[index].scrollTop, stack[index].exclude, stack[index].expiration);
			},
			moveBack: function(toUrl) {
				var currentUrl = null,
					index = 0;

				while(currentUrl !== toUrl && index < maxDepth && index < stack.length) {
					currentUrl = stack[index].url;
					if(currentUrl != toUrl) {
						index++;
					}
					// if not passed a toUrl, stop it after one iteration
					if(toUrl == undef) {
						toUrl = currentUrl;
					}
				}
				// sanity check
				if(!stack || !stack[index])
					return null;

				// delete all pages prior to the index, so can't move forward again
				for(var i = 0; i < index; i++) {
					delContent(stack[0].id);
					stack.shift();
				}
				persistStack(stack);

				return new Page(stack[0].url, stack[0].id, stack[0].scrollTop, stack[0].exclude, stack[0].expiration);
			},
			empty: function() {
				for(var i = 0; i < stack.length; i++) {
					delContent(stack[i].id);
				}
				storage.del(stackKey);
				stack = [];
			},
			exclude: function() {
				if (stack.length > 0) {
					stack[0].exclude = true;
					persistStack(stack);
				}
			},
			setExpiration: function(date, url) {
				if(!stack || stack.length == 0 || !date)
					return;

				// if not provided a url, set the current page's expiration
				if(!url) {
					stack[0].expiration = date.getTime();
				// otherwise, look in the stack for the url
				} else {
					for(var i = 0; i < stack.length; i++) {
						if(stack[i].url == url) {
							stack[i].expiration = date.getTime();
							break;
						}
					}
				}

				persistStack(stack);
			},
			// clears content of all that are past expiration if online
			expireAll: function() {
				if(!stack || stack.length == 0)
					return;

				// don't expire if offline
				if(!environment.isOnline())
					return;

				var now = new Date().getTime();
				for(var i = 0; i < stack.length; i++) {
					// if expired
					if(stack[i].expiration && stack[i].expiration <= now) {
						// go ahead and delete its current content to clean it up
						delContent(stack[i].id);
					}
				}
			},
			clearContent: function(url) {
				// url is explicit or current
				url = url || stack[0].url;
				for(var i = 0; i < stack.length; i++) {
					if(stack[i].url == url) {
						delContent(stack[i].id);
						break;
					}
				}
			}
		};
	};

	return NavigationStack;
}); 
 
/*
 * Navigator (Internal API)
 *
 * Coordinates navigation with the history stack, back button/URL modifications, and requests for new pages
 * The UI can tell the navigator to move somewhere, and the navigator makes sure it
 * occurs via a bookmarkable change in URL hash
 * Looks for any previously requested content in the history to know if this represents a directional change
 * Otherwise loads URL via the transport
 * Ultimately reports back to UI with retireved content and the effective navigation direction this represents
 * Additionally, back in the browser also end up flowing through this navigator back to the UI
 *
 * Constructor options
 *
 *   defaultUrl: '/'
 *     Default URL to request when there isn't a current one
 *   onDetermineRedirect
 *     function passed url
 *     Just used to notify client code of a redirect determination in progress
 *   onDeterminedRedirect
 *     Just used to notify client code of a redirect having been determined
 *   onLoad
 *     function passed url
 *     Implementation of requesting a URL. Returns a promise
 *   onLoadError
 *     function passed error result of requesting a URL
 *   onNavigated
 *     function passed url, content, and direction
 *     Implementation of what to do once content has been retrieved (or pulled from history)
 *   onMessage
 *     function passed message, class
 *     Implementation of what to do with an (error) message
 *   initFromStorage (default false)
 *     When true, first looks in storage for the URL to init from, ignoring the current hash
 *     Used for native and home screen app
 *   cacheDuration (default 600000 - 10 minutes)
 *
 * Methods
 *   reset()
 *     navigates to default url and clears the stack
 *   navigateTo(url, options)
 *     adjusts querystring, triggering either a load of page or pull from stack
 * 	   options:
 *       replace: is an optional boolean - when true, doesn't attempt to determine direction/animate in
 * 		 currentContentScrollTop: scroll top position of current page to persist for content
 *       refresh: refreshes any existing cache for the url
 *   navigateBack(options)
 *     adjusts querystring with previous url
 *     options:
 * 		 currentContentScrollTop: scroll top position of current page to persist for content
 *   refresh(options)
 *     refreshes current page
 *     options: extra keys/value pairs to include in the URL's query string
 *       will only be used for the next refresh request, but not stored
 *   canNavigateBack()
 *     returns whether there's a previous history item
 *   clearContent(url)
 *     clears the currently-cached content for current page or explicit url to force a refresh on next load or navigation back to it
 *   setExpiration(date, [url])
 *     sets the (custom) expirate date for a page in stack. defaults to curent if url not provided
 *   excludeFromHistory()
 *     excludes current url from stack (marking it for exclusion)
 */
define('navigator',
	['navigationStack', 'transport', 'util', 'url', 'messaging', 'environment', 'lrucache', 'storage'],
	function(NavigationStack, transport, util, url, messaging, environment, LruCache, storage, $, global, undef)
{
	var urlHashKey = '__u',
		resetValue = '__reset',
		reset = false,
		hasChildBrowser = false,
		replaceContentWithoutAnimation = false,
		directions = {
			back: 'back',
			forward: 'forward',
			none: null
		};

	function handleEvents(context) {
		// when the hash changes, possibly do something about it
		$(window).on('hashchange', function(e) {
			var navigatedToUrl = url.hashData()[urlHashKey];
			var current = context.stack.getCurrent();

			// if this represented a legitimate change to the current URL...
			if(navigatedToUrl && navigatedToUrl != resetValue &&  (!current || navigatedToUrl !== current.url)) {
				if(reset){
					reset = false;
					return;
				}
				// if can nav back to this url, then do so
				var page = context.stack.peekBack(navigatedToUrl);
				if(page != null) {
					// if the page was excluded and it's not the URL we're moving to, move back again
					if (page.exclude) {
						page = context.stack.moveBack(navigatedToUrl);
						var prevUrl = context.stack.canMoveBack();
						if (prevUrl) {
							adjustHashData(prevUrl);
						}
					// otherwise, only move once
					} else {
						page = context.stack.moveBack(navigatedToUrl);
						var previousContent = page.getContent();
						// if previous content was cleared or not existent, reload
						if(!previousContent) {
							replaceContentWithoutAnimation = false;
							loadAndShowUrlViaTransportWithDirection(context, page.url, directions.back);
						} else {
							if(context.onLoadFromCache)
								context.onLoadFromCache(page.url);
							renderContent(context, page.url, previousContent, directions.back, page.scrollTop);
						}
						return;
					}
				}
				// if instructed to replace current, just do that
				if(replaceContentWithoutAnimation) {
					replaceContentWithoutAnimation = false;
					loadAndShowUrlViaTransportWithDirection(context, navigatedToUrl, directions.none);
					return;
				}
				// otherwise, load the url - use a direction of forward if there is a current url, otherwise no direction
				var direction = (current && current.url != null && current.url != undef)
					? directions.forward
					: directions.none;
				loadAndShowUrlViaTransportWithDirection(context, navigatedToUrl, direction);
			}
		});
	}

	function adjustHashData(toUrl) {
		var data = {};
		data[urlHashKey] = toUrl;
		url.hashData(data);
	}

	function renderContent(context, url, content, direction, scrollTop) {
		// clear any content-scoped messaging subscriptions before changing content
		messaging.clear(messaging.CONTENT_SCOPE);
		context.onNavigated(url, content, direction, scrollTop);
	}

	function loadAndShowUrlViaTransportWithDirection(context, urlToLoad, direction) {
		if(urlToLoad.indexOf('#') > 0)
			urlToLoad = urlToLoad.split('#')[0];
		context.currentlyLoading = urlToLoad;
		context.onLoad(urlToLoad)
			.done(function(content){
				// avoid race conditions of parallel loading - only render the last one requested
				if(context.currentlyLoading != urlToLoad) {
					return;
				}

				if(urlToLoad.indexOf('#') > 0) {
					urlToLoad = urlToLoad.split('#')[0];
				}
				// if there were refresh params used in this previous request
				// remove them from the URL before storing it
				// as these should be temporary
				if(context.refreshParams) {
					var queryString = url.parseQuery(urlToLoad);
					for(var key in queryString) {
						// if this key in the querystring was part of the refresh params, remove it
						if(context.refreshParams[key] != undef) {
							delete queryString[key];
						}
					}
					urlToLoad = url.modify({ url: urlToLoad, query: queryString, overrideQuery: true });
				}
				if(urlToLoad.indexOf('#') > 0) {
					urlToLoad = urlToLoad.split('#')[0];
				}
				// then put its result in the stack
				var current = context.stack.getCurrent();
				if(current && current.url == urlToLoad) {
					// if this is the current URL, replace it in the stack
					context.stack.replaceCurrent(urlToLoad, content);
				} else {
					// otherwise push it onto the stack
					context.stack.push(urlToLoad, content);
				}
				current = context.stack.getCurrent();
				// and tell the UI about our successful navigation
				renderContent(context, urlToLoad, content, direction, (current ? current.scrollTop : 0));
			})
			.fail(function(ex){
				if(context.onLoadError)
					context.onLoadError(ex);
			});
	}

	function init(context) {
		// first try to look for a current url in the hash
		var currentUrl = url.hashData()[urlHashKey];
		if(currentUrl && !context.initFromStorage) {
			// if there was a current url, ajax request it
			loadAndShowUrlViaTransportWithDirection(context, currentUrl, directions.none);
		} else {
			// otherwise, try looking in the stored history stack for a current URL
			// (or if it was instructed to start from storage)
			var current = context.stack.getCurrent();
			if(current && current.url) {
				// if there's a current stored page in the stack, show it
				adjustHashData(current.url);
				var content = current.getContent();
				// if content was cleared, expired, or not existent, then reload it
				if(!content) {
					loadAndShowUrlViaTransportWithDirection(context, current.url, directions.none);
				} else {
					renderContent(context, current.url, content, directions.none, current.scrollTop);
				}
			// otherwise, if this was inited from webapp, load the default page
			} else if (environment.type == 'webapp') {
				loadAndShowUrlViaTransportWithDirection(context, context.defaultUrl, directions.none);
			// otherwise just adjust the hash as normal
			} else {
				adjustHashData(context.defaultUrl);
			}
		}

		// whenever the app resumes, force delete any expired stack caches
		messaging.subscribe('mobile.resume', 'global', context.stack.expireAll);
	}

	function loadExternalUrl(context, url) {
		// if in native, load it in child browser
		if (transport.isNative()) {
			if (context.useDeviceBrowserForExternalUrls) {
				global.open(url, '_system', '');
			} else if (!hasChildBrowser) {
				hasChildBrowser = true;
				var cb = global.open(url, '_blank', '');
				cb.addEventListener('exit', function (event) {
					hasChildBrowser = false;
				});
			}
		// homescreened web app
		} else if (environment.type == 'webapp') {
			var a = document.createElement('a');
			a.setAttribute('href', url);
			a.setAttribute('target', '_blank');

			var event = document.createEvent('HTMLEvents')
			event.initEvent('click', true, true);
			a.dispatchEvent(event);
		// otherwise, redirect
		} else {
			global.location.href = url;
		}
	}

	// gets and caches the target of a redirect
	// returns a promise
	function determineRedirect(context, url) {
		return $.Deferred(function(dfd){
			var redirectData = context.redirectCache.get(url);
			if(!redirectData) {
				transport.load(url).done(function(data){
					context.redirectCache.set(url, data);
					dfd.resolve(data);
				}).fail(function(){
					dfd.reject();
				})
			} else {
				dfd.resolve(redirectData);
			}
		}).promise();
	}

	function internalNavigateTo(context, url, options) {
		options = options || {};
		if(options.refresh) {
			context.stack.clearContent(url);
		}
		if(options.currentContentScrollTop != undef) {
			context.stack.setCurrentScrollTop(options.currentContentScrollTop);
		}
		// mobile-defined page
		if(transport.isLocal(url)) {
			replaceContentWithoutAnimation = options.replace || false;
			adjustHashData(url);
		// non-mobile defined page
		} else {
			// potentially a redirect, so try getting the redirect target
			if(url.indexOf('rsw.ashx') > 0 && url.indexOf('~') > 0) {
				if(context.onDetermineRedirect)
					context.onDetermineRedirect(url);
				determineRedirect(context, url).then(function(data){
					if(context.onDeterminedRedirect)
						context.onDeterminedRedirect(url);
					// this URL *was* a redirect target, then use that target
					if(data) {
						if (data.error) {
							if ($.telligent.evolution.user.accessing.isSystemAccount) {
								context.authenticator.login();
							} else {
								// not sure what happened, but show an error message
								$.telligent.evolution.notifications.show('Access denied', {
									type: 'error'
								})
							}
						} else if (data.redirectUrl) {
							if(options.refresh) {
								context.stack.clearContent(data.redirectUrl);
							}
							// redirect to locally-defined redirect url
							if(transport.isLocal(data.redirectUrl)) {
								replaceContentWithoutAnimation = options.replace || false;
								adjustHashData(data.redirectUrl);
							// non-mobile defined redirect url
							} else {
								loadExternalUrl(context, data.redirectUrl);
							}
						} else {
							loadExternalUrl(context, url);
						}
					// otherwise, just treat it like an external URL
					} else {
						loadExternalUrl(context, url);
					}
				});
			// an external url, so just load it
			} else {
				loadExternalUrl(context, url);
			}
		}
	}

	var Navigator = function(context) {
		context = context || {};
		context.cacheDuration = context.cacheDuration || (10 * 60 * 1000) // 10 minutes
		context.stack = new NavigationStack({
			maxDepth: (context.maxDepth || 100),
			cacheDuration: context.cacheDuration
		});
		context.defaultUrl = context.defaultUrl || '/';
		context.onLoad = context.onLoad || function() {};
		context.onNavigated = context.onNavigated || function() {};
		context.initFromStorage = context.initFromStorage || false;
		context.redirectCache = LruCache({
			size: 250,
			load: function(){
				return storage.get('_redirect_cache');
			},
			persist: function(obj) {
				storage.set('_redirect_cache', obj);
			}
		});

		handleEvents(context);
		init(context);

		return {
			navigateTo: function(url, options) {
				internalNavigateTo(context, url, options);
			},
			navigateBack: function(options) {
				options = options || {
					refresh: false
				};
				if(options.currentContentScrollTop != undef) {
					context.stack.setCurrentScrollTop(options.currentContentScrollTop);
				}
				// get the previous url
				// if there was one, just change the URL
				// the change handler will still determine that
				// it should re-use any previously-requested content
				var prevUrl = context.stack.canMoveBack();
				if(prevUrl) {
					// if should refresh when moving back, clear content of previous URL
					if(options.refresh) {
						context.stack.clearContent(prevUrl);
					}
					adjustHashData(prevUrl);
				}
			},
			refresh: function(options) {
				context.stack.setCurrentScrollTop(0);

				var currentPage = context.stack.getCurrent();
				if(!currentPage)
					return;

				var refreshUrl = options
					? url.modify({ url: currentPage.url, query: options })
					: currentPage.url;
				// keep track of what extra refresh params were added to remove them from the next url
				context.refreshParams = options;
				// reload it and re-show it with no direction
				loadAndShowUrlViaTransportWithDirection(context, refreshUrl, directions.none);
			},
			reset: function() {
				reset = true;
				// clear any content-scoped messaging subscriptions before changing content
				messaging.clear(messaging.CONTENT_SCOPE);
				context.stack.empty();
				adjustHashData(resetValue);
				adjustHashData(context.defaultUrl);
			},
			canNavigateBack: function() {
				var currentPage = context.stack.getCurrent();
				return context.stack.canMoveBack() != null
					&& currentPage
					&& context.stack.canMoveBack() != currentPage.url;
			},
			clearContent: function(url) {
				context.stack.clearContent(url);
			},
			setExpiration: function(date, url) {
				context.stack.setExpiration(date, url);
			},
			excludeFromHistory: function() {
				context.stack.exclude();
			}
		};
	};
	return Navigator;

}, jQuery, window); 
 
/*
 * PostListHandler
 * Internal API
 *
 * Intercepts taps of any post-list-items in a container
 * And navigates to them if they include a data-targeturl
 * And highlights them with a class while loading the target url
 *
 * var postListHandler = new PostListHandler(options)
 *
 * options:
 *   parent: container to monitor for taps
 *   highlightClassName: class to apply when loading a post-list-item with a target-url
 *   onTap: function(url) { }
 *
 * methods:
 *   handleTargetedTaps()  // initiates
 *   clearHighlights()  // clears any active highlights
 */
define('postlisthandler', ['util', 'scrollfix', 'environment'], function(util, scrollfix, environment, $, global, undef){

	var PostListHandler= function(options) {
		options = options || {};
		var highlightedItem = null,
			parent = $(options.parent),
			highlightClassName = (options.highlightClassName || 'loading-item'),
			onTap = (options.onTap || function(targetUrl) { });
		return {
			handleTargetedTaps: function() {
				parent.on('click', '.post-list-item', function(e){
					if(scrollfix.isScrolling())
						return;

					// handle links in post lists without tapping the list item
					if($(e.target).is('a') || $(e.target).closest('a').length > 0)
						return;
					var item = $(this);
						targetUrl = item.data('targeturl');
					if(!targetUrl)
						return;
					// there's a highlighted one, unhighlight it
					if(highlightedItem)
						highlightedItem.removeClass(highlightClassName);
					// highlight tapped item
					item.addClass(highlightClassName);
					highlightedItem = item;
					onTap(targetUrl);
				});
			},
			clearHighlights: function() {
				if(highlightedItem)
					highlightedItem.removeClass(highlightClassName);
			}
		}
	};

	return PostListHandler;

}, jQuery, window); 
 
/*
 * Push Notifications
 * Internal API
 *
 * Publishes:
 *   notification.raised
 *   notification.read
 */

/// @name notification.raised
/// @category Client Message
/// @description Raised when a notification is received
///
/// ### notification.raised Client Message
///
/// Published when a notification is received. Mobile version, overrides the platform `notification.raised` message, including an additional `unreadCount` data property.
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
///  * `unreadCount`: Current unread count of notifications
///

/// @name notification.read
/// @category Client Message
/// @description Raised when a notification is read
///
/// ### notification.read Client Message
///
/// Published when a notification is read. Mobile-specific override.
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('notification.read', function(data) {
///         // handle the event
///     });
///
/// ### Data
///
///  * `unreadCount`: Remaining unread count of notifications
///

define('pushNotifications', ['transport','controller','environment','messaging'],
function(transport, controller, environment, messaging, $, global, undef) {

	var iosNotificationRegistered = function(t) {
		if (t.length > 0) {
			token = t;
			registerWithEvolution();
			messaging.subscribe('user.login', messaging.GLOBAL_SCOPE, function() { registerWithEvolution(); });
			messaging.subscribe('user.logout', messaging.GLOBAL_SCOPE, function() { unregisterWithEvolution() });
		}
	}, androidNotificationRegistered = function(e) {
	}, notificationRegistrationFailed = function(e) {
		// fail silently
	}, sendNotification = function(notificationId, unreadCount) {
		$.telligent.evolution.get({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/notification/{NotificationId}.json?IncludeFields=NotificationId,ContentId,ContentTypeId,NotificationTypeId,TargetUrl,Message,AvatarUrl,Actors',
			global: false,
			data: {
				NotificationId: notificationId
			},
			success: function(response) {
				messaging.publish('notification.raised', {
					id: response.Notification.NotificationId,
					contentId: response.Notification.ContentId,
					contentTypeId: response.Notification.ContentTypeId,
					typeId: response.Notification.NotificationTypeId,
					contentUrl: response.Notification.TargetUrl,
					message: response.Notification.Message,
					avatarUrl: response.Notification.Actors != null && response.Notification.Actors.length > 0 ? response.Notification.Actors[response.Notification.Actors.length - 1].User.AvatarUrl : null,
					unreadCount: unreadCount
				});
			},
			error: function() {
				// ignore
			}
		});
	}, processNotificationOnResume = function(notificationId, unreadCount) {
		$.telligent.evolution.get({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/notification/{NotificationId}.json?IncludeFields=TargetUrl,IsRead',
			global: false,
			data: {
				NotificationId: notificationId
			},
			success: function(response) {
				var complete = function() {
					var url = response.Notification.TargetUrl;
					if(url.indexOf('rsw.ashx') > 0 && url.indexOf('~') > 0) {
						transport.load(url).then(function(data){
							if(data && data.redirectUrl) {
								if(transport.isLocal(data.redirectUrl)) {
									$.telligent.evolution.mobile.load(data.redirectUrl);
								} else {
									$.telligent.evolution.mobile.load(global.mobileNativeConfig.notificationsUrl ? global.mobileNativeConfig.notificationsUrl : (global.mobileNativeConfig.baseUrl + 'notifications'));
								}
							} else {
								$.telligent.evolution.mobile.load(global.mobileNativeConfig.notificationsUrl ? global.mobileNativeConfig.notificationsUrl : (global.mobileNativeConfig.baseUrl + 'notifications'));
							}
						});
					} else {
						controller.load(global.mobileNativeConfig.notificationsUrl ? global.mobileNativeConfig.notificationsUrl : (global.mobileNativeConfig.baseUrl + 'notifications'));
					}
				}

				if (!response.Notification.IsRead) {
					$.telligent.evolution.put({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/notification/{NotificationId}.json',
						data: {
							NotificationId: notificationId,
							MarkAsRead: 'True'
						},
						success: function(r) {
							jQuery.telligent.evolution.messaging.publish('notification.read', {
								unreadCount: (unreadCount - 1)
							});
							complete();
						}
					});
				} else {
					jQuery.telligent.evolution.messaging.publish('notification.read', {
						unreadCount: unreadCount
					});
					complete();
				}
			},
			error: function() {
				// ignore
			}
		});
	}, registerWithEvolution = function() {
		if (token != null && token.length > 0 && deviceType != 'Unknown') {
			$.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/mobile/pushnotifications/registration.json',
				global: false,
				async: false,
				data: {
					Token: token,
					Device: deviceType
				},
				success: function(response) {
					// done
				},
				error: function() {
					unregisterWithEvolution();
				}
			});
		}
	}, unregisterWithEvolution = function() {
		if (token != null && token.length > 0 && deviceType != 'Unknown') {
			$.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/mobile/pushnotifications/registration.json',
				global: false,
				async: false,
				data: {
					Token: token,
					Device: deviceType
				},
				success: function(response) {
					// done
				},
				error: function() {
					// fail silently
				}
			});
		}
	}, deviceType = null,
	token = null;

	global.androidNotification = function(e) {
		switch(e.event) {
			case 'registered':
				if (e.regid.length > 0) {
					token = e.regid;
					registerWithEvolution();
					messaging.subscribe('user.login', messaging.GLOBAL_SCOPE, function() { registerWithEvolution(); });
					messaging.subscribe('user.logout', messaging.GLOBAL_SCOPE, function() { unregisterWithEvolution() });
				}
				break;
			case 'message':
				if (e.payload.n) {
					if (e.foreground) {
						sendNotification(e.payload.n, e.payload.msgcnt);
					} else {
						processNotificationOnResume(e.payload.n, e.payload.msgcnt);
					}
				}
				break;
		}
	}

	global.iosNotification = function(e) {
		if (e.n != undef) {
			if (e.foreground == 1) {
				sendNotification(e.n, e.badge);
			} else {
				processNotificationOnResume(e.n, e.badge);
			}
		}
	}

	if (environment.type == 'native') {
		if (environment.device == 'android') {
			deviceType = 'Android';
			if (global.mobileNativeConfig.androidSenderId) {
				global.plugins.pushNotification.register(global.androidNotification, notificationRegistrationFailed, {"senderID":global.mobileNativeConfig.androidSenderId,"ecb":"androidNotification"});
			}
		} else if (environment.device == 'ios') {
			deviceType = 'IOS';
			global.plugins.pushNotification.register(iosNotificationRegistered, notificationRegistrationFailed, {"badge":"true","sound":"true","alert":"true","ecb":"iosNotification"});
		}
	}

	return {};
}, jQuery, window);
 
 
/*
 * Pull to Refresh
 * Private API
 *
 * new PullToRefresh(options);
 *
 * Methods
 *   enabled(true|false)  returns currently enabled status. can also set enabled
 *   refresh()  // manually run
 *
 * options:
 *   enablePan: true (when true, can pan down the content area to refresh, not just swipe)
 *   container: refreshable container
 *   indicator: refresh indicator div
 *   content: refreshable content div
 *   overflow: extra pixels needed to pull past indicator's height to trigger refresh (default 20)
 *   revealThrottle: min milliseconds between 'reveal' callbacks (default 10)
 *   load: function called when a refresh is triggered. passed a function, which, when called, tells the refresher it's done
 *   revealStart: function called as the refresher starts being revealed
 *   reveal: function called as the refrehser is being revealed, before refreshing is triggered. passed a percentage of reveal
 *   animateClose: when true, animates the slide-up of the refreshed area after refreshing. defaults false.
 */
define('refresh', function($, undef){

	function handleEvents(context) {
		if(context.enablePan) {
			context.content.on({
				panstart: function(e) {
					if(!context.enabled)
						return;
					context.lastPanAt = 0;
					if(context.revealStart) {
						context.revealStart();
					}
				},
				panend: function(e) {
					if(!context.enabled)
						return;
					if(!context.refreshing &&
						-1 * context.container.scrollTop >= (context.indicatorHeight + context.overflow))
						startRefreshing(context);
				},
				pan: function(e) {
					if(!context.enabled)
						return;
					if(context.refreshing || e.direction === 'right' || e.direction === 'left')
						return;
					var now = (new Date().getTime()),
						revealPercent = (-1 * context.container.scrollTop) / (context.indicatorHeight + context.overflow);

					if(revealPercent > 0 && (now - context.lastPanAt >= context.revealThrottle)) {
						context.lastPanAt = now;
						context.reveal(revealPercent);
					}
				}
			});
		}
		context.content.on({
			swipedown: function() {
				if(!context.enabled)
					return;
				// swipedown fallback if panning isn't being supported in the browser
				if(!context.refreshing && context.container.scrollTop <= 10) {
					startRefreshing(context);
				}
			}
		});
	}

	function startRefreshing(context) {
		context.refreshing = true;
		context.indicator.evolutionTransform({
			x: 0,
			y: 0,
			position: 'static'
		});
		context.load(function(){
			stopRefreshing(context);
		});
	}

	function stopRefreshing(context) {
		context.refreshing = false;
		if(context.animateClose) {
			clearTimeout(context.stopRefreshingTimeout);
			context.content.evolutionTransform({
				x: 0,
				y: (-1 * context.indicatorHeight)
			}, {
				duration: 150
			});
			context.stopRefreshingTimeout = setTimeout(function(){
				context.indicator.evolutionTransform({
					x: 0,
					y: (-1 * context.indicatorHeight),
					position: 'absolute'
				});
				context.content.evolutionTransform({
					x: 0, y: 0
				}, { duration: 1 });
			}, 300);
		} else {
			context.content.evolutionTransform({
				top: (-1 * context.indicatorHeight),
				left: 0
			});
			context.indicator.evolutionTransform({
				x: 0,
				y: (-1 * context.indicatorHeight),
				position: 'absolute'
			});
			context.content.evolutionTransform({
				x: 0, y: 0
			});
		}
	}

	function measureIndicator(context) {
		var height,
			indicatorHeightInterval;
		return $.Deferred(function(d){
			height = context.indicator.outerHeight();
			if(height == 0) {
				indicatorHeightInterval = setInterval(function() {
					height = context.indicator.outerHeight();
					if(height > 0) {
						clearInterval(indicatorHeightInterval);
						d.resolve(height);
					}
				}, 10);
			} else {
				d.resolve(height);
			}
		}).promise();
	}

	function PullToRefresh (context){
		if(!context)
			return;
		context.enablePan = context.enablePan != undef ? context.enablePan : true;
		context.enabled = true;
		context.indicator = $(context.indicator || '#refresh-indicator');
		context.content = $(context.content || '#refreshable-content');
		context.container = context.container.get(0);

		measureIndicator(context).done(function(height){
			context.indicatorHeight = height;
			context.overflow = context.overflow || 10;
			context.animateClose = context.animateClose != undef? context.animateClose : true;
			context.revealThrottle = context.revealThrottle || 150;
			if(!context.load)
				context.load = function(complete){
					setTimeout(function(){
						complete()
					}, 2000);
				};
			if(!context.reveal)
				context.reveal = function(percent){ };

			context.indicator.evolutionTransform({
				x: 0,
				y: -1 * context.indicatorHeight
			});

			handleEvents(context);
		});

		return {
			enabled: function(isEnabled) {
				if(isEnabled !== undef)
					context.enabled = isEnabled;
				return context.enabled;
			},
			// manually refresh
			refresh: function() {
				if(!context.enabled)
					return;
				if(!context.refreshing) {
					startRefreshing(context);
				}
			}
		};
	}

	return PullToRefresh;

}, jQuery);
 
 
/*
 * Endless Scrolling
 * Internal API
 *
 * Supports:
 *   Showing/Hiding an indicator
 *   Debouncing of scroll bottom events to only load while not loading
 *   Tracking Page Index
 *   Canceling in-progress endless scrolls/race conditions
 *   Prefilling with max attempts
 *   Canceling pre-filling after giving up
 *   Providing illusion of extra speed by pre-showing loading indicator on swipe even though scroll events won't yet fire
 *
 * scrollable.register(name, options)
 *   options:
 *     element: function() { /* lazily returns element / }
 *     container
 *     scrollEndMessage
 *	   load: function(pageIndex, success, error)
 *	   complete: function(content)
 *	   initialPageIndex - default 0
 *	   preFillAttempts - default 5
 *     buildIndicator: function() { }  // callback called to generate indicator element
 *
 * scrollable.unregister(name)
 *
 */
define('scrollable', ['util', 'messaging'], function(util, messaging, $, global, undef) {

	var contexts = {},
		indicators = {};

	function buildScrollableLoadingIndicator(context) {
		if(!indicators[context.region]) {
			indicators[context.region] = context.buildIndicator();
			invisiblyAttachScrollableLoadingIndicator(context);
		}
	}

	function invisiblyAttachScrollableLoadingIndicator(context) {
		indicators[context.region]
			.css({ visibility: 'hidden' })
			.appendTo(context.element());
	}

	function showScrollableLoadingIndicator(context, prefilling) {
		buildScrollableLoadingIndicator(context);
		indicators[context.region]
			.appendTo(context.element())
			.css({ visibility: 'visible' });
	}

	function hideScrollableLoadingIndicator(context) {
		indicators[context.region].css({ visibility: 'hidden' });
	}

	function unRegisterScrollable(region) {
		var context = contexts[region];
		if(context) {
			context.element().off('.scrollable');
			hideScrollableLoadingIndicator(context);
			messaging.unsubscribe(contexts[region].subscription);
			delete contexts[region];
		}
	}

	function loadNextScrollablePage(context, preFilling) {
		// only allow one endless scroll load at a time for a given region
		if(context.currentlyLoading)
			return;
		context.currentlyLoading = true;
		context.pageIndex++;
		showScrollableLoadingIndicator(context, preFilling);
		context.loadCallback(
			context.pageIndex,
			// success callback
			function(content) {
				context.currentlyLoading = false;
				invisiblyAttachScrollableLoadingIndicator(context);
				// if this scroll context is still active, call the complete handler
				if(contexts[context.region] &&
					contexts[context.region].id == context.id)
				{
					context.completeCallback(content);
					// if there was content being shown,
					// potentially check to see if more should be pre-filled
					if(content && $.trim(content).length > 0) {
						// if still not filling the available height, try loading more pages
						if(context.preFillAttempts > 2 &&
							!doesCurrentHeightExceedContainer(context))
						{
							context.preFillAttempts--;
							loadNextScrollablePage(context, preFilling);
						}
					} else {
						// record that pre-filling is done for this context even if it hasn't
						// exceeded the height
						context.disable = true;
					}
				} else {
					context.pageIndex--;
				}
			},
			// error callback
			function() {
				context.pageIndex--;
				context.currentlyLoading = false;
				hideScrollableLoadingIndicator(context.region);
			})
	}

	function doesCurrentHeightExceedContainer(context) {
		context.children = context.children || context.element().children();
		var height = 0;
		for(var i = 0; i < context.children.length; i++){
			height += $(context.children[i]).outerHeight();
		}
		return height >= context.container.height();
	}

	function registerScrollable(options) {
		// unsubscribe any scroll bottom handlers and clear page index context for the region
		unRegisterScrollable(options.region);

		// set up a new endless scrolling context for the region
		var context = {
			pageIndex: options.initialPageIndex,
			subscription: null,
			currentlyLoading: false,
			loadCallback: options.load,
			region: options.region,
			completeCallback: options.complete,
			preFillAttempts: options.preFillAttempts,
			element: options.element,
			container: options.container,
			scrollEndMessage: options.scrollEndMessage,
			buildIndicator: options.buildIndicator,
			// associate id of this scrollable context to ensure it still exists
			id: util.guid()
		};
		contexts[options.region] = context;

		// handle the scroll message and load a scrollable page
		context.subscription = messaging.subscribe(context.scrollEndMessage, function(){
			if(!context.disable)
				loadNextScrollablePage(context);
		});
		// attempt to pre-fill if necessary
		if(!doesCurrentHeightExceedContainer(context)) {
			loadNextScrollablePage(context, true);
		} else {
			// pre-build the loading indicator in a hidden state
			// so that the visual space it requires is already allocated
			// only do this if not pre-filling
			buildScrollableLoadingIndicator(context);
		}
		// if there was a fast swipe, then pre-show the loader
		// since scroll events won't occur during the inertial phase
		// until the scroll completely stops.
		// so this way, the loader will already be visible in case it's
		// needed at that point to avoid the bounce
		// this helps provide an illusion of speed
		context.element().on('swipeup.scrollable', function(){
			// don't show fake loading indicator if we know we're halted...
			if(context.disable)
				return;
			showScrollableLoadingIndicator(context);
		});
	}

	var scrollable = {
		register: function(name, options) {
			options = options || {};
			options.region = name;
			registerScrollable(options);
		},
		unregister: function(name) {
			unRegisterScrollable(name);
		}
	};

	return scrollable;

}, jQuery, window); 
 
/// @name scrolled
/// @category jQuery Event
/// @description Raised when a scrollable container stops scrolling
///
/// ### jQuery.event.special.scrolled
///
/// The scrolled event is raised when a scrollable container stops scrolling, including containers that use inertial scrolling via `-webkit-overflow-scrolling: touch`.
///
/// Raised when:
///
/// * scrolling from constant touch contact (dragging) stops
/// * inertial scrolling stops on its own
/// * inertial scrolling is interrupted
///
/// Inertial scrolling is detected by measuring travel distance and time and inferring inertial scrolling is likely taking place after a touch end. While usually correct, this is prone to an occasional incorrect guess.
///
/// ### Usage
///
///     // handle the 'scrolled' event on a selection
///     $(selection).on('scrolled', function() {
///         // handle event
///     });
///
define('scrolled', function($, global, undef){

	var eventName = 'scrolled';

	function pushPositionToStack(context, position, time) {
		if(context.positionStack.push({ position: position, time: time }) === 4) {
			context.positionStack.shift();
		}
	}

	function calculateVelocityFromPositions(context) {
		if(context.positionStack.length <= 1)
			return 0;
		var distance = context.positionStack[context.positionStack.length - 1].position - context.positionStack[0].position;
		if(distance < 0)
			distance = distance * -1;
		var time = context.positionStack[context.positionStack.length - 1].time - context.positionStack[0].time;
		return distance / time;
	}

	function onPointerStart(context) {
		var triggered = false;
		if(context.momentumScrolling) {
			trigger(context, true);
			triggered = true;
		}
		context.positionStack = [];
		context.momentumScrolling = false;
		if(!triggered)
			pushPositionToStack(context, context.currentPointerPageY, context.now);
	}

	function onPointerMove(context) {
		pushPositionToStack(context, context.currentPointerPageY, context.now);
	}

	function onPointerEnd(context) {
		if(context.positionStack.length <= 1)
			return;
		pushPositionToStack(context, context.currentPointerPageY, context.now);
		context.momentumScrolling = (calculateVelocityFromPositions(context) >= $.event.special.scrolled.defaults.velocityThreshold);
		if(!context.momentumScrolling) {
			trigger(context, false);
		}
	}

	function onScroll(context) {
		if(context.momentumScrolling) {
			trigger(context, true);
		}
	}

	function trigger(context, fromMomentum) {
		context.elm.trigger($.Event(eventName, {
			scrollType: (fromMomentum ? 'momentum' : 'drag')
		}));
		context.positionStack = [];
		context.momentumScrolling = false;
	}

	$.event.special.scrolled = {
		add: function(handle) {
			var elm = $(this);
			if(elm.data('_scrolled_bound'))
				return;

			var context = {
				elm: elm,
				didPointerStart: false,
				didScroll: false,
				didPointerMove: false,
				didPointerEnd: false,
				positionStack: [],
				currentPointerPageY: null,
				now: null,
				momentumScrolling: false,
				lastPointerEndAt: new Date().getTime()
			};

			context.checkInterval = global.setInterval(function(){
				context.now = new Date().getTime();
				if(context.didPointerStart) {
					context.didPointerStart = false;
					onPointerStart(context);
				}
				if(context.didPointerMove) {
					context.didPointerMove = false;
					onPointerMove(context)
				}
				if(context.didPointerEnd) {
					context.didPointerEnd = false;
					onPointerEnd(context)
					context.lastPointerEndAt = new Date().getTime();
				}
				if(context.didScroll) {
					context.didScroll = false;
					if((new Date().getTime() - context.lastPointerEndAt) > 100)
						onScroll(context);
				}
			}, 50);

			context.elm.on('pointerstart', function(e){
				context.didPointerStart = true;
				context.currentPointerPageY = e.pointers[0].pageY;
			});
			context.elm.on('pointermove', function(e){
				context.didPointerMove = true;
				context.currentPointerPageY = e.pointers[0].pageY;
			});
			context.elm.on('scroll', function(e){
				context.didScroll = true;
			});
			context.elm.on('pointerend', function(e){
				context.didPointerEnd = true;
				context.currentPointerPageY = e.pointers[0].pageY;
			});

			elm.data('_scrolled_bound', { context: context });
		},
		teardown: function() {
			var d = $(this).data('_scrolled_bound');
			if (d) {
				global.clearInterval(d.checkInterval);
			}
		}
	}
	$.event.special.scrolled.defaults = {
		velocityThreshold: .2
	};

	return {};

}, jQuery, window);
 
 
/*
 * Scroll Fixing for Mobile Browsers to prevent bouncing
 * Private API
 *
 * scrollfix.preventBounce(container)
 * // monitors whether a container is currently scrolling, inertial or not.
 * // Not 100% foolproof, errs on the side of assuming it's not, as this isn't fully possible to know
 * scrollfix.monitorEffectiveScrollState(container)
 * // Returns the assumed scrolling state
 * scrollfix.effectiveScrollState()  // returns true
 */
define('scrollfix', ['messaging', 'environment', 'scrolled'], function(messaging, environment, scrolled, $, global, undef){

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
	};


	function fixKeyboardHeaderScrolling() {
		var fixHeaderPositionHandle = null;
		var fixed = false;
		var header = $('#header');
		var previousScrollY = 0;
		var bottomPadding;
		var removedOffset = null;
		var originalTopPadding;
		var originalHeaderHeight;
		var extraTopPadding;

		function applyExtraTopPadding() {
			extraTopPadding = $(global).height();
			originalTopPadding = parseInt(header.css('padding-top'), 10);
			originalHeaderHeight = header.outerHeight() - originalTopPadding;

			header.evolutionTransform({
				'padding-top': extraTopPadding + originalTopPadding,
				top: -1 * extraTopPadding
			}, { duration: 0 });
			header.data('_extra_top_padding', extraTopPadding);
		}

		messaging.subscribe('mobile.orientationchange', function(data) {
			applyExtraTopPadding();
			if(fixed)
				fixHeaderPosition();
			else
				unFixHeaderPosition();
		});

		setTimeout(applyExtraTopPadding, 100)

		function offsetFormToAllowForSpacingAtFormBase() {
			// add padding to bottom of form to allow for it to be scrollable
			bottomPadding = bottomPadding || $('<div>&nbsp;</div>').css({
				height: 300,
				display: 'none',
				backgroundColor: 'transparent'
			});
			bottomPadding.appendTo('.slideable:first').show();

			var el = $(document.activeElement);
			// if focused element is positioned such that there's no space between it and the keyboard,
			// then offset the content to allow for space
			if(window.innerHeight - (el.outerHeight(true) + el.offset().top) <= 0) {
				if(removedOffset === null)
					removedOffset = $('#content').css('top');
				$('#content').css({ top: (environment.device == 'ios' ? '20px' : '0px') });
			}
		}

		function unOffsetForm() {
			if(bottomPadding)
				bottomPadding.remove();
			if(removedOffset !== null)
				$('#content').css({ top: removedOffset });
			removedOffset = null;
		}

		function getYScroll() {
			return global.scrollY;
		}

		function fixHeaderPosition(refocus) {
			global.clearTimeout(fixHeaderPositionHandle);
			var newYScroll = getYScroll();
			// long scroll
			if(Math.abs(newYScroll - previousScrollY) > originalHeaderHeight) {
				// down
				if(newYScroll > previousScrollY) {
					header.evolutionTransform({ top: newYScroll - extraTopPadding - originalHeaderHeight }, { duration: 0 })
						.evolutionTransform({ top: newYScroll - extraTopPadding }, { duration: 100 });
				// up
				} else {
					header.evolutionTransform({ top: newYScroll - extraTopPadding }, { duration: 50 });
				}
			// short scroll
			} else {
				header.evolutionTransform({ top: newYScroll - extraTopPadding }, { duration: 50 });
			}
			previousScrollY = newYScroll;
			fixed = true;
			if(!refocus) {
				offsetFormToAllowForSpacingAtFormBase();
			}
		}

		function unFixHeaderPosition() {
			global.clearTimeout(fixHeaderPositionHandle);
			// if page was scrolled, hide the header place it just out of final position, and then slide it back in
			if(previousScrollY >= originalHeaderHeight) {
				header.css({ visibility: 'none' })
					.evolutionTransform({ top: -1 * originalHeaderHeight - extraTopPadding }, { duration: 0 })
					.evolutionTransform({ top:  -1 * extraTopPadding }, { duration: 50 });
			// otherwise just hide transition the header back to where it should be to avoid making movement
			// more interrupted than it already would have been.
			} else {
				header.evolutionTransform({ top: -1 * extraTopPadding }, { duration: 150 });
			}
			previousScrollY = 0;
			fixed = false;
			unOffsetForm();
		}

		messaging.subscribe('mobile.keyboard.open', messaging.GLOBAL_SCOPE, function() {
			global.clearTimeout(fixHeaderPositionHandle);
			fixHeaderPositionHandle = global.setTimeout(function(){ fixHeaderPosition(false) }, 50);
		});
		messaging.subscribe('mobile.keyboard.close', messaging.GLOBAL_SCOPE, unFixHeaderPosition);
		$('#content').on('focus', 'input, select, textarea', function(e) {
			if(fixed) {
				global.clearTimeout(fixHeaderPositionHandle);
				fixHeaderPositionHandle = global.setTimeout(function(){ fixHeaderPosition(true) }, 1);
			}
		});
		messaging.subscribe('mobile.keyboard.opened', messaging.GLOBAL_SCOPE, function() {
		});
		messaging.subscribe('mobile.keyboard.closed', messaging.GLOBAL_SCOPE, function(){
		});
	};

	var scrolling = false;
	function monitorEffectiveScrollState(selection) {
		var scrolledTimeout;
		$(selection).on({
			pointermove: function() {
				global.clearTimeout(scrolledTimeout);

				if(!scrolling) {
					scrolling = true;
				}
			},
			scrolled: function(e) {
				if(e.scrollType === 'momentum') {
					global.clearTimeout(scrolledTimeout);
					scrolledTimeout = global.setTimeout(function(){
						scrolling = false;
					}, 310);
				} else {
					global.clearTimeout(scrolledTimeout);
					scrolling = false;
				}
			}
		});
	}

	var api = {
		adaptBannerAndFormScrollPositionOnKeyboardFocus: function() {
			fixKeyboardHeaderScrolling();
		},
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
		},
		monitorEffectiveScrollState: function(selection) {
			if(environment.device == 'ios') {
				monitorEffectiveScrollState(selection);
			}
		},
		isScrolling: function(difference) {
			if(difference !== undef) {
				scrolling = difference
			}
			if(environment.device == 'ios') {
				return scrolling;
			} else {
				return false;
			}
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
define('sheet', ['scrollfix', 'messaging'], function(scrollfix, messaging, $, global, undef){

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
				position: 'absolute',
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
				position: 'absolute',
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
		context.sheet.on('click', 'a', function(e){
			e.preventDefault();
			var link = $(this),
				href = link.attr('href') || link.closest('[href]').attr('href');
			if(href && href.length > 1 && $.telligent && $.telligent.evolution && $.telligent.evolution.mobile) {
				$.telligent.evolution.mobile.load(href);
				return false;
			}
		})

		handleEvents(context);

		// ensure that it can't be scrolled around
		scrollfix.fix(context.backDrop);
		scrollfix.fix(context.sheet);
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
		if(context.suppress)
			return;

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
		messaging.subscribe('mobile.orientationchange', messaging.GLOBAL_SCOPE, function(){
			global.setTimeout(function(){
				setDimensions(context);
			}, 300)
		})

		// suppress display of sheets while keyboard openened
		messaging.subscribe('mobile.keyboard.open', messaging.GLOBAL_SCOPE, function(){
			context.suppress = true;
		});
		messaging.subscribe('mobile.keyboard.close', messaging.GLOBAL_SCOPE, function(){
			context.suppress = false;
		});

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

}, jQuery, window) 
 
/*
 * UI Shell
 * Private API
 *
 * var shell = new Shell(options);
 *
 * options:
 *
 *   enablePan: true
 *   doubleTapHeaderToScroll: true
 *
 *   // Elements
 *   viewport
 *   navigationWrapper
 *   gutter
 *   contentWrapper
 *   header
 *   content
 *   refreshIndicator
 *   refreshableContent
 *
 *   // Animation settings
 *   easing: 'cubic-bezinavigationOpenPercenter(0.160, 0.060, 0.450, 0.940)'
 *   navigationOpenPercent: 0.8
 *   navigationOpenDuration: 275
 *   navigationClosedOffsetPercent: .15
 *   navigationClosedZoom: 0
 *
 *   // Sheet Settings
 *   sheetMaxHeightPerent: 0.7
 *   sheetCssClass: 'sheet'
 *   sheetBackgroundColor: '#333'
 *   sheetBackgroundOpacity: 0.7
 *
 *   // Pull to Refresh Settings
 *   refreshOverflow: 10 // extra pixels needed to pull past indicator's height to trigger refresh (default 20)
 *   refreshRevealThrottle: 10 // min milliseconds between 'reveal' callbacks (default 10)
 *
 *   // Callbacks
 *
 *   onNavigationOpening(fn)
 *   onNavigationOpened(fn)
 *   onNavigationClosing(fn)
 *   onNavigationClosed(fn)
 *
 *   onSheetOpening(fn)
 *   onSheetOpened(fn)
 *   onSheetClosing(fn)
 *   onSheetClosed(fn)
 *
 *   onRefreshRevealing(fn)
 *   onRefreshing(fn)
 *
 *   onKeyboardOpening(fn)
 *   onKeyboardClosing(fn)
 *   onKeyboardOpened(fn)
 *   onKeyboardClosed(fn)
 *
 * Messages
 *   mobile.content.scrollTop
 *   mobile.content.scrollBottom
 *   mobile.navigation.scrollTop
 *   mobile.navigation.scrollBottom
 *
 * Methods
 *   navigable([navigable])			true/false, returns current
 *   refreshable([refreshable]) 	true/false, returns current
 *   navigationVisible([visible])	true/false, returns current
 *   navigationScrollTop(to)			element, y, nothing
 *   contentScrollTop(to)				element, y, nothing
 *   setContent(content, options)  accepts DOM or HTML and returns DOM
 *     options
 *       animate: fade, left, right
 *       duration: 275
 *   displayMessage(content, options)
 *     content is text or selection - when falsey, hides any current message
 *     options
 *       cssClass
 *       disappearAfter
 *   alert(message, callback)
 *     displays the provided message and executes the callback when the message has been dismissed
 *   confirm(message, callback)
 *     displays the message and executes the callback with a single boolean parameter identifying if the message was accepted positively
 *   debug(message)   // shows a debug message in a moveable debug panel
 *   displaySheet(options) // displays either a list of links/actions (with optional cancel) or arbitrary contnent
 *     options
 *       links: array of link objects
 *       content: when links aren't provided, arbitrary content can be shown. string, DOM, or jQuery selection.
 *   hideSheet()
 *   showLoading(options)
 *     options
 *       cssClass: optional css class to apply to div being shown as an overlay
 *       content: optional content to show in loading indicator
 *       opacity: optional target opacity - default: 1
 *   hideLoading()
 *   refresh()  // manually call refresh
 *   scrollable(options) // sets a region to be endlessly scrollable
 *     options:
 *       region: 'content' || 'navigation'  // required
 *       load: function(pageIndex, complete, error)    // required
 *       complete: function(content)    // required
 *       initialpageIndex: 0
 *       preFillAttempts: 5
 *   setClass: function(className) // adds a classname to the overall viewport
 *   navigationContent: function() // returns current navigation content
 *   content: function() // current content
 *   viewport: function() // returns viewport wrapper
 */

/// @name mobile.content.scrollTop
/// @category Client Message
/// @description Published when content is scrolled to the top of the content area
///
/// ### mobile.content.scrollTop Message
///
/// [Client-side message](@messaging) Published when content is scrolled to the top of the content area
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.scrollTop', function(data) {
///         // handle the event
///     });
///

/// @name mobile.content.scrollBottom
/// @category Client Message
/// @description Published when content is scrolled to the bottom of the content area
///
/// ### mobile.content.scrollBottom Message
///
/// [Client-side message](@messaging) Published when content is scrolled to the bottom of the content area
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.content.scrollBottom', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.scrollTop
/// @category Client Message
/// @description Published when the navigation bar's content is scrolled to the top
///
/// ### mobile.navigation.scrollTop Message
///
/// [Client-side message](@messaging) Published when the navigation bar's content is scrolled to the top
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.scrollTop', function(data) {
///         // handle the event
///     });
///

/// @name mobile.navigation.scrollBottom
/// @category Client Message
/// @description Published when the navigation bar's content is scrolled to the bottom
///
/// ### mobile.navigation.scrollBottom Message
///
/// [Client-side message](@messaging) Published when the navigation bar's content is scrolled to the bottom
///
/// ### Usage
///
///     $.telligent.evolution.messaging.subscribe('mobile.navigation.scrollBottom', function(data) {
///         // handle the event
///     });
///

define('shell', ['refresh', 'scrollfix', 'util', 'actionSheet', 'sheet', 'messaging', 'environment', 'scrollable', 'messagelinkhandler', 'keyboardShim'],
	function(PullToRefresh, scrollFix, util, ActionSheet, Sheet, messaging, environment, scrollable, MessageLinkHandler, keyboardShim, $, global, undef)
{
	var messages = {
		contentScrollTop: 'mobile.content.scrollTop',
		contentScrollBottom: 'mobile.content.scrollBottom',
		navigationScrollTop: 'mobile.navigation.scrollTop',
		navigationScrollBottom: 'mobile.navigation.scrollBottom'
	}

	var Shell = function(context) {

		// local state
		var fullWidth,
			fullHeight,
			openPercent,
			openWidth,
			opened,
			fullDuration,
			openThreshold,
			easing,
			startX,
			offset,
			gutterClosedOffset,
			gutterClosedScale,
			isWindows,
			navigable = true,
			pullToRefresh,
			openedTimeout,
			closedTimeout,
			minContentHeight,
			contentTimeout,
			sheet,
			actionSheet,
			focused,
			messageTimeout,
			loadingIndicatorShown = false,
			enablePan = context.enablePan != undef ? context.enablePan : true,
			easing = context.easing || 'cubic-bezier(0.160, 0.060, 0.450, 0.940)',
			navigationOpenPercent = context.navigationOpenPercent || 0.8,
			navigationOpenDuration = context.navigationOpenDuration || 275,

			navigationClosedOffsetPercent = context.navigationClosedOffsetPercent || -0.2,//0.15,
			navigationClosedZoom = context.navigationClosedZoom || 0.00,//0.07,
			minOpacity = context.minOpacity || 1.0,//0.4,

			sheetMaxHeightPerent = context.sheetMaxHeightPerent || 0.7,
			sheetCssClass = context.sheetCssClass || 'sheet',
			sheetBackgroundColor = context.sheetBackgroundColor || '#333',
			sheetBackgroundOpacity = context.sheetBackgroundOpacity || 0.7,

			refreshOverflow = context.refreshOverflow || 10,
			refreshRevealThrottle = context.refreshRevealThrottle || 10,

			doubleTapHeaderToScroll = context.doubleTapHeaderToScroll != undef ? context.doubleTapHeaderToScroll : true,

			messageContainer,
			debugContainer,
			debugState = 'closed',
			debugInited = false,

			loadingIndicator,
			defaultAlert = global.alert,
			settingContent = false;

		// elements
		var header = $(context.header),
			viewport = $(context.viewport),
			gutter = $(context.gutter),
			content = $(context.content),
			contentWrapper = $(context.contentWrapper),
			gutterWrapper = $(context.gutterWrapper),
			gutterContentWrapper = $(context.gutterContentWrapper),
			gutterContent = $(context.gutterContent),
			refreshIndicator = $(context.refreshIndicator),
			refreshableContent = $(context.refreshableContent),
			debugContainer = $(context.debugContainer);

		function initDimensions() {
			fullWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width),
			fullHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height),
			openPercent = navigationOpenPercent,
			openWidth = fullWidth * openPercent,
			opened = false,
			fullDuration = navigationOpenDuration,
			openThreshold = fullWidth / 2,
			startX = null,
			offset = null,
			gutterClosedOffset = openWidth * navigationClosedOffsetPercent,
			gutterClosedScale = navigationClosedZoom,
			minContentHeight = ($(window).height() - header.outerHeight() + 10),
			gutterWrapper.css({ width: openWidth });
			refreshableContent.css({ minHeight: minContentHeight });

			if(!messageContainer) {
				messageContainer = $(document.createElement('div'))
					.html('something')
					.appendTo(contentWrapper)
					.evolutionTransform({
						x: 0, y: -300
					});
				scrollFix.fix(messageContainer);
			}

			if(!loadingIndicator) {
				loadingIndicator = $(document.createElement('div'))
					.css({ opacity: 0.01 })
					.appendTo(contentWrapper);
				scrollFix.fix(loadingIndicator);
			}

			// yes, this is bad.
			isWindows = navigator.userAgent.match(/IEMobile/i);
		}

		function revealGutter(percent, duration, revealEasing) {
			if(percent == 0 && context.onNavigationOpening) {
				context.onNavigationOpening();
			}
			if(!navigable)
				return;
			// windows phone is really buggy with css animation...
			if(isWindows) {
				// if closing, we unforunatley have to rely on js tweens.
				if(percent < 1 && contentWrapper.css('left') != '0px') {
					contentWrapper.animate({ left: 0 }, { duration: duration });
				} else {
					// no gutter animation on windows
					contentWrapper.evolutionTransform({
							x: openWidth * percent,
							y: 0
						},{
							duration: duration,
							easing: revealEasing
						});
					// a bug in windows phone animation makes the content wrapper
					// jump out too far to the right after the animation is done.
					// as a workaround, remove the transform after the animation is over
					// and switch to a pure css left offset
					if(percent === 1) {
						setTimeout(function(){
							contentWrapper
								.evolutionTransform({ x: 0, y: 0 }, { duration: 0 })
								.css({ left: openWidth });
						}, duration);
					}
				}
			} else {
				revealEasing = revealEasing || easing;
				contentWrapper.evolutionTransform({
						x: openWidth * percent,
						y: 0
					},{
						duration: duration,
						easing: revealEasing
					});
				gutterWrapper.evolutionTransform({
						x: (gutterClosedOffset * (1 - percent)),
						y: 0,
						scale: 1 - gutterClosedScale * (1 - percent),
						// never make it fully opaque or fully transparent as
						// this triggers webkit layout bugs
						opacity: 0.99 - ((1 - minOpacity) * (1 - percent))
					}, {
						duration: duration,
						easing: revealEasing
					});
			}
		}

		function open(duration) {
			if(!navigable)
				return;
			opened = true;

			if(context.onNavigationOpening) {
				context.onNavigationOpening();
			}
			if(context.onNavigationOpened) {
				clearTimeout(openedTimeout);
				openedTimeout = setTimeout(function(){
					if(opened)
						context.onNavigationOpened();
				}, duration + 1);
			}

			revealGutter(1.0, duration);
			scrollFix.fix(contentWrapper);
			scrollFix.unfix(gutterWrapper);
		}

		function close(duration) {
			if(!navigable)
				return;
			opened = false;

			if(context.onNavigationClosing) {
				context.onNavigationClosing();
			}
			if(context.onNavigationClosed) {
				clearTimeout(closedTimeout);
				closedTimeout = setTimeout(function(){
					if(!opened)
						context.onNavigationClosed();
				}, duration + 1);
			}

			revealGutter(0, duration);
			scrollFix.unfix(contentWrapper);
			scrollFix.fix(gutterWrapper);
		}

		function registerGutterRevealingEvents(emitter) {
			if(enablePan) {
				emitter.on({
					panstart: function(e){
						// ignore the event if working with an input
						if(e.target.nodeName == 'TEXTAREA' || e.target.nodeName == 'INPUT')
							return;
						if((!opened && e.direction == 'right') || (opened && e.direction == 'left')) {
							scrollFix.fix(contentWrapper);
							scrollFix.fix(gutterWrapper);
						}
						if(opened) {
							startX = e.pageX;
						} else {
							startX = e.pageX;
						}
					},
					pan: function(e){
						// ignore the event if working with an input
						if(e.target.nodeName == 'TEXTAREA' || e.target.nodeName == 'INPUT')
							return;
						offset = e.pageX - startX;
						if(opened)
							offset = openWidth + offset;
						if(offset <  0 || offset > openWidth || e.direction === 'up' || e.direction === 'down')
							return;
						revealGutter(offset / openWidth, 10, 'linear');
					},
					panend: util.debounce(function(e) {
						// ignore the event if working with an input
						if(e.target.nodeName == 'TEXTAREA' || e.target.nodeName == 'INPUT')
							return;
						// if this was panning in a scrolling ui-links, ignore
						var target = $(e.target);
						if(target.is('.ui-links') || target.closest('.ui-links').length > 0)
							return;

						offset = e.pageX - startX;
						if(opened)
							offset = openWidth + offset;
						if(offset <  0 || e.direction === 'up' || e.direction === 'down')
							return;
						if(offset > openThreshold) {
							var openedPercent = offset / fullWidth;
							var remainingPercent = openedPercent > .5 ? 1 - openedPercent : openedPercent;
							// adjust the easing time relative to how far it has to travel
							open(.5 * fullDuration + (remainingPercent * .5 * fullDuration))
						} else {
							var openedPercent = offset / fullWidth;
							var remainingPercent = openedPercent > .5 ? 1 - openedPercent : openedPercent;
							// adjust the easing time relative to how far it has to travel
							close(.5 * fullDuration + (remainingPercent * .5 * fullDuration));
						}
					})
				});
			}
			emitter.on({
				swiperight: function(e){
					// if this was swiping in a scrolling ui-links, ignore
					var target = $(e.target);
					if(target.is('.ui-links') || target.closest('.ui-links').length > 0)
						return;

					open(fullDuration * openPercent * .75);
				},
				swipeleft: function(e){
					close(fullDuration * openPercent * .75);
				}
			});
		}

		// workaround for Android Browser issue to allow
		// display: blocked content to still be scrollabe after being updated
		function correctContentDisplay() {
			if(environment.device == 'android') {
				refreshableContent.css({ display: 'inline' });
				setTimeout(function(){
					refreshableContent.css({ display: 'block' });
				}, 10)
			}
		}

		function setContent(content, options) {
			return $.Deferred(function(d){
				var currentContent;

				// if content setting is currently in progress (quick navigation),
				// treat this like there's no anmiation and just show immediately
				if(settingContent) {
					options.animate = false;
					clearTimeout(contentTimeout);
					refreshableContent.empty();
					currentContent = $(document.createElement('div'))
						.addClass('slideable')
						.css({ minHeight: minContentHeight })
						.appendTo(refreshableContent);
					d.resolve();
				}

				settingContent = true;
				currentContent = refreshableContent.find('.slideable:first');
				var currentContentHeight = refreshableContent.outerHeight();

				if(options && options.animate) {
					var duration = options.duration || fullDuration;
					var newContent = $(document.createElement('div'));

					switch(options.animate) {
						case 'left':
							newContent.addClass('slideable')
								.appendTo(refreshableContent)
								.html(content)
								.css({ minHeight: minContentHeight })
								.evolutionTransform({ x: fullWidth, y: -1 * currentContentHeight })
								.evolutionTransform({ x: 0, y: -1 * currentContentHeight }, {
									duration: duration,
									easing: easing,
									complete: function() {
										newContent.evolutionTransform({ x: 0, y: 0 })
										currentContent.remove();
										correctContentDisplay();
										settingContent = false;
										d.resolve();
									}
								});
							currentContent
								.evolutionTransform({ x: -1 * fullWidth, y: 0 },
									{ duration: duration, easing: easing });
							break;
						case 'right':
							newContent.addClass('slideable')
								.appendTo(refreshableContent)
								.html(content)
								.css({ minHeight: minContentHeight })
								.evolutionTransform({ x: -1 * fullWidth, y: -1 * currentContentHeight })
								.evolutionTransform({ x: 0, y: -1 * currentContentHeight }, {
									duration: duration,
									easing: easing,
									complete: function() {
										newContent.evolutionTransform({ x: 0, y: 0 })
										currentContent.remove();
										correctContentDisplay();
										settingContent = false;
										d.resolve();
									}
								});
							currentContent
								.evolutionTransform({ x: fullWidth, y: 0 },
									{ duration: duration, easing: easing });

							break;
						case 'dissolve':
						default:
							newContent.addClass('slideable')
								.appendTo(refreshableContent)
								.html(content)
								.css({ minHeight: minContentHeight, opacity: 0 })
								.evolutionTransform({ x: 0, y: -1 * currentContentHeight, opacity: 0 })
								.evolutionTransform({ x: 0, y: -1 * currentContentHeight, opacity: 1 }, {
									duration: duration / 2,
									easing: easing,
									complete: function() {
										newContent.evolutionTransform({ x: 0, y: 0, opacity: 1.0 });
										currentContent.remove();
										correctContentDisplay();
										settingContent = false;
										d.resolve();
									}
								});
							currentContent
								.evolutionTransform({ opacity: 0.01 },
									{ duration: duration / 2, easing: easing });
					}
				} else {
					// no animation
					currentContent.html(content);
					correctContentDisplay();
					settingContent = false;
					d.resolve();
				}

			}).promise();
		}

		function hideMessage() {
			messageContainer
				.evolutionTransform({ x: 0, y: -1 * messageContainer.outerHeight() },
					{ duration: fullDuration, easing: easing });
		}

		function showMessage(message, cssClass) {
			messageContainer.evolutionTransform({ x: 0, y: -300 });
			messageContainer.empty().append(message);
			if(cssClass) {
				messageContainer.removeClass().addClass(cssClass);
			}
			messageContainer
				.evolutionTransform({ x: 0, y: -1 * messageContainer.outerHeight() })
				.evolutionTransform({ x: 0, y: 0 },
					{ duration: fullDuration, easing: easing });
		}

		function alert(message, callback) {
			if (global.navigator.notification !== undefined && global.navigator.notification.alert !== undefined) {
				global.navigator.notification.alert(message, (callback === undefined ? function() { } : callback), '');
			} else {
				defaultAlert(message);
				if (callback) {
					callback();
				}
			}
		}

		function confirm(message, callback) {
			if (global.navigator.notification !== undefined && global.navigator.notification.confirm !== undefined) {
				global.navigator.notification.confirm(message, function(b) { if(callback !== undefined) { callback(b==1) } }, '');
			} else {
				var result = global.confirm(message);
				if (callback) {
					callback(result);
				}
			}
		}

		function displayMessage(message, options) {
			if(!message) {
				hideMessage();
				return;
			}
			clearTimeout(messageTimeout);
			var cssClass = null;
			if(options) {
				cssClass = options.cssClass;
				if(options.disappearAfter) {
					messageTimeout = setTimeout(function(){
						clearTimeout(messageTimeout);
						hideMessage();
					}, options.disappearAfter)
				}
			} else {
				// default to 5 second disappear
				messageTimeout = setTimeout(function(){
					clearTimeout(messageTimeout);
					hideMessage();
				}, 5000)
			}
			showMessage(message, cssClass);
		}

		function showLoadingIndicator(options) {
			if(loadingIndicatorShown)
				return;
			loadingIndicatorShown = true;
			var targetOpacity = 0.99;
			if(options) {
				if(options.cssClass) {
					loadingIndicator.addClass(options.cssClass);
				}
				if(options.content) {
					loadingIndicator.empty().append(options.content);
				}
				if(options.opacity) {
					targetOpacity = options.opacity;
				}
			}
			var headerHeight = header.outerHeight();
			var extraTopPadding = (header.data('_extra_top_padding') || 0);
			loadingIndicator.css({
				position: 'absolute',
				top: headerHeight - extraTopPadding,
				left: 0,
				bottom: 0,
				right: 0,
				display: 'block'
			});
			loadingIndicator.evolutionTransform({
				opacity: targetOpacity
			}, {
				duration: fullDuration,
				easing: easing
			});
		}

		function hideLoadingIndicator() {
			loadingIndicatorShown = false;
			loadingIndicator.evolutionTransform({ opacity: 0 }, {
				duration: fullDuration,
				easing: easing,
				complete: function() {
					loadingIndicator.css({
						opacity: 0.01,
						top: -5000,
						bottom: 'auto'
					});
				}
			});
		}

		function positionDebug(openPercent) {
			var position = (1 - openPercent) * fullHeight;
			debugContainer.evolutionTransform({ x: 0, y: position },
				{ duration: fullDuration / 2, easing: easing });
		}

		function initDebug() {
			if(debugInited)
				return;
			debugInited = true;
			debugContainer.css({ left: 0 })
				.evolutionTransform({ x: 0, y: fullHeight + 20 }, { duration: 0 });

			debugContainer.on('swipedown', function(){
				switch(debugState) {
					case 'closed':
						break;
					case 'min':
						debugState = 'closed';
						positionDebug(-2);
						debugContainer.hide();
						break;
					case 'open':
						debugState = 'min';
						positionDebug(1/4);
						break;
					case 'max':
						debugState = 'open';
						positionDebug(3/4);
						break;
				}
			});
			debugContainer.on('swipeup', function(){
				switch(debugState) {
					case 'closed':
						debugState = 'min';
						positionDebug(1/4);
						debugContainer.hide();
						break;
					case 'min':
						debugState = 'open';
						positionDebug(3/4);
						break;
					case 'open':
						debugState = 'max';
						positionDebug(1);
						break;
					case 'max':
						break;
				}
			});
		}

		function showDebugMessage(message) {
			initDebug();
			if(debugState === 'closed') {
				debugContainer.show();
				debugState = 'min';
				positionDebug(1/4);
			}
			if(global.console && global.console.log) {
				global.console.log(message);
			}
			debugContainer.prepend('<span>' + message + '</br /></span>');
		}

		function handleKeyboardRaisingEvents() {
			keyboardShim.handleVisibilityChange({
				container: content,
				onShow: function() {
					if(context.onKeyboardOpening)
						context.onKeyboardOpening();
				},
				onHide: function() {
					if(context.onKeyboardClosing)
						context.onKeyboardClosing();
				},
				onShown: function() {
					if(context.onKeyboardOpened)
						context.onKeyboardOpened();
				},
				onHidden: function() {
					if(context.onKeyboardClosed)
						context.onKeyboardClosed();
				}
			})
		}

		function blurFocusedElement() {
			if ($(document.activeElement).is('input, textarea')) {
				document.activeElement.blur();
			}
		}

		function handleKeyboardBlurringEvents() {
			// android already has os-level keyboard hiding/closing
			if(environment.device == 'android')
				return;
			gutter.on('pointerstart', blurFocusedElement);
		}

		function handleUnregisteringEvents() {
			if(!scrollable)
				return;
			// when content or navigation is loading, unregister any currently-registered
			// endless scrollable instances
			messaging.subscribe('mobile.content.loading', function(){
				scrollable.unregister('content');
			});
			messaging.subscribe('mobile.navigation.loading', function(){
				scrollable.unregister('navigation');
			});
		}

		function publishContentScrollTop() {
			messaging.publish(messages.contentScrollTop);
		}

		function publishContentScrollBottom(e) {
			if(content.get(0).scrollTop > 10)
				messaging.publish(messages.contentScrollBottom);
		}

		function publishNavigationScrollTop() {
			messaging.publish(messages.navigationScrollTop);
		}

		function publishNavigationScrollBottom(e) {
			if(gutter.get(0).scrollTop > 10)
				messaging.publish(messages.navigationScrollBottom);
		}

		function handleScrollBoundaryEvents() {
			if($.event.special.scrolltop)
				content.on('scrolltop', publishContentScrollTop);
			if($.event.special.scrollend)
				content.on('scrollend', publishContentScrollBottom);
			if($.event.special.scrolltop)
				gutter.on('scrolltop', publishNavigationScrollTop);
			if($.event.special.scrollend)
				gutter.on('scrollend', publishNavigationScrollBottom);
		}

		// prevent bouncing
		scrollFix.preventBounce(gutter);
		scrollFix.preventBounce(content);
		scrollFix.fix(debugContainer);
		scrollFix.fix(header);

		// set up initial dimensions, and re-calc on orient change
		initDimensions();
		messaging.subscribe('mobile.orientationchange', messaging.GLOBAL_SCOPE, function(){
			setTimeout(function(){
				initDimensions();
			}, 300);
		});
		initDebug();

		// handle gestures
		registerGutterRevealingEvents(contentWrapper);
		registerGutterRevealingEvents(gutterWrapper);

		pullToRefresh = new PullToRefresh({
			enablePan: enablePan,
			container: content,
			indicator: refreshIndicator,
			content: refreshableContent,
			overflow: refreshOverflow,
			revealThrottle: refreshRevealThrottle,
			revealStart: function() {
				if(context.onRefreshRevealStart)
					context.onRefreshRevealStart();
			},
			reveal: function(percent) {
				if(context.onRefreshRevealing)
					context.onRefreshRevealing(percent);
			},
			load: function(complete) {
				if(context.onRefreshing)
					context.onRefreshing(complete);
			}
		});

		sheet = new Sheet({
			enablePan: enablePan,
			parent: viewport,
			maxHeightPerent: sheetMaxHeightPerent,
			cssClass: sheetCssClass,
			backgroundColor: sheetBackgroundColor,
			backgroundOpacity: sheetBackgroundOpacity,
			animationDuration: fullDuration * 2/3,
			animationEasing: easing,
			onOpening: context.onSheetOpening,
			onOpened: context.onSheetOpened,
			onClosing: context.onSheetClosing,
			onClosed: context.onSheetClosed
		});

		actionSheet = new ActionSheet({
			sheet: sheet
		});

		handleScrollBoundaryEvents();
		handleKeyboardRaisingEvents();
		handleUnregisteringEvents();
		handleKeyboardBlurringEvents();

		global.alert = function(message) { alert(message, null); };

		$.telligent.evolution.notifications.show = function(message, options) {
			displayMessage(message, {
				disappearAfter: options.duration || 5000,
				cssClass: options.type || 'success'
			});
		};

		// double tap to scroll header
		if(doubleTapHeaderToScroll) {
			header.on('doubletap', function(){
				content.animate({
					scrollTop: 0
				}, { duration: fullDuration });
			});
		}
		// also handle statusTap taps to navigate back to the top
		// https://github.com/martinmose/cordova-statusTap/blob/0815259b749828cce12db6f2f88832bb21d36627/README.md)
		if(global.addEventListener){
			global.addEventListener('statusTap', function() {
				content.animate({
					scrollTop: 0
				}, { duration: fullDuration });
			});
		}

		return {
			navigable: function(isNavigable) {
				if(isNavigable !== undef)
					navigable  = isNavigable;
				return navigable;
			},
			refreshable: function(isRefreshable) {
				return pullToRefresh.enabled(isRefreshable);
			},
			navigationVisible: function(visible) {
				if(visible !== undef) {
					if(visible && !opened) {
						open(fullDuration * openPercent);
					} else if(!visible && opened) {
						close(fullDuration * openPercent);
					}
				}
				return opened;
			},
			navigationScrollTop: function(to) {
				if(to !== undef && isNaN(to)) {
					to = $(to).offset().top;
				}
				gutter.scrollTop(to);
				return gutter.scrollTop();
			},
			contentScrollTop: function(to) {
				if(to !== undef && isNaN(to)) {
					var headerHeight = header.outerHeight();
					var extraTopPadding = (header.data('_extra_top_padding') || 0);
					to = $(to).offset().top - (headerHeight - extraTopPadding + 10);
				}

				content.scrollTop(to);
				return content.scrollTop();
			},
			setContent: function(content, options) {
				return setContent(content, options);
			},
			displayMessage: function(message, options) {
				displayMessage(message, options);
			},
			alert: function(message, callback) {
				alert(message, callback);
			},
			confirm: function(message, callback) {
				confirm(message, callback);
			},
			debug: function(message) {
				showDebugMessage(message);
			},
			displaySheet: function(options) {
				options = options || {};
				if(options.links) {
					actionSheet.show({
						links: options.links
					});
				} else if(options.content) {
					sheet.show(options.content);
				}
			},
			hideSheet: function() {
				sheet.hide();
			},
			showLoading: function(options) {
				showLoadingIndicator(options);
			},
			hideLoading: function() {
				hideLoadingIndicator();
			},
			refresh: function() {
				pullToRefresh.refresh();
			},
			setClass: function(className) {
				context.viewport.removeClass();
				if(className)
					context.viewport.addClass(className);
			},
			navigationContent: function() {
				return gutterContent;
			},
			content: function() {
				return refreshableContent.find('.slideable:first');
			},
			contentWrapper: function() {
				return refreshableContent;
			},
			viewport: function() {
				return viewport;
			},
			scrollable: function(options) {
				if(!scrollable || !options || !options.load || !options.complete)
					return;

				var name = options.region || 'content';
				options.initialPageIndex = options.initialPageIndex || 0;
				options.preFillAttempts = options.preFillAttempts || 5;
				if(name == 'content') {
					options.container = content;
					options.element = function() {
						return refreshableContent.find('.slideable:first');
					};
					options.scrollEndMessage = messages.contentScrollBottom;
				} else {
					options.container = gutter;
					options.element = function() {
						return gutterContent;
					};
					options.scrollEndMessage = messages.navigationScrollBottom;
				}
				options.buildIndicator = function() {
					return $('<div class="scrollable-loading-indicator"><span class="icon cw"></span></div>');
				};

				scrollable.register(name, options)
			}
		};
	};

	return Shell;

}, jQuery, window); 
 
/* Storage
 * Internal API
 *
 * Enables storing and retrieving objects from serialized storage.
 * Keeps storage user-specific
 * When anonymous, only stores across current session
 */

define('storage', function($, global){

	var contextualStore = $.telligent.evolution.user.accessing.isSystemAccount
		? global.sessionStorage
		: global.localStorage;

	function addUserToKey(key) {
		return $.telligent.evolution.user.accessing.id + ':' + key;
	}

	function addNameSpaceToKey(key) {
		return 'mobile' + ':' + key;
	}

	return {
		set: function(key, obj) {
			if (!contextualStore) { return; }
			contextualStore.setItem(addNameSpaceToKey(addUserToKey(key)), JSON.stringify(obj));
		},
		get: function(key) {
			if (!contextualStore) { return; }
			return JSON.parse(contextualStore.getItem(addNameSpaceToKey(addUserToKey(key))));
		},
		del: function(key) {
			if (!contextualStore) { return; }
			contextualStore.removeItem(addNameSpaceToKey(addUserToKey(key)));
		},
		empty: function() {
			if (!contextualStore) { return; }
			contextualStore.clear();
		}
	};

}, jQuery, window);
 
 
/*
 * Mobile-friendly override of the touchEventAdapter
 * Also handles ensuring that programmatic tap-based .focus() doesn't double-focus when a subsequent native is raised
 *
 * Unfortunately, mobile cannot override core's adapter using $.telligent.evolution._SUPPRESS_TOUCH_CLICK_EVENTS since
 * core checks this value too early for mobile to set (before $ is even available to mobile be overriden).
 * Instead, mobile is temporarily setting window.parent to {} to trick core into thinking it's in an iframe,
 * and thus it's not run. And then in this overriding adapter, window.parent is re-set to window
 */
define('touchEventAdapter', ['util'], function(util, $, global, undef){

	// mobile hack. see above
	global.parent = global;

	var preventAllTriggers = false;
	var modalEventTriggerDebounceDuration = 250;

	var hasTouchEvents = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
	var forceRemap = '_evolutionForceTouchRemap' in window;
	var suppressTouchMouseEvents = $.telligent && $.telligent.evolution && $.telligent.evolution._SUPPRESS_TOUCH_MOUSE_EVENTS;
	var suppressTouchClickEvents = $.telligent && $.telligent.evolution && $.telligent.evolution._SUPPRESS_TOUCH_CLICK_EVENTS;
	var isEmbedded = global != global.parent;

	var isChrome = /chrom(e|ium)/.test(navigator.userAgent.toLowerCase());
	var isAndroid = /android/.test(navigator.userAgent.toLowerCase());
	var isWindows = /windows nt/.test(navigator.userAgent.toLowerCase());

	var hasNativeMouseEvents = ('MouseEvent' in window) && (!('ontouchstart' in window) || isWindows);
	var chromeVersion = parseInt((/Chrome\/([0-9]+)/.exec(navigator.userAgent) || ['0','0'])[1], 10);
	var viewPortIsDeviceWidth = document.querySelector && document.querySelector('meta[name=viewport][content*="width=device-width"]') !== undef;
	var viewPortNotUserScalable = document.querySelector && document.querySelector('meta[name=viewport][content*="user-scalable=no"]') !== undef;

	function isFormInput(el) {
		return (el.nodeName == 'INPUT' || el.nodeName == 'TEXTAREA' || el.nodeName == 'SELECT' || el.nodeName == 'FILE');
	}

	function isCheckboxOrRadio(el) {
		return (el.nodeName == 'INPUT' && el.type.toLowerCase() == 'checkbox' || el.type.toLowerCase() == 'radio');
	}

	function synthesizeNativeEvent(el, evt) {
		if(preventAllTriggers) {
			return;
		}

		if(document.createEventObject){
			// IE
			trigger = document.createEventObject();
			trigger.synthesized = true;
			el.fireEvent('on' + evt, trigger);
		} else {
			// Others
			trigger = document.createEvent('HTMLEvents');
			trigger.initEvent(evt, true, true);
			trigger.synthesized = true;
			el.dispatchEvent(trigger);
		}
	}

	function synthesizeClicksFromTaps() {
		var lastSynthClickTime = new Date();
		var lastSynthFocusTime = new Date();
		var focusedElm;

		// handle taps globally
		$('body').on('tap', function(e){
			if(preventAllTriggers) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}

			// if a form element, focus on it (or change it) directly (don't just synthesize a focus event)
			if(isFormInput(e.target)){
				// if checkbox or radio, change its value
				if(isCheckboxOrRadio(e.target)) {
					var input = $(e.target);
					if(input.is(':checked')) {
						setTimeout(function(){
							input.prop('checked', false).trigger('change');
						}, 25)
					} else {
						setTimeout(function(){
							input.prop('checked', true).trigger('change');
						}, 25);
					}
				// if it's a select, let the delay occur as normal, Android can't be focused
				} else if(e.target.nodeName == 'SELECT') {
					return true;
				// all other inputs, focus immediately
				} else {
					lastSynthFocusTime = new Date();
					focusedElm = $(e.target);
					// if already focused, allow normal behavior
					if(focusedElm.is(':focus')) {
						return true;
					// otherwise immediately focus
					} else {
						focusedElm.focus();
					}
				}

				// prevent any synth clicks or normal clicks from happening
				e.stopPropagation();
				e.stopImmediatePropagation();
				e.preventDefault();
				return false;
			}

			lastSynthClickTime = new Date();

			// trigger synthesized native 'click' events on tapped elements
			synthesizeNativeEvent(e.target, 'click');

			// prevent anything else from happening
			e.stopPropagation();
			e.stopImmediatePropagation();
			e.preventDefault();
		});

		// handle taps globally
		document.addEventListener('click', function(e){
			if(preventAllTriggers) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}

			var now = new Date();
			var timeSinceLastSynthesizedClick = now - lastSynthClickTime;
			// programmatic .click() should also pass, and can be detected (typically) from their lack of mouse coordinates
			var fromAnOriginMouseEvent = !(e.clientX || e.clientY || e.pageX || e.pageY || e.x || e.y);
			// if the click wasn't syntehsized and happened within a
			// small gap from last synth click, block it
			if(!(fromAnOriginMouseEvent || e.synthesized) && timeSinceLastSynthesizedClick < 350) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
			return true;
		}, true);

		$('body').on('focus focusin', 'textarea,input', function(e){
			var now = new Date();
			var timeSinceLastSynthesizedFocus = now - lastSynthFocusTime;
			if(timeSinceLastSynthesizedFocus < 350) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			} else {
				return true;
			}
		});
	}

	function remapMouseEventHandlersToTouchEventHandlers() {
		var mappedEvents = {
			'mouseenter': 'taphold',
			'mouseover': 'taphold',
			'mouseleave': 'pointerend',
			'mousedown': 'pointerstart',
			'mouseup': 'pointerend'
		};

		$.fn.on = $.fn.bind = translate($.fn.on, mappedEvents, true);
		$.fn.trigger = translate($.fn.trigger, mappedEvents, false);
		$.fn.off = $.fn.unbind = translate($.fn.off, mappedEvents, false);
	}

	function translate(method, mappings, useObjectSyntax) {
		// returns a new method that adjusts the calling of 'bind' or 'on' to bind 'tap' instead of 'click'
		// maintains any event namespaces
		// also supports object syntax
		return function() {
			var args = Array.prototype.slice.call(arguments, 0);
			// object syntax
			if(useObjectSyntax && args.length === 1 && $.isPlainObject(args[0])) {
				// object bound syntax. replaces 'click' binders with 'tap'
				var bindingObj = args[0];
				$.each(mappings, function(k, v){
					if(bindingObj[k] != undef) {
						bindingObj[v] = bindingObj[k];
						delete bindingObj[k];
					}
				});

				return method.call(this, bindingObj);
			// string syntax
			} else {
				// if this doesn't apply, skip it
				if(typeof args[0] != 'string')
					return method.apply(this, args);

				eventParts = args[0].split('.', 2);

				// don't re-map events used internally by pointers and gestures, as mouse events are still needed to simulate
				// touch events for non-touch targets
				if(eventParts.length == 2 && (eventParts[1] == '_gesture_events_namespace' || eventParts[1] == '_pointer_events_namespace'))
					return method.apply(this, args);

				// remap events (accounting or namespace)
				if(mappings[eventParts[0]]) {
					eventParts[0] = mappings[eventParts[0]];
					args[0] = eventParts.join('.');
				}
				return method.apply(this, args);
			}
		}
	}

	// safely wraps modal dialogs to cancel any gesture detection in progress
	function wrapModalDialogs() {
		// when a modal dialog (alert or confirm) is shown, prevent any more triggering from
		// occurring for a limited time, as gesture detection would otherwise get confused
		// with the unexpected absence of pointer events during the modal dialog's display

		var modalDialogWrapOptions = {
			after: function() {
				preventAllTriggers = true;
				setTimeout(function(){
					preventAllTriggers = false;
				}, modalEventTriggerDebounceDuration);
			}
		};

		global.alert = util.wrap(global.alert, modalDialogWrapOptions);
		global.confirm = util.wrap(global.confirm, modalDialogWrapOptions);
	}

	return {
		adapt: function() {
			// don't even attemp to adapt if there are no touch events or simulated/forced ones
			if(!(hasTouchEvents || forceRemap))
				return;

			// remap mouse events if not suppressed
			if(!hasNativeMouseEvents && !suppressTouchMouseEvents){
				remapMouseEventHandlersToTouchEventHandlers();
			}

			// clicks should be synthesized from taps when...
			var shouldSynthesizeClickFromTaps = true
				// not explicitly suppressed
				&& !suppressTouchClickEvents
				// and not running in an inframe
				&& !isEmbedded
				// and not running in new versions of android chrome which don't have 300ms delays
				&& !(isChrome && isAndroid && chromeVersion >= 32 && viewPortIsDeviceWidth)
				// and not running in older versions of android chrome with user-scalable turned off
				&& !(isChrome && isAndroid && chromeVersion < 32 && viewPortIsDeviceWidth && viewPortNotUserScalable);

			if(shouldSynthesizeClickFromTaps) {
				wrapModalDialogs();
				synthesizeClicksFromTaps();
			}

			// give styling an indicator that this is a touch client
			$(function(){
				$('body').addClass('touch');
			});
		}
	};

}, jQuery, window); 
 
/* Transport
 * Internal API
 *
 * Handles making requests
 *
 *  // persists credentials in storage for native use
 *	transport.load: function(url, options)
 *    async: true
 *	transport.configure: function(options)
 *    isNative
 *    domain
 *	transport.isNative()
 *	transport.isLocal(url)
 *  transport.baseUrl()
 *  transport.absolutize(url)
 *  transport.adjustUrl(url) // adjusts a local Evo URL to a proxied remote URL
 *
 */
define('transport', ['storage'], function(storage, $, global, undef){

	var nativeClient = false,
		nativeDomain,
		baseUrl,
		basePath;

	function isAbsolute(url) {
		return url.indexOf('http') === 0;
	}

	function normalizeBase(url) {
		url = url.indexOf(baseUrl) === 0
			? url.substr(baseUrl.length)
			: url;
		url = url.indexOf(basePath) === 0
			? url.substr(basePath.length)
			: url;
		if(url.indexOf('/') == 0)
			url = url.substr(1);
		return url;
	}

	function load(url, options) {
		options = options || {};
		url = normalizeBase(url);
		var request = {
			type: 'GET',
			url: baseUrl + url,
			cache: false,
			timeout: 60000,
			async: (options.async === undef ? true : options.async)
		};
		return $.ajax(request);
	}

	function determineBasePath() {
		if(baseUrl.lastIndexOf('/') != baseUrl.length - 1)
			baseUrl = baseUrl + '/';

		basePath = baseUrl.substring(8 + baseUrl.substring(8).lastIndexOf('/', baseUrl.length - 10))
	}

	return {
		load: function(url, options) {
			return load(url, (options || {}));
		},
		configure: function(options) {
			nativeClient = options.isNative || nativeClient;
			nativeDomain = options.domain || nativeDomain;
			baseUrl = options.baseUrl || baseUrl;
			determineBasePath();
			$.ajaxSetup({
				crossDomain: false
			});
		},
		isNative: function() {
			return nativeClient;
		},
		isLocal: function(url) {
			var normalized = normalizeBase(url);
			return !isAbsolute(normalized) && normalized.indexOf('rsw.ashx') != 0;
		},
		baseUrl: function() {
			return baseUrl;
		},
		absolutize: function(url) {
			var normalized = normalizeBase(url);
			return !isAbsolute(normalized) ? (baseUrl + normalized) : normalized;
		},
		adjustUrl: function(localUrl) {
			return load('callback.ashx?redirect=' + encodeURIComponent(localUrl));
		}
	};

}, jQuery, window); 
 
/*
 * Declarative Interactive Comment Rendering UI Component
 *
 * <div class="ui-comments"
 *      data-contentid=""
 *      data-contenttypeid=""
 *      data-typeid="" />
 */

/// @name commenting
/// @category UI Component
/// @description Presents a commenting UI
///
/// ### jQuery.telligent.evolution.ui.components.comments
///
/// [UI Component](#) which handles presentation of commenting behavior for content. Transforms the output from `$core_v1_mobileUI.Comment()`, which is a `<span class="ui-comments"></span>` stub. The default implementation uses the [evolutionMobileComments plugin](#). Overrides can be provided to present comments differently.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `contenttypeid`: (string) Content Type Id Guid
///  * `contentid`: (string) Content Id Guid
///  * `typeid`: (string) Comment Type Id Guid
///  * `canflagasabusive`: Whether the abuse flag should be shown
///  * `accessinguserid`: Accessing User ID
///
/// ### Example
///
/// A barebones UI component override which would result in rendering a read-only message of 'Comments for: [content id]'.
///
///     $.telligent.evolution.ui.components.comments = {
///         setup: function() {
///         },
///         add: function(elm, options) {
///             var message = 'Comments for: ' + options.contentid;
///             $(elm).html(message);
///         }
///     };
///
/// ### Default Implementation
///
/// For reference purposes or as the basis for an override:
///
///     $.telligent.evolution.ui.components.comments = {
///         setup: function() { },
///         add: function(elm, options) {
///             $(elm).evolutionMobileComments({
///                 contentId: options.contentid,
///                 contentTypeId: options.contenttypeid,
///                 typeId: options.typeid,
///                 canFlagAsAbusive: (options.canflagasabusive.toLowerCase() == 'true'),
///                 accessingUserId: parseInt(options.accessinguserid, 10)
///             });
///         }
///     }
///
define('uicomments', function($, global, undef) {

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.ui = $.telligent.evolution.ui || {};
	$.telligent.evolution.ui.components = $.telligent.evolution.ui.components || {};

	$.telligent.evolution.ui.components.comments = {
		setup: function() { },
		add: function(elm, options) {
			$(elm).removeClass('ui-comments').evolutionMobileComments({
				contentId: options.contentid,
				contentTypeId: options.contenttypeid,
				typeId: options.typeid,
				canFlagAsAbusive: (options.canflagasabusive.toLowerCase() == 'true'),
				accessingUserId: parseInt(options.accessinguserid, 10)
			});
		}
	}

	return {};

}, jQuery, window);
 
 
/*
 * ui-formatteddate UI Component
 * Renders server-side formatted client date declaratively
 *
 * <span class="ui-formatteddate" date="date" format="format" ></span>
 *
 * date: date formatted using $.telligent.evolution.formatDate()
 * format: 'date', 'datetime', or 'ago'. default: 'ago'
 *
 */

/// @name formatteddate
/// @category UI Component
/// @description Presents a formatted date
///
/// ### jQuery.telligent.evolution.ui.components.formatteddate
///
/// [UI Component](#) which renders a server-side formatted client date declaratively from the client side. This allows a JavaScript date object to be displayed according to the accessing user's saved date format and time zone. The default implementation uses the [language module](http://telligent.com/community/developers/w/developer75/35200.language-javascript-api-module.aspx). Overrides can be provided to present dates differently.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `date`: date formatted using `$.telligent.evolution.formatDate()`
///  * `format`: 'date', 'datetime', or 'ago'. default: 'ago'
///
/// ### Example
///
/// Render an 'ago' date:
///
///     <span class="ui-formatteddate" date="DATE-VALUE" format="ago" ></span>
///
/// ### Default Implementation
///
/// For reference purposes or as the basis for an override:
///
///     $.telligent.evolution.ui.components.formatteddate = {
///         setup: function() { },
///         add: function(elm, options) {
///             elm.removeClass('ui-formatteddate');
///             var date = $.telligent.evolution.parseDate(options.date),
///                 formatter;
///             if(options.format=="date") {
///                 formatter = $.telligent.evolution.language.formatDate;
///             } else if(options.format=="datetime") {
///                 formatter = $.telligent.evolution.language.formatDateAndTime;
///             } else {
///                 formatter = $.telligent.evolution.language.formatAgoDate;
///             }
///             formatter(date, function(r){
///                 elm.html(r);
///             });
///         }
///     }
define('uiformatteddate', function($, global, undef) {

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.ui = $.telligent.evolution.ui || {};
	$.telligent.evolution.ui.components = $.telligent.evolution.ui.components || {};

	$.telligent.evolution.ui.components.formatteddate = {
		setup: function() { },
		add: function(elm, options) {
			elm.removeClass('ui-formatteddate');
			var date = $.telligent.evolution.parseDate(options.date),
				formatter;
			if(options.format=="date") {
				formatter = $.telligent.evolution.language.formatDate;
			} else if(options.format=="datetime") {
				formatter = $.telligent.evolution.language.formatDateAndTime;
			} else {
				formatter = $.telligent.evolution.language.formatAgoDate;
			}
			formatter(date, function(r){
				elm.html(r);
			});
		}
	}

	return {};

}, jQuery, window);

 
 
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
 
 
/// @name links
/// @category UI Component
/// @description Presents links
///
/// ### jQuery.telligent.evolution.ui.components.links
///
/// Mobile-specific override of the UI component which dynamically renders a list of links horizontally to fit the maximum width available to it. When the width of the links exceeds the horizontal space, adapts to either horizontally scroll and/or render a final 'more' link which, when tapped, displays a sheet containing the remaining links. Supports the `orientationchange` event to re-render the available links. Supports retaining bound event handlers on the rendered links
///
/// Existing instances of ui-links UI components can be modified programmatically using the [$.uilinks](@uilinks) jQuery plugin.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `minlinks`: Minimum number of links that must be always visible and not collapsed. When the link count exceeds minlinks and the combined horizontal width of the links exceeds the available width, remaining links are hidden behind a 'more' link. To cause horizontal scrolling links, this should be a high number. *default: 1*
///  * `maxlinks`: Maximum number of links that can be shown horizontally until remaining links are collapsed behind a 'more' link, regardless of available horiztonal width. To cause a 'more' link when there's still remaining space for links to render horizontally, this should be a low number. *default: 50*
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

define('uilinks', ['dynamicLinks', 'messaging'], function(DynamicLinks, messaging, $, global, undef) {

	// UILinks jQuery Plugin
	// Provides access to add, insert, or remove links from already-existing
	// UI Link components
	// $('ui-link-selector').uilinks('add', link, options)
	// $('ui-link-selector').uilinks('insert', link, index, options)
	// $('ui-link-selector').uilinks('remove', 'selector');
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
		}

		return selection;
	}

	function onShowMore(links, cancelLink) {
		if($.telligent && $.telligent.evolution && $.telligent.evolution.mobile) {

			var linksToShow = links.slice(0);
			linksToShow.push(cancelLink);

			$.telligent.evolution.mobile.displaySheet({
				links: $.map(linksToShow, function(l) { return l.element; })
			});

			cancelLink.element.one('click', function(e) {
				$.telligent.evolution.mobile.hideSheet();
			});

			var sheetClosedHandler = messaging.subscribe('mobile.sheet.closed', function(){
				$.each(links, function(i, link){
					safelyDetachLink($(link.element));
				});
				messaging.unsubscribe(sheetClosedHandler);
			});
		}
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
				listItems = elm.find('li');
				parsedMaxLinks = options.maxlinks,
				parsedMinLinks = options.minlinks;

			var dynamicLinkOptions = {
				parent: elm,
				links: [],
				onShowMore: onShowMore,
				animate: false
			};
			if(parsedMaxLinks)
				dynamicLinkOptions.maxLinks = parseInt(parsedMaxLinks, 10);
			if(parsedMinLinks)
				dynamicLinkOptions.minLinks = parseInt(parsedMinLinks, 10);
			if(options.animate == 'true')
				dynamicLinkOptions.animate = true;

			for(var i = 0; i < listItems.length; i++) {
				var listItem = $(listItems[i]),
					linkElement = listItem.children();
				safelyDetachLink(linkElement);

				var selected = linkElement.is('[data-selected]');

				if(linkElement.is('[data-more]')) {
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
			dynamicLinks.render();

			// after content finishes rendering before rendering ui links
			messaging.subscribe('mobile.content.loaded', function(){
				dynamicLinks.render();
			});

			// save a reference to the DynamicLinks instance with the
			// element so that it can be used by the $.fn.uilinks plugin
			elm.data('_dynamic_links', dynamicLinks);

			// re-render on orientation change
			messaging.subscribe('mobile.orientationchange', function(){
				global.setTimeout(function(){
					dynamicLinks.render();
				}, 300)
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.ui = $.telligent.evolution.ui || {};
	$.telligent.evolution.ui.components = $.telligent.evolution.ui.components || {};
	$.telligent.evolution.ui.components.links = component;

	return component;

}, jQuery, window); 
 
/*
 * Mobile-specific UI moderate component override
 *   Designed to be used within UI-links instead of rendering its
 *   own links/popup as in the desktop view
 *
 * Still raises the ui.reportabuse message
 *
 */

/// @name moderate
/// @category UI Component
/// @description Presents a mobile-specific moderation UI
///
/// ### jQuery.telligent.evolution.ui.components.moderate
///
/// [UI Component](#) which overrides the default [moderation UI component](http://telligent.com/community/developers/w/developer75/35253.moderate-ui-component.aspx) for mobile. Renders a 'Flag as Abuse/Spam' link as a simple toggle instead of the richer support for other options and dropdowns in the desktop experience. This enables instances of the moderate component to be used within instances of [ui-links](#). When toggled, flags the content.
///
/// ### Options
///
/// Data made available to instances of the component:
///
///  * `contentid`: Content Id
///  * `contenttypeid`: Content Type Id
///  * `initialstate`: Initial State to render 'true|false'. When true, shows the 'flagged' text and is not toggleable.
///
/// ### Example
///
/// Render a moderation toggle as a UI component:
///
///     <span class="ui-moderate" contentid="CONTENT-ID" contenttypeid="CONTENT-TYPE-ID" initialstate="true" ></span>
///
/// Render via velocity in a widget, including the initial state automatically
///
///     $core_v2_ui.Moderate($story.ContentId, $story.ContentTypeId)
///
/// ### Default Implementation
///
/// For reference purposes or as the basis for an override:
///
///     function addAbuseReport(contentId, contentTypeId) {
///         return $.telligent.evolution.post({
///             url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/abusereports.json',
///             data: {
///                 ContentId: contentId,
///                 ContentTypeId: contentTypeId
///             },
///             cache: false,
///             dataType: 'json'
///         });
///     }
///
///     $.telligent.evolution.ui.components.moderate = {
///         setup: function() { },
///         add: function(elm, options) {
///             var flagLink = $('<a href="#">Flag as spam/abuse</a>').hide().appendTo(elm),
///                 changing = $('<a href="#">…</a>').hide().appendTo(elm),
///                 flaggedState = $('<a href="#">Flagged as spam/abuse</a>').hide().appendTo(elm);
///
///             // if already flagged, show that instead of the link
///             if(options.initialstate == 'true') {
///                 flaggedState.show();
///             } else {
///                 flagLink.show().on('click', function(){
///                     // when tapped, show the 'changing' state
///                     changing.show();
///                     flagLink.hide();
///                     // and submit the abuse report
///                     addAbuseReport(options.contentid, options.contenttypeid).then(function(){
///                         // switch to the 'flagged' link state
///                         flaggedState.show();
///                         changing.hide();
///                         // raise ui.reportabuse message
///                         messaging.publish('ui.reportabuse', {
///                             contentId: options.contentid,
///                             contentTypeId: options.contenttypeid
///                         });
///                     });
///                 });
///             }
///         }
///     };
///     $.telligent.evolution.ui.components.moderate.defaults = {
///         reportedText: 'Thank you for your report',
///         flagText: 'Flag as spam/abuse',
///         flaggedText: 'Flagged as spam/abuse'
///     };
///
define('uimoderate', ['messaging'], function(messaging, $, global, undef){

	function addAbuseReport(contentId, contentTypeId) {
		return $.telligent.evolution.post({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/abusereports.json',
			data: {
				ContentId: contentId,
				ContentTypeId: contentTypeId
			},
			cache: false,
			dataType: 'json'
		});
	}

	$.telligent.evolution.ui.components.moderate = {
		setup: function() { },
		add: function(elm, options) {
			var flagLink = $('<a href="#">Flag as spam/abuse</a>').hide().appendTo(elm),
				changing = $('<a href="#">…</a>').hide().appendTo(elm),
				flaggedState = $('<a href="#">Flagged as spam/abuse</a>').hide().appendTo(elm);

			// if already flagged, show that instead of the link
			if(options.initialstate == 'true') {
				flaggedState.show();
			} else {
				flagLink.show().on('click', function(){
					// when tapped, show the 'changing' state
					changing.show();
					flagLink.hide();
					// and submit the abuse report
					addAbuseReport(options.contentid, options.contenttypeid).then(function(){
						// switch to the 'flagged' link state
						flaggedState.show();
						changing.hide();
						// raise ui.reportabuse message
						messaging.publish('ui.reportabuse', {
							contentId: options.contentid,
							contentTypeId: options.contenttypeid
						});
					});
				});
			}
		}
	};
	$.telligent.evolution.ui.components.moderate.defaults = {
		reportedText: 'Thank you for your report',
		flagText: 'Flag as spam/abuse',
		flaggedText: 'Flagged as spam/abuse'
	};

}, jQuery, window); 
 
define('url', function($, global, undef) {

	var api = {
		parseQuery: function(queryString) {
			var parts = queryString.split('?'),
				raw = (parts.length > 1 ? parts[1] : queryString).split('#')[0],
				data = {},
				pairs = raw.split('&');

			for(var i = 0;  i< pairs.length; i++) {
				var pair = pairs[i].split('=');
				if(pair.length === 2) {
					data[pair[0]] = decodeURIComponent(pair[1].replace(/\+/gi,' '));
				}
			}

			return data;
		},
		serializeQuery: function(data) {
			data = data || {};
			var pairs = [];
			for(var key in data) {
				var value = data[key];
				pairs[pairs.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
			}
			return pairs.join('&');
		},
		modify: function(options) {
			var settings = $.extend({
					url: global.location.href,
					query: null,
					hash: global.location.hash,
					protocol: global.location.protocol,
					overrideQuery: false
				}, options),
				newUrlParts = [ settings.url.split('?')[0].split('#')[0] ],
				newQuery;

			// get the current query and update it with newly-passed query
			if(typeof settings.query === 'string') {
				settings.query = api.parseQuery(settings.query);
			}
			newQuery = settings.overrideQuery
				? api.serializeQuery(settings.query)
				: api.serializeQuery($.extend(api.parseQuery(settings.url), settings.query));
			if(newQuery && newQuery.length > 0) {
				newUrlParts[newUrlParts.length] = ('?' + newQuery);
			}

			// add in new or current hash
			if(settings.hash && settings.hash.length > 0) {
				newUrlParts[newUrlParts.length] = ((settings.hash.indexOf('#') !== 0 ? '#' : '') + settings.hash);
			}
			return newUrlParts.join('');
		},
		hashData: function(data, overrideCurrent) {
			if(typeof data === 'undefined') {
				data = {};
				var urlParts = global.location.href.split("#"),
					rejoinedParts = '';
				// firefox workaround
				if(urlParts.length > 2) {
					for(var i = 0; i < urlParts.length; i++) {
						if(i > 0) {
							if(i > 1) {
								rejoinedParts += '#';
							}
							rejoinedParts += urlParts[i];
						}
					}
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
		}
	};

	return api;

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
define('util', function(global){

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
 
/*
 * Defines Exposure of the Mobile API
 */
require(['controller', 'transport', 'messaging', 'pushNotifications', 'environment', 'media', 'uiformatteddate', 'evolutionMobileComments', 'uicomments', 'uimoderate', 'uilike', 'evolutionResize', 'evolutionHighlight', 'keyboardfix', 'glowUpload', 'scrollfix', 'touchEventAdapter', 'evolutionTransform' ],
function(Controller, transport, messaging, pushNotifications, environment, media, uiformatteddate, evolutionMobileComments, uicomments, uimoderate, uilike, evolutionResize, evolutionHighlight, keyboardfix, glowUpload, scrollFix, touchEventAdapter, evolutionTransform, $, global) {

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.mobile = $.telligent.evolution.mobile || {
		environment: environment,
		defaults: Controller.defaults
	};

	$(function(){
		touchEventAdapter.adapt();
		keyboardfix.fix();
		scrollFix.adaptBannerAndFormScrollPositionOnKeyboardFocus();

		// the mobile api still requires being 'inited' by
		// the client code via $.telligent.evolution.mobile.init(options)
		var inited = false;
		function exposeControllerIniting() {
			//$.telligent.evolution.mobile.defaults = Controller.defaults;
			$.telligent.evolution.mobile.init = function(options) {
				if(inited)
					return;
				inited = true;
				// when inited, replace the definition of mobile
				// with an instance of the controller
				$.extend($.telligent.evolution.mobile, new Controller(options));
			};
		}

		function overrideMessaging() {
			// override the evolution messaing API with our own
			$.telligent.evolution.messaging = {
				publish: messaging.publish,
				subscribe: messaging.subscribe,
				unsubscribe: messaging.unsubscribe
			};
		}

		function overrideLanguageFormatAgoDate() {
			var dateCache = {},
				buildCacheKey = function(date) {
					return date.toString();
				},
				loadFormattedDate = function (date, complete) {
					var formattedDate = dateCache[buildCacheKey(date)];
					if(typeof formattedDate === 'undefined') {
						$.telligent.evolution.get({
							url: 'services/formatagodate',
							data: {
								date: $.telligent.evolution.formatDate(date)
							},
							success: function (response) {
								if (response && complete && typeof response !== 'undefined' && response !== null && response.formattedDate) {
									dateCache[buildCacheKey(date)] = response.formattedDate;
									complete(response.formattedDate);
								}
							}
						});
					} else {
						complete(formattedDate);
					}
				};

			var api = {
				formatAgoDate: function(date, complete) {
					loadFormattedDate(date, complete);
				}
			};

			if(!$.telligent) { $.telligent = {}; }
			if(!$.telligent.evolution) { $.telligent.evolution = {}; }
			$.telligent.evolution.language = $.extend({}, $.telligent.evolution.language, api);
		}

		function displayDefaultUiComponentMessages() {
			// when items are reported, hide any open sheets and show a default message
			messaging.subscribe('ui.reportabuse', messaging.GLOBAL_SCOPE, function(data) {
				// update existing moderate link components so that if they regenerate, have the proper value
				// this is a shim and should ideally occur at the component level
				var moderateLinks = $('.ui-moderate[data-contentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"]');
				moderateLinks.attr('data-initialstate', 'true');

				$.telligent.evolution.mobile.displayMessage(
					$.telligent.evolution.ui.components.moderate.defaults.reportedText, {
						disappearAfter: 5000,
						cssClass: 'info'
					});
				$.telligent.evolution.mobile.hideSheet();
			});

			// when items are bookmarked or unbookmarked, hide any open sheets and show a default message
			messaging.subscribe('ui.bookmark', messaging.GLOBAL_SCOPE, function(data) {
				// update existing bookmark link components so that if they regenerate, have the proper value
				// this is a shim and should ideally occur at the component level
				var bookmarkLinks = data.typeId
					? $('.ui-bookmark[data-contentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"][data-typeid="' + data.typeId + '"]')
					: $('.ui-bookmark[data-contentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"]');
				bookmarkLinks.attr('data-value', data.bookmarked.toString());

				var message = data.bookmarked ? 'Bookmark added' : 'Bookmark removed';

				$.telligent.evolution.mobile.displayMessage(message, {
					disappearAfter: 2500,
					cssClass: 'info'
				});
				$.telligent.evolution.mobile.hideSheet();
			});
		}

		function adjustAjaxSettings() {
			// ensure all Ajax URLs are fully absolutized
			$(document).ajaxSend(function(event, jqxhr, settings) {
				settings.url = transport.absolutize(settings.url);
			});

			$(document).ajaxError(function(e, xhr, settings, error) {
				// ignore errors from talking to anything other than RSW
				if(settings.url.indexOf('rsw') < 0)
					return;
				$.telligent.evolution.mobile.displayMessage('An error has occurred', {
					cssClass: 'warning',
					disappearAfter: 10 * 1000
				});
			});
		}

		function initAndExposeApi() {
			overrideMessaging();
			adjustAjaxSettings();
			displayDefaultUiComponentMessages();
			exposeControllerIniting();
			overrideLanguageFormatAgoDate();
		};

		if(environment.type == 'native') {
			document.addEventListener('deviceready', function () {
				transport.configure({
					isNative: true,
					domain: global.mobileNativeConfig.domain,
					baseUrl: global.mobileNativeConfig.baseUrl
				});

				initAndExposeApi();
			});
		} else {
			var baseUrl = global.location.href.indexOf('#') > -1
				? global.location.href.substr(0, global.location.href.indexOf('#'))
				: global.location.href;
			var baseUrl = baseUrl.indexOf('?') > -1
				? baseUrl.substr(0, baseUrl.indexOf('?'))
				: baseUrl;
			if(baseUrl.lastIndexOf('/') != baseUrl.length - 1)
				baseUrl = baseUrl + '/';
			transport.configure({
				isNative: false,
				baseUrl: baseUrl
			});
			initAndExposeApi();
		}

		// set environment-specific styling classes
		$('body').addClass(environment.device + ' ' + environment.type);
	});

}, jQuery, window); 
}()); 
