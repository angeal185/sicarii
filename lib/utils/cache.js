const config = require(process.cwd() + '/config/config');

const cache = function(){
  this[config.static.path.slice(1)] = [];
  this[config.render.path.slice(1)] = [];
  this.store = [];
}

cache.prototype = {
  get: function(item, url){
    let res;
    for (let i = 0; i < this[item].length; i++) {
      if(this[item][i].url === url){
        res = this[item][i];
        break;
      }
    }
    return res;
  },
  add: function(item, obj){
    obj.date = Date.now() + config[item].cache.maxage;
    this[item].push(obj);
    return this
  },
  check: function(item){
    let arr = [],
    dnow = Date.now(),
    len = this[item].length;
    for (let i = 0; i < len; i++) {
      if(this[item][i].date > dnow){
        arr.push(this[item][i]);
      }
    }
    if(arr.length !== len){
      this[item] = arr;
    }
    arr = dnow = len = null;
  },
  delete: function(){

  },
  val: function(){
    return this;
  }
}

module.exports = cache;
