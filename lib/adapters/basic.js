const fs = require('fs'),
zlib = require('zlib'),
utils = require('../utils');

function str2tpl(str, obj) {
    let parts = str.split(/\$\{(?!\d)[\wæøåÆØÅ]*\}/),
    args = str.match(/[^{\}]+(?=})/g) || [],
    params = args.map(function(argument){
      return obj[argument] || (obj[argument] === undefined ? "" : obj[argument])
    });
    return String.raw({raw: parts}, ...params);
}

module.exports = function(stream, config, cache){

  stream.Duplex.prototype.render = function(src, data, cb){
    let url = '/'+ src;
    if(config.render.cache.enabled){
      let cached = cache.get(config.render.path.slice(1), url);
      if(cached){
        let obj = {':status': 200}
        obj = Object.assign(cached.headers);
        this.respond(obj);
        this.end(cached.data, 'utf-8');
        cc(['GET', url + ' 200'],92);
        console.log(url + ' loaded from cache')
        return;
      }
    }
    console.log(url + ' not loaded from cache')
    data = data || {};
    if(typeof data === 'function'){
      cb = data;
      data = {};
    }


    let file = '.' + config.render.path + url;

    let $this = this;
    fs.readFile(file, 'utf8', function(err, content) {
      if(err){
        return utils.err($this, 'GET', url, 404, 'Not Found')
      }

      content = Buffer.from(str2tpl(content, data))

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
        cache.add(config.render.path.slice(1),{
          url: url,
          data: content,
          headers: $this.headers
        })
      }

      $this.headers[':status'] = 200;
      $this.respond($this.headers);
      $this.end(content, 'utf-8');
      cc(['GET', url + ' 200'],92);

    });

  }
}
