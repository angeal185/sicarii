const config = require(process.env.config_file),
utils = require('../utils'),
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
  respawn: function(cluster, logs){
    cluster.on('exit', function(worker, code, signal) {
      let msg = '[pid]:' + worker.process.pid +' dead [code]:' + code +' [sig]:'+ signal
      utils.cc(['sync', msg+=' Respawning...'],96);
      cluster.fork();
    });

    utils.cc(['sync', ['Respawn watching', config.cluster.workers, 'workers...'].join(' ')],96);
  },
  logs_handler: function(logs, obj){
    logs[obj.method](obj.item, obj.data);
  }

}

module.exports = { worker, master };
