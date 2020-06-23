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
ip_config = require(cwd + config.ip_config + '.json'),
push_config = require(cwd + config.push_handler.path);

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
  cck = headers['cookie'];

  if(config.stream.path_limit){
    if(hpath.length > config.stream.path_limit){
      return utils.err(stream, hmethod, hpath, 414, 'URI Too Long')
    }
  }

  if(config.cookie_parser.enabled){
    stream.cookies = utils.cookie_decode(cck)
  }

  try {

    let ip,
    socket = stream.session.socket;

    if(config.proxy){
      ip = headers['x-forwarded-for'] || socket.remoteAddress;
    } else {
      ip = socket.remoteAddress;
    }

    //console.log(stream.session)
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

    if(!config.stream.case_sensitive){
      cpath.pathname = cpath.pathname.toLowerCase()
    }

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

        if(str && str.length > config.param_limit.param_limit){
          return utils.err(stream, hmethod, hpath, 431, 'Request Params Too Large');
        }

        if(config.push_handler.enabled && method === 'get'){
          let accept = headers['accept'].split(','),
          accepted = config.push_handler.accept;
          for (let j = 0; j < accepted.length; j++) {
            if(accept.indexOf(accepted[j]) !== -1){
              for (let i = 0; i < push_config.length; i++) {
                if(push_config[i].url === cpath.pathname){
                  if(!push_config[i].items){
                    stream.pushStatic(push_config[i].path, push_config[i].ctype);
                  } else {
                    stream.pushStatic(push_config[i].items);
                  }
                  break;
                }
              }
              break;
            }
          }
        }

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

        headers = new Extend_headers(headers);
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
      stream.setEncoding('utf8');
      let body = '';
      stream.on('data', function(chunk, i){
          body += chunk;
          if(config.stream.body_limit){
            if(body.length > config.stream.body_limit){
              return utils.err(stream, hmethod, hpath, 413, 'Payload Too Large');
            }
          }
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

          headers = new Extend_headers(headers);
          evts[method].emit(cpath.pathname, stream, headers, flags);
          body = null;

        } catch (err) {
          return utils.err(stream, hmethod, hpath, 500, 'Bad Request');
        }
      });

      stream.on('error', function(err){
        //console.log(err)
        return utils.err(stream, hmethod, hpath, 500, 'Bad Request');
      });

    }

    if(config.logs.ip.enabled){
      server.log_ip(ip, dest_url)
    } else if(config.logs.history.enabled){
      server.log_history([Date.now(), hmethod, hpath].join('::::'))
    }

  } catch (err) {
    console.error(err)
    return utils.err(stream, hmethod, hpath, 400, 'Bad Request')
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

module.exports = { server, router };
