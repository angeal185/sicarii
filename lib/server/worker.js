const fs = require('fs'),
stream = require('stream'),
cluster = require('cluster'),
http2 = require('http2'),
cwd = process.cwd();

let server,router;

let minion;

if(!cluster.isMaster) {
 minion = cluster.worker.id;
}

let config = require(process.env.config_file),
ip_config = require(cwd + config.ip_config + '.json');

config.port = process.env.PORT || config.port;

const utils = require('../utils'),
url = require('url'),
EventEmitter = require('events'),
Extend_headers = require('../extends/headers'),
path = require('path'),
qs = require('querystring'),
{ worker } = require('../utils/sync_utils');

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

server.on('stream', function (stream, headers,flags) {
  stream.headers = {}

  let hmethod = headers[':method'],
  hpath = headers[':path'],
  ctype = headers['content-type'],
  ip = utils.sort_ip(stream, headers),
  socket = stream.session.socket,
  ext = path.extname(hpath).slice(1),
  method = hmethod.toLowerCase(),
  cpath = new URL(config.origin + hpath);

  stream.ip = ip;
  stream.headers['Origin'] = config.origin;

  //console.log(stream.session)

  try {

    if(config.stream.path_limit){
      if(hpath.length > config.stream.path_limit){
        return utils.err(stream, hmethod, hpath, 414, 'URI Too Long')
      }
    }

    let in_valid = utils.stream_check(router, ip, headers);
    if(in_valid){
      utils.err(stream, hmethod, hpath, 401, in_valid);
      return;
    }
    if(mth.indexOf(method) === -1){
      return utils.err(stream, hmethod, hpath, 405, 'Method Not Allowed')
    }

    if(config.cookie_parser.enabled){
      stream.cookies = utils.cookie_decode(headers['cookie'])
    }

    if(!config.stream.case_sensitive){
      cpath.pathname = cpath.pathname.toLowerCase()
    }


    if(ext !== '' && method === 'get'){
      return utils.serve_static(hpath, ext, stream);
    } else if(config.stream.method_query.indexOf(method) !== -1){

      try {

        if(!utils.path_exists(server.dest_arr, method, cpath.pathname)){
          return utils.err(stream, hmethod, hpath, 400, 'Bad Request');
        }

        let str = cpath.search.slice(1),
        query = {};

        if(str && str.length > config.stream.param_limit){
          return utils.err(stream, hmethod, hpath, 431, 'Request Params Too Large');
        }

        if(config.push_handler.enabled && method === 'get'){
          utils.stream_push(stream, headers, cpath);
        }

        if(str !== ''){
          if(config.stream.querystring){
            stream.qs = str;
          }
          str = utils.qsJSON(str);
          query = str;
        }

        stream.query = query;
        headers = new Extend_headers(headers);
        evts[method].emit(cpath.pathname, stream, headers, flags);
        str = query = null;
      } catch (err) {
        console.error(err)
      }


    } else if(config.stream.method_body.indexOf(method) !== -1){

      let body = '';
      ctype = ctype.split(';')[0];

      if(!utils.path_exists(server.dest_arr, method, cpath.pathname)){
        return utils.err(stream, hmethod, hpath, 500, 'Bad Request');
      } else if(!ctype){
        return utils.err(stream, hmethod, hpath, 415, 'Unsupported Media Type');
      } else if(config.stream.content_types.indexOf(ctype) === -1){
        return utils.err(stream, hmethod, hpath, 415, 'Unsupported Media Type');
      }

      stream.setEncoding('utf8');

      stream.on('data', function(chunk, i){
          body += chunk;
          if(config.stream.body_limit){
            if(body.length > config.stream.body_limit){
              return utils.err(stream, hmethod, hpath, 413, 'Payload Too Large');
            }
          }
      });

      stream.on('end', function(){
        try {
          stream = utils.stream_body(stream, body, ctype)
          headers = new Extend_headers(headers);
          evts[method].emit(cpath.pathname, stream, headers, flags);
          body = null;
        } catch (err) {
          return utils.err(stream, hmethod, hpath, 500, 'Bad Request', err);
        }
      });

      stream.on('error', function(err){
        return utils.err(stream, hmethod, hpath, 500, 'Bad Request', err);
      });

    }

    if(config.logs.ip.enabled){
      server.log_ip(ip, hpath)
    } else if(config.logs.history.enabled){
      server.log_history([Date.now(), hmethod, hpath].join('::::'))
    }

  } catch (err) {
    return utils.err(stream, hmethod, hpath, 400, 'Bad Request', err)
  }
})


server.push_handler = function(x){
  config.push_handler.enabled = x;
  return server;
}

server.pre_cache = function(){
  process.send({type: 'pre_cache'});
  server.pre_cache = null;
  return server;
}

server.on('listening', function(err,res){
  utils.cc(['worker', 'Server pid:'+ process.pid +' listening at '+ config.origin +':'+config.port],96);
})

process.on('message', function(obj){

  if(obj.type === 'blacklist' || obj.type === 'whitelist'){
    ip_config = utils.requireUncached(cwd + config.ip_config + '.json');
  } else if(obj.type === 'log_error'){
    server.log_error(obj.data)
  } else if(obj.type === 'pre_cache'){
    utils.pre_cache_init()
  }

})

module.exports = { server, router }
