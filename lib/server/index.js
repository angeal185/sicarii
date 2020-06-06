global.cl = console.log;
global.js = JSON.stringify;
global.jp = JSON.parse;
global.cc = function(x,y){
  return cl('\x1b[92m[\x1b[94mCMS\x1b[92m:\x1b[94m'+x[0]+'\x1b[92m] \x1b['+y+'m'+ x[1] +' \x1b[0m');
}

const fs = require('fs'),
https = require('https'),
http = require('http');
let config;

try {
  config = require(process.cwd() + '/config/config');
} catch (err) {
  require('../utils/init').config()
}

if(config.template_engine.nunjucks.enabled){
  require('../adapters/nunjucks')(http,config)
} else if(config.template_engine.pug.enabled){
  require('../adapters/pug')(http,config)
}

const utils = require('../utils'),
url = require('url'),
EventEmitter = require('events'),
path = require('path'),
Cache = require('../utils/cache')
ip_config = require(process.cwd() + '/config/ip_config');

class evt extends EventEmitter {};

let evts = {}
let router = new evt();

for (let i = 0; i < config.methods.length; i++) {
  evts[config.methods[i]] = new evt();
  router[config.methods[i]] = function(dest_url,req,res){
    return evts[config.methods[i]].on(dest_url,req,res);
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

const server = https.createServer(config.server);

server.cache = new Cache();

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

server.on('request', function (req, res) {


  try {
    if(config.blacklist.enabled || config.whitelist.enabled || config.authtoken.enabled){
      let ip;

      if(config.proxy){
        ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
      } else {
        ip = req.connection.remoteAddress;
      }

      if(config.blacklist.enabled){
        if(ip_config.blacklist.indexOf(ip) !== -1){
          router.emit('auth_error', {type: 'blacklist', ip: ip});
          return utils.err(res, req.method, req.url, 401, config.blacklist.msg)
        }
      }
      if(config.whitelist.enabled){
        if(ip_config.whitelist.indexOf(ip) === -1){
          router.emit('auth_error', {type: 'whitelist', ip: ip});
          return utils.err(res, req.method, req.url, 401, config.whitelist.msg)
        }
      }
      if(config.authtoken.enabled){
        router.emit('auth_error', {type: 'authtoken', ip: ip});
        if(req.header(config.authtoken.header) !== config.authtoken.token){
          return utils.err(res, req.method, req.url, 401, config.authtoken.msg)
        }
      }
    }

    let dest_url = req.url;
    ext = path.extname(dest_url).slice(1),
    method = req.method.toLowerCase();


    if(config.methods.indexOf(method) === -1){
      return utils.err(res, req.method, req.url, 405, 'Method Not Allowed')
    }

    res.setHeader('Origin', config.origin);

    if(ext !== '' && method === 'get'){
      return utils.serve_static(dest_url, ext, res, server.cache);
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

        req.query = query;

        str = null;
        query = null;

        evts[method].emit(x.pathname, req, res);

      } catch (err) {
        cl(err)
      }


    } else if(['post', 'delete', 'patch', 'put'].indexOf(method) !== -1){

      let body = '';
      req.setEncoding('utf8');
      req.on('data', function(chunk){
          body += chunk;
      });

      req.on('end', function(){
        if(req.headers['content-type'] === 'application/json'){
          body = JSON.parse(body);
        }
        req.body = body;
        evts[method].emit(dest_url, req, res);
      });

      req.on('error', function(){
        return utils.err(res, req.method, req.url, 500, 'Bad Request');
      });

    }

  } catch (err) {
    return utils.err(res, req.method, req.url, 400, 'Bad Request')
  }
})

http.ServerResponse.prototype.cookie = function(key, val, obj){
  let new_obj = {};
  new_obj[key] = val;
  new_obj = Object.assign(new_obj, obj);
  new_obj = utils.cookie_encode(new_obj);
  this.setHeader('Set-Cookie', new_obj);
  return this
}

http.ServerResponse.prototype.doc = function(src, charset){
  return utils.serve(config.render.path.slice(1), '/'+ src, charset, this, server.cache);
}

if(config.base_build.enabled){
  server.build = require('../utils/init').build();
}

http.ServerResponse.prototype.json = function(chunk, encoding, cb){
  this.setHeader('Content-Type', 'application/json');
  return this.end(js(chunk), encoding, cb)
}

module.exports = { server, router };
