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
