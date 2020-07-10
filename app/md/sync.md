# Sync

the sync object is is used to control and synchronize events between master/server

* sync is optionally responsible for all tasks related to the cluster module
* sync will automatically handle spawning of new worker threads
* sync will automatically handle respawning of crashed worker threads
* sync will automatically handle inter-process messaging across all processes
* sync will automatically initialize Cache and start the cache server
* sync will handle inter-process ip/history/error logging
* sync is a part of the master scope


#### sync.init()


```js

/**
 *  sync.listen(settings)
 *  @param {object} settings // optional worker settings overrides to config.cluster.settings
 **/

if (cluster.isMaster) {
  const { sync } = require('sicarii/master');

  // * spawn workers
  // * synchronize master/worker communication
  sync.init();
}
```

#### sync.respawn()

```js
if (cluster.isMaster) {
  const { sync } = require('sicarii/master');

  // * respawn dead workers
  sync.respawn()

  // or
  sync.init().respawn()
}
```

#### sync.listen()

```js
/**
 *  sync.listen(callback)
 *  @param {function} callback // optional callback
 **/

if (cluster.isMaster) {
  const { sync } = require('sicarii/master');

  // * start cache on config.cache.port cache port
  sync.listen()

  // or
  sync.init().respawn().listen()
}
```

#### sync.kill()

```js
/**
 *  sync.kill(id)
 *  @param {number} id // id of the worker to kill
 **/

if (cluster.isMaster) {
  const { sync } = require('sicarii/master');

  sync.init().respawn().listen()

  // kill worker with id 1 then worker with id 2
  // with sync.respawn() active these workers will be respawned
  setTimeout(function(){
    sync.kill(1).kill(2)
  },5000)
}
```

#### sync.kill_all()

```js
if (cluster.isMaster) {
  const { sync } = require('sicarii/master');

  sync.init().respawn().listen()

  // kill all workers
  // with sync.respawn() active these workers will be respawned
  setTimeout(function(){
    sync.kill_all(1)
  },5000)
}
```