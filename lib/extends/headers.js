const utils = require('../utils');

const Extend_headers = function(headers){
  this.headers = headers;
}

Extend_headers.prototype = {
  all: function(){
    return JSON.parse(JSON.stringify(this.headers));
  },
  get: function(i){
    return this.headers[i]
  },
  is: function(i,e){
    return this.headers[i] === e
  },
  has: function(i){
    if(this.headers[i] || this.headers[i] === 0 || this.headers[i] === false){
      return true
    } else {
      return false
    }
  },
  cookies: function(){
    return utils.cookie_decode(this.headers.cookie)
  },
  ctype: function(){
    return this.headers['content-type']
  },
  agent: function(){
    return this.headers['user-agent']
  },
  encoding: function(){
    return utils.trim_arr(this.headers['accept-encoding'].split(','))
  },
  lang: function(){
    return utils.trim_arr(this.headers['accept-language'].split(','))
  },
  accept: function(){
    return utils.trim_arr(this.headers['accept'].split(','))
  },
  size: function(){
    let res = JSON.stringify(this.headers).length
    return res
  },
  count: function(){
    let res = Object.keys(this.headers).length
    return res
  }
}

module.exports = Extend_headers;
