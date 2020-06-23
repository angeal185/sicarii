const { master } = require('../utils/sync_utils'),
config = require(process.env.config_file);

function Sync(server, logs){
  this.server = server;
  this.logs = logs;
}

Sync.prototype = {
  init: function(obj){
    master.init(obj, this.logs)
    return this;
  },
  respawn: function(){
    if(config.sync.respawn){
      master.respawn(this.logs)
    }
    return this;
  },
  listen: function(cb){
    this.server.listen(config.cache.port, cb)
  },
  kill: function(id){
    master.kill(id);
    return this;
  },
  kill_all: function(){
    master.kill_all();
    return this;
  }
}

module.exports = Sync
