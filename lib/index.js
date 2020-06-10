const cwd = process.cwd(),
utils = require('./utils');

module.exports = {
  config: require(cwd + '/config/config'),
  cookie_encode: utils.cookie_encode,
  cookie_decode: utils.cookie_decode,
  etag: utils.etag
}
