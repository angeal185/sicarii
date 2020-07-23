# Server

Sicarii is built to incorporate  multi-threading by default. you can edit your thread count at `config.cluster.workers`

Although many frameworks wrap the server object within their app, limiting your server actions to those they
wish you to have access to, sicarii does not.
sicarii extends the existing nodejs modules in place, leaving you full access to the nodejs server object.
Most of these extensions can be either disabled, replaced, configured or extended.

sicarii uses the modern nodejs http2 api and does not need or contain any code related to the
http2 Compatibility API.

Below is a 30 second minimal `rest-api`/`static server` example.

```js
const { app, cluster } = require('sicarii');
// app is always called first

if (cluster.isMaster) {

  const { sync, Cache, server, logs } = require('sicarii/master');


  // Cache extentions here ~ if any

  // server extentions here ~ if any

  // logs extentions here ~ if any

  // * spawn workers
  // * synchronize master/worker communication
  // * respawn dead workers
  // * start cache on config.cache.port cache port
  // * automatically handle cache requests
  // * automatically handle log requests

  sync.init().respawn().listen();

} else {

  const { server, router, crypt } = require('sicarii/main');

  // serve static
  router.get('/', function(stream, headers, flags){

    stream.addHeaders({
      header2: 'ok2',
      header3: 'ok3'
    });


    //stream headers and and send static document
    stream.doc('index.html', 'text/html; charset=utf-8');

  });

  // json rest
  router.post('/', function(stream, headers, flags){
    let body = stream.body.json;

    stream.addHeader('x-Static', 'ok');

    // send headers & response
    stream.json({key: 'val'});
  });

  //start worker server at config.port
  server.listen(app.config.port);
}
```

#### server.log_ip()
refer to logs for a detailed explanation

log ip address

```js

/**
 *  @server.log_ip(ip, path)
 *
 *  @param {string} ip ~ ip address to log
 *  @param {string} path ~ path to log
 **/

router.get('/login', function(stream, headers, flags){

  server.log_ip(stream.ip, '/login')

});

```

#### server.log_history()
refer to logs for a detailed explanation

log history

```js

/**
 *  @server.log_history(data)
 *
 *  @param {string} data ~ history data to log
 **/

 router.get('/login', function(stream, headers, flags){

   let his_log = [Date.now(), 'GET', '/login'].join('::::')
   server.log_history(his_log)

 });

```

#### server.log_error()
refer to logs for a detailed explanation

log error

```js

/**
 *  @server.log_error(data)
 *
 *  @param {string} data ~ error data to log
 **/

 router.get('/someerror', function(stream, headers, flags){

   let his_log = [Date.now(), 'GET', '/someerror', '400', 'some message'].join('::::')
   server.log_error(his_log)

 });

```

#### server.pre_cache()
server.pre_cache() will enable you to pre-cache your static files/docs.

* this method can only be called once and upon doing so, it will remove itself
* this method is apart of `sync` although you may have many workers, it will only be called once.
* this method is for static files/docs only, it is not intended for rendered docs
* `config.pre_cache` is the path to your pre_cache config file
* `config.verbose` enabled will log to console the cache status of a streamed file

the configuration file can be configured like so:

```js
/* ./config/pre_cache.json */

{
  "render": [{
    "ctype": "text/html", // file content-type 'only'
    "url": "/index.html"  // file path relative to render path
  }],
  "static": [{
    "ctype": "text/css",
    "url": "/css/main.css" // file path relative to static path
  },{
    "ctype": "application/javascript",
    "url": "/modules/main.mjs"
  }]
}

```

the method can be called like so:

```js
const { app, cluster } = require('sicarii');


if(cluster.isMaster) {

  const { sync } = require('sicarii/master');

  sync.init().respawn().listen();


} else {

  const { server, router } = require('sicarii/main');

  router.get('/', function(stream, headers, flags){

    // stream.doc() static files are located in the render folder
    // this file has been cached
    // [sicarii:GET] /index.html 200 [cache]
    stream.status(200).doc('index.html', 'text/html')

    // stream.render() files are located in the render folder but are not static
    // this has not been rendered/cached properly
    // do not pre-cache rendered files
    stream.status(200).render('index.html', {not: 'cached'})

  });

  // can be optionally called in chain
  // sync will ensure the method is only called by first worker
  server.pre_cache().listen(app.config.port);

}
```

#### server.push_handler()
refer to push handler

server.push_handler() will enable/disable automatic stream push of static files.
* this method takes priority over `config.push_handler.enabled`

```js
const { app, cluster } = require('sicarii');

if(cluster.isMaster) {

  const { sync } = require('sicarii/master');

  sync.init().respawn().listen();

} else {

  const { server, router } = require('sicarii/main');

  router.get('/', function(stream, headers, flags){
    stream.status(200).doc('index.html', 'text/html')
  });

  //enable push_handler manually
  server.pre_cache().push_handler(true).listen(app.config.port);
}

```