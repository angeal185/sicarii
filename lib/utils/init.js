const fs = require('fs'),
cx = function(x,y){
  console.log('\x1b[92m[\x1b[94msicarii\x1b[92m:\x1b[94m'+x[0]+'\x1b[92m] \x1b['+y+'m'+ x[1] +' \x1b[0m');
},
cwd = process.cwd();

const init = {
  create: function(dir){
    try {
      fs.mkdirSync(dir, {recursive: true});
      cx(['init', dir + ' created'],96);
    } catch (err) {
      cx(['init', dir + ' not created'],91);
    }
  },
  write: function(dir, item){
    fs.writeFileSync(cwd + dir, item)
    cx(['init', dir + ' created'],96);
  },
  config: function(){

    if(fs.existsSync('./config/config.json')){
      process.exit()
    }

    let config = require('../config'),
    arr = ['config', 'static', 'render','uploads', 'logs', 'store/cache', 'store/session', 'store/store'];

    for (let i = 0; i < arr.length; i++) {
      init.create([cwd,arr[i]].join('/'))
    }

    init.write('/config/config.json', JSON.stringify(config));
    init.write('/config/ip_config.json', JSON.stringify({blacklist: [],whitelist:[]}));

  },
  build: function(){
    let base_html = '<!DOCTYPE html><html><head><link rel="stylesheet" href="./css/main.css"><script src="./modules/main.mjs" type="module" defer></script></head><body></body></html>',
    base_js = "let str='Sicarii Starter',x=document.createElement('h3');document.title=str;x.textContent=str;document.body.append(x);str=x=null;",
    arr = ['css', 'modules'];

    for (let i = 0; i < arr.length; i++) {
      init.create([cwd, 'static', arr[i]].join('/'))
    }

    init.write('/render/index.html', base_html);
    init.write('/static/modules/main.mjs', base_js);
    init.write('/static/css/main.css', '');

    base_html = base_js = arr = null;
  }
}

module.exports = init
