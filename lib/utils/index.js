const fs = require('fs'),
config = require(process.cwd() + '/config/config'),
zlib = require('zlib'),
crypto = require('crypto'),
qs = require('querystring');


const utils = {
  cookie_encode: function(obj){
    return qs.stringify(obj,';');
  },
  qsJSON: function(qs) {
    let pairs = qs.split('&'),
    res = {};
    pairs.forEach(function(p) {
      let pair = p.split('='),
        key = pair[0],
        value = decodeURIComponent(pair[1] || '');

        if (res[key]) {
          if (Object.prototype.toString.call(res[key]) === '[object Array]') {
            res[key].push(value);
          } else {
            res[key] = [res[key], value];
          }
        } else {
          res[key] = value;
        }
      });

      res = JSON.parse(JSON.stringify(res));
      return  res;
    },
  etag: function(digest, data, encode){
    return crypto.createHash(digest).update(data).digest(encode);
  },
  serve: function(src, url, ctype, stream, cache){

    if(config[src].cache.enabled){
      let cached = cache.get(src, url);
      if(cached){
        let obj = {':status': 200}
        obj = Object.assign(cached.headers);
        stream.respond(obj);
        stream.end(cached.data, 'utf-8');
        cc(['GET', url + ' 200'],92);
        cl(url + 'loaded from cache')
        return;
      }
    }

    let file = '.' + config[src].path + url;

    if(config.gzip.enabled && config.gzip.prezipped){
      file += config.gzip.ext
    }

    fs.readFile(file, function(err, content) {
      if(err){
        return utils.err(stream, 'GET', url, 404, 'Not Found')
      }

      stream.headers['Content-Type'] = ctype;


      if(config.gzip.enabled){
        if(!config.gzip.prezipped){
          content = zlib.gzipSync(content, config.gzip.settings);
        }
        stream.headers['Content-Encoding'] = 'gzip';
      }

      stream.headers['Content-Length'] = Buffer.byteLength(content);

      if(config[src].etag.enabled){
        stream.headers.Etag = utils.etag(
          config[src].etag.digest,
          content,
          config[src].etag.encode,
        )
      }

      stream.headers = Object.assign(stream.headers, config[src].headers)

      if(config[src].cache.enabled){
        cache.add(src,{
          url: url,
          data: content,
          headers: stream.headers
        })

      }
      stream.headers[':status'] = 200;
      stream.respond(stream.headers);
      stream.end(content, 'utf-8');
      cc(['GET', url + ' 200'],92);
    });
  },
  serve_static: function(url, ext, stream){

    if(config.static.blocked.indexOf(url) !== -1){
      return utils.err(stream, 'GET', url, 403, 'Forbidden')
    }

    let ctype = null,
    found = false;

    for (let i in config.mimetypes) {
      if(config.mimetypes[i].indexOf(ext) !== -1) {
        ctype = i;
        utils.serve('static', url, ctype, stream);
        found = true;
        break;
      }
    }

    if(!found){
      return utils.err(stream, 'GET', url, 415, 'Unsupported Media Type')
    }

  },
  err: function(stream, method, url, code, msg){
    cc([method, url + ' '+ code],91);
    stream.headers[':status'] = code
    stream.respond(stream.headers);
    stream.json({code: code, error: msg}, 'utf-8');
  },
  fetch: function(){

  }
}


module.exports = utils;
