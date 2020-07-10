# Sessions

sicarii has its own built in easily extendable and multi-thread compatible in-memory session store.

* the same sessions are shared over all worker-threads.
* sessions is built into the Cache object
* sessions supports auth-token and ip authentication for local or remote access.
* sessions can be hosted locally or remotely.
* sessions is initiated with Cache.
* a current timestamp is added to every new session object automatically
* sessions are accessed via the `app` object
* sessions are available to the master and worker scopes
* session items must have an unique id


#### session api

* the session api is similar to the store api, with a few exclusions

```js

/**
 *  app.session(method, data, callback)
 *  @param {string} method ~ session data
 *  @param {object} data ~ session data
 *  @param {function} callback ~ function(err,res)
 **/


let obj = {
  id: app.uuid(),
  user: 'test',
  token: 'secret',
  age 5
}

// add or update a session object with the same id
// a date timestamp is automatically added
// adds object to end of collection
app.session('add', obj, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// unshift or update a session object with the same id
// a date timestamp is automatically added
// adds object to beginning of collection
app.session('unshift', obj, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});


// find a session object or automatically delete expired session
app.session('find', {user: 'test'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// find the index of a session object
// returns -1 for not found
app.session('findIndex', {user: 'test'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// replace or add additional values to a session object
app.session('assign', [{user: 'test'}, {age: 23, token: 'newtoken'}], function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// assign values to each included key of each object in sessions
app.session('each', {add: 'this', and: 'this', to: 'each'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// delete keys from each object in sessions
app.session('omit', ['add', 'and', 'to'], function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// return chunked section of session
// app.session('chunk', ['chunk size', 'chunk count'])
app.session('chunk', [2,3], function(err,res){
  if(err){return console.error(err)}
  console.log(res.data.data)
});

// sort session by key and return count amount
// count is optional
app.session('sort', {key: 'id', count: 2}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// delete a session object
app.session('delete', {user: 'test'}, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// get the first x amount of sessions
app.session('first',  5, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// get the last x amount of sessions
app.session('last',  5, function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// return filterd sessions by values greater than
app.session('gt', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return filterd sessions by values less than
app.session('lt', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return filtered sessions by values greater than or equal to
app.session('gte', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return filterd sessions by values less than or equal to
app.session('lte', {age: 4}, function(err,res){
  if(err){return console.error(err)}
  console.log(res.data)
});

// return session collection
app.session('val', function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

// remove all expired sessions
app.session('check', function(err,res){
  if(err){return console.error(err)}
  console.log(res)
});

```


#### session extend

sessions can be easily extended via the Cache object to add your own methods like so:

```js

if(cluster.isMaster) {

  const { sync, Cache } = require('sicarii/master');


  // Cache.store_[YOUR METHOD NAME]

  // create function to reset sessions
  Cache.prototype.store_reset = function(collection, obj){
    this[collection] = [];
    return { success: true, msg: 'sessions reset' }
  }


  // start app
  sync.init().respawn().listen(/* optional callback*/);

  // reset sessions
  app.session('reset', function(err,res){
    if(err){return console.error(err)}
    console.log(res)
    // { success: true, msg: 'sessions reset' }
  })

}
```