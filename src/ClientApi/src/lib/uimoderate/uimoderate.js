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