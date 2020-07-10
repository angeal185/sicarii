# Ip whitelist

sicarii has its own built in ip whitelist for both master and worker servers

* the ip whitelist can be configured at `config.whitelist` for workers
* the ip whitelist can be configured at `config.cache.whitelist` for the master server
* ip addresses can be manually added to `./config/ip_config.json`
* ip addresses that have not been whitelisted will be denied access to the master/worker servers
* this feature should be enabled for production on the master server

```js

const { app } = require('sicarii');

app.whitelist('some.ip.address')


```