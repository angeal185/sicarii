const pug = require("pug"),
config = require(process.env.config_file),
utils = require('../utils');

module.exports = function(stream, file, src, url, data, cb){

  let settings = config.template_engine.pug.settings;
  settings.basedir = '.'+ config.render.path;
  settings = Object.assign(settings, data);

  pug.renderFile(file, settings, function(err, data){
    if(err){
      utils.err(stream, 'GET', url, 500, 'pug template render error', err);
      if(cb){cb(err)}
      return;
    }
    utils.render_sort(stream, data, url, cb);
  });
}
