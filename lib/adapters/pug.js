const pug = require("pug"),
zlib = require('zlib'),
utils = require('../utils');

const pug_adapter = function(http2, config, cache){
  http2.Http2ServerResponse.prototype.render = function(src, data, cb){
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

    let url = '/'+ src;
    if(config.render.cache.enabled){
      let cached = cache.get('render', url);
      if(cached){
        cl('loaded cached')
        this.writeHead(200, cached.headers);
        cc(['GET', url + ' 200'],92);
        this.end(cached.data, 'utf-8');
        return;
      }
    }

    let content = Buffer.from(data)

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

    this.writeHead(200, headers);

    return this.end(content)
  }
}

module.exports = pug_adapter;
