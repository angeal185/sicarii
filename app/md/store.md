# Store

sicarii has its own built in easily extendable and multi-thread compatible in-memory/flat-file json store.

* the same store is shared over all worker-threads.
* store is built into the Cache object
* store supports auth-token and ip authentication for local or remote access.
* store can be hosted locally or remotely.
* store is initiated with Cache.
* a current timestamp is added to every new store object automatically
* store is accessed via the `app` object
* store is available to the master and worker scopes
* store items must have a unique id


#### store api

* the store api is similar to the session api, with a few extra methods

```js

/**
 *  app.store(method, data, callback)
 *  @param {string} method ~ store data
 *  @param {object|array} data ~ store data compatible with method
 *  @param {function} callback ~ function(err,res)
 **/


let obj = {
  id: app.uuid(),
  user: 'test',
  token: 'secret',
  age 5
}

// add or update a store object with the same id
// a date timestamp is automatically added
// adds object to end of collection
app.store('add', obj, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// unshift or update a store object with the same id
// a date timestamp is automatically added
// adds object to beginning of collection
app.store('unshift', obj, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});


// find a store object
app.store('find', {user: 'test'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// find the index of a store object
// returns -1 for not found
app.store('findIndex', {user: 'test'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// replace or add additional values to a store object
app.store('assign', [{user: 'test'}, {age: 23, token: 'newtoken'}], function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// assign values to each included key of each object in store
app.store('each', {add: 'this', and: 'this', to: 'each'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// delete keys from each object in store
app.store('omit', ['add', 'and', 'to'], function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// return chunked section of store
// app.store('chunk', ['chunk size', 'chunk count'])
app.store('chunk', [2,3], function(err,res){
  if(err){return console.error(err)}
  console.log(res.data.data)
});

// sort store by key and return count amount
// count is optional
app.store('sort', {key: 'id', count: 2}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// delete a store object
app.store('delete', {user: 'test'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// get the first x amount of store objects
app.store('first',  5, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// get the last x amount of store objects
app.store('last',  5, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// return filtered store objects by values greater than
app.store('gt', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return filtered store objects by values less than
app.store('lt', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return filtered store objects by values greater than or equal to
app.store('gte', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return filtered store objects by values less than or equal to
app.store('lte', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return store collection
app.store('val', function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

//add multiple objects at the same time
app.store('concat', [{id: 1}, {id: 2}, {id:3}], function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});


// save store to file at config.store.path
// file write is non blocking
app.store('write', function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// load store into cache from config.store.path
// this action should only be called once
app.store('read', function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

```

#### store extend

the store object can be easily extended via the Cache object to add your own methods like so:

```js

if(cluster.isMaster) {

  const { sync, Cache } = require('sicarii/master');


  // Cache.store_[YOUR METHOD NAME]

  // create function to reset store
  Cache.prototype.store_reset = function(src, obj){
    //src = 'store'
    //obj = data
    this[src] = [];
    return { success: true, msg: 'store reset' }
  }


  // start app
  sync.init().respawn().listen(/* optional callback*/);

  // reset sessions
  app.store('reset', function(err,res){
    if(err){return console.error(err)}
    console.log(res)
    // { success: true, msg: 'store reset' }
  })

}
```