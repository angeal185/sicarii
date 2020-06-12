const cluster = require('cluster'),
cwd = process.cwd(),
config = require(cwd + '/config/config'),
fs = require('fs'),
utils = require('./lib/utils');

const app  = {
  config: config,
  cookie_encode: utils.cookie_encode,
  cookie_decode: utils.cookie_decode,
  etag: utils.etag,
  set_cert: utils.set_cert(),
  delete_build: function(){

  }
}

module.exports = { app, cluster }
