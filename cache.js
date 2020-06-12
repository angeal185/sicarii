const http2 = require('http2'),
fs = require('fs'),
cwd = process.cwd(),
config = require(cwd + '/config/config'),
utils = require('./lib/utils');

function Cache(){
  this[config.static.path.slice(1)] = [];
  this[config.render.path.slice(1)] = [];
  this.store = [];
}

const server = http2.createSecureServer(config.cache.server);

server.setSecureContext(utils.set_cert())

Cache.prototype = {
  add_cache: function(src, obj){
    obj.date = Date.now() + config[src].cache.maxage;
    this[src].push(obj);
    return this;
  },
  get_cache: function(src, obj){
    let res = {};
    for (let i = 0; i < this[src].length; i++) {
      if(this[src][i].url === obj.url){
        let current = this[src][i]
        if(!current.date || current.date < Date.now()){
          this.del_cache_index(src, {index: i});
        } else {
          res = current;
        }
        break;
      }
    }
    return res;
  },
  del_cache_index: function(src, obj){
    this[src] = this[src].splice(obj.index, 1);
    return this;
  },
  reset_cache: function(src){
    this[src] = [];
    return this;
  },
  import_cache: function(src){
    try {
      let data = JSON.parse(fs.readFileSync(src, 'utf8'));
      this[src] = data;
    } catch (err) {
      console.error('invalid json '+ src +' in cache import')
    } finally{
      return this;
    }
  },
  export_cache: function(src, obj){
    try {
      fs.writeFileSync(obj.dest, JSON.stringify(this[src]));
    } catch (err) {
      console.error('ifailed to export '+ src)
    } finally{
      return this;
    }
  },
  check_cache: function(src){
    let arr = [],
    dnow = Date.now(),
    len = this[src].length;
    for (let i = 0; i < len; i++) {
      if(this[src][i].date > dnow){
        arr.push(this[src][i]);
      }
    }
    if(arr.length !== len){
      this[src] = arr;
    }
    arr = dnow = len = null;
  },
  val: function(){
    return this;
  }
}

let cache;

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
  utils.cc(['cache', 'Server pid:'+ process.pid +' listening at '+ config.origin +':'+config.cache_port],96);
})


module.exports = { Cache, server };
