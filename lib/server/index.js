const fs = require('fs'),
stream = require('stream'),
cluster = require('cluster'),
http2 = require('http2'),
cwd = process.cwd();

let server,router, config;

if (cluster.isMaster) {
  console.log(
    '\x1b[92m[\x1b[94msicarii\x1b[92m:\x1b[94mmaster\x1b[92m] \x1b[96mStarted on pid:'+ process.pid+'\x1b[0m'
  )
  try {
    config = require(cwd + '/config/config');
    process.exit();
  } catch (err) {
    require('../utils/init').config();
    require('../utils/init').build();
    process.exit();
  }


} else {

  let config = require(cwd + '/config/config');

  const utils = require('../utils'),
  url = require('url'),
  EventEmitter = require('events'),
  path = require('path'),
  Cache = require('../utils/cache'),
  qs = require('querystring'),
  ip_config = require(cwd + '/config/ip_config');

  class evt extends EventEmitter {};

  let evts = {
    stream: {}
  }

  let dest_arr = [];

  let cert_arr = ['cert', 'key', 'pfx', 'ca'];
  for (let i = 0; i < cert_arr.length; i++) {
    if(config.server[cert_arr[i]] && config.server[cert_arr[i]] !== ''){
      config.server[cert_arr[i]] = fs.readFileSync(cwd + config.server[cert_arr[i]]);
      if(cert_arr[i] === 'ca'){
        config.server[cert_arr[i]] = [config.server[cert_arr[i]]]
      }
    }
  }

  cert_arr = null;

  server = http2.createSecureServer(config.server);

  server.cache = new Cache();
  server.dest_arr = []
  router = new evt();

  let mth = config.stream.methods;

  for (let i = 0; i < mth.length; i++) {
    evts[mth[i]] = new evt();
    router[mth[i]] = function(dest_url,stream,headers,flags){
      server.dest_arr.push({'method': mth[i], path: dest_url})
      return evts[mth[i]].on(dest_url,stream,headers,flags);
    }
  }

  // extends
  require('../extends/stream')(stream, utils, server, config);

  let engine = config.template_engine;
  for (let i = 0; i < engine.engines.length; i++) {
    if(engine[engine.engines[i]].enabled){
      require('../adapters/'+ engine.engines[i])(stream, config, server.cache);
      break;
    }
  }

  engine = null;

  let cache_arr = [config.static.path.slice(1),config.render.path.slice(1),'store'];
  for (let i = 0; i < cache_arr.length; i++) {
    if(config[cache_arr[i]].cache.enabled){
      setInterval(function(){
        server.cache.check(cache_arr[i]);
      },config[cache_arr[i]].cache.maxage)
    }
  }

  server.on('listening', function(err,res){
    utils.cc(['worker', 'Server pid:'+ process.pid +' listening at '+ config.origin +':'+config.port],96);
  })

  server.on('error', function(err, cb){
    console.error('errrrrrrrrr'+ err)
    //cb()
  })



  server.on('stream', function (stream, headers,flags) {
    stream.headers = {}
    //console.log(stream)
    //console.log(stream.session.socket)

    let hmethod = headers[':method'],
    hpath = headers[':path'],
    ctype = headers['content-type'];
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
        return utils.serve_static(dest_url, ext, stream, server.cache);
      } else if(config.stream.method_query.indexOf(method) !== -1){


        try {

          if(!utils.path_exists(server.dest_arr, method, cpath.pathname)){
            return utils.err(stream, hmethod, hpath, 500, 'Bad Request');
          }

          let str = cpath.search.slice(1),
          query = {};

          if(str !== ''){
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

  // get console.log(Object.getPrototypeOf())


}

module.exports = { server, router };
