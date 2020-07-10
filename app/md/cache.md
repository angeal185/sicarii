# Cache

sicarii has its own built in easily extendable and multi-thread compatible in-memory cache.

* the same cache is shared over all worker-threads to prevent cache duplication.
* the cache can act as a standalone app for remote usage.
* the cache supports auth-token and ip authentication for local or remote access.
* the cache can be hosted locally or remotely.
* the cache will store compressed streams if either of `gzip/brotli/deflate` are enabled.
* `render/document` cache can be configured at `config.render.cache`
* the `render/static` cache will store headers as well as the document.
* the `render/static` cache will automatically remove items dated past their maxage settings.
* `static` file cache can be configured at `config.render.static`.
* if `config.verbose` is enabled, the cache status of a render/doc/file... will be logged to console.
* the cache module MUST be initiated outside of the worker scope.
* not doing so would would pointlessly spawn multiple instances of the cache.
* one instance of cache shares data with all instances of workers.
* cache has its own `server` object that has been named the same as your apps `server` help to prevent spawning both on the same thread.
* the cache server can be configured at `config.cache`.
* the cache port can be set at `config.cache.port`
* `config.cache.server` accepts all nodejs http2 configuration


#### authentication

the cache server can be authenticated by way of auth-token and/or ip whitelist

* the ip whitelist `config.cache.whitelist` will limit access to the ip addresses in `config.cache.whitelist.ip`
* the ip authtoken `config.cache.authtoken` will require the specified token header and secret upon connection.


#### usage

below is `one` example of a `correct` way and an `incorrect` way to setup cache.
```js

const { app, cluster } = require('sicarii');

if(cluster.isMaster) {

  /* CORRECT! */
  const { sync, Cache, server } = require('sicarii/master');


  // cache extensions here

  // start cache server manually
  server.listen()

  // or

  // start cache server with sync
  sync.init().respawn().listen();


} else {

  const { server, router } = require('sicarii/main');

  /* INCORRECT! */
  const { server } = require('sicarii/master');


  //
  server.listen()
  server.listen(app.config.port)

}

```

#### cache object

the cache has the following collections which are `reserved` for sicarii internal usage.

```js

{
  "render": [], // render/document cache
  "static": [], // static cache
  "session": [], // session cache
  "store": []
}

```

#### cache internal methods

the cache has the following Methods which are `reserved` for sicarii internal usage.
you may use these but should not change them:

```js

/**
 *  @param {string} collection ~ cache collection
 *  @param {object} obj ~ request settings
 **/

// used to add an object within to a collection
Cache.add_cache(collection, obj);
// Cache.add_cache('store', {key: 'val'});

// used to find an object within a collection
Cache.get_cache(collection, obj);

//used to delete an object by index from a collection
Cache.del_cache_index(collection, obj)

//used to reset a collection
Cache.reset_cache(collection)

//used to import a collection
Cache.import_cache(collection, obj)

//used to export a collection to file
Cache.export_cache(collection, obj)

```

#### cache extend

* the cache server does not share the same nodejs method extensions as your app server.


the Cache and server objects can be easily extended to add your own methods like so:

```js

if(cluster.isMaster) {

  const { sync, Cache, server } = require('sicarii/master');

  /* add to the Cache object */

  //return a collection
  Cache.prototype.return_example = function(collection){
    return this[collection];
  }

  //add a new collection
  Cache.prototype.new_collection_example = function(collection, obj){
    this[collection] = obj.new_name;
    return this;
  }

  //add a new object to a collection
  Cache.prototype.new_entry_example = function(collection, obj){
    this[collection].push(obj)
    return this
  }


  /* add to or extend the caches server object */

  //add custom error handler to cache server.
  server.on('error', function(err){
    console.log(err)
  })

  //extend on listening to include extra data.
  server.on('listening', function(err,res){
    console.log('i am the caches server')
  })

  // all extensions should be added prior to starting server
  // server.listen / sync.listen will create the new Cache() object
  //server.listen()

  sync.init().respawn().listen(/* optional callback*/);

}


```

#### cache api
the cache can be accessed via either or both of the server/browser depending on your settings.

```js

/* api object */

let cache_obj = {
  method: 'val', //the cache method to use
  src: 'static', // the collection name
  data: {
    //the data object with settings/data specific to the method if any.
  }
}
```

#### cache http2 client request using app.fetch

```js
/* app.fetch example */


let head = {
  'url': app.config.cache.url, //dest url
  ':method': 'POST', // fetch method
  ':path': '/', // fetch path
  'Content-Type': 'application/json',
  'X-Auth-Token': 'secret',
  'body':  JSON.stringify(cache_obj)// fetch body for accepted methods
}

app.fetch(head, function(err,res){
  if(err){return console.error(err)}
  console.log(res.json)
})

```

#### cache http2 client request

```js

/* server example */

const http2 = require('http2');

let options = app.set_cert();

options = Object.assign(options, app.config.server);

client = http2.connect(app.config.cache.url, options),
head = {
  ':method': 'POST',
  ':path': '/',
  'Content-Type': 'application/json',
  'X-Auth-Token': 'secret'
},
stream = client.request(head),
body = '';

stream.setEncoding('utf8');

stream.on('response', function(headers){
  console.log(headers)
});

stream.on('data', function(chunk){
  body += chunk;
});

stream.on('end', function(data){
  // parse and log result
  console.log(JSON.parse(body));
});

// send api object
stream.end(JSON.stringify(cache_obj), 'utf8');

```

#### cache Browser fetch request

```js
/* browser example */

fetch('https://localhost:5000/',{
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'Sec-Fetch-mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'X-Auth-Token': 'secret'
  },
  body: JSON.stringify(cache_obj)
})
.then(function(res){
  res.json().then(function(data){
    console.log(data)
  })
})
.catch(function(err){
  console.log(err)
})
```
