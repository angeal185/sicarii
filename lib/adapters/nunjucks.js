const njk = require("nunjucks"),
config = require(process.env.config_file),
utils = require('../utils'),
cwd = process.cwd(),
views = cwd + config.render.path,
settings = config.template_engine.nunjucks;

if(settings.jinjacompat){
  njk.installJinjaCompat()
}

let env = njk.configure(views, settings.settings),
filters;

if(settings.filters){
  filters = require(cwd + settings.filters);
  for (let i in filters) {
    if(filters[i] && typeof filters[i] === 'function'){
      env.addFilter(i, filters[i]);
    }
  }
}

if(settings.globals.enabled){
  let vars = settings.globals.vars;
  for (let i in vars) {
    if(vars[i]){
      env.addGlobal(i, vars[i]);
    }
  }
}


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
