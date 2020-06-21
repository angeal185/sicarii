const njk = require("nunjucks"),
config = require(process.env.config_file),
utils = require('../utils');

njk.configure('.' + config.render.path, config.template_engine.nunjucks.settings);

module.exports = function(stream, file, src, url, data, cb){
  njk.render(src, data, function(err, data){
    if(err){
      utils.err(stream, 'GET', url, 500, 'njk template render error')
      if(cb){cb(err)}
      return;
    }
    utils.render_sort(stream, data, url, cb);
  });
}
