const http2 = require('http2'),
fs = require('fs'),
cwd = process.cwd(),
config = require(process.env.config_file),
pre_cache = require(cwd + config.pre_cache),
push_config = require(cwd + config.push_handler.path),
ip_config = require(cwd + config.ip_config + '.json'),
path = require('path'),
zlib = require('zlib'),
crypto = require('crypto'),
crypt = require('./crypt'),
qs = require('querystring'),
url = require('url'),
dns = require('dns');


const utils = {
  engine: {
    add: function(title, obj, cb){
      try {
        let adapt_file = __dirname.split('/').slice(0, -1).join('/');
        adapt_file += '/adapters/'+ title +'.js'

        let tpl =
        'const '+ title +' = require("'+ title +'"),\nconfig = require(process.env.config_file),\nutils = require("../utils");\n\nmodule.exports = function(stream, file, src, url, data, cb){\n  utils.render_sort(stream, data, url, cb);\n};'

        config.template_engine.engines.push(title);
        config.template_engine[title] = obj;

        fs.writeFile(process.env.config_file +'.json', JSON.stringify(config), function(err){
          if(err){return cb(err)}
          utils.cc(['engine', title + ' config added to config file'],92)
          fs.writeFile(adapt_file, tpl, function(err){
            if(err){return cb(err)}
            utils.cc(['engine', title + ' adapter template created'],92)
            cb(false)
          })
        })
      } catch (err) {
        cb(err)
      }
    },
    del: function(arr,cb){
      try {
        let adapt_file = __dirname.split('/').slice(0, -1).join('/');

        for (let i = 0; i < arr.length; i++) {
          let file =  adapt_file + '/adapters/'+ arr[i] +'.js',
          new_arr = [],
          items = config.template_engine.engines;

          for (let x = 0; x < items.length; x++) {
            if(items[x] !== arr[i]){
              new_arr.push(items[x])
            }
          }

          config.template_engine.engines = new_arr;
          delete config.template_engine[arr[i]];

          fs.unlink(file, function(err){
            if(err){return cb(err)}
            utils.cc(['engine', arr[i] + ' adapter removed'],92)
            if(i === arr.length -1){
              fs.writeFile(process.env.config_file +'.json', JSON.stringify(config), function(err){
                if(err){return cb(err)}
                utils.cc(['engine', 'config file updated'],92)
                cb(false)
              })
            }
          })

        }

      } catch (err) {
        cb(err)
      }
    }
  },
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
          b = utils.multiPart_parse(body, 'multipart/form-body; boundary=' + b);
          result.text = b;
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
  store_fetch: function(method, data, sel, cb){
    if(typeof data === 'function'){
      cb = data;
      data = {}
    }

    let head = {
      'url': config.cache.url,
      ':method': 'POST',
      ':path': '/',
      'Content-Type': 'application/json',
      'body': JSON.stringify({
        method: 'store_' + method,
        src: sel,
        data: data
      })
    }

    if(config.cache.authtoken.enabled){
      head[config.cache.authtoken.header] = config.cache.authtoken.token;
    }

    utils.fetch(head, function(err,res){
      if(err){return cb(err)}
      cb(false, res.json)
    })

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
  set_engine: function(engine, stream, config){
    for (let i = 0; i < engine.engines.length; i++) {
      if(engine[engine.engines[i]].enabled){
        process.env.template_engine = engine.engines[i];
        return require('../adapters/adapter')(stream, config);
      }
    }
  },
  uuid: function() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function(c){
      return (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
    });
  },
  cc: function(x,y,z,err){
    if(config.verbose){
      if(z){
        x[1] = x[1] + ' [push]'
      }
      console.log('\x1b[92m[\x1b[94msicarii\x1b[92m:\x1b[94m'+x[0]+'\x1b[92m] \x1b['+y+'m'+ x[1] +' \x1b[0m');
      if(err){
        console.error(err)
      }
    }
    return
  },
  qs: function(data, i, e){
    return qs.stringify(data, i, e)
  },
  cookie_encode: function(key, val, obj){
    delete obj.Signed;
    let new_obj = {};
    new_obj[key] = val;
    new_obj = Object.assign(new_obj, obj);
    new_obj = qs.stringify(new_obj,';');
    return new_obj + ';';
  },
  cookie_sign: function(key, val, obj){
    val = crypt.hmac.sign(val, config.cookie_parser.sig.hmac);
    key = [key, config.cookie_parser.sig.suffix].join('_')
    return utils.cookie_encode(key, val, obj);
  },
  cookie_decode: function(obj){
    try {
      if(obj){
        obj = JSON.parse(JSON.stringify(qs.parse(obj, '; ')));
      }
      return obj;
    } catch (err) {
      return null
    }
  },
  cookie_verify: function(name, obj){
    try {
      obj = utils.cookie_decode(obj)
      for (let i in obj) {
        if(i.slice(0, -(config.cookie_parser.sig.suffix.length + 1)) === name){
          let hash = crypt.hmac.sign(obj[name], config.cookie_parser.sig.hmac)
          return obj[i] === hash;
        }
      }
      return false;
    } catch (err) {
      return false
    }
  },
  trim_arr: function(arr){
    for (let i = 0; i < arr.length; i++){
      arr[i] = arr[i].trim();
    }
    return arr
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
  compress_ext: function(file){
    if(config.compression.gzip.enabled && config.compression.gzip.prezipped){
      file += config.compression.gzip.ext
    } else if(config.compression.brotli.enabled && config.compression.brotli.prezipped){
      file += config.compression.brotli.ext
    } else if(config.compression.deflate.enabled && config.compression.deflate.prezipped){
      file += config.compression.deflate.ext
    }
    return file;
  },
  render_sort: function($this, content, url, cb){

    content = Buffer.from(content);

    $this.headers['Content-Type'] = 'text/html; charset=utf-8';
    if(config.compression.gzip.enabled){
      content = zlib.gzipSync(content, config.compression.gzip.settings);
      $this.headers['Content-Encoding'] = 'gzip';
    } else if(config.compression.brotli.enabled){
      content = zlib.brotliCompressSync(content, config.compression.brotli.settings);
      $this.headers['Content-Encoding'] = 'br';
    } else if(config.compression.deflate.enabled){
      content = zlib.deflateSync(content, config.compression.deflate.settings);
      $this.headers['Content-Encoding'] = 'deflate';
    }
    $this.headers['Content-Length'] = Buffer.byteLength(content);

    if(config.render.etag.enabled){
      $this.headers.Etag = utils.etag(
        config.render.etag.digest,
        content,
        config.render.etag.encode
      )
    }

    $this.headers = Object.assign(config.render.headers, $this.headers);

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

    if(!cb){
      return this;
    }
    cb(false);
  },
  compress_sort: function(headers, content){
    if(config.compression.gzip.enabled){
      if(!config.compression.gzip.prezipped){
        content = zlib.gzipSync(content, config.compression.gzip.settings);
      }
      headers['Content-Encoding'] = 'gzip';
    } else if(config.compression.brotli.enabled){
      if(!config.compression.brotli.prezipped){
        content = zlib.brotliCompressSync(content, config.compression.brotli.settings);
      }
      headers['Content-Encoding'] = 'br';
    } else if(config.compression.deflate.enabled){
      if(!config.compression.deflate.prezipped){
        content = zlib.deflateSync(content, config.compression.deflate.settings);
      }
      headers['Content-Encoding'] = 'deflate';
    }
    return {
      content: content,
      headers:headers
    }
  },
  pre_cache_init: function(){
    let arr = ['static', 'render']
    for (let x = 0; x < arr.length; x++) {
      for (let i = 0; i < pre_cache[arr[x]].length; i++) {
        utils.pre_cache_stream(arr[x], pre_cache[arr[x]][i].url, pre_cache[arr[x]][i].ctype)
      }
    }
  },
  pre_cache_stream: function(src, url, ctype){
    try {

      let file = utils.compress_ext('.' + config[src].path + url),
      headers = {}

      fs.readFile(file, function(err, content) {
        if(err){console.error(err)}

        headers['Content-Type'] = ctype;


        let srt =  utils.compress_sort(headers, content);
        headers = srt.headers;
        content = srt.content;

        headers['Content-Length'] = Buffer.byteLength(content);

        if(config[src].etag.enabled){
          headers.Etag = utils.etag(
            config[src].etag.digest,
            content,
            config[src].etag.encode,
          )
        }

        headers = Object.assign(headers, config[src].headers)

        let obj = {
          src: src,
          method: 'add_cache',
          data: {
            url: url,
            data: content,
            headers: headers
          }
        }

        utils.cache_stream(config.cache.url, obj, function(err,res){
          if(err){return console.error(err)}
        })

      });
    } catch (err) {
      return console.error(err)
    }
  },
  serve: function(src, url, ctype, stream, is_push){

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
          utils.cc(['GET', url + ' 200 [cache]'],92,is_push);
          return;
        }

        let file = utils.compress_ext('.' + config[src].path + url);

        fs.readFile(file, function(err, content) {
          if(err){return utils.err(stream, 'GET', url, 404, 'Not Found', err)}

          stream.headers['Content-Type'] = ctype;

          let sorted =  utils.compress_sort(stream.headers, content);
          stream.headers = sorted.headers;
          content = sorted.content;

          stream.headers['Content-Length'] = Buffer.byteLength(content);

          if(config[src].etag.enabled){
            stream.headers.Etag = utils.etag(
              config[src].etag.digest,
              content,
              config[src].etag.encode,
            )
          }

          stream.headers = Object.assign(stream.headers, config[src].headers);

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


          if(!stream.destroyed){
            stream.headers[':status'] = 200;
            stream.respond(stream.headers);
            stream.end(content);
            utils.cc(['GET', url + ' 200  [file]'],92, is_push);
          }

        });
      } catch (err) {
        return utils.err(stream, 'GET', url, 500, 'Bad request', err)
      }
    })


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
        utils.serve(process.env.static_path, url, ctype, stream);
        found = true;
        break;
      }
    }

    if(!found){
      return utils.err(stream, 'GET', url, 415, 'Unsupported Media Type')
    }

  },
  push_stream: function(stream, src, ctype){

    if(stream.pushAllowed){
      stream.pushStream({':path': src}, function(err, pushStream){
        if(err){return console.err(err)};

        pushStream.on('error', function(err){
          pushStream.end();
        })

        pushStream.headers = {}

        utils.serve(process.env.static_path, src, ctype, pushStream, true);
      })
    }

  },
  err: function(stream, method, url, code, msg, error){
    utils.cc([method, url + ' '+ code],91, error);
    if(!stream.destroyed){
      stream.headers[':status'] = code;
      stream.json({code: code, error: msg}, 'utf-8');
    }
    if(config.logs.error.enabled){
      process.emit('message', {type: 'log_error', data: [Date.now(), method, url, code, msg].join('::::')})
    }
  },
  cache_res: function(stream, code, msg){
    stream.headers[':status'] = code
    stream.respond(stream.headers);
    return stream.end(JSON.stringify({code: code, data: msg}, 'utf8'));
  },
  h_parse: function(header) {
    let headerFields = {},
    matchResult = header.match(/^.*name="([^"]*)"$/);

    if (matchResult){
       headerFields.name = matchResult[1];
     }

    return headerFields;
  },
  is_bot: function(ua, arr){
    let x = false;
    try {
      for (let i = 0; i < arr.length; i++) {
        if(ua.includes(arr[i])){
          x = true;
          break;
        }
      }
      return x;
    } catch (err) {
      console.log(err);
      return x;
    }
  },
  stream_check: function(router, ip, headers){
    let in_valid = false;

    if(config.bot.block.enabled){
      let ua = headers['user-agent'],
      arr = config.bot.block.items;
      if(utils.is_bot(ua, arr)){
        in_valid = config.bot.block.msg;
      }
    }
    if(config.blacklist.enabled){
      if(ip_config.blacklist.indexOf(ip) !== -1){
        router.emit('auth_error', {type: 'blacklist', ip: ip});
        in_valid = config.blacklist.msg;
      }
    }
    if(config.whitelist.enabled && !in_valid){
      if(ip_config.whitelist.indexOf(ip) === -1){
        router.emit('auth_error', {type: 'whitelist', ip: ip});
        in_valid = config.whitelist.msg;
      }
    }
    if(config.authtoken.enabled && !in_valid){
      router.emit('auth_error', {type: 'authtoken', ip: ip});
      if(headers[config.authtoken.header] !== config.authtoken.token){
        in_valid = config.authtoken.msg
      }
    }
    return in_valid;
  },
  stream_body: function(stream, body, ctype){
    let is_json = true,
    is_buff = true;
    stream.body = {};
    if(ctype === 'multipart/form-data'){
      let b = utils.Boundary_parse(body);
      body = utils.multiPart_parse(body, 'multipart/form-body; boundary=' + b);
      stream.body.text = body;
    } else if(ctype === 'application/x-www-form-urlencoded'){
      stream.body.text = JSON.stringify(qs.parse(body));
    } else if(ctype === 'application/json'){
      stream.body.text = body;
    } else {
      is_json = false;
      stream.body.text = body;
    }

    if(is_json){
      stream.body.json = JSON.parse(stream.body.text);
    }

    if(is_buff){
      stream.body.buffer = Buffer.from(stream.body.text);
    }
    return stream;
  },
  stream_push: function(stream, headers, cpath){
    let accept = headers['accept'].split(','),
    accepted = config.push_handler.accept;
    for (let j = 0; j < accepted.length; j++) {
      if(accept.indexOf(accepted[j]) !== -1){
        for (let i = 0; i < push_config.length; i++) {
          if(push_config[i].url === cpath.pathname){
            if(!push_config[i].items){
              stream.pushStatic(push_config[i].path, push_config[i].ctype);
            } else {
              stream.pushStatic(push_config[i].items);
            }
            break;
          }
        }
        break;
      }
    }
  },
  multiPart_parse: function(body, contentType) {
    try {
      let m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

      if (!m) {
        return 'Bad content-type header, no multipart boundary'
      }

      let boundary = m[1] || m[2],
      isRaw = typeof(body) !== 'string',
      s, fname;


      boundary = '\r\n--' + boundary;

      if (isRaw) {
        s = String.fromCharCode.apply(null, new Uint8Array(body));
      } else {
        s = body;
      }

      s = '\r\n' + s;

      let parts = s.split(new RegExp(boundary)),
      partsByName = {},
      headerFields;

      for (var i = 1; i < parts.length - 1; i++) {
        let subparts = parts[i].split('\r\n\r\n'),
        headers = subparts[0].split('\r\n');

        for (var j = 1; j < headers.length; j++) {
          headerFields = utils.h_parse(headers[j]);
          if (headerFields.name) {
            fname = headerFields.name;
          }
          headerFields = null;
        }

        partsByName[fname] = isRaw ? Buffer.from(subparts[1]).buffer : subparts[1];
      }

      return JSON.stringify(partsByName);
    } catch (err) {
      return null
    }
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
  nocache: function(dest, data, cb){
    try {
      cb(false, require(dest)(data));
      delete require.cache[require.resolve(dest)];
    } catch (err) {
      cb(err);
    }
  },
  sort_ip: function(stream, headers){
    let ip;
    if(config.cache.proxy){
      ip = headers['x-forwarded-for'] || stream.session.socket.remoteAddress;
    } else {
      ip = stream.session.socket.remoteAddress;
    }
    return ip;
  },
  add_ip: function(addr, i){

    let dest = cwd + config.ip_config + '.json';
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

  },
  store_add: function(src, obj, x, is_unshift){
    try {
      let add_items = x[src],
      exists = false;


      obj.date = Date.now();

      if(config[src] && config[src].maxage){
        obj.date = obj.date + config[src].maxage
      }

      for (let i = 0; i < add_items.length; i++) {
        if(add_items[i].id === obj.id){
          exists = true;
          x[src][i] = obj;
        }
      }

      if(exists){
        return {success: true, msg: src +' updated'};
      } else {
        if(is_unshift){
          x[src].unshift(obj);
        } else {
          x[src].push(obj);
        }

        return {success: true, msg: src +' added'};
      }
    } catch (err) {
      return {success: false, msg: 'unable to add '+ src};
    }
  },
  store_find: function(src, obj, x){
    try {

      let find_items = x[src],
      data = {
        success: true,
        data: null
      },
      item = Object.keys(obj)[0];

      for (let i = 0; i < find_items.length; i++) {
        if(find_items[i][item] === obj[item]){
          if(config[src] && config[src].maxage){
            if(!find_items[i].date || find_items[i].date < Date.now()){
              x.del_cache_index(src, {index: i});
            } else {
              data.data = find_items[i];
            }
          } else {
            data.data = find_items[i];
          }
        }
      }

      return data;

    } catch (err) {
      return {success: false, msg: src+ ' find error'};
    }

  },
  store_first: function(src, x, cnt){
    try {

      let first_items = x[src],
      data = {success: true,data: null}

      if(!cnt){
        data.data = first_items[0]
      } else {
        data.data = first_items.slice(0, cnt)
      }

      return data;

    } catch (err) {
      return {success: false, msg: src+ ' find error'};
    }

  },
  store_last: function(src, x, cnt){
    try {

      let last_items = x[src],
      data = {success: true,data: null},
      len = last_items.length;

      if(!cnt){
        cnt = 1
      }

      data.data = last_items.slice(len - cnt)
      return data;

    } catch (err) {
      return {success: false, msg: src+ ' find error'};
    }

  },
  store_assign: function(src, arr, x){

    let msg = {success: false, msg: src+ ' assign error'};

    try {

      let assign_items = x[src],
      item = Object.keys(arr[0])[0],
      exists = false;

      for (let i = 0; i < assign_items.length; i++) {
        if(assign_items[i][item] === arr[0][item]){
          x[src][i] = Object.assign(assign_items[i], arr[1]);
          exists = true;
          break;
        }
      }

      if(exists){
        msg.success = true;
        msg.msg = src+ ' assign success';
      }

      return msg

    } catch (err) {
      return msg;
    }

  },
  store_each: function(src, obj, x){

    let msg = {success: false, msg: src+ ' each error'};
    try {

      let each_items = x[src];

      for (let i = 0; i < each_items.length; i++) {
        each_items[i] = Object.assign(each_items[i], obj);
      }

      msg.success = true;
      msg.msg = src+ ' each success';
      return msg

    } catch (err) {
      return msg;
    }

  },
  store_omit: function(src, arr, x){

    let msg = {success: false, msg: src+ ' omit error'};

    try {

      let omit_items = x[src];

      for (let i = 0; i < omit_items.length; i++) {
        for (let j = 0; j < arr.length; j++) {
          delete omit_items[i][arr[j]]
        }
      }
      msg.success = true;
      msg.msg = src+ ' omit success';
      return msg
    } catch (err) {
      return msg;
    }

  },
  store_filter: function(src, obj, x){
    try {

      let filter_items = x[src],
      item = Object.keys(obj)[0],
      data = {
        success: true,
        data: null
      }

      data.data = filter_items.filter(function(i){
        return i[item] !== obj[item]
      })

      return data;

    } catch (err) {
      return {success: false, msg: src+ ' filter error'};
    }

  },
  store_compare: function(src, obj, x, sel){
    try {

      let compare_items = x[src],
      item = Object.keys(obj)[0],
      data = {
        success: true,
        data: null
      }

      if(sel === 'gt'){
        data.data = compare_items.filter(function(i){
          return i[item] > obj[item]
        })
      } else if(sel === 'lt'){
        data.data = compare_items.filter(function(i){
          return i[item] < obj[item]
        })
      } else if(sel === 'gte'){
        data.data = compare_items.filter(function(i){
          return i[item] >= obj[item]
        })
      } else if(sel === 'lte'){
        data.data = compare_items.filter(function(i){
          return i[item] <= obj[item]
        })
      }

      return data;

    } catch (err) {
      return {success: false, msg: src+ ' filter '+ sel +' error'};
    }

  },
  store_findIndex: function(src, obj, x){
    try {

      let idx_items = x[src],
      item = Object.keys(obj)[0],
      data = {
        success: true,
        data: null
      }

      data.data = idx_items.findIndex(function(i){
        return i[item] === obj[item]
      })

      return data;

    } catch (err) {
      return {success: false, msg: src+ ' filter error'};
    }

  },
  store_delete: function(src, obj, x){
    try {

      let del_items = x[src],
      item = Object.keys(obj)[0],
      data = {
        success: true,
        msg: src +' not found'
      }

      for (let i = 0; i < del_items.length; i++) {
        if(del_items[i][item] === obj[item]){
          x[src].splice(i, 1);
          data.msg = src +' deleted'
        }
      }

      return data;

    } catch (err) {
      return {success: false, msg: src+ ' delete error'};
    }
  },
  store_chunk: function(src, arr, x){
    try {

      let   data = {
        success: true,
        data: utils.chunk(x[src], arr[0])
      }

      if(arr[1]){
        data.data = data.data.slice(0, arr[1])
      }

      return data;

    } catch (err) {
      return {success: false, msg: src+ ' chunk error'};
    }
  },
  store_import: function(src, dest, x, cb){

    let msg = {
      success: true,
      msg: src +' import success'
    }

    try {
      let data = JSON.parse(fs.readFileSync(cwd + dest, 'utf8'));
      x[src] = data;
    } catch (err){
      msg.success = false;
      msg.msg = src +' import failed';
    } finally{
      return msg;
    }

  },
  store_export: function(src, dest, x){

    let msg = {
      success: true,
      msg: src +' export success'
    },
    data = JSON.stringify(x[src]);
    fs.writeFile(cwd + dest, data, function(err){
      if(err){return console.error(err)}
    });
    return msg;
  },
  store_sort: function(src, obj, x){
    try {

      let sort_items = x[src],
      item = Object.keys(obj)[0],
      data = {
        success: true,
        data: null
      }

      data.data = utils.sortBy(sort_items, obj.key)

      if(obj.count){
        data.data = data.data.slice(0, obj.count)
      }

      return data;

    } catch (err) {
      return {success: false, msg: src+ ' sort error'};
    }

  },
  store_concat: function(src, arr, x){
    try {
      x[src] = x[src].concat(arr);
      return {success: true, msg: src+ ' concat success'};
    } catch (err) {
      return {success: false, msg: src+ ' concat error'};
    }
  },
  sortKey: function(key) {
    return function (a, b) {
      return a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0;
    }
  },
  sortBy: function(arr,key){
    return arr.concat().sort(utils.sortKey(key))
  },
  chunk: function(input, size){
    return input.reduce(function(arr, item, idx){
      return idx % size === 0
        ? [...arr, [item]]
        : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    }, []);
  },
  path: function(i){
    try {
      return path.parse(i);
    } catch (err) {
      return null;
    }
  },
  url: function(i){
    try {
      return JSON.parse(JSON.stringify(url.parse(i,{parseQueryString:true})));
    } catch (err) {
      return null;
    }
  },
  dns: {
    get: function(dest, obj, cb){
      let getcnf = {family:0, all: false};
      if(typeof obj === 'object'){
        getcnf = Object.assign(getcnf, obj)
      } else {
        cb = obj;
      }
      dns.lookup(dest, getcnf, function(err, address, family){
        if(err){return cb(err)}
        cb(false, {
          address: address,
          family: family
        })
      });
    },
    getService: function(dest, port, cb){

      try { // nodejs bug ~ remove it if they 'ever' fix it
            // dest validation should be handled within lookupService scope
        dns.lookupService(dest, port, function(err, hostname, service){
          if(err){return cb(err)}
          cb(false, {
            hostname: hostname,
            service: service
          })
        })
      } catch (err) {
        cb(err)
      }

    },
    reverse: function(dest, cb){
      try { // nodejs bug 2 ~ remove it if they 'ever' fix it
            // dest validation should be handled within reverse scope
      dns.reverse(dest, function(err,res){
        if(err){return cb(err)}
        cb(false,res)
      })
     } catch (err) {
       cb(err)
     }
    }
  },
  encode: function(data, from, to){
    try {
      if(['hex','base64','utf8'].indexOf(from) !== -1){
        data = Buffer.from(data, from)
      } else {
        data = Buffer.from(data)
      }

      if(!to){
        return data
      }

      if(['hex','base64','utf8'].indexOf(to) !== -1){
        data = data.toString(to)
      } else {
        data = new global[to](data)
      }

      return data
    } catch (err) {
      return null
    }

  }
}


module.exports = utils;
