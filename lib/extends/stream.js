const qs = require('querystring'),
path = require('path'),
utils = require('../utils');

module.exports = function(stream, utils, server, config){

  stream.Duplex.prototype.json = function(data){
    this.headers['Content-Type'] = 'application/json';
    this.respond(this.headers)
    this.end(JSON.stringify(data))
  }

  if(config.cookie_parser.enabled){

    stream.Duplex.prototype.cookie = function(key, val, obj){
      let is_signed;
      if(obj.Signed){
        is_signed = true;
      }
      let newcookie = utils.cookie_encode(key, val, obj),
      current = this.headers['Set-Cookie'];
      if(!current){
        this.headers['Set-Cookie'] = [newcookie];
      } else {
        this.headers['Set-Cookie'].push(newcookie)
      }

      if(is_signed){
        is_signed = utils.cookie_sign(key, val, obj);
        this.headers['Set-Cookie'].push(is_signed)
      }

      return this
    }

  }

  stream.Duplex.prototype.etag = function(digest, data, encode){
    this.headers['Etag'] =  utils.etag(digest, data, encode);
    return this
  }

  stream.Duplex.prototype.ctype = function(x){
    this.headers['Content-Type'] =  x;
    return this
  }

  stream.Duplex.prototype.csp = function(x){
    this.headers['Content-Security-Policy'] =  config.csp[x];
    return this
  }

  stream.Duplex.prototype.feature = function(x){
    this.headers['Feature-Policy'] =  config.feature_policy[x];
    return this
  }

  stream.Duplex.prototype.tk = function(x){
    this.headers['TK'] =  x;
    return this
  }

  stream.Duplex.prototype.cors = function(x){

    if(!x){
      x = config.cors;
    }

    if(x.origin || x.origin === ''){
      this.headers['Access-Control-Allow-Origin'] = x.origin;
    }
    if(x.methods || x.methods === ''){
      this.headers['Access-Control-Allow-Methods'] = x.methods;
    }
    if(x.allow_headers || x.allow_headers === ''){
      this.headers['Access-Control-Allow-Headers'] = x.allow_headers
    }
    if(x.expose_headers || x.expose_headers === ''){
      this.headers['Access-Control-Expose-Headers'] = x.expose_headers
    }
    if(typeof x.credentials === 'boolean'){
      this.headers['Access-Control-Allow-Credentials'] = x.credentials
    }
    if(typeof x.maxage === 'number'){
      this.headers['Access-Control-Max-Age'] = x.maxage
    }
    return this
  }

  stream.Duplex.prototype.lang = function(x){
    this.headers['Content-Language'] =  x;
    return this
  }

  stream.Duplex.prototype.status = function(x){
    this.headers[':status'] =  x;
    return this
  }

  stream.Duplex.prototype.doc = function(src, charset){
    return utils.serve(config.render.path.slice(1), '/'+ src, charset, this);
  }

  stream.Duplex.prototype.pushStatic = function(src, ctype){
    if(typeof src === 'object'){
      for (let i = 0; i < src.length; i++) {
        utils.push_stream(this, src[i].path, src[i].ctype)
      }
    } else {
      utils.push_stream(this, src, ctype)
    }
    return this;
  }

  stream.Duplex.prototype.download = function(src, charset){
    this.headers['Content-Disposition'] = 'attachment; filename="'+ path.basename(src) +'"';
    return utils.serve(config.static.path.slice(1), '/'+ src, charset, this);
  }


  stream.Duplex.prototype.addHeader = function(key, val){
    this.headers[key] = val
    return this
  }

  stream.Duplex.prototype.addHeaders = function(obj){
    this.headers = Object.assign(this.headers, obj)
    return this
  }

  if(config.uploads.enabled){
    stream.Duplex.prototype.upload = function(obj, cb){
      utils.upload(obj, cb)
    }
  }

  stream.Duplex.prototype.redirect = function(dest){
    this.headers[':status'] =  302;
    this.headers['Location'] =  dest;
    this.respond(this.headers)
    this.end();
  }


}
