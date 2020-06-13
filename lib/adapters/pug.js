const pug = require("pug"),
zlib = require('zlib'),
utils = require('../utils');


module.exports = function(stream, config){

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

      if(cached.code === 200 && cached.data.data && cached.data.headers){
        let data = cached.data.data;
        if(typeof data === 'object' && data.data){
          data = Buffer.from(data.data)
        }

        let obj = {':status': 200};
        obj = Object.assign(obj, cached.data.headers);
        $this.respond(obj);
        $this.end(data);
        utils.cc(['GET', url + ' 200 [cache]'],92);
        return;
      }

      data = data || {};
      if(typeof data === 'function'){
        cb = data;
        data = {};
      }

      src = '.' + [config.render.path, src].join('/');
      let settings = config.template_engine.pug.settings;
      settings.basedir = '.'+ config.render.path;
      settings = Object.assign(settings, data)
      data = pug.renderFile(src, settings);


      let content = Buffer.from(data);

      $this.headers['Content-Type'] = 'text/html; charset=utf-8';

      if(config.gzip.enabled){
        content = zlib.gzipSync(content, config.gzip.settings);
        $this.headers['Content-Encoding'] = 'gzip';
      }

      $this.headers['Content-Length'] = Buffer.byteLength(content);

      if(config.render.etag.enabled){
        $this.headers.Etag = utils.etag(
          config.render.etag.digest,
          content,
          config.render.etag.encode,
        )
      }

      $this.headers = Object.assign($this.headers, config.render.headers)

      if(config.render.cache.enabled){
        cache_obj = {
          src: 'render',
          method: 'add_cache',
          data: {
            url: url,
            data: content,
            headers: $this.headers
          }
        }

        utils.cache_stream(config.cache.url, cache_obj, function(err,res){
          if(err){return console.error(err)}

        })
      }

      $this.headers[':status'] = 200;
      $this.respond($this.headers);
      $this.end(content, 'utf-8');
      utils.cc(['GET', url + ' 200'],92);

    })

  }
}
