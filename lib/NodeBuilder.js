var _ = require('underscore');

var nodeBuilderProto = {
	_isNodeBuilder: true,
	
	addNode: function ( nodeName ) {
		if (!this.nodes) {
			this.nodes = [];
		}
		var newNode = createNodeBuilder(nodeName, this);
		this.nodes.push(  newNode );
		
		return newNode;
	},
	addDirective: function (name) {
		if (!this.directives) {
			this.directives = [];
		}
		
		this.directives.push({
			name: name,
			values: Array.prototype.slice.call(arguments, 1)
		});
		
		return this;
	},
	
	parent: function () {
		if (this.parent) {
			return this.parent;
		}
		return this;
	},
	
	root: function () {
		if (this.parent) {
			return this.parent.root();
		}
		return this;
	},
	
	// makes it a real parsed config
	// Assumes the thing using this will extract it's name
	build: function () {
		
		var nodeObj = {};
		_.each(this.directives, function (d) {
			if (!nodeObj[d.name]) {
				nodeObj[d.name] = [];
				nodeObj[d.name]._isDirectiveArray = true;
			}
			nodeObj[ d.name ].push(d.values);
		});
		
		_.each(this.nodes, function (n) {
			if (!nodeObj[n.name]) {
				nodeObj[n.name] = [];
				nodeObj[n.name]._isNodeArray = true;
			}
			nodeObj[ n.name ].push( n.build() );
		});
		
		return nodeObj;
	}
};
var createNodeBuilder = function (nodeName, parent) {
	var nodeBuilder = Object.create(nodeBuilderProto);
	
	_.extend(nodeBuilder, {
		name: nodeName,
		nodeName: nodeName,
		
		parent: parent
	});
	
	return nodeBuilder;
};

module.exports = {
	create: createNodeBuilder
};
