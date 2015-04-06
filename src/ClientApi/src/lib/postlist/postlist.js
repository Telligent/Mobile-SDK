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