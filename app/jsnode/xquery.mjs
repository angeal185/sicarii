const dutil = {
  is_num(i){
    return typeof i === 'number';
  }
}

function Q(){
  this.d = document;
  this.r = null;
}

Q.prototype = {
  id(x){
    this.r = this.d.getElementById(x);
    return this;
  },
  class(x,y){
    let res = this.d.getElementsByClassName(x);
    if(dutil.is_num(y)){res = res[y];}
    this.r = res;
    return this;
  },
  tag(x,y){
    let res = this.d.getElementsByTagName(x);
    if(dutil.is_num(y)){res = res[y];}
    this.r = res;
    return this;
  },
  qs(x){
    this.r = this.d.querySelector(x);
    return this;
  },
  qsa(x,y){
    let res = this.d.querySelectorAll(x);
    if(typeof y === 'number'){res = res[y];}
    this.r = res;
    return this;
  },
  name(x,y){
    let res = this.d.getElementsByName(x);
    if(dutil.is_num(y)){res = res[y];}
    this.r = res;
    return this;
  },
  addClass(){
    this.r.classList.add(...arguments);
    return this;
  },
  rmClass(){
    this.r.classList.remove(...arguments);
    return this;
  },
  tgClass(){
    this.r.classList.toggle(...arguments);
    return this;
  },
  hasClass(x){
    return this.r.classList.contains(x);
  },
  attr(x, y){
    if(y){
      this.r.setAttribute(x,y);
    } else {
      let j = this.r;
      for(let i = 0, keys = Object.keys(x); i < keys.length; i++) {
        j.setAttribute(keys[i], x[keys[i]]);
      }
    }
    return this;
  },
  rmAttr(){
    let args = [...arguments];
    for (let i = 0; i < args.length; i++) {
      this.r.removeAttribute(args[i])
    }
    return this;
  },
  tgAttr(){
    this.r.toggleAttribute(...arguments)
    return this;
  },
  getAttr(x){
    if(typeof x === 'object'){
      let obj = {}
      for (let i = 0; i < x.length; i++) {
        obj[x[i]] = this.r.getAttribute(x[i]);
      }
      return obj;
    }
    return this.r.getAttribute(x);
  },
  child(i){
    let res = this.r.children;
    if(dutil.is_num(i)){res = res[i];}
    this.r = res;
    return this;
  },
  parent(i){
    this.r = this.r.parentNode;
    return this;
  },
  after(){
    this.r.after(...arguments);
    return this;
  },
  before(){
    this.r.before(...arguments);
    return this;
  },
  first(){
    this.r = this.r.firstChild;
    return this;
  },
  last(){
    this.r = this.r.lastChild;
    return this;
  },
  clone(){
    this.r = this.r.cloneNode(...arguments)
    return this;
  },
  append(){
    this.r.append(...arguments)
    return this;
  },
  prepend(){
    this.r.prepend(...arguments)
    return this;
  },
  next(x){
    if(!x){
      this.r = this.r.nextSibling
    } else {
      this.r = this.r.nextElementSibling
    }
    return this;
  },
  prev(x){
    if(!x){
      this.r = this.r.previousSibling
    } else {
      this.r = this.r.previousElementSibling
    }
    return this;
  },
  rm(){
    this.r.remove()
  },
  empty(x){
    if(x){
      this.r.innerHTML = '';
    } else {
      x = this.r;
      while(x.firstChild){
        x.removeChild(x.firstChild);
      }
    }
    return this
  },
  replace(x){
    this.r.replaceWith(x);
    this.r = x;
    return this
  },
  html(x){
    if(x){
      this.r.innerHTML = x;
    } else {
      return this.r.innerHTML;
    }
    return this;
  },
  txt(x){
    if(x){
      this.r.textContent = x;
    } else {
      return this.r.textContent;
    }
    return this;
  },
  each(fn){
    let x = Array.prototype.slice.call(this.r);
    for(let i = 0, keys = Object.keys(x); i < keys.length; i++) {
      fn(x[keys[i]], i);
    }
    return this;
  },
  filter(fn){
    let x = Array.prototype.slice.call(this.r);
    for(let i = 0, keys = Object.keys(x); i < keys.length; i++) {
      if(!fn(x[keys[i]], i)){
        x[i].remove();
      }
    }
    return this;
  },
  eq(x){
    this.r = this.r[x]
    return this
  },
  on(x, fn){
    this.r['on'+ x] = fn;
    return this;
  },
  off(x, fn){
    this.r['on'+ x] = null;
    return this;
  },
  addEvt(x, y, z){
    z = z || false;
    this.r.addEventListener(x,y,z);
    return this;
  },
  rmEvt(x, y, z){
    z = z || false;
    this.r.removeEventListener(x,y,z);
    return this;
  },
  css(x,y){
    if(y){
      this.r.style[x] = y
    } else {
      let j = this.r;
      for(let i = 0, keys = Object.keys(x); i < keys.length; i++) {
        j.style[keys[i]] = x[keys[i]];
      }
    }
    return this;
  },
  click(x){
    this.r.click()
    return this;
  },
  submit(x){
    this.r.submit()
    return this;
  },
  blur(x){
    this.r.blur()
    return this;
  },
  focus(x){
    this.r.focus()
    return this;
  },
  cb(fn){
   fn(this.r);
 },
 set(x){
   this.r = x;
   return this;
 }
}

const q = new Q()

export { q };
