var parse = require('./parse'),
	stringify = require('./stringify'),
	QueryableNodeBuilder = require('./QueryableNodeBuilder'),
	_ = require("underscore");

var DEBUG_MODE = false;
var dLog = function () {
	if (DEBUG_MODE) {
		console.log.apply(console, arguments);
	}
};


// Might not be a regex
var resetRegex = function (regex) {
	if (regex && regex.exec && regex.compile && regex.lastIndex !== undefined) {
		regex.lastIndex = 0;
	}
};

var stringOrRegexMatch = function (matchee, matcher) {
	var isMatch = false;
	if (typeof matcher == "string") {
		isMatch = (matchee == matcher);
	} else {
		isMatch = !!String(matchee).match(matcher);
		resetRegex(matcher);
	}
	return isMatch;
};

var matcherProto = Object.create({});
_.extend(matcherProto, {
	init: function (attributeName, queryable) {
		
		// attributeName is what i will be matching each of the
		// queryable's keys against
		// It can be a string or a regex
		this.attributeName = attributeName;
		
		// queryable is the queryable I will be filtering
		this.queryable = queryable;
		
		dLog('===== matcher init, queryable ====', queryable);
	},
	
	/*
	 * This will return a new queryable,
	 * whose parent is the original queryable
	 * where the base queryable's attributeName match this attributeValue
	 *
	 * This means that any element of the queryable that does not HAVE the
	 * attributeName key will be discarded
	 */
	match: function (attributeValue) {
		var newData = [],
			matcher = this;
		
		dLog('match called');
		
		_.each(this.queryable, function (datum) {
			dLog("queryable element ", datum);
			
			datumChecker: for (var key in datum) {
				if (!datum.hasOwnProperty(key)) {
					continue;
				}
				
				if (key == "parentArray") {
					continue;
				
				}
				dLog('--- key', key);
				
				if (stringOrRegexMatch(key, matcher.attributeName)) {
					dLog('--- key matches ' + matcher.attributeName);
					
					// Each of these keys have an array associated with them
					// so to match it, I'll need to check all of the values associated with this key
					// I'll return it if ANY match
					
					var values = datum[key];
					for (var i = 0; i < values.length; i++) {
						var value = values[i];
						dLog('--- checking ', value, ' if it matches', attributeValue);
						
						if (stringOrRegexMatch(value, attributeValue)) {
							newData.push(datum);
							break datumChecker;
						}
					}
				}
			}
		});
		
		dLog("match data", newData);
		return createQueryable(newData, this.queryable);
	},
	all: function() {
		// convenience method
		return this.match(/./);
	}
});

var createMatcher = function (attributeName, queryable) {
	var matcher = Object.create(matcherProto);
	matcher.init(attributeName, queryable);
	return matcher;
};


// Extending from an array, 
var queryableProto = Object.create([]);
_.extend(queryableProto, {
	/*
	 * @returns Queryable
	 */
	init: function (data, parent) {
		if (this === queryableProto) {
			throw new Error("Do not directly init the prototype.");
		}
		this.parent = parent;
		this.clear();
		
		
		if ( !(data instanceof Array) ) {
			data = [data];
		}
		
		var q = this;
		data.forEach(function (value) {
			q.push(value);
		});
	},
	
	
	/*
	 * Each argument is treated as an incremental search
	 *  each item can be a string or a regex
	 * @example
	 *  q.find('http', 'server', /location/)
	 *  will return all the /location/ blocks in all the 'server' blocks in all the 'http' blocks
	 * 
	 * @returns A new Queryable
	 */
	find: function () {
		
		dLog("========= in find ==========");
		
		var keys = Array.prototype.slice.call(arguments),
			key;
		
		if (!keys.length) {
			throw new Error("Must provide arguments to find.");
		}
		
		var currentData = this, // This will become the data for the new queryable
			bufferData; //These get remade each key
		
		dLog("---- keys", keys);
		
		while ( (key = keys.shift()) ) {
			bufferData = [];
			
			dLog('--- looking for ', key);
			
			currentData.forEach(function (configDataPoint) {
				
				dLog('--- data point', configDataPoint);
				
				for (var dataPointKey in configDataPoint) {
					dLog('------ data point key', dataPointKey);
					
					if (stringOrRegexMatch(dataPointKey, key)) {
						dLog('--------- data point key matches');
						
						var configDataArray = configDataPoint[dataPointKey];
						
						// Point all of the elements of this array back to the original
						// so i can modify the array in place later on.
						_.each(configDataArray, function (obj) {
							obj.parentArray = configDataArray;
							bufferData.push( obj );
						});
					}
				}
			});
			
			currentData = bufferData;
		}
		
		dLog('--- reutrning queryable based on this data', currentData);
		var q = createQueryable(currentData, this);
		
		dLog('--- returning queryable', q);
		return q;
	},
	
	/*
	 * Returns new queryable with only that index (or empty)
	 */
	eq: function (index) {
		return createQueryable( this[index] || [], this);
	},
	
	/*
	 * Returns a matcher
	 * The idea is that you'll do something like this:
	 * @example
	 * queryable.find('server').where('server_name').match(/awe/).find(/location/)
	 *
	 * So "where" returns a matcher whose "match" method you call, which will return a filtered queryable
	 */
	where: function (attributeName) {
		return createMatcher(attributeName, this);
	},
	
	
	
	
	_getDataPointIndex: function (datum) {
		var parentArray = datum.parentArray;
		if (!parentArray) {
			throw new Error("data point has no parent array!");
			
		} else {
			for (var i=0; i < parentArray.length; i++) {
				if (parentArray[i] == datum) {
					return i;
				}
			}
			throw new Error("Could not find data point inside array");
		}
	},
	
	
	remove: function () {
		var queryable = this;
		_.each(this, function (datum) {
			var dataPointIndex = queryable._getDataPointIndex(datum);
			datum.parentArray.splice(dataPointIndex, 1);
		});
		
		return this;
	},
	
	
	_parseNewNode: function (newNode) {
		var isBuilder = newNode._isNodeBuilder;
		if (isBuilder) {
			newNode = newNode.build();
		}
		return newNode;
	},
	
	addNode: function (key, newNode) {
		newNode = this._parseNewNode( newNode );
		
		_.each(this, function (datum) {	
			if (!datum[key]) {
				datum[key] = [];
				datum[key]._isNodeArray = true;
			}
			datum[key].push(newNode);
		});
		
		return this;
	},
	replaceWith: function ( newNode ) {
		var queryable = this;
		newNode = this._parseNewNode( newNode );
		
		_.each(this, function (datum) {
			var dataPointIndex = queryable._getDataPointIndex(datum);
			datum.parentArray.splice(dataPointIndex, 1, newNode);
		});
		
		return this;
	},
	
	
	/*
	 * Allows NodeBuilder to be accessed implicitly
	 */
	createNewNode: function (name) {
		return QueryableNodeBuilder.create(this, name);
	},
	alterNodes: function () {
		return QueryableNodeBuilder.create(this, this);
	},
	
	parent: function () {
		return this.parent;
	},
	root: function () {
		if (this.parent) {
			return this.parent.root();
		}
		return this; //only root doesn't have a parent
	},
	
	// output whatever this is currently matching
	stringify: function () {
		var stringifieds = [];
		
		_.each(this, function (datum) {
			stringifieds.push( stringify(datum) );
		});
		
		return stringifieds.join("\n");
	},
	
	
	clear: function () {
		this.splice(0, this.length);
	}
});

var createQueryable = function ( data, parent ) {
	var q = Object.create(queryableProto);
	
	if (typeof data == "string") {
		data = parse(data);
	}
	
	q.init(data, parent);
	return q;
};


module.exports = {
	create: createQueryable
};