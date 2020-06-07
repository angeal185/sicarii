const qs = require('querystring');

module.exports = function(stream, utils, server, config){

  stream.Duplex.prototype.json = function(data){
    this.end(JSON.stringify(data))
  }

  stream.Duplex.prototype.cookie = function(key, val, obj){
    let new_obj = {};
    new_obj[key] = val;
    new_obj = Object.assign(new_obj, obj);
    new_obj = qs.stringify(new_obj,';')
    this.headers['Set-Cookie'] =  new_obj;
    return this
  }

  stream.Duplex.prototype.doc = function(src, charset){
    return utils.serve(config.render.path.slice(1), '/'+ src, charset, this, server.cache);
  }


}
