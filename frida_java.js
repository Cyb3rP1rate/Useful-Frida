function trace(pattern)
{
	var type = (pattern.toString().indexOf("!") === -1) ? "java" : "module";
	if (type === "module") {
		// trace Module
		var res = new ApiResolver("module");
		var matches = res.enumerateMatchesSync(pattern);
		var targets = uniqBy(matches, JSON.stringify);
		targets.forEach(function(target) {
			traceModule(target.address, target.name);
		});

	} else if (type === "java") {
		// trace Java Class
		var found = false;
		Java.enumerateLoadedClasses({
			onMatch: function(aClass) {
				if (aClass.match(pattern)) {
          			found = true;
					traceClass(aClass);
				}
			},
			onComplete: function() {}
		});
		// trace Java Method
		if (!found) {
			try {
				traceMethod(pattern);
			}
			catch(err) { // catch non existing classes/methods
				console.error(err);
			}
		}
	}
}

// find and trace all methods declared in a Java Class
function traceClass(targetClass)
{
	var hook = Java.use(targetClass);
	var methods = hook.class.getDeclaredMethods();
	hook.$dispose;
	var parsedMethods = [];
	methods.forEach(function(method) {
		parsedMethods.push(method.toString().replace(targetClass + ".", "TOKEN").match(/\sTOKEN(.*)\(/)[1]);
	});

	var targets = uniqBy(parsedMethods, JSON.stringify);
	targets.forEach(function(targetMethod) {
		traceMethod(targetClass + "." + targetMethod);
	});
}

// trace a specific Java Method
function traceMethod(targetClassMethod)
{
	var delim = targetClassMethod.lastIndexOf(".");
	if (delim === -1) return;
	var targetClass = targetClassMethod.slice(0, delim)
	var targetMethod = targetClassMethod.slice(delim + 1, targetClassMethod.length)
	var hook = Java.use(targetClass);
	
	try{ //check the overload count if none catch and give it a value of 0
	var overloadCount = hook[targetMethod].overloads.length;
        } catch(e){
        var overloadCount = 0;
        }
        
	console.log("Tracing " + targetClassMethod + " [" + overloadCount + " overload(s)]");

	for (var i = 0; i < overloadCount; i++) {
		hook[targetMethod].overloads[i].implementation = function() {
			console.warn("\n[+] Entered: " + targetClassMethod);
			// print args
			if (arguments.length) console.log();
		        console.log("error1")
			for (var j = 0; j < arguments.length; j++) {
				console.log("\x1b[31marg[" + j + "]:\x1b[0m \x1b[34m" + arguments[j] + "\x1b[0m");
			}

			// print retval
			var retval = this[targetMethod].apply(this, arguments); 
			var test = '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,"sailfish","8996-012001-1907011432","google","arm64-v8a","","abfarm813","sailfish","sailfish","Google","Pixel","sailfish"]'
			//var win = '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,"sailfish","8996-012001-1907011432","google","arm64-v8a","","abfarm813","sailfish","sailfish","Google","Pixel","sailfish"]'
			var win = ""
			
			if (retval == test){
			    retval = win
			}			 
			console.log("\n\x1b[31mretval:\x1b[0m \x1b[34m" + retval + "\x1b[0m");
			console.warn("\n[-] Exiting: " + targetClassMethod);
			return retval;
		}
	}
}
// trace Module functions
function traceModule(impl, name)
{
	console.log("Tracing " + name);
	Interceptor.attach(impl, {
		onEnter: function(args) {
			// debug only the intended calls
			this.flag = false;
			this.flag = true;
			if (this.flag) {
				console.warn("\n*** entered " + name);
				// print backtrace
				console.log("\nBacktrace:\n" + Thread.backtrace(this.context, Backtracer.ACCURATE)
						.map(DebugSymbol.fromAddress).join("\n"));
			}
		},
		onLeave: function(retval) {
			if (this.flag) {
				// print retval
				console.log("\nretval: " + retval);
				console.warn("\n*** exiting " + name);
			}
		}

	});
}
// remove duplicates from array
function uniqBy(array, key)
{
        var seen = {};
        return array.filter(function(item) {
                var k = key(item);
                return seen.hasOwnProperty(k) ? false : (seen[k] = true);
        });
}
setTimeout(function() { // avoid java.lang.ClassNotFoundException
	Java.perform(function() {
		trace(""); //insert base class to trace
	});   
}, 0);


