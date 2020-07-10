# Ip blacklist

sicarii has its own built in ip blacklist

* the ip blacklist can be configured at `config.blacklist`
* the ip blacklist is controlled by `sync`
* ip addresses can be manually added to `./config/ip_config.json`
* dynamically adding a blacklist via `app.blacklist` will sync across all worker threads
* ip addresses that have been blacklisted will be denied access globally to all worker servers

```js

/**
 *  app.blicklist(ip)
 *  @param {string} ip // ip address to add to blacklist
 **/

router.get('/', function(stream, headers, flags){

  app.blacklist(stream.ip)

});

```