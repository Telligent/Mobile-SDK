// SUPER ADVANCED UNIT TESTING FRAMEWORK (TM)

function test(name, fn) {
	// not yet implemented
	if(!fn){
		console.log('NOT IMPLEMENTED: ' + name);
		return;
	}

	// if this doesn't look like a promise, then wrap it in one
	if(!fn['promise']) {
		fn = $.Deferred(function(dfd){
			var result = false;
			try {
				result = fn();
				dfd.resolve(result);
			}catch(e) {
				console.log('ERROR: ' + e);
				dfd.reject();
			}
		}).promise();
	}

	fn.done(function(result){
		console.log((result ? 'PASS' : 'FAIL') + ': ' + name);
	})
	.fail(function(){
		console.log('FAIL: ' + name);
	})

	return fn;
}

// support asynchronous tests
function async(fn) {
	return $.Deferred(function(dfd){
		try {
			fn(function(result){
				dfd.resolve(result);
			})
		} catch(e) {
			console.log('ERROR: ' + e);
			dfd.reject();
		}
	}).promise();
}
