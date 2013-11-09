/*
 * Will create a JSON representation of the conf it's fed
 */

module.exports = function (confFile) {	
	var obj = {};
	var objectChain = [obj];
	
	
	var getCurrentObject = function () {
		return objectChain[ objectChain.length - 1 ];
	};
	
	// a correct token has been found
	var prepareBuffer = function () {
		currentBuffer = currentBuffer.substring(0, currentBuffer.length-1);
		
		// but i also want to treeat things with a ' or " as one string with the spaces
		var split = [];
		var newBuffer = "", token;
		var quoteOpeners = [];
		var strip = function (str) {
			return str.replace(/^\s*/, '').replace(/\s*$/, '');
		};
		
		for (var i = 0; i < currentBuffer.length; i++) {
			token = currentBuffer.substring(i, i+1);
			newBuffer += token;
			
			
			if (quoteOpeners.length) {
				
				// this quote is complete
				if (token == quoteOpeners[ quoteOpeners.length-1 ]) {
					quoteOpeners.pop();
					
					// .. and so is the entire quote
					if (!quoteOpeners.length) {
						// push in between quotes
						newBuffer = strip( newBuffer.substring(1, newBuffer.length-1) );
						split.push(newBuffer);
						newBuffer = "";
					}
				}
			} else {
				if (token.match(/\s/)) {
					newBuffer = strip(newBuffer);
					if (newBuffer != '') {
						split.push(newBuffer);
					}
					newBuffer = "";
				
				} else if (token == "'" || token == '"') {
					quoteOpeners.push(token);
				}
			}
		}
		if (newBuffer != "") {
			split.push(newBuffer);
		}
		
		currentBuffer = "";
		return split;
	};
	
	var endObject = function () {
		prepareBuffer();
		objectChain.pop();
	};
	
	var newObject = function () {
		var strings = prepareBuffer(),
			key = strings.join(" "),
			currentObject = getCurrentObject(),
			currentKey = currentObject[key],
			isArray = (currentKey && currentKey instanceof Array);
		
		// This key already exists on this object. Sooo we'll make the current value part of an array related to this key.
		if (currentKey && !isArray) {
			currentObject[key] = [ currentKey ];
			isArray = true;
		}
		
		// And create the actual new obj
		var newObj = {
		};
		
		if (isArray) {
			currentObject[key].push(newObj);
		} else {
			currentObject[key] = newObj;
		}
		
		objectChain.push(newObj);
	};
	
	var currentBuffer = "", token, currentObject;
	
	var onComment = false;
	
	for (var i = 0; i < confFile.length; i++) {
		token = confFile.substring(i, i+1);
		currentBuffer += token;
		
		currentObject = getCurrentObject();
		
		if (onComment) {
			// line comments wait for a line break
			if (token.match(/\n/)) {
				var commentStrings = prepareBuffer();
				currentObject.comments.push(commentStrings.join(" "));
				onComment = false;
				continue;
			}
		
		} else {
			// An ending brace means the object is complete
			if (token == "}") {
				endObject();
				continue;
			
			// an opening brace means a new object is starting
			} else if (token ==  "{") {
				newObject();
				continue;
			
			// most other things need to end in a semicolon
			} else if (token == ";") {
				var strings = prepareBuffer();
				
				currentObject[ strings[0] ] = strings.slice(1);
				continue;
			
			// a comment. this line doesn't have to end in a semicolon
			} else if (token == "#") {
				if (!currentObject.comments) {
					currentObject.comments = [];
				}
				onComment = true;
			}
		}
	}
	
	//console.log( JSON.stringify(obj, null, 4));
	return obj;
};