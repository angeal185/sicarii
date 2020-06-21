const fs = require('fs'),
cwd = process.cwd(),
config = require(process.env.config_file),
utils = require('../utils'),
dest = cwd + config.render.path;

module.exports = function(stream, file, src, url, data, cb){

  if(config.template_engine.poorboy.settings.use_globals){
    data = Object.assign(config.template_engine.poorboy.settings.globals)
  }

  let item = dest + url;
  utils.nocache(item, data, function(err, content){
    if(err){
      utils.err(stream, 'GET', url, 404, 'Not Found');
      if(cb){cb(err)}
      return
    }
    utils.render_sort(stream, content, url, cb);
  })

}
