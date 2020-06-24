const ejs = require("ejs"),
config = require(process.env.config_file),
utils = require('../utils'),
settings = config.template_engine.ejs.settings;


module.exports = function(stream, file, src, url, data, cb){
  ejs.renderFile(file, data, settings, function(err, data){
    if(err){
      utils.err(stream, 'GET', url, 500, 'ejs template render error', err)
      if(cb){cb(err)}
      return;
    }
    utils.render_sort(stream, data, url, cb);
  });
}
