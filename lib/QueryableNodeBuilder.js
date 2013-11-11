var NodeBuilder = require('./NodeBuilder'),
	_ = require('underscore');


var queryableNodeBuilderProto = {
	addToQuery: function () {
		return this.queryable.addNode( this.name, this );
	},
	replaceQuery: function () {
		return this.queryable.replaceWith( this );
	}
};

var createQueryableNodeBuilder = function (queryable) {
	var qnBuilder = Object.create(queryableNodeBuilderProto);
	_.extend(qnBuilder, {
		queryable: queryable
	});
	
	var args = Array.prototype.slice.call(arguments, 1);
	var nodeBuilder = NodeBuilder.create.apply(this, args);
	
	// Add the extra functions
	_.extend(nodeBuilder, qnBuilder);
	
	return nodeBuilder;
};

module.exports = {
	create: createQueryableNodeBuilder
}