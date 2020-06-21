const fs = require('fs'),
utils = require('../utils'),
config = require(process.env.config_file),
engine = require('./' + process.env.template_engine);

module.exports = function(stream){

  stream.Duplex.prototype.render = function(src, data, cb){
    let url = '/'+ src,
    $this = this;

    let cache_obj = {
      src: 'render',
      method: 'get_cache',
      data: {
        url: url
      }
    }

    utils.cache_stream(config.cache.url, cache_obj, function(err, cached){
      if(err){
        console.error(err)
        cached = {code: 500};
      }

      let file = '.' + config.render.path + url;

      data = data || {};
      if(typeof data === 'function'){
        cb = data;
        data = {};
      }

      if(cached.code === 200 && cached.data.data && cached.data.headers){
        data = cached.data.data;
        if(typeof data === 'object' && data.data){
          data = Buffer.from(data.data)
        }

        let obj = {':status': 200};
        obj = Object.assign(obj, cached.data.headers);
        $this.respond(obj);
        $this.end(data);
        utils.cc(['GET', url + ' 200 [cache]'],92);
        if(cb){cb(false)}
        return;
      }
      
      engine($this, file, src, url, data, cb)

    })

  }
}
