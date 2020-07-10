let workers = {
  web:{},
  service:{}
}

const worker = {
  start(src, fn, er){
    
    new Worker(src).on('message', fn).on('error', er)

  },
  kill(){

  }
}

export { worker }
