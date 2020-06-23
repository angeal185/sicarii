const config = require(process.env.config_file),
cluster = require('cluster'),
utils = require('./'),
sep = '::::';

const worker = {
  log_ip: function(ip, path){
    try {
      let data = ip + ':' + Date.now();
      if(config.logs.ip.log_time){
        ip += (sep + Date.now());
      }
      if(config.logs.ip.log_path){
        ip += (sep + path);
      }
      ip = {
        type: 'log',
        method: 'append',
        item: 'ip',
        data: ip
      }

      process.send(ip)
    } catch (err) {
      if(config.logs.console_error){
        console.error(err)
      }
    }

  },
  log_history: function(data){
    try {
      let hist = {
        type: 'log',
        method: 'append',
        item: 'history',
        data: data
      }

      process.send(hist)
    } catch (err) {
      if(config.logs.console_error){
        console.error(err)
      }
    }

  },
  log_error: function(data){
    try {
      let res = {
        type: 'log',
        method: 'append',
        item: 'error',
        data: data
      }
      process.send(res)
    } catch (err) {
      if(config.logs.console_error){
        console.error(err)
      }
    }

  }
}

const master = {
  syncHandler: function(obj, logs){
    if(obj.type === 'ticket_request'){
      cluster.workers[obj.id].send({type: 'ticket_request', data: process.env.TicketKeys})
    } else if(obj.type === 'log'){
      master.logs_handler(logs, obj)
    } else if(obj.type === 'blacklist' || obj.type === 'whitelist'){
      for (const id in cluster.workers) {
        if(cluster.workers[id]){
          cluster.workers[id].send(obj);
        }
      }
    } else if(obj.type === 'pre_cache'){
      if(!process.env.pre_cached){
        process.env.pre_cached = true;
        for (const id in cluster.workers) {
          if(cluster.workers[id]){
            cluster.workers[id].send({type: 'pre_cache'});
            break;
          }
        }
      }
    }
  },
  init: function(obj, logs){
    if(obj){
      obj = Object.assign(config.cluster.settings, obj)
    } else {
      obj = config.cluster.settings;
    }
    cluster.setupMaster(obj);
    for (let i = 0; i < config.cluster.workers; i++) {
      cluster.fork().on('message', function(msg){
        master.syncHandler(msg,logs);
      });
    }
    utils.cc(['sync', 'Syncing '+ Object.keys(cluster.workers).length + ' workers with master...'],96);
  },
  respawn: function(logs){
    cluster.on('exit', function(worker, code, signal) {
      let msg = '[pid]:' + worker.process.pid +' dead [code]:' + code +' [sig]:'+ signal
      utils.cc(['sync', msg+=' Respawning...'],96);
      cluster.fork().on('message', function(msg){
        master.syncHandler(msg,logs);
      });
    });

    utils.cc(['sync', ['Respawn watching', config.cluster.workers, 'workers...'].join(' ')],96);
  },
  logs_handler: function(logs, obj){
    logs[obj.method](obj.item, obj.data);
  },
  kill: function(id){
    cluster.workers[id].process.kill();
  },
  kill_all: function(){
    for (let id in cluster.workers) {
      if(id){
        cluster.workers[id].process.kill();
      }
    }
  }
}

module.exports = { worker, master };
