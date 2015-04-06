var require, define;
(function (undef){
	var modules = {},
		resolve = function(name) {
			var module = modules[name];
			if(module == undef)
				return null;

			if(module.compiled)
				return module.compiled;

			var resolvedDependencies = [];
			if(module.dependencies && module.dependencies.length > 0) {
				for(var i = 0; i < module.dependencies.length; i++) {
					resolvedDependencies.push(resolve(module.dependencies[i]));
				}
			}

			module.compiled = module.factory.apply(this, resolvedDependencies.concat(module.extraArguments));

			return module.compiled;
		};
	require = function(dependencies, factory) {
		var deps = dependencies,
			fac = factory,
			offset = 2;
		// if there's no dependencies
		if(!deps.splice) {
			fac = deps;
			deps = undef;
			offset--;
		}

		var extraArgs = Array.prototype.slice.call(arguments, offset);

		var resolvedDependencies = [];
		for(var i = 0; i < deps.length; i++) {
			resolvedDependencies.push(resolve(deps[i]));
		}

		fac.apply(this, resolvedDependencies.concat(extraArgs));
	};
	define = function(name, dependencies, factory) {
		var deps = dependencies,
			fac = factory,
			offset = 3;
		// if there's no dependencies
		if(!deps.splice) {
			fac = deps;
			deps = undef;
			offset--;
		}

		var extraArgs = Array.prototype.slice.call(arguments, offset);

		modules[name] = {
			dependencies: deps,
			factory: fac,
			extraArguments: extraArgs || []
		};
	};
}());
