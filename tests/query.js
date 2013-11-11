var vows = require('vows'),
	assert = require('assert'),
	
	Queryable = require('../lib/Queryable'),
	NodeBuilder = require('../lib/NodeBuilder'),
	
	fs = require('fs'),
	getConf = function () {
		return fs.readFileSync('./test-conf.conf', 'utf-8');
	};


vows.describe('Queries')
.addBatch({
	'init': {
		topic: Queryable.create( getConf() ),
		'should have have two https in actual object': function (q) {
			assert(q[0].http.length, 2);
		}
	},
	'find': {
		topic: Queryable.create( getConf() ),
		'should have find method': function (t) {
			assert.isFunction(t.find);
		},
		'should error if no selector is given': function (t) {
			assert.throws(function () { t.find(); });
		},
		'should return a filtered queryable': {
			topic: function (topic) {
				return topic.find('http');
			},
			'should contain http only': function (t) {
				assert.equal(t.length, 2);
			}
		},
		'should work with multiple selectrors': {
			topic: function (topic) {
				return topic.find('http', 'server');
			},
			'should contain the server instances in all of the https': function (t) {
				assert.equal(t.length, 3);
			}
		}
	},
	'where': {
		topic: Queryable.create( getConf() ).find('http', 'server').where('server_name'),
		
		'should return a matcher': function (t) {
			assert.isFunction(t.match);
		},
		'works with regex': {
			topic: Queryable.create( getConf() ).find('http', 'server')
				.where(/location.*?another/).all(),
			'should have an array of matching elements': function (t) {
				assert.equal(t.length, 1);
				assert.isFunction(t.find); // is a queryable
			}
		},
		
		'match': {
			'when it exists': {
				topic: function (topic) {
					return topic.match('another.server');
				},
				'should have an array of matching elements': function (t) {
					assert.equal(t.length, 1);
					assert.isFunction(t.find); // is a queryable
				}
			},
			'when it doesn\'t exist': {
				topic: function (topic) {
					return topic.match('something else');
				},
				'should have an array of matching elements': function (t) {
					assert.equal(t.length, 0);
					assert.isFunction(t.find); // is a queryable
				}
			},
			'works with regex': {
				topic: function (topic) {
					return topic.match(/another/);
				},
				'should have an array of matching elements': function (t) {
					assert.equal(t.length, 1);
					assert.isFunction(t.find); // is a queryable
				}
			}
		}
	},
	'stringify': {
		topic: Queryable.create( getConf() ),
		'should be able to stringify entire configuration': function (t) {
			var s = function () { t.stringify(); };
			assert.doesNotThrow(s);
		},
		'should be able to stringify part of configuration': function (t) {
			t = t.find('http');
			var s = function () { t.stringify(); };
			assert.doesNotThrow(s);
		}
	}
})

.addBatch({
	'remove': {
		topic: Queryable.create( getConf() ),
		'cannot remove root node': function (t) {
			var s = function () {
				t.remove();
			};
			assert.throws(s);
		},
		'should remove current matched nodes': function (t) {
			t.find('http', 'server').remove();
			var s = t.stringify();
			var matches = s.match(/\s+server\s+\{/);
			
			// there is no doesNotMatch
			assert.equal(matches, null);
		}
	},
	'createNewNode/replaceQuery': {
		topic: Queryable.create( getConf() ).find('http', 'server')
			.where('server_name')
			.match(/another/),
		
		'creates new node with NodeBuilder and replaces': function (t) {
			t.createNewNode('server')
				.addDirective('expires', 'on')
				.replaceQuery();
			
			var newQuery = t.root().find('http', 'server').where('expires').match('on');
			
			assert.equal(newQuery.length, 1);
		}
	},
	'createNewNode/addToQuery': {
		topic: Queryable.create( getConf() ),
		'creates new node with NodeBuilder and adds': function (t) {
			var newQuery;
			
			newQuery = t.find('http', 'server');
			assert.equal(newQuery.length, 3);
			
			// add new one
			t.find('http').eq(0)
				.createNewNode('server')
				.addDirective('whoop', 'dee', 'doo')
				.addToQuery();
			
			//console.log( t.stringify() );
			
			newQuery = t.find('http', 'server');
			assert.equal(newQuery.length, 4);
		}
	}
})
.export(module);