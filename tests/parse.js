var vows = require('vows'),
	assert = require('assert'),
	parse = require('../lib/parse'),
	getConf = require('./utils/getConf');



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
