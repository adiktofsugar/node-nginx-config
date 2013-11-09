#!/usr/bin/env node

var parse = require('./parse'),
	fs = require('fs');

var conf = parse( fs.readFileSync('./test-conf.conf', 'utf-8') );
console.log(JSON.stringify(conf, null, 4));
