import { defaults } from './defaults.mjs';
import { xutils } from './xutils.mjs';
import { router, navigate } from './router.mjs';

function Stream(){
  this.settings = defaults
}

Stream.prototype = {
  render(item, data, cb){
   this.settings.render(this, item, data,cb);
   return this;
  },
  renderErr(){
    navigate[this.settings.error]({data:{
      msg: 'render error',
      code: 500
    }}, this);
    return this;
  },
  replace(src, data){
    navigate[src]({data:data}, this, cb);
    return this;
  },
  redirect(src, data){
    router.rout(src, data);
    return this;
  },
  download(filename, text, type, charset){
    xutils.download(this.settings.download, filename, text, type, charset);
    return this
  },
  empty(x){
    xutils.empty(this.settings, x);
    return this
  },
  append(x){
    this.settings.app_main.append(x);
    return this
  },
  fetch(src, options, cb){
    xutils.fetch(this.settings, src, options, cb);
    return this;
  },
  setCookie(key,val,obj){
    xutils.cookie.set(key,val,obj);
    return this;
  },
  getCookie(key){
    return xutils.cookie.get(key);
  },
  delCookie(key){
    xutils.cookie.del(key);
    return this;
  },
  setLs(key,val){
    ls.set(key,val);
    return this;
  },
  getLs(key){
    return ls.get(key);
  },
  delLs(key){
    ls.del(key);
    return this;
  },
  setSs(key,val){
    xutils.ss.set(key,val);
    return this;
  },
  getSs(key){
    return xutils.ss.get(key);
  },
  delSs(key){
    xutils.ss.del(key);
    return this;
  },
  base64: xutils.base64,
  hex: xutils.hex,
  uint8: xutils.uint8,
  path: xutils.path,
  js: JSON.stringify,
  jp: JSON.parse,
  blob: xutils.blob,
  url: xutils.url
}

const stream = new Stream(defaults);

export { stream }
