var vows = require('vows'),
	path = require('path'),
	assert = require('assert'),
	
	ncp = require('../lib/nginx-config-parser'),
	
	fs = require('fs'),
	getConf = function () {
		return fs.readFileSync(path.join(__dirname, 'test-conf.conf'), 'utf-8');
	};


vows.describe('main module')
.addBatch({
	'query': {
		topic: ncp.queryFromString( getConf() ),
		'finding all servers': {
			topic: function (q) {
				return q.find('http', 'server');
			},
			'should have all the servers in the https': function (q) {
				assert.equal(q.length, 3);
			}
		},
		'finding all certain locations': {
			topic: function (q) {
				return q.find('http', 'server', /location/);
			},
			'should contain all locations in all servers in all https': function (t) {
				assert.equal(t.length, 2);
			}
		}
	}
})
.export(module);
