# Logs

sicarii has its own built in extendable logging system

* `config.logs.path` is the logs file dir relative to cwd()
* `config.logs.separator` is the separator used to separate log entries
* `config.logs.error` will enable logging logger errors to console
* `config.logs.compression` the compression type to use for backup of full log files

* all log files have a max size. when reached, the log file is backed up then reset
* all logging is asynchronous and controlled by `sync`
* all logs use fs.appendFile for speed

logging is optionally provided for the following:

#### ip logger
will log all ip addresses to file

* `config.logs.ip.base_name` the base name for the log file
* `config.logs.ip.max_size` the max size for log file before it is backed up and reset
* `config.logs.ip.ext` the filename extension
* `config.logs.ip.log_time` adds additional timestamp to log
* `config.logs.ip.log_path` adds additional path to log
* the ip logger will not log static file streams
* the ip logger will not log streams resulting in an error

ip logger can also be used via server.log_ip() in the worker threads:

```js

router.get('/login', function(stream, headers, flags){

  server.log_ip(stream.ip, '/login')

});

```

#### error logger
will log all errors to file

* `config.logs.error.base_name` the base name for the log file
* `config.logs.error.max_size` the max size for log file before it is backed up and reset
* `config.logs.error.ext` the filename extension

error logger can also be used via server.log_error() in the worker threads:

```js

router.get('/someerror', function(stream, headers, flags){

  let his_log = [Date.now(), 'GET', '/someerror', '400', 'some message'].join('::::')
  server.log_error(his_log)

});

```

#### history logger
will log all visits to file

* `config.logs.history.base_name` the base name for the log file
* `config.logs.history.max_size` the max size for log file before it is backed up and reset
* `config.logs.history.ext` the filename extension
* the history logger will not log static file streams
* the history logger will not log streams resulting in an error

history logger can also be used via server.log_history() in the worker threads:

```js

router.get('/login', function(stream, headers, flags){

  let his_log = [Date.now(), 'GET', '/login'].join('::::')
  server.log_history(his_log)

});

```

#### logs.backup()
logs can be backed up manually via logs.backup()

* this action will compress, backup and reset a log file that exceeds its configured max_size setting

```js
/**
 *  logs.backup(method, callback)
 *  @param {string} method // log method to backup ip|history|error
 *  @param {object} callback // function(err)
 **/

if(cluster.isMaster) {

  const { sync, logs } = require('sicarii/master');

  sync.init().respawn().listen();

  logs.backup('ip', function(err){
    if(err){return cl(err)}
  })

}
```

#### logs.cron()
logs can be backed up automatically via logs.cron()

* this action will call logs.backup for each log file.
* `config.logs.cron` will set the cron interval.
* this action will compress, backup and reset a log file that exceeds its configured `max_size` setting

```js

if(cluster.isMaster) {

  const { sync, logs } = require('sicarii/master');

  sync.init().respawn().listen();

  logs.cron()

}

```