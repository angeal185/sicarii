const xutils = {
  ls: {
    get(i) {
      return JSON.parse(localStorage.getItem(i))
    },
    set(i, e) {
      localStorage.setItem(i, JSON.stringify(e))
      return;
    },
    del(i) {
      localStorage.removeItem(i);
    }
  },
  ss: {
    get(i) {
      return JSON.parse(sessionStorage.getItem(i))
    },
    set(i, e) {
      sessionStorage.setItem(i, JSON.stringify(e))
      return;
    },
    del(i) {
      sessionStorage.removeItem(i);
    }
  },
  url: {
    add(text, type, charset){
      return URL.createObjectURL(xutils.blob(text, type, charset))
    },
    del(item){
      URL.revokeObjectURL(item);
    },
    parse(i){
      return new URL(i)
    }
  },
  cookie: {
    set(name, val, obj) {
      let str = (name + "=" + val + ";")
      Object.keys(obj).forEach(function(x,y){
        str+= x + "=" + y + ";";
      })
      return document.cookie = str;
    },
    get(name){
      name+= "=";
      let ca = document.cookie.split(';');
      for(var i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return false;
    },
    del(name){
      let str = (name + "=;max-age=0;")
      return document.cookie = str;
    }
  },
  parse_params(str){
    str = str.split('?');
    let obj = {
      dest: str[0]
    }
    if(str[1]){
      obj.params = new URLSearchParams(str[1])
    }
    return obj;
  },
  blob(text, type, charset){
    return new Blob([text], {
      type: [type +";"+ charset].join(';')
    })
  },
  download(settings, filename, text, type, charset) {
    if(!type){type = settings.type;}
    if(!charset){charset = settings.charset;}
    let url = xutils.url.add(text, type, charset),
    link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.style.display = 'none';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    setTimeout(function(){
      xutils.url.del(url);
      blob = url = link = null;
    },5000)

  },
  empty(settings, x){
    if(!x){
      x = settings.app_main
    }
    while(x.firstChild){
      x.removeChild(x.firstChild);
    }
  },
  fetch(settings, src, options, cb){
    let cnf = settings.fetch
    if(typeof options === 'function'){
      cb = options;
      options = cnf;
    } else {
      options = Object.assign(cnf, options);
    }

    let headers = {}
    fetch(src, options).then(function(res){
      if (res.status >= 200 && res.status < 300) {
        headers.status = res.status;
        headers.statusText = res.statusText;
        res.headers.forEach(function(x,y){
          headers[y] = x;
        })
        return res.text();
      } else {
        return Promise.reject(new Error(res.statusText))
      }
    }).then(function(data){
      let ctype = headers['content-type'],
      obj = {
        headers: headers,
        body: data
      }

      if (ctype && ctype.includes('application/json')) {
        obj.json = JSON.parse(data)
      }

      cb(false, obj);

      headers = data = null;
    }).catch(function(err){
      cb(err)
    })
  },
  path(src){
    try {
      src = src.split('/');
      let len = src.length,
      fileName = src.pop(),
      base = fileName.split('.');

      return {
        fileName: fileName,
        baseName: base[0],
        ext: base.pop(),
        dirName: src.join('/')
      }
    } catch (err) {
      return null;
    }
  },
  base64: {
    enc(str){
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function(match, p1) {
          return String.fromCharCode('0x' + p1);
      }));
    },
    dec(str) {
      return decodeURIComponent(atob(str).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    }
  },
  hex: {
    enc(str) {
      return Array.from(str).map(c =>
        c.charCodeAt(0) < 128 ? c.charCodeAt(0).toString(16) :
        encodeURIComponent(c).replace(/\%/g,'').toLowerCase()
      ).join('');
    },
    dec(str) {
      return decodeURIComponent('%' + str.match(/.{1,2}/g).join('%'));
    }
  },
  uint8: {
    enc(str){
      return new TextEncoder().encode(str)
    },
    dec(arr){
      return new TextDecoder().decode(arr)
    }
  }
}

export { xutils }
