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


