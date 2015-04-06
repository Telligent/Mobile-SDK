define('testlog', function($, global, undef){

	var inited = false,
		logContainer,
		useConsole = false;

	function init() {
		if(inited)
			return;
		inited = true;
		logContainer = $('<pre id="log"></pre>');
		logContainer.appendTo($('body'));
	}

	return {
		useConsole: function(shouldUseConsole) {
			useConsole = shouldUseConsole;
		},
		message: function(message) {
			init();
			if(useConsole)
				console.log(message);
			else
				logContainer.prepend('<span><strong>' + new Date().getTime() + '</strong>: ' + message + '<br /></span>');
		},
		object: function(obj) {
			init();
			if(useConsole)
				console.log(obj);
			//logContainer.prepend('<span><strong>' + new Date().getTime() + '</strong>: ' + message + '<br /></span>');
		}
	};

}, jQuery, window);
