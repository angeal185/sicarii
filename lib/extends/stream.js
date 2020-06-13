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
      this.headers['Set-Cookie'] =  utils.cookie_encode(key, val, obj);
      return this
    }

  }

  stream.Duplex.prototype.etag = function(digest, data, encode){
    this.headers['Etag'] =  utils.etag(digest, data, encode);
    return this
  }

  stream.Duplex.prototype.doc = function(src, charset){
    return utils.serve(config.render.path.slice(1), '/'+ src, charset, this, server.cache);
  }

  stream.Duplex.prototype.download = function(src, charset){
    this.headers['Content-Disposition'] = 'attachment; filename="'+ path.basename(src) +'"';
    return utils.serve(config.static.path.slice(1), '/'+ src, charset, this, server.cache);
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
