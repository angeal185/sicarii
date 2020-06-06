const pug = require("pug");

const pug_adapter = function(http, config){
  http.ServerResponse.prototype.render = function(src, data, cb){
    data = data || {};
    if(typeof data === 'function'){
      cb = data;
      data = {};
    }
    src = '.' + [config.render.path, src].join('/');
    let settings = config.template_engine.pug.settings;
    settings.basedir = '.'+ config.render.path;
    settings = Object.assign(settings, data)
    return this.end(
      pug.renderFile(src, settings),
      "utf8",
      cb
    )
  }
}

module.exports = pug_adapter;
