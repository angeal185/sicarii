const fs = require('fs'),
cx = function(x,y){
  console.log('\x1b[92m[\x1b[94msicarii\x1b[92m:\x1b[94m'+x[0]+'\x1b[92m] \x1b['+y+'m'+ x[1] +' \x1b[0m');
}

const init = {
  config: function(){
    config = require('../config');
    let arr = ['config', 'static', 'render'],
    dir = null;
    for (let i = 0; i < arr.length; i++) {
      dir = [process.cwd(),arr[i]].join('/')
      try {
        fs.mkdirSync(dir);
        cx(['init', dir + ' created'],96);
      } catch (err) {
        cx(['init', dir + ' not created'],91);
      }
    }
    dir = '/config/config.json';
    fs.writeFileSync(process.cwd() + '/config/config.json', js(config))
    cx(['init', dir + ' created'],96);
    dir = '/config/ip_config.json';
    fs.writeFileSync(process.cwd() + '/config/ip_config.json', js({blacklist: [],whitelist:[]}))
    cx(['init', dir + ' created'],96);
    process.exit(1)
  },
  build: function(){
    let base_html = '<!DOCTYPE html><html><head><link rel="stylesheet" href="./css/main.css"><script src="./modules/main.mjs" type="module" defer></script></head><body></body></html>',
    base_js = "let str='Sicarii Starter',x=document.createElement('h3');document.title=str;x.textContent=str;document.body.append(x);str=x=null;",
    arr = ['css', 'modules'],
    dir = null;

    for (let i = 0; i < arr.length; i++) {
      dir = [process.cwd(), 'static', arr[i]].join('/')
      try {
        fs.mkdirSync(dir);
        cx(['init', dir + ' created'],96);
      } catch (err) {
        cx(['init', dir + ' not created'],91);
      }
    }

    dir = '/render/index.html';
    fs.writeFileSync(process.cwd() + dir, base_html)
    cx(['init', dir + ' created'],96);

    dir = '/static/modules/main.mjs';
    fs.writeFileSync(process.cwd() + dir, base_js)
    cx(['init', dir + ' created'],96);

    dir = '/static/css/main.css';
    fs.writeFileSync(process.cwd() + dir, '')
    cx(['init', dir + ' created'],96);

    base_html = base_js = arr = dir = null;
  }
}

module.exports = init
