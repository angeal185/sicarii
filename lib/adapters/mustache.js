const fs = require('fs'),
zlib = require('zlib'),
utils = require('../utils'),
cwd = process.cwd(),
Mustache = require("mustache");


module.exports = function(stream, config){

  function render_tpl($this, file, data,  templates, url){
    fs.readFile(file, 'utf8', function(err, content) {
      if(err){
        return utils.err($this, 'GET', url, 404, 'Not Found')
      }

      try {
        content = Buffer.from(Mustache.render(content, data, templates, config.template_engine.mustache.tags));
      } catch (err) {
      return utils.err($this, 'GET', url, 500, 'template render error')
      }

      $this.headers['Content-Type'] = 'text/html; charset=utf-8';

      let cmp = utils.compress_render_sort($this.headers, content);

      $this.headers = cmp.headers,
      content = cmp.content

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
        let cache_obj = {
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
      utils.cc(['GET', url + ' 200 [file]'],92);

    });
  }

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

      let render_path = '.' + config.render.path,
      file = render_path + url,
      tpl_obj = {},
      tpl_count;

      if(data.templates){
        tpl_count = Object.keys(data.templates).length;
      }

      if(tpl_count && typeof data.templates === 'object'){

        let cnt = 0

        for (let i in data.templates) {
          tpl_obj[i] = fs.readFile(render_path + data.templates[i], 'utf8', function(err,res){
            if(err){
              cnt = 999999
              return utils.err($this, 'GET', url, 500, 'template include error')
            }
            tpl_obj[i] = res;
            cnt++
            if(cnt === tpl_count){
              delete data.templates
              render_tpl($this, file, data, tpl_obj, url)
            }
          })
        }

      } else {
        render_tpl($this, file, data, tpl_obj, url)
      }
    })

  }
}
