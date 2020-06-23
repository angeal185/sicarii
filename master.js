const config = require(process.env.config_file),
Logs = require('./lib/utils/logs'),
logs = new Logs(config.logs, config.compression),
{ server, Cache } = require('./lib/server/master'),
Sync = require('./lib/extends/sync'),
sync = new Sync(server, logs);

module.exports = { Cache, server, logs, sync};
