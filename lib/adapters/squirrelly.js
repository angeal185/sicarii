const squirrelly = require("squirrelly"),
config = require(process.env.config_file),
cwd = process.cwd(),
utils = require('../utils'),
settings = config.template_engine.squirrelly.settings;

squirrelly.defaultConfig = Object.assign(squirrelly.defaultConfig, settings);

squirrelly.defaultConfig.views =
squirrelly.defaultConfig.root =
cwd + config.render.path;

module.exports = function(stream, file, src, url, data, cb){
  squirrelly.renderFile(file, data, function(err, data){
    if(err){
      utils.err(stream, 'GET', url, 500, 'squirrelly template render error')
      if(cb){cb(err)}
      return;
    }
    utils.render_sort(stream, data, url, cb);
  });
}
