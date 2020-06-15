const cwd = process.cwd(),
config = require(cwd + '/config/config'),
utils = require('../utils'),
sep = '::::';

const worker = {
  log_ip: function(ip, path){
    let sep = '::::';
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
      console.error(err)
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
