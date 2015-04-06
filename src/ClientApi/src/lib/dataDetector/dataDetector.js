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