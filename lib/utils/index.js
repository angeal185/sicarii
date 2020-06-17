const http2 = require('http2'),
fs = require('fs'),
cwd = process.cwd(),
config = require(process.env.config_file),
path = require('path'),
zlib = require('zlib'),
crypto = require('crypto'),
qs = require('querystring');

const utils = {
  upload: function(obj, cb){
    try {

      let base = cwd + config.uploads.path,
      dest = path.dirname(obj.path),
      file = path.basename(obj.path),
      ext = path.extname(file).slice(1),
      mtype = config.uploads.mimetypes,
      gz = obj.gzip,
      br = obj.brotli,
      dfl = obj.deflate;

      if(gz === undefined){
        gz = config.uploads.gzip
      }

      if(br === undefined){
        br = config.uploads.brotli
      }

      if(dfl === undefined){
        dfl = config.uploads.deflate
      }


      if(file.length > config.uploads.max_filename){
        return cb('upload filename too long')
      } else if(obj.data.length > config.uploads.max_filesize){
        return cb('upload size too large')
      } else if(typeof obj.data !== 'string'){
        return cb('invalid upload format')
      } else {
        let is_valid = false
        for (let i in mtype) {
          if(i === obj.ctype && mtype[i].indexOf(ext) !== -1){
            is_valid = true;
            fs.mkdir(base + dest, {recursive: config.uploads.recursive}, function(err){
              if(err){return cb(err)}
              if(gz){
                obj.path += config.compression.gzip.ext;
                obj.data = zlib.gzipSync(obj.data, config.compression.gzip.settings);
              } else if(br){
                obj.path += config.compression.brotli.ext;
                obj.data = zlib.brotliCompressSync(obj.data, config.compression.brotli.settings);
              } else if(dfl){
                obj.path += config.compression.deflate.ext;
                obj.data = zlib.deflateSync(obj.data, config.compression.deflate.settings);
              }
              fs.writeFile(base + obj.path, obj.data, function(err){
                if(err){return cb(err)}
                cb(false, file + ' upload success')
              })
            });

            break;
          }
        }
        if(!is_valid){
          return cb('invalid file type')
        }
      }

    } catch (err) {
      cb(err)
    }

  },
  fetch: function(obj, cb, tm){

    tm = tm || config.fetch.timeout;

    let options = utils.set_cert(),
    data;
    options = Object.assign(options, config.server);

    const client = http2.connect(obj['url'], options);
    delete obj.url;

    if(obj.body){
      data = obj.body;
      delete obj.body;

    }

    let stream = client.request(obj),
    body = '',
    timeout = setTimeout(function(){
      cb('connection timeout error')
      stream.close();
    }, tm),
    headers;

    stream.setEncoding('utf8');

    stream.on('response', function(head){
      headers = head;
    });

    stream.on('data', function(chunk){
      body += chunk;
    });

    stream.on('end', function(){

      let result = {
        headers: headers,
        text: body,
        buffer: Buffer.from(body)
      }

      try {

        clearTimeout(timeout)
        let ctype = headers['content-type'].split(';')[0];

        if(ctype === 'application/json'){
          result.json = JSON.parse(body);
        } else if(ctype === 'multipart/form-data'){
          let b = utils.Boundary_parse(body);
          result.text = utils.MultiPart_parse(body, 'multipart/form-body; boundary=' + b);
        } else if(ctype === 'application/x-www-form-urlencoded'){
          result.text = JSON.stringify(qs.parse(body));
        }

        result.statusText = 'ok'

      } catch (err) {
        result.statusText = 'not ok'
      } finally {
        cb(false, result)
        stream.close();
      }

    });

    if(data){
      stream.end(data, 'utf8');
    } else {
      stream.end();
    }


  },
  cache_stream: function(url, obj, cb){

    if(!config[obj.src].cache.enabled){
      return cb(false, {code: 300})
    }
    let options = utils.set_cert();
    options = Object.assign(options, config.cache.server);

    const client = http2.connect(url, options);

    if(typeof obj !== 'string'){
      obj = JSON.stringify(obj);
    }

    let head = {
      ':method': 'POST',
      ':path': '/',
      'Content-Type': 'application/json'
    }

    if(config.cache.authtoken.enabled){
      head[config.cache.authtoken.header] = config.cache.authtoken.token;
    }

    let stream = client.request(head),
    timeout = setTimeout(function(){
      cb('connection timeout error')
      stream.close();
    }, config.fetch.timeout),
    body = '';

    stream.setEncoding('utf8');

    stream.on('data', function(chunk){
      body += chunk;
    });

    stream.on('end', function(){

      try {
        clearTimeout(timeout)
        let data = JSON.parse(body);
        cb(false, data)
      } catch (err) {
        cb(err)
      } finally {
        stream.close();
      }
    });

    stream.end(obj, 'utf8');

  },
  set_cert: function(){
    let cert_arr = ['cert', 'key', 'pfx', 'ca'];
    let obj = {};
    for (let i = 0; i < cert_arr.length; i++) {
      if(config.ssl[cert_arr[i]] && config.ssl[cert_arr[i]] !== ''){
        obj[cert_arr[i]] = fs.readFileSync(cwd + config.ssl[cert_arr[i]]);
        if(cert_arr[i] === 'ca'){
          obj.ca = [obj.ca]
        }
      }
    }
    return obj
  },
  set_methods: function(mth, evts, evt, router, server){
    for (let i = 0; i < mth.length; i++) {
      evts[mth[i]] = new evt();
      router[mth[i]] = function(dest_url,stream,headers,flags){
        server.dest_arr.push({'method': mth[i], path: dest_url})
        return evts[mth[i]].on(dest_url,stream,headers,flags);
      }
    }
  },
  set_engine: function(engine, stream, config, cache){
    for (let i = 0; i < engine.engines.length; i++) {
      if(engine[engine.engines[i]].enabled){
        return require('../adapters/'+ engine.engines[i])(stream, config, cache);
      }
    }
  },
  uuid: function() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function(c){
      return (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
    });
  },
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
  digest: function(prefix, digest, data, encode){
    let hash = crypto.createHash(digest).update(data).digest(encode);
    return [prefix, hash].join('=');
  },
  serve: function(src, url, ctype, stream, cache){

    let obj = {
      src: src,
      method: 'get_cache',
      data: {
        url: url
      }
    }

    utils.cache_stream(config.cache.url, obj, function(err,cached){
      if(err){
        console.error(err)
        cached = {code: 500};
      }

      try {

        if(cached.code === 200 && cached.data.data && cached.data.headers){
          let res = cached.data.data;
          if(typeof res === 'object' && res.data){
            res = Buffer.from(res.data)
          }

          obj = {':status': 200};
          obj = Object.assign(obj, cached.data.headers);
          stream.respond(obj);
          stream.end(res);
          utils.cc(['GET', url + ' 200 [cache]'],92);
          return;
        }


        let file = '.' + config[src].path + url;

        if(config.compression.gzip.enabled && config.compression.gzip.prezipped){
          file += config.compression.gzip.ext
        } else if(config.compression.brotli.enabled && config.compression.brotli.prezipped){
          file += config.compression.brotli.ext
        } else if(config.compression.deflate.enabled && config.compression.deflate.prezipped){
          file += config.compression.deflate.ext
        }

        fs.readFile(file, function(err, content) {
          if(err){
            return utils.err(stream, 'GET', url, 404, 'Not Found')
          }

          stream.headers['Content-Type'] = ctype;


          if(config.compression.gzip.enabled){
            if(!config.compression.gzip.prezipped){
              content = zlib.gzipSync(content, config.compression.gzip.settings);
            }
            stream.headers['Content-Encoding'] = 'gzip';
          } else if(config.compression.brotli.enabled){
            if(!config.compression.brotli.prezipped){
              content = zlib.brotliCompressSync(content, config.compression.brotli.settings);
            }
            stream.headers['Content-Encoding'] = 'br';
          } else if(config.compression.deflate.enabled){
            if(!config.compression.deflate.prezipped){
              content = zlib.deflateSync(content, config.compression.deflate.settings);
            }
            stream.headers['Content-Encoding'] = 'deflate';
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
            obj = {
              src: src,
              method: 'add_cache',
              data: {
                url: url,
                data: content,
                headers: stream.headers
              }
            }


            utils.cache_stream(config.cache.url, obj, function(err,res){
              if(err){return console.error(err)}

            })
          }

          stream.headers[':status'] = 200;
          stream.respond(stream.headers);
          stream.end(content);
          utils.cc(['GET', url + ' 200  [file]'],92);
        });
      } catch (err) {
        return utils.err(stream, 'GET', url, 500, 'Bad request')
      }
    })


  },
  serve_static: function(url, ext, stream, cache){

    if(config.static.blocked.indexOf(url) !== -1){
      return utils.err(stream, 'GET', url, 403, 'Forbidden')
    }

    let ctype = null,
    found = false;

    for (let i in config.mimetypes) {
      if(config.mimetypes[i].indexOf(ext) !== -1) {
        ctype = i;
        utils.serve(config.static.path.slice(1), url, ctype, stream, cache);
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
    stream.headers[':status'] = code;
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
  },
  requireUncached: function(src) {
    delete require.cache[require.resolve(src)];
    return require(src);
  },
  add_ip: function(addr, i){

    let dest = cwd + '/config/ip_config.json';
    fs.readFile(dest, function(err,res){
      if(err){return console.error(err)}
      res = JSON.parse(res);
      if(typeof addr === 'string'){
        res[i].push(addr);
      } else {
        for (let x = 0; x < addr.length; i++) {
          res[i].push(addr[x]);
        }
      }

      fs.writeFile(dest, JSON.stringify(res), function(err){
        if(err){return console.error(err)}
        process.send({type: i})
      })
    })

  }
}


module.exports = utils;
