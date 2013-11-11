var vows = require('vows'),
	assert = require('assert'),
	
	parse = require('../lib/parse'),
	
	fs = require('fs'),
	getConf = function () {
		return fs.readFileSync('./test-conf.conf', 'utf-8');
	};



vows.describe('parse')
.addBatch({
	'parses': {
		topic: parse( getConf() ),
		'should get two https': function (t) {
			assert(t.http.length, 2);
		}
	}
})
.export(module);