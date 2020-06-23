const http2 = require('http2'),
fs = require('fs'),
config = require(process.env.config_file),
utils = require('./lib/utils'),
{ master } = require('./lib/extends/sync'),
{ cluster } = require('./'),
Logs = require('./lib/utils/logs'),
logs = new Logs(config.logs, config.compression);

let Cache = require('./lib/extends/cache'),
cache;

const server = http2.createSecureServer(config.cache.server);

server.setSecureContext(utils.set_cert())


server.on('stream', function (stream, headers) {
  stream.headers = config.cache.headers;

  let ip;

  if(config.cache.proxy){
    ip = headers['x-forwarded-for'] || stream.session.socket.remoteAddress;
  } else {
    ip = stream.session.socket.remoteAddress;
  }

  let method = headers['access-control-request-method'],
  hpath = headers[':path'],
  token = headers[config.cache.authtoken.header],
  ctype = headers['content-type'];

  if(config.cache.whitelist.enabled){
    if(config.cache.whitelist.ip.indexOf(ip) === -1){
      stream.headers[':status'] = 401
      stream.respond(stream.headers);
      return stream.end(JSON.stringify({code: 401, data: 'Unauthorized'}, 'utf8'));
    }
  }

  if(config.cache.authtoken.enabled && token !== config.cache.authtoken.token){
    stream.headers[':status'] = 500
    stream.respond(stream.headers);
    return stream.end(JSON.stringify({code: 500, data: 'Bad Request'}, 'utf8'));
  }

  let body = '';
  stream.on('data', function(chunk, i){
      body += chunk;
  });

  stream.on('end', function(){

    let result;

    try {
      body = JSON.parse(body);
      result = {
        code: 200,
        data: cache[body.method](body.src, body.data)
      }
      stream.headers[':status'] = 200;
    } catch (err) {
      result = {
        code: 500,
        data: 'error in request'
      }
      stream.headers[':status'] = 500;
    } finally{
      stream.respond(stream.headers);
      return stream.end(JSON.stringify(result), 'utf8');
    }

  })

})

server.on('listening', function(err,res){
  Object.freeze(Cache);
  cache = new Cache();
  utils.cc(['cache', 'Server pid:'+ process.pid +' listening at '+ config.origin +':'+config.cache.port],96);
})

function Sync(){

}

Sync.prototype = {
  init: function(obj){
    master.init(obj, logs)
    return this;
  },
  respawn: function(){
    if(config.sync.respawn){
      master.respawn(logs)
    }
    return this;
  },
  listen: function(cb){
    server.listen(config.cache.port, cb)
  },
  kill: function(id){
    master.kill(id);
    return this;
  },
  kill_all: function(){
    master.kill_all();
    return this;
  }
}

const sync = new Sync();

module.exports = { Cache, server, logs, sync};
