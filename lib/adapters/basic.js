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

const basic_adapter = function(http2, config, cache){

  http2.Http2ServerResponse.prototype.render = function(src, data, cb){
    let url = '/'+ src;
    if(config.render.cache.enabled){
      let cached = cache.get('render', url);
      if(cached){
        this.writeHead(200, cached.headers);
        cc(['GET', url + ' 200'],92);
        this.end(cached.data, 'utf-8');
        return;
      }
    }

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

      let headers = {
        'Content-Type': 'text/html; charset=utf-8'
      }

      if(config.gzip.enabled){
        content = zlib.gzipSync(content, config.gzip.settings);
        headers['Content-Encoding'] = 'gzip';
      }

      headers['Content-Length'] = Buffer.byteLength(content);

      if(config.render.etag.enabled){
        headers.Etag = utils.etag(
          config.render.etag.digest,
          content,
          config.render.etag.encode,
        )
      }

      headers = Object.assign(headers, config.render.headers)

      if(config.render.cache.enabled){
        cache.add('render',{
          url: url,
          data: content,
          headers: headers
        })
      }

      $this.writeHead(200, headers);
      $this.end(content, 'utf-8');
      cc(['GET', url + ' 200'],92);

    });

  }
}

module.exports = basic_adapter;
