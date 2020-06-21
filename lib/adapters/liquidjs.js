const { Liquid } = require('liquidjs'),
config = require(process.env.config_file),
utils = require('../utils'),
cwd = process.cwd(),
settings = config.template_engine.liquidjs.settings;


settings.root = cwd + config.render.path + '';

const engine = new Liquid(settings);

module.exports = function(stream, file, src, url, data, cb){
  engine.renderFile(src, data).then(function(content){
    utils.render_sort(stream, content, url, cb);
  }).catch(function(err){
    utils.err(stream, 'GET', url, 500, 'liquid template render error')
    if(cb){cb(err)}
  });
}
