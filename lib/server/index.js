const fs = require('fs'),
stream = require('stream'),
http2 = require('http2'),
cwd = process.cwd();

let server,router;

let config = require(cwd + '/config/config');

config.port = process.env.PORT || config.port;

const utils = require('../utils'),
url = require('url'),
EventEmitter = require('events'),
path = require('path'),
qs = require('querystring'),
ip_config = require(cwd + '/config/ip_config'),
{ worker } = require('../extends/sync');

class evt extends EventEmitter {};

let evts = {
  stream: {}
}

let dest_arr = [];

server = http2.createSecureServer(config.server);
server.setSecureContext(utils.set_cert())

server.dest_arr = []
router = new evt();


server = Object.assign(server, worker);

let mth = config.stream.methods;

utils.set_methods(mth, evts, evt, router, server);

// extends
require('../extends/stream')(stream, utils, server, config);

utils.set_engine(config.template_engine, stream, config);

server.on('listening', function(err,res){
  utils.cc(['worker', 'Server pid:'+ process.pid +' listening at '+ config.origin +':'+config.port],96);
})

server.on('error', function(err, next){
  console.error(err)
  next()
})



server.on('stream', function (stream, headers,flags) {
  stream.headers = {}
  //console.log(stream)
  //console.log(stream.session.socket)

  let hmethod = headers[':method'],
  hpath = headers[':path'],
  ctype = headers['content-type'],
  cck = headers['cookie'];

  //let obj = this.headers['cookie'];

  if(config.cookie_parser.enabled){
    stream.cookies = utils.cookie_decode(cck)
  }

  try {

    let ip;

    if(config.proxy){
      ip = headers['x-forwarded-for'] || stream.session.socket.remoteAddress;
    } else {
      ip = stream.session.socket.remoteAddress;
    }

    stream.ip = ip;

    if(config.blacklist.enabled){
      if(ip_config.blacklist.indexOf(ip) !== -1){
        router.emit('auth_error', {type: 'blacklist', ip: ip});
        return utils.err(stream, hmethod, hpath, 401, config.blacklist.msg)
      }
    }
    if(config.whitelist.enabled){
      if(ip_config.whitelist.indexOf(ip) === -1){
        router.emit('auth_error', {type: 'whitelist', ip: ip});
        return utils.err(stream, hmethod, hpath, 401, config.whitelist.msg)
      }
    }
    if(config.authtoken.enabled){
      router.emit('auth_error', {type: 'authtoken', ip: ip});
      if(headers[config.authtoken.header] !== config.authtoken.token){
        return utils.err(stream, hmethod, hpath, 401, config.authtoken.msg)
      }
    }

    let dest_url = hpath,
    ext = path.extname(dest_url).slice(1),
    method = hmethod.toLowerCase(),
    cpath = new URL(config.origin + dest_url);

    if(mth.indexOf(method) === -1){
      return utils.err(stream, hmethod, hpath, 405, 'Method Not Allowed')
    }

    stream.headers['Origin'] = config.origin;

    if(ext !== '' && method === 'get'){
      return utils.serve_static(dest_url, ext, stream);
    } else if(config.stream.method_query.indexOf(method) !== -1){

      try {

        if(!utils.path_exists(server.dest_arr, method, cpath.pathname)){
          return utils.err(stream, hmethod, hpath, 400, 'Bad Request');
        }

        let str = cpath.search.slice(1),
        query = {};

        if(str !== ''){
          if(config.stream.querystring){
            stream.qs = str;
          }
          str = utils.qsJSON(str);
          query = str;
        }

        stream.query = query;

        str = null;
        query = null;

        evts[method].emit(cpath.pathname, stream, headers, flags);

      } catch (err) {
        console.error(err)
      }


    } else if(config.stream.method_body.indexOf(method) !== -1){

      if(!utils.path_exists(server.dest_arr, method, cpath.pathname)){
        return utils.err(stream, hmethod, hpath, 500, 'Bad Request');
      }

      if(!ctype){
        return utils.err(stream, hmethod, hpath, 415, 'Unsupported Media Type');
      }

      ctype = ctype.split(';')[0];

      if(config.stream.content_types.indexOf(ctype) === -1){
        return utils.err(stream, hmethod, hpath, 415, 'Unsupported Media Type');
      }

      let body = '';
      stream.on('data', function(chunk, i){
          body += chunk;
      });

      stream.on('end', function(){
        let is_json = true,
        is_buff = true;

        stream.buffer = Buffer.from(body);
        stream.body = {};
        try {
          if(ctype === 'multipart/form-data'){
            let b = utils.Boundary_parse(body);
            body = utils.MultiPart_parse(body, 'multipart/form-body; boundary=' + b);
            stream.body.text = body;
          } else if(ctype === 'application/x-www-form-urlencoded'){
            stream.body.text = JSON.stringify(qs.parse(body));
          } else if(ctype === 'application/json'){
            stream.body.text = body;
          } else {
            is_json = false;
            stream.body.text = body;
          }

          if(is_json){
            stream.body.json = JSON.parse(stream.body.text);
          }

          if(is_buff){
            stream.body.buffer = Buffer.from(stream.body.text);
          }

          evts[method].emit(cpath.pathname, stream, headers, flags);
          body = null;

        } catch (err) {
          return utils.err(stream, hmethod, hpath, 500, 'Bad Request');
        }
      });

      stream.on('error', function(){

        return utils.err(stream, hmethod, hpath, 500, 'Bad Request');
      });

    }

  } catch (err) {
    console.error(err)
    return utils.err(stream, hmethod, hpath, 400, 'Bad Request')
  }
})

module.exports = { server, router };
