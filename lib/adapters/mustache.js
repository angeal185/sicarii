const fs = require('fs'),
config = require(process.env.config_file),
utils = require('../utils'),
cwd = process.cwd(),
Mustache = require("mustache"),
render_path = '.' + config.render.path;

function render_tpl(stream, file, data,  partials, url, cb){
  fs.readFile(file, 'utf8', function(err, content) {
    if(err){
      utils.err(stream, 'GET', url, 404, 'mustache template Found', err);
      if(cb){cb(err)}
      return;
    }
    try {
      content = Mustache.render(content, data, partials, config.template_engine.mustache.tags);
    } catch (err) {
      utils.err(stream, 'GET', url, 500, 'mustache template render error', err);
      if(cb){cb(err)}
      return;
    }
    utils.render_sort(stream, content, url, cb);
  });
}

module.exports = function(stream, file, src, url, data, cb){

  let tpl_obj = {},
  tpl_count;

  if(data.partials){
    tpl_count = Object.keys(data.partials).length;
  }

  if(tpl_count && typeof data.partials === 'object'){

    let cnt = 0;

    for (let i in data.partials) {
      if(cnt === 9999){
        break;
      }
      fs.readFile(render_path + data.partials[i], 'utf8', function(err,res){
        if(err){
          cnt = 9999;
          utils.err(stream, 'GET', url, 500, 'mustache template include error', err);
          if(cb){cb(err)}
          return;
        }
        tpl_obj[i] = res;
        cnt++
        if(cnt === tpl_count){
          delete data.partials;
          render_tpl(stream, file, data, tpl_obj, url, cb);
          return cnt = null;
        }
      })
    }
  } else {
    render_tpl(stream, file, data, tpl_obj, url, cb)
  }
}
