global.cl = console.log;
global.js = JSON.stringify;
global.jp = JSON.parse;
global.cc = function(x,y){
  return cl('\x1b[92m[\x1b[94mCMS\x1b[92m:\x1b[94m'+x[0]+'\x1b[92m] \x1b['+y+'m'+ x[1] +' \x1b[0m');
}

const fs = require('fs');
let config;

try {
  config = require(process.cwd() + '/config/config');
} catch (err) {
  require('../utils/init')()
}

const utils = require('../utils'),
https = require('https'),
EventEmitter = require('events'),
path = require('path'),
ip_config = require(process.cwd() + '/config/ip_config');

class evt extends EventEmitter {}

let evts = {}
const router = {}

for (let i = 0; i < config.methods.length; i++) {
  evts[config.methods[i]] = new evt();
  router[config.methods[i]] = function(url,req,res){
    return evts[config.methods[i]].on(url,req,res);
  }
}

let cert_arr = ['cert', 'key', 'pfx'];
for (let i = 0; i < cert_arr.length; i++) {
  if(config.server[cert_arr[i]] && config.server[cert_arr[i]] !== ''){
    config.server[cert_arr[i]] = fs.readFileSync(process.cwd() + config.server[cert_arr[i]]);
  }
}

cert_arr = null;

const server = https.createServer(config.server);

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
        //  router.emit('auth_error', {type: 'blacklist', ip: ip});
          return utils.err(res, req.method, req.url, 401, config.blacklist.msg)
        }
      }
      if(config.whitelist.enabled){
        if(ip_config.whitelist.indexOf(ip) === -1){
        //  router.emit('auth_error', {type: 'whitelist', ip: ip});
          return utils.err(res, req.method, req.url, 401, config.whitelist.msg)
        }
      }
      if(config.authtoken.enabled){
        //router.emit('auth_error', {type: 'authtoken', ip: ip});
        if(req.header(config.authtoken.header) !== config.authtoken.token){
          return utils.err(res, req.method, req.url, 401, config.authtoken.msg)
        }
      }
    }

    let url = req.url;
    ext = path.extname(url).slice(1),
    method = req.method.toLowerCase();

    if(config.methods.indexOf(method) === -1){
      return utils.err(res, req.method, req.url, 405, 'Method Not Allowed')
    }

    res.setHeader('Origin', config.origin);

    if(ext !== '' && method === 'get'){
      return utils.serve_static(url, ext, res);
    } else if(['get','connect', 'head', 'options', 'trace'].indexOf(method) !== -1){

      evts[method].emit(url, req, res);

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
        evts[method].emit(url, req, res);
      });

      req.on('error', function(){
        return utils.err(res, req.method, req.url, 500, 'Bad Request');
      });

    }

  } catch (err) {
    return utils.err(res, req.method, req.url, 400, 'Bad Request')
  }
})

server.serve_static = utils.serve;

module.exports = { server, router };
