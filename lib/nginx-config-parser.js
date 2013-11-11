var Queryable = require('./Queryable'),
	parse = require('./parse');

//
// There are some weird things that happen
// with parsing from files in other scripts
// with relative loactions,
// so I'm not including it anymore.
//

var parseFromString = function (data) {
	return parse(data);
};

var queryFromString = function (data) {
	return Queryable.create( parseFromString(data) );
};

module.exports = {
	parseFromString: parseFromString,
	queryFromString: queryFromString
};