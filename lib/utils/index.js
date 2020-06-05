const fs = require('fs'),
config = require(process.cwd() + '/config/config'),
zlib = require('zlib'),
crypto = require('crypto');

const utils = {
  etag: function(digest, data, encode){
    return crypto.createHash(digest).update(data).digest(encode);
  },
  serve: function(src, url, ctype, res){
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
  }
}

module.exports = utils;
