var fs = require('fs');
var path = require('path');
module.exports = function () {
  return fs.readFileSync(path.resolve(__dirname, '../../examples/normal.conf'), 'utf-8');
}
