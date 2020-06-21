const Twig = require('twig'),
config = require(process.env.config_file),
utils = require('../utils');

module.exports = function(stream, file, src, url, data, cb){
  Twig.renderFile(file, data, function(err, content){
    if(err){
      utils.err(stream, 'GET', url, 500, 'twig template render error')
      if(cb){cb(err)}
      return;
    }
    utils.render_sort(stream, content, url, cb);
  });
}
