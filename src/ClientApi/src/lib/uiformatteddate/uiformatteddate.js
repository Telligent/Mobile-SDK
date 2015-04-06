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

