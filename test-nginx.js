#!/usr/bin/env node

var WITH_NGINX_TEST = true;

var nginx_config_parser = require('./lib/nginx_config_parser'),
	fs = require('fs'),
	spawn = require('child_process').spawn,
	path = require('path');



var nginxConfLocation = {
		"test": './test-conf.conf',
		"real": '/usr/local/nginx/conf/nginx.conf'
	}[ WITH_NGINX_TEST ? "real" : "test" ],
	confDir = '/usr/local/nginx/conf/';

var conf = nginx_config_parser.parse( fs.readFileSync(nginxConfLocation, 'utf-8') ),
	sameThing = nginx_config_parser.stringify(conf);

console.log(JSON.stringify(conf, null, 4));
return;

if (WITH_NGINX_TEST) {
	
	fs.writeFileSync( path.join(confDir, 'my-nginx.conf'), sameThing);
	
	
	var nginxConfTest = spawn('sudo', ['nginx', '-c', path.join(confDir, 'my-nginx.conf')]);
	
	nginxConfTest.stdout.on('data', function (data) {
	  console.log('nginx stdout: ' + data);
	});
	
	nginxConfTest.stderr.on('data', function (data) {
	  console.log('nginx stderr: ' + data);
	});
	
	nginxConfTest.on('close', function (code) {
		console.log('nginx conf test exited with code ' + code);
	});



} else {
	console.log( sameThing );
}