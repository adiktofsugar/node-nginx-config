
module.exports = function ( parsedNode, DEBUG_MODE ) {
	
	var dLog = function () {
		if (DEBUG_MODE) {
			console.log.apply(console, arguments);
		}
	};

	
	var stringFromComments = function (comments, indent) {
		var s = "";
		for (var i=0; i < comments.length; i++) {
			s += indent + "#" + comments[i] + "\n";
		}
		return s;
	};
	
	var stringFromNodes = function (key, nodes, indent) {
		var s = "";
		
		for (var i=0; i < nodes.length; i++) {
			var node = nodes[i];
			s += ""
				+ indent + key + " {" + "\n"
				+ indent + stringFromNode(node, indent.length + 4) + "\n"
				+ indent + "}" + "\n";
		}
		
		return s;
	};
	
	var stringFromDirectives = function (key, directives, indent) {
		var s =  "";
		for (var i = 0; i < directives.length; i++) {
			s += indent + key + " " + directives[i].join(" ") + ";" + " \n";
		}
		return s;
	};
	
	var stringFromNode = function (node, indentAmount) {
		
		dLog("=== in stringFromNode ===");
		
		indentAmount = indentAmount || 0;
		var indent = "";
		for (var i = 0; i < indentAmount; i++) {
			indent += " ";
		}
		
		var nodeString = "";
		for (var key in node) {
			var v = node[key];
			
			dLog("key = ", key);
			
			// comments array
			if (key == "comments") {
				//nodeString += stringFromComments(v, indent) + "\n";
			
			// Queryable puts a parentArray key on node arrays so that it can delete them.
			} else if (key == "parentArray") {
				continue;
				
			} else if (v._isNodeArray) {
				dLog("--- is node");
				nodeString += stringFromNodes(key, v, indent);
			
			} else if (v._isDirectiveArray) {
				dLog("--- is directive");
				nodeString += stringFromDirectives(key, v, indent);
			}
			
		}
		
		return nodeString;
	};
	
	return stringFromNode(parsedNode);
	
};