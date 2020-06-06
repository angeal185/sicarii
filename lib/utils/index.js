const fs = require('fs'),
config = require(process.cwd() + '/config/config'),
http2 = require('http2'),
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
  serve: function(src, url, ctype, res, cache){

    if(config[src].cache.enabled){
      let cached = cache.get(src, url);
      if(cached){

        res.writeHead(200, cached.headers);
        res.end(cached.data, 'utf-8');
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
        return utils.err(res, 'GET', url, 404, 'Not Found')
      }

      let headers = {
        'Content-Type': ctype
      }

      if(config.gzip.enabled){
        if(!config.gzip.prezipped){
          content = zlib.gzipSync(content, config.gzip.settings);
        }
        headers['Content-Encoding'] = 'gzip';
      }

      headers['Content-Length'] = Buffer.byteLength(content);

      if(config[src].etag.enabled){
        headers.Etag = utils.etag(
          config[src].etag.digest,
          content,
          config[src].etag.encode,
        )
      }

      headers = Object.assign(headers, config[src].headers)

      if(config[src].cache.enabled){
        cache.add(src,{
          url: url,
          data: content,
          headers: headers
        })

        cl(cache.val())
      }

      res.writeHead(200, headers);
      res.end(content, 'utf-8');
      cc(['GET', url + ' 200'],92);
    });
  },
  serve_static: function(url, ext, res){

    if(config.static.blocked.indexOf(url) !== -1){
      return utils.err(res, 'GET', url, 403, 'Forbidden')
    }

    let ctype = null,
    found = false;

    for (let i in config.mimetypes) {
      if(config.mimetypes[i].indexOf(ext) !== -1) {
        ctype = i;
        utils.serve('static', url, ctype, res);
        found = true;
        break;
      }
    }

    if(!found){
      return utils.err(res, 'GET', url, 415, 'Unsupported Media Type')
    }

  },
  err: function(res, method, url, code, msg){
    cc([method, url + ' '+ code],91);
    res.writeHead(code);
    res.end(js({code: code, error: msg}));
  },
  fetch: function(){
  
  }
}


module.exports = utils;
