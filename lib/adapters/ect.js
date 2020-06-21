const ECT = require("ect"),
config = require(process.env.config_file),
cwd = process.cwd(),
utils = require('../utils'),
settings = config.template_engine.ect.settings;


settings.root = cwd + config.render.path;

const ect = ECT(settings);

module.exports = function(stream, file, src, url, data, cb){
  console.log(data)
  ect.render(src, data, function(err, data){
    if(err){
      utils.err(stream, 'GET', url, 500, 'ect template render error')
      if(cb){cb(err)}
      return;
    }
    utils.render_sort(stream, data, url, cb);
  });
}
