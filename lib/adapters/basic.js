const fs = require('fs'),
config = require(process.env.config_file),
utils = require('../utils');

function str2tpl(str, obj) {
  let parts = str.split(/\$\{(?!\d)[\wæøåÆØÅ]*\}/),
  args = str.match(/[^{\}]+(?=})/g) || [],
  params = args.map(function(argument){
    return obj[argument] || (obj[argument] === undefined ? "" : obj[argument])
  });
  return String.raw({raw: parts}, ...params);
}

module.exports = function(stream, file, src, url, data, cb){
  fs.readFile(file, 'utf8', function(err, content) {
    if(err){
      utils.err(stream, 'GET', url, 404, 'Not Found', err);
      if(cb){cb(err)}
      return;
    }
    content = str2tpl(content, data);
    utils.render_sort(stream, content, url, cb);
  });
}
