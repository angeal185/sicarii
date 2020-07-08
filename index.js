if(!process.env.config_file){
  process.env.config_file = process.cwd() + '/config/config';
}

const cluster = require('cluster'),
config = require(process.env.config_file),
fs = require('fs'),
{ gzip, deflate, brotli} = require('./lib/utils/compress'),
utils = require('./lib/utils');

process.env.static_path = config.static.path.slice(1);
process.env.render_path = config.render.path.slice(1);

const app  = {
  config: config,
  env: function(i){
    return process.env[i];
  },
  set: function(i,e){
    process.env[i] = e;
  },
  cookie_encode: utils.cookie_encode,
  cookie_sign: utils.cookie_sign,
  cookie_verify: utils.cookie_verify,
  cookie_decode: utils.cookie_decode,
  etag: utils.etag,
  digest: utils.digest,
  uuid: utils.uuid,
  set_cert: utils.set_cert(),
  fetch: utils.fetch,
  session: function(method, data, cb){
    return utils.store_fetch(method, data, 'session', cb)
  },
  store: function(method, data, cb){
    return utils.store_fetch(method, data, 'store', cb)
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
  engine: utils.engine,
  gzip: gzip,
  deflate: deflate,
  brotli: brotli,
  blacklist: function(ip){
    utils.add_ip(ip, 'blacklist')
  },
  whitelist: function(ip){
    utils.add_ip(ip, 'whitelist')
  },
  bot: function(ua){
    return utils.is_bot(ua, config.bot.detect.items);
  },
  qs: utils.qs
}

module.exports = { app, cluster }
