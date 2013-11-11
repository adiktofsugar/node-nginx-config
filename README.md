Nginx config parser
================

Should parse and stringify nginx configs so they can be modified programmatically.

Installation

	npm install nginx-config-parser

Example use:

	var ncp = require('nginx-config-parser'),
		fs = require('fs');
	
	var config = ncp.queryFromString( fs.readFileSync(NGINX_LOCATION, 'utf-8') );
	
	config.find('http', 'server')
		.where('server_name').match(/notcool\.com/)
		.remove()
		
		.parent()
	
		.find('http', 'server')
		.where('server_name').match(/corslocation\.com/)
		.find(/location.*)
		.createNewNode('if $request_method = "OPTIONS"')
			.addDirective('add_header', 'Access-Allow-Origin:', '*')
			.addToQuery();
	
	fs.writeFileSync( NGINX_LOCATION, config.stringify() );

That should get all servers with server name that matches "notcool.com" and remove them.
Then it'll find all the servers with server name "corslocation.com", and add an if node/block with the add_header Access-Allow-Origin: *; in it.

It's very chainable. It's definitely not amazing, but I also definitely spent more time on it than I should have...

Things I'm aware it can't do
-------
- add a directive (which is something that ends in a semicolon)

It's late. I'm not a huge fan of documenting. You know how this goes...


The issues for sure
-------

### The parser
The parser is all one big stateful thing. I've never written a parser before, and this seemed like a good chance for one.
With that disclaimer stated...

The parser adds _isNodeArray and _isDirectiveArray to the respective arrays so that stringify can pump them out.
This logic is repeated in the NodeBuilder. That bugs me. Really there should be the one NodeBuilder that takes a string or a parsed
object and can be modified, then call it's build method for parse.

...but That's not what I did. I didn't build the NodeBuilder until last.
