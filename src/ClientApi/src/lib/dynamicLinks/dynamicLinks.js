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