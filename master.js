const http2 = require('http2'),
fs = require('fs'),
config = require(process.env.config_file),
utils = require('./lib/utils'),
{ master } = require('./lib/extends/sync'),
{ cluster } = require('./'),
Logs = require('./lib/utils/logs');


const logs = new Logs(config.logs, config.compression),
static_path = config.static.path.slice(1),
render_path = config.render.path.slice(1);

function Cache(){
  this[static_path] = [];
  this[render_path] = [];
  this.store = [];
  this.session = [];
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
    this[src].splice(obj.index, 1);
    return this;
  },
  reset_cache: function(src){
    this[src] = [];
    return this;
  },
  import_cache: function(src){
    let cpath = config.cache.path + src + '.json';
    return utils.store_import(src, cpath, this);
  },
  export_cache: function(src){
    let cpath = config.cache.path + src + '.json';
    return utils.store_export(src, cpath, this);
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
  store_read: function(src){
    return utils.store_import(src, config[src].path, this);
  },
  store_write: function(src){
    return utils.store_export(src, config[src].path, this);
  },
  store_check: function(src, obj){
    try {

      let items = this[src],
      arr = [],
      data = {
        success: true,
        data: 0
      }

      for (let i = 0; i < items.length; i++) {
        if(!items[i].date || items[i].date < Date.now()){
          data.data++
        } else {
          arr.push(items[i]);
        }
      }

      this[src] = arr;

      return data;

    } catch (err) {
      return {success: false, msg: 'session check error'};
    }

  },
  store_add: function(src, obj){
    return utils.store_add(src, obj, this, false);
  },
  store_unshift: function(src, obj){
    return utils.store_add(src, obj, this, true);
  },
  store_find: function(src, obj){
    return utils.store_find(src, obj, this);
  },
  store_each: function(src, obj){
    return utils.store_each(src, obj, this);
  },
  store_omit: function(src, arr){
    return utils.store_omit(src, arr, this);
  },
  store_concat: function(src, arr){
    return utils.store_concat(src, arr, this);
  },
  store_chunk: function(src, obj){
    return utils.store_chunk(src, obj, this);
  },
  store_first: function(src, cnt){
    return utils.store_first(src, this, cnt);
  },
  store_last: function(src, cnt){
    return utils.store_last(src, this, cnt);
  },
  store_assign: function(src, arr){
    return utils.store_assign(src, arr, this);
  },
  store_findIndex: function(src, obj){
    return utils.store_findIndex(src, obj, this);
  },
  store_filter: function(src, obj){
    return utils.store_filter(src, obj, this);
  },
  store_gt: function(src, obj){
    return utils.store_compare(src, obj, this, 'gt');
  },
  store_lt: function(src, obj){
    return utils.store_compare(src, obj, this, 'lt');
  },
  store_gte: function(src, obj){
    return utils.store_compare(src, obj, this, 'gte');
  },
  store_lte: function(src, obj){
    return utils.store_compare(src, obj, this, 'lte');
  },
  store_sort: function(src, obj){
    return utils.store_sort(src, obj, this);
  },
  store_delete: function(src, obj){
    return utils.store_delete(src, obj, this);
  },
  store_val: function(src){
    return this.val(src);
  },
  val: function(src){
    return this[src];
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
  utils.cc(['cache', 'Server pid:'+ process.pid +' listening at '+ config.origin +':'+config.cache.port],96);
})


function syncHandler(obj){

  if(obj.type === 'log'){
    master.logs_handler(logs, obj)
  } else if(obj.type === 'blacklist' || obj.type === 'whitelist'){
    for (const id in cluster.workers) {
      if(cluster.workers[id]){
        cluster.workers[id].send(obj);
      }
    }
  } else if(obj.type === 'pre_cache'){
    if(!process.env.pre_cached){
      process.env.pre_cached = true;
      for (const id in cluster.workers) {
        if(cluster.workers[id]){
          cluster.workers[id].send({type: 'pre_cache'});
          break;
        }
      }
    }
  }
}

function Sync(){

}

Sync.prototype = {
  init: function(){

    for (let i = 0; i < config.cluster.workers; i++) {
      cluster.fork();
    }

    for (const id in cluster.workers) {
      if(cluster.workers[id]){
        cluster.workers[id].on('message', syncHandler);
      }
    }

    utils.cc(['sync', 'Syncing '+ Object.keys(cluster.workers).length + ' workers with master...'],96);
    return this;
  },
  respawn: function(){
    if(config.sync.respawn){
      master.respawn(cluster, logs)
    }
    return this
  },
  listen: function(cb){
    server.listen(config.cache.port, cb)
  }
}

const sync = new Sync();

module.exports = { Cache, server, logs, sync};
