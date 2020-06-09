const cwd = process.cwd(),
utils = require('./utils');

module.exports = {
  config: require(cwd + '/config/config'),
  cookie: {
    encode: utils.cookie_encode,
    decode: utils.cookie_decode
  },
  etag: utils.etag
}
