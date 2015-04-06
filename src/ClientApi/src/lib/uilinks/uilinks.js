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