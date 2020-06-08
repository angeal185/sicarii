const njk = require("nunjucks"),
zlib = require('zlib'),
utils = require('../utils');

module.exports = function(stream, config, cache){
  njk.configure('.' + config.render.path, config.template_engine.nunjucks.settings);

  stream.Duplex.prototype.render = function(src, data, cb){
    data = data || {};
    if(typeof data === 'function'){
      cb = data;
      data = {};
    }
    data = njk.render(src, data);

    let url = '/'+ src;
    if(config.render.cache.enabled){
      let cached = cache.get(config.render.path.slice(1), url);
      if(cached){
        let obj = {':status': 200}
        obj = Object.assign(cached.headers);
        this.respond(obj);
        this.end(cached.data, 'utf-8');
        cc(['GET', url + ' 200'],92);
        cl(url + 'loaded from cache')
        return;
      }
    }

    let content = Buffer.from(data),
    $this = this;

    this.headers['Content-Type'] = 'text/html; charset=utf-8';

    if(config.gzip.enabled){
      content = zlib.gzipSync(content, config.gzip.settings);
      this.headers['Content-Encoding'] = 'gzip';
    }

    this.headers['Content-Length'] = Buffer.byteLength(content);

    if(config.render.etag.enabled){
      this.headers.Etag = utils.etag(
        config.render.etag.digest,
        content,
        config.render.etag.encode,
      )
    }

    this.headers = Object.assign($this.headers, config.render.headers)

    if(config.render.cache.enabled){
      cache.add(config.render.path.slice(1),{
        url: url,
        data: content,
        headers: $this.headers
      })
    }

    this.headers[':status'] = 200;
    this.respond($this.headers);
    this.end(content, 'utf-8');
    cc(['GET', url + ' 200'],92);
  }
}
