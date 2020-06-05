const fs = require('fs');

function init(){
  config = require('../config');
  let arr = ['config', 'static', 'render'],
  dir = null;
  for (let i = 0; i < arr.length; i++) {
    dir = [process.cwd(),arr[i]].join('/')
    try {
      fs.mkdirSync(dir);
      cc(['init', dir + ' created'],96);
    } catch (err) {
      cc(['init', dir + ' not created'],91);
    }
  }
  dir = '/config/config.json';
  fs.writeFileSync(process.cwd() + '/config/config.json', js(config,0,2))
  cc(['init', dir + ' created'],96);
  dir = '/config/ip_config.json';
  fs.writeFileSync(process.cwd() + '/config/ip_config.json', js({blacklist: [],whitelist:[]}))
  cc(['init', dir + ' created'],96);
  process.exit(1)
}

module.exports = init
