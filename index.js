const cluster = require('cluster'),
cwd = process.cwd(),
config = require(cwd + '/config/config'),
fs = require('fs'),
{ gzip, deflate, brotli} = require('./lib/utils/compress'),
utils = require('./lib/utils');

const app  = {
  config: config,
  cookie_encode: utils.cookie_encode,
  cookie_decode: utils.cookie_decode,
  etag: utils.etag,
  set_cert: utils.set_cert(),
  fetch: utils.fetch,
  del_build: function(){
    let dir = __dirname;
    fs.unlink(dir + '/build.js', function(err){
      if(err){return console.error('failed to delete build.js')}
      fs.unlink(dir + '/lib/utils/init.js', function(err){
        if(err){return console.error('failed to delete init.js')}
        utils.cc(['app', 'Delete success'],96);
      })
    })

  },
  gzip: gzip,
  deflate: deflate,
  brotli: brotli
}

module.exports = { app, cluster }
