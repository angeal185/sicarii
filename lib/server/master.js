const http2 = require('http2'),
config = require(process.env.config_file),
utils = require('../utils');

let Cache = require('../extends/cache'),
cache;

const server = http2.createSecureServer(config.cache.server);

server.setSecureContext(utils.set_cert());

server.on('stream', function (stream, headers) {
  stream.headers = config.cache.headers;

  let ip = utils.sort_ip(stream),
  method = headers['access-control-request-method'],
  hpath = headers[':path'],
  token = headers[config.cache.authtoken.header],
  ctype = headers['content-type'];

  if(config.cache.whitelist.enabled){
    if(config.cache.whitelist.ip.indexOf(ip) === -1){
      return utils.cache_res(stream, 401, 'Unauthorized');
    }
  }

  if(config.cache.authtoken.enabled && token !== config.cache.authtoken.token || ctype !== 'application/json'){
    return utils.cache_res(stream, 500, 'Bad Request');
  }

  let body = '';
  stream.on('data', function(chunk){
    body += chunk;
  });

  stream.on('end', function(){
    try {
      body = JSON.parse(body);
      return utils.cache_res(stream, 200, cache[body.method](body.src, body.data));
    } catch (err) {
      return utils.cache_res(stream, 500, 'Error In Request');
    }
  })

})

server.on('listening', function(err,res){
  cache = new Cache();
  utils.cc(['cache', 'Server pid:'+ process.pid +' listening at '+ config.origin +':'+config.cache.port],96);
})

module.exports = { server, Cache }
