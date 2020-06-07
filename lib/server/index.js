global.cl = console.log;
global.js = JSON.stringify;
global.jp = JSON.parse;


const fs = require('fs'),
stream = require('stream'),
http2 = require('http2');

let config;

try {
  config = require(process.cwd() + '/config/config');
} catch (err) {
  require('../utils/init').config()
}

global.cc = function(x,y){
  if(config.verbose){
    cl('\x1b[92m[\x1b[94msicarii\x1b[92m:\x1b[94m'+x[0]+'\x1b[92m] \x1b['+y+'m'+ x[1] +' \x1b[0m');
  }
  return
}

const utils = require('../utils'),
url = require('url'),
EventEmitter = require('events'),
path = require('path'),
Cache = require('../utils/cache')
ip_config = require(process.cwd() + '/config/ip_config');

class evt extends EventEmitter {};

let evts = {
  stream: {}
}

let router = new evt();

for (let i = 0; i < config.methods.length; i++) {
  evts[config.methods[i]] = new evt();
  router[config.methods[i]] = function(dest_url,stream,headers){
    return evts[config.methods[i]].on(dest_url,stream,headers);
  }
}

let cert_arr = ['cert', 'key', 'pfx', 'ca'];
for (let i = 0; i < cert_arr.length; i++) {
  if(config.server[cert_arr[i]] && config.server[cert_arr[i]] !== ''){
    config.server[cert_arr[i]] = fs.readFileSync(process.cwd() + config.server[cert_arr[i]]);
    if(cert_arr[i] === 'ca'){
      config.server[cert_arr[i]] = [config.server[cert_arr[i]]]
    }
  }
}

cert_arr = null;

const server = http2.createSecureServer(config.server);

server.cache = new Cache();

// extends
require('../extends/stream')(stream, utils, server, config);


let engine = config.template_engine;
for (let i = 0; i < engine.engines.length; i++) {
  if(engine[engine.engines[i]].enabled){
    require('../adapters/'+ engine.engines[i])(stream, config, server.cache);
    cl('Template engine set to '+ engine.engines[i])
    break;
  }
}
engine = null;

let cache_arr = ['static','render','store'];
for (let i = 0; i < cache_arr.length; i++) {
  if(config[cache_arr[i]].cache.enabled){
    cl(cache_arr[i] +' cache watching...')
    setInterval(function(){
      server.cache.check(cache_arr[i]);
    },config[cache_arr[i]].cache.maxage)
  }
}



server.on('listening', function(err,res){
  cc(['init', 'Server listening at https:\/\/localhost:'+config.port],96);
})

server.on('error', function(err){
  console.error(err)
})


server.on('stream', function (stream, headers) {
  stream.headers = {}
  //cl(stream.session.socket)
  try {
    if(config.blacklist.enabled || config.whitelist.enabled || config.authtoken.enabled){
      let ip;

      if(config.proxy){
        ip = headers['x-forwarded-for'] || stream.session.socket.remoteAddress;
      } else {
        ip = stream.session.socket.remoteAddress;
      }

      if(config.blacklist.enabled){
        if(ip_config.blacklist.indexOf(ip) !== -1){
          router.emit('auth_error', {type: 'blacklist', ip: ip});
          return utils.err(stream, headers[':method'], headers[':path'], 401, config.blacklist.msg)
        }
      }
      if(config.whitelist.enabled){
        if(ip_config.whitelist.indexOf(ip) === -1){
          router.emit('auth_error', {type: 'whitelist', ip: ip});
          return utils.err(stream, headers[':method'], headers[':path'], 401, config.whitelist.msg)
        }
      }
      if(config.authtoken.enabled){
        router.emit('auth_error', {type: 'authtoken', ip: ip});
        if(headers[config.authtoken.header] !== config.authtoken.token){
          return utils.err(stream, headers[':method'], headers[':path'], 401, config.authtoken.msg)
        }
      }
    }

    let dest_url = headers[':path'];
    ext = path.extname(dest_url).slice(1),
    method = headers[':method'].toLowerCase();


    if(config.methods.indexOf(method) === -1){
      return utils.err(stream, headers[':method'], headers[':path'], 405, 'Method Not Allowed')
    }

    stream.headers['Origin'] = config.origin;

    if(ext !== '' && method === 'get'){
      return utils.serve_static(dest_url, ext, stream, server.cache);
    } else if(['get','connect', 'head', 'options', 'trace'].indexOf(method) !== -1){
      try {

        let x = new URL(config.origin + dest_url),
        str = x.search.slice(1),
        query = {};

        if(str !== ''){
          str = utils.qsJSON(str);
          if(str){

          }
          query = str;
        }

        stream.query = query;

        str = null;
        query = null;

        evts[method].emit(x.pathname, stream, headers);

      } catch (err) {
        cl(err)
      }


    } else if(['post', 'delete', 'patch', 'put'].indexOf(method) !== -1){

      let body = '';
      stream.on('data', function(chunk, i){
          body += chunk;
      });

      stream.on('end', function(){
        stream.buffer = Buffer.from(body);
        stream.body = body;
        if(headers['content-type'] === 'application/json'){
          stream.json = JSON.parse(stream.body);
        }
        body = null;
        evts[method].emit(dest_url, stream, headers);
      });

      stream.on('error', function(){
        return utils.err(stream, headers[':method'], headers[':path'], 500, 'Bad Request');
      });

    }

  } catch (err) {
    cl(err)
    //return utils.err(stream, headers[':method'], headers[':path'], 400, 'Bad Request')
  }
})



const sicarii = {

}

/*
server.on('stream', function(stream, headers){
  cl(stream.headers);


  stream.headers = {}
  // stream is a Duplex
  const method = headers[':method'];
  //cl(stream.session.socket.remoteAddress)

  cl(stream.headers)

  stream.respond(stream.headers);


//  cl(headers)
  stream.json({test: 'ok'})

});
*/

// get cl(Object.getPrototypeOf())
//ServerHttp2Stream { [Symbol(proceed)]: [Function: respond] }


http2.Http2ServerResponse.prototype.cookie = function(key, val, obj){
  let new_obj = {};
  new_obj[key] = val;
  new_obj = Object.assign(new_obj, obj);
  new_obj = utils.cookie_encode(new_obj);
  this.setHeader('Set-Cookie', new_obj);
  return this
}

http2.Http2ServerResponse.prototype.doc = function(src, charset){
  return utils.serve(config.render.path.slice(1), '/'+ src, charset, this, server.cache);
}

http2.Http2ServerResponse.prototype.json = function(chunk, encoding, cb){
  this.setHeader('Content-Type', 'application/json');
  return this.end(JSON.stringify(chunk), encoding, cb)
}

if(config.base_build.enabled){
  server.build = require('../utils/init').build();
}






module.exports = { server, router, sicarii };
