const njk = require("nunjucks");

const njk_adapter = function(http, config){
  njk.configure('.' + config.render.path, config.template_engine.nunjucks.settings);

  http.ServerResponse.prototype.render = function(src, data, cb){
    data = data || {};
    if(typeof data === 'function'){
      cb = data;
      data = {};
    }
    
    return this.end(
      njk.render(src, data),
      "utf8",
      cb
    )
  }
}

module.exports = njk_adapter;
