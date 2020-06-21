const eta = require("eta"),
config = require(process.env.config_file),
cwd = process.cwd(),
utils = require('../utils'),
settings = config.template_engine.eta.settings;

eta.defaultConfig = Object.assign(eta.defaultConfig, settings);

eta.defaultConfig.views =
eta.defaultConfig.root =
cwd + config.render.path;

module.exports = function(stream, file, src, url, data, cb){
  eta.renderFile(file, data, function(err, data){
    if(err){
      utils.err(stream, 'GET', url, 500, 'eta template render error')
      if(cb){cb(err)}
      return;
    }
    utils.render_sort(stream, data, url, cb);
  });
}
