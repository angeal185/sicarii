const fs = require('fs'),
config = require(process.cwd() + '/config/config'),
path = require('path'),
zlib = require('zlib'),
crypto = require('crypto'),
qs = require('querystring');


const utils = {
  cc: function(x,y){
    if(config.verbose){
      console.log('\x1b[92m[\x1b[94msicarii\x1b[92m:\x1b[94m'+x[0]+'\x1b[92m] \x1b['+y+'m'+ x[1] +' \x1b[0m');
    }
    return
  },
  cookie_encode: function(key, val, obj){
    let new_obj = {};
    new_obj[key] = val;
    new_obj = Object.assign(new_obj, obj);
    new_obj = qs.stringify(new_obj,';');
    return new_obj;
  },
  cookie_decode: function(obj){
    try {
      if(obj){
        obj = JSON.parse(JSON.stringify(qs.parse(obj, ';')));
      }
      return obj;
    } catch (err) {
      return null
    }
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
        utils.cc(['GET', url + ' 200'],92);
        console.log(url + 'loaded from cache')
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
      utils.cc(['GET', url + ' 200'],92);
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
        utils.serve(config.static.path.slice(1), url, ctype, stream);
        found = true;
        break;
      }
    }

    if(!found){
      return utils.err(stream, 'GET', url, 415, 'Unsupported Media Type')
    }

  },
  err: function(stream, method, url, code, msg){
    utils.cc([method, url + ' '+ code],91);
    stream.headers[':status'] = code
    stream.respond(stream.headers);
    stream.json({code: code, error: msg}, 'utf-8');
  },
  MultiPart_parse: function(body, contentType) {

    var m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

    if (!m) {
      throw new Error('Bad content-type header, no multipart boundary');
    }

    let s, fieldName;
    let boundary = m[1] || m[2];

    function Header_parse(header) {
      var headerFields = {};
      var matchResult = header.match(/^.*name="([^"]*)"$/);
      if (matchResult){
         headerFields.name = matchResult[1];
       }
      return headerFields;
    }

    function rawStringToBuffer(str) {
      Buffer.from(str).buffer;
    }

    // \r\n is part of the boundary.
    boundary = '\r\n--' + boundary;

    var isRaw = typeof(body) !== 'string';

    if (isRaw) {
      var view = new Uint8Array(body);
      s = String.fromCharCode.apply(null, view);
    } else {
      s = body;
    }

    s = '\r\n' + s;

    var parts = s.split(new RegExp(boundary)),
      partsByName = {};

    for (var i = 1; i < parts.length - 1; i++) {
      var subparts = parts[i].split('\r\n\r\n');
      var headers = subparts[0].split('\r\n');
      for (var j = 1; j < headers.length; j++) {
        var headerFields = Header_parse(headers[j]);
        if (headerFields.name) {
          fieldName = headerFields.name;
        }
      }

      partsByName[fieldName] = isRaw ? rawStringToBuffer(subparts[1]) : subparts[1];
    }

    return JSON.stringify(partsByName);
  },
  Boundary_parse:function(body) {
    let x = body.split('Content-Disposition: form-data;')[0];
    return x.trim().slice(2);
  },
  path_exists: function(check_exists, method, dest_url){
    let path_exists = false;
    for (let i = 0; i < check_exists.length; i++) {
      if(check_exists[i].method === method && check_exists[i].path ===  dest_url){
        path_exists = true;
        break;
      }
    }
    return path_exists;
  }
}


module.exports = utils;
