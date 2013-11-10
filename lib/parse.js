/*
 * Will create a JSON representation of the conf it's fed
 */

module.exports = function (confFile) {
	// "global" variables used to maintain the current state
	var obj = {};
	var nodeChain = [obj];
	var currentBuffer = "";
	var token;
	var currentObject;
	
	// helper methods
	var getCurrentNode = function () {
		return nodeChain[ nodeChain.length - 1 ];
	};
	var strip = function (str) {
		return str.replace(/^\s*/, '').replace(/\s*$/, '');
	};
	
	
	// a correct token has been found
	// The goal is to split the string into "tokens", which are basically split by
	//  space..but then there's quotes...
	var prepareBuffer = function () {
		currentBuffer = currentBuffer.substring(0, currentBuffer.length-1);
		
		var split = [];
		var newBuffer = "";
		for (var i = 0; i < currentBuffer.length; i++) {
			var character = currentBuffer.substring(i, i+1);
			newBuffer += character;
			
			// Don't split if it's a quote
			if (quoteHandler.handling) {
				quoteHandler.handle(character);
			
			}else{	
				if (character.match(/'|"/)) {
					quoteHandler.init(character);
				
				} else if (character.match(/\s/)) {
					newBuffer = strip(newBuffer);
					// could be "" at this point.
					if (newBuffer) {
						split.push(newBuffer);
					}
					newBuffer = "";
				}
				
			}
		}
		
		// Any remaining...like the tail end of the string.
		if (newBuffer) {
			split.push(newBuffer);
		}
		
		// reset the buffer.
		currentBuffer = "";
		return split;
	};
	
	var endObject = function () {
		prepareBuffer();
		nodeChain.pop();
	};
	
	var newObject = function () {
		var strings = prepareBuffer(),
			key = strings.join(" "),
			currentObject = getCurrentNode(),
			currentKey = currentObject[key];
		
		// This key already exists on this object. Sooo we'll make the current value part of an array related to this key.
		if (!currentKey) {
			currentObject[key] = [];
			currentObject[key]._isNodeArray = true;
		}
		
		// And create the actual new obj
		var newObj = {};
		
		currentObject[key].push(newObj);
		
		nodeChain.push(newObj);
	};
	
	
	var quoteHandler = {
		
		init: function (token) {
			this.handling = true;
			this.quoteOpeners = [token];
		},
		handle: function (token) {
			// sample 'theres this "cool \'whatupppp' super" thing' that
			
			if (token == "\\") {
				this.nextIsEscaped = true;
			
			// Shouldn't count if it was escaped
			} else if (this.nextIsEscaped) {
				this.nextIsEscaped = false;
			
			}
			
			// might be the last quote...
			if (!this.nextIsEscaped
			&& token == this.quoteOpeners[ this.quoteOpeners.length-1 ]) {
				this.quoteOpeners.pop();
				
				// And it's totes done??
				if (!this.quoteOpeners.length) {
					this.complete();
				}
			
			// a nested quote
			// ..and i do push it if it's escaped. Assuming that the closing quote is also going to be escaped
			} else if (token.match(/'|"/)) {
				this.quoteOpeners.push(token);
			
			}
		},
		complete: function () {
			// This doesn't modify the buffer. The buffer should be used as is
			this.handling = false;
		}
	};
	
	var commentHandler = {
		init: function () {
			this.handling = true;
			if (!currentObject.comments) {
				currentObject.comments = [];
			}
			onComment = true;
		},
		handle: function (token) {
			if (token.match(/\n|\r/)) {
				this.complete();
			}
		},
		complete: function () {
			// Do this manually for comments, because there shouldn't be any parsing
			currentBuffer = strip(currentBuffer);
			currentObject.comments.push( currentBuffer );
			currentBuffer = "";
			
			this.handling = false;
		}
	};
	
	
	for (var i = 0; i < confFile.length; i++) {
		token = confFile.substring(i, i+1);
		currentBuffer += token;
		
		currentObject = getCurrentNode();
		
		if (commentHandler.handling) {
			commentHandler.handle(token);
			continue;
		
		} else if (quoteHandler.handling) {
			quoteHandler.handle(token);
			continue;
		
		// Normal processing
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
				var strings = prepareBuffer(),
					name = strings[0];
				
				if (!currentObject[ name ]) {
					currentObject[ name ] = [];
					currentObject[ name ]._isDirectiveArray = true;
				}
				currentObject[ name ].push( strings.slice(1) );
				continue;
			
			// a comment. this line doesn't have to end in a semicolon
			} else if (token == "#") {
				commentHandler.init(token);
				
			} else if (token.match(/"|'/)) {
				quoteHandler.init(token);
			}
		}
	}
	
	//console.log( JSON.stringify(obj, null, 4));
	return obj;
};