var vows = require('vows'),
	path = require('path'),
	assert = require('assert'),
	
	stringify = require('../lib/stringify'),
	parse = require('../lib/parse'),
	Queryable = require('../lib/Queryable'),
	
	fs = require('fs'),
	getConf = function () {
		return fs.readFileSync(path.join(__dirname, 'test-conf.conf'), 'utf-8');
	};


vows.describe('stringify')
.addBatch({
	'from parsed': {
		topic: parse( getConf() ),
		
		'entire config': function (t) {
			var s = function () { stringify(t); };
			assert.doesNotThrow(s);
		},
		'single node': function (t) {
			var node = t.http[0];
			var s = function () {
				stringify(node);
			};
			assert.doesNotThrow(s);
		}
	},
	'from query': {
		topic: Queryable.create( getConf() ),
		'entire config': function (t) {
			var s = function () {
				stringify( t[0] );
			};
			assert.doesNotThrow(s);
		},
		'single node': function (t) {
			var node = t.find('http')[0];
			var s = function () {
				stringify( node );
			};
			assert.doesNotThrow(s);
		}
	}
	
})
.export(module);
