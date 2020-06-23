const config = require(process.env.config_file),
utils = require('../utils');

function Cache(){
  this[process.env.static_path] = [];
  this[process.env.render_path] = [];
  this.store = [];
  this.session = [];
  this.http2_sessions = []
}

Cache.prototype = {
  add_cache: function(src, obj){
    obj.date = Date.now() + config[src].cache.maxage;
    this[src].push(obj);
    return this;
  },
  get_cache: function(src, obj){
    let res = {};
    for (let i = 0; i < this[src].length; i++) {
      if(this[src][i].url === obj.url){
        let current = this[src][i]
        if(!current.date || current.date < Date.now()){
          this.del_cache_index(src, {index: i});
        } else {
          res = current;
        }
        break;
      }
    }
    return res;
  },
  del_cache_index: function(src, obj){
    this[src].splice(obj.index, 1);
    return this;
  },
  reset_cache: function(src){
    this[src] = [];
    return this;
  },
  import_cache: function(src){
    let cpath = config.cache.path + src + '.json';
    return utils.store_import(src, cpath, this);
  },
  export_cache: function(src){
    let cpath = config.cache.path + src + '.json';
    return utils.store_export(src, cpath, this);
  },
  check_cache: function(src){
    let arr = [],
    dnow = Date.now(),
    len = this[src].length;
    for (let i = 0; i < len; i++) {
      if(this[src][i].date > dnow){
        arr.push(this[src][i]);
      }
    }
    if(arr.length !== len){
      this[src] = arr;
    }
    arr = dnow = len = null;
  },
  store_read: function(src){
    return utils.store_import(src, config[src].path, this);
  },
  store_write: function(src){
    return utils.store_export(src, config[src].path, this);
  },
  store_check: function(src, obj){
    try {

      let items = this[src],
      arr = [],
      data = {
        success: true,
        data: 0
      }

      for (let i = 0; i < items.length; i++) {
        if(!items[i].date || items[i].date < Date.now()){
          data.data++
        } else {
          arr.push(items[i]);
        }
      }

      this[src] = arr;

      return data;

    } catch (err) {
      return {success: false, msg: 'session check error'};
    }

  },
  store_add: function(src, obj){
    return utils.store_add(src, obj, this, false);
  },
  store_unshift: function(src, obj){
    return utils.store_add(src, obj, this, true);
  },
  store_find: function(src, obj){
    return utils.store_find(src, obj, this);
  },
  store_each: function(src, obj){
    return utils.store_each(src, obj, this);
  },
  store_omit: function(src, arr){
    return utils.store_omit(src, arr, this);
  },
  store_concat: function(src, arr){
    return utils.store_concat(src, arr, this);
  },
  store_chunk: function(src, obj){
    return utils.store_chunk(src, obj, this);
  },
  store_first: function(src, cnt){
    return utils.store_first(src, this, cnt);
  },
  store_last: function(src, cnt){
    return utils.store_last(src, this, cnt);
  },
  store_assign: function(src, arr){
    return utils.store_assign(src, arr, this);
  },
  store_findIndex: function(src, obj){
    return utils.store_findIndex(src, obj, this);
  },
  store_filter: function(src, obj){
    return utils.store_filter(src, obj, this);
  },
  store_gt: function(src, obj){
    return utils.store_compare(src, obj, this, 'gt');
  },
  store_lt: function(src, obj){
    return utils.store_compare(src, obj, this, 'lt');
  },
  store_gte: function(src, obj){
    return utils.store_compare(src, obj, this, 'gte');
  },
  store_lte: function(src, obj){
    return utils.store_compare(src, obj, this, 'lte');
  },
  store_sort: function(src, obj){
    return utils.store_sort(src, obj, this);
  },
  store_delete: function(src, obj){
    return utils.store_delete(src, obj, this);
  },
  store_val: function(src){
    return this.val(src);
  },
  val: function(src){
    return this[src];
  }
}

module.exports = Cache;
