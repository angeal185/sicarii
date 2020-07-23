# Backwards compatibility

http2 is supported as far back as the now `obsolete` internet explorer 11 so most people should not
need to worry about Backwards compatibility.
sicarii does however support Backwards compatibility, should you have any need for requiring it.

* `config.server.allowHTTP1` will enable/disable Backwards compatibility.
* the server `stream` event is reserved for http2, but the server `request` event is not and will not
  ever be required by sicarii.
* the server `stream` event will always ignore all non http2 requests.
* the `request` event will enable you to accept http1 requests using the nodejs http compatibility layer.  
* sicarii `stream` methods are not supported when using the http2 compatibility layer.
* the `request` event is limited to methods in the nodejs http compatibility api but can be manually
  extended to mimic most of the `stream` events.  

```js


const { app, cluster } = require('sicarii');

if(cluster.isMaster) {

  const { sync } = require('sicarii/master');

  sync.init().respawn().listen();

} else {

  const { server, router, crypt } = require('sicarii/main');

  server.on('request', function (req, res) {
    if(req.httpVersion !== '2.0'){ // version check is mandatory
      // do something
      console.log('i am a http1 connection!')

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(app.js({test: 'ok'});

    }
  })

  router.get('/', function(stream, headers, flags){

    console.log('i am a http2 connection!')
    stream.status(200).render('index.html', {
      title: 'http2 connection'
    })

  });



  server.pre_cache().push_handler(true).listen(app.config.port);

}

```