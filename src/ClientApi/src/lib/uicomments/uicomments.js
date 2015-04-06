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
