import { x, xrender } from './xscript.mjs';
import { xtpl } from '../views/xviews.mjs';
import { xdata } from '../data/xdata.mjs';

let app_main = x('div');

// app defaults
let defaults = {
  version: '1.0.0', // don't delete me
  origin: 'http://localhost:8000',
  params: true,
  error: '/error',
  base_path: '/home',
  base_data: {
    msg: 'The zero dependency http2 nodejs multithreading framework'
  },
  each: {
    before: function(dest) {
      // return false;  cancel rout
      return true // continue to rout
    },
    after: function(dest) {
      
    }
  },
  storage: {
    max_age: 9999999999,
    prefix: 'rt'
  },
  stream: {
    download: {
      type: 'text/plain',
      charset: 'utf-8'
    },
    fetch: {
      method: 'GET',
      headers: {
        'Content-Type': 'text/markdown'
      }
    }
  },
  app_main: app_main,
  init: function(){

    let loader = x('div',{class: 'loader'},
      x('div',{id: 'loader-1'},
        x('span'),x('span'),x('span'),x('span'),x('span')
      )
    ),
    code_theme_lnk = x('link', {
      rel:'stylesheet'
    }),
    code_theme = localStorage.getItem('code_theme');


    if(!code_theme){
      code_theme_lnk.href = './app/css/code/'+ xdata.default_code_theme +'.css';
    } else {
      code_theme_lnk.href = './app/css/code/'+ code_theme +'.css';
    }

    document.head.append(code_theme_lnk);

    window.addEventListener('code-theme', function(evt){
      code_theme_lnk.href = './app/css/code/'+ evt.detail +'.css';
    })

    document.body.append(loader,xtpl['build'](app_main));

    setTimeout(function(){
      loader.style.opacity = 0;
      setTimeout(function(){

        loader.remove();
        loader = document.scripts;
        while(loader.length) {
          loader[0].remove();
        }
        loader = null;
      },1000)
    },2000)

    return this;
  },
  render: function(stream, path, data, cb){
    xrender(stream, xtpl[path], data, xdata[path], cb);
    return this;
  }
}

export { defaults, app_main }
