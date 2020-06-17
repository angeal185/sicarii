if(!process.env.config_file){
  process.env.config_file = process.cwd() + '/config/config';
}

const cluster = require('cluster'),
config = require(process.env.config_file),
fs = require('fs'),
{ gzip, deflate, brotli} = require('./lib/utils/compress'),
utils = require('./lib/utils');

const app  = {
  config: config,
  cookie_encode: utils.cookie_encode,
  cookie_decode: utils.cookie_decode,
  etag: utils.etag,
  digest: utils.digest,
  uuid: utils.uuid,
  set_cert: utils.set_cert(),
  fetch: utils.fetch,
  session: function(method, data, cb){
    if(typeof data === 'function'){
      cb = data;
      data = {}
    }

    let head = {
      'url': config.cache.url,
      ':method': 'POST',
      ':path': '/',
      'Content-Type': 'application/json',
      'body': JSON.stringify({
        method: 'session_' + method,
        src: 'session',
        data: data
      })
    }

    if(config.cache.authtoken.enabled){
      head[config.cache.authtoken.header] = config.cache.authtoken.token;
    }

    utils.fetch(head, function(err,res){
      if(err){return cb(err)}
      cb(false, res.json)
    })

  },
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
  brotli: brotli,
  blacklist: function(ip){
    utils.add_ip(ip, 'blacklist')
  },
  whitelist: function(ip){
    utils.add_ip(ip, 'whitelist')
  }
}

module.exports = { app, cluster }
