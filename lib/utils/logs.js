const fs = require('fs'),
{ app } = require('../../'),
cwd = process.cwd();



function Logs(config, cmp){
  this.config = config;
  this.cmp_ext = cmp[this.config.compression].ext
  this.compression = this.config.compression
  this.path = cwd + this.config.path + '/'

  let item;
  for (let i = 0; i < config.logs.length; i++) {
    item = config.logs[i]
    if(config[item].enabled){
      this[item + '_path'] = [this.path, config[item].base_name, config[item].ext].join('')
    }
    item = null;
  }

}

Logs.prototype = {
  append: function(method, data){
    data = encodeURIComponent(data);
    data += this.config.separator;
    let path = this[method + '_path'];
    console.log(path)
    fs.appendFile(path, data, function(err){
      if(err){return console.error(err)}
      path = null;
    });
  },
  reset: function(dest, cb){
    fs.writeFile(dest,'',function(err){
      if(err){return cb(err)}
      cb(false)
    })
  },
  stat: function(method, cb){
    let src = this[method + '_path'];
    fs.stat(src, function(err, stats) {
       if(err){return cb(err)}
       cb(false, stats)
    });
  },
  backup: function(method,cb){

    let tm = Date.now().toString(),
    src = this[method + '_path'],
    dest = [this.path, this.config[method].base_name, '_', tm, this.config[method].ext, this.cmp_ext].join(''),
    $this = this;
    this.stat(function(err,stats){
      if(err){return cb(err)}
      if(stats.size > $this.config[method].max_size){
        fs.readFile(src, 'utf8', function(err,data){
          if(err){return cb(err)}
          app[$this.compression](data, true, function(err, res){
            if(err){return cb(err)}
            fs.writeFile(dest, res, function(err,data){
              if(err){return cb(err)}
              $this.reset(src, cb)
              tm = src = dest = null;
            })
          })
        })
      } else {
        cb(false)
      }
    })
  }
}

module.exports = Logs;
