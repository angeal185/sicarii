# Auth-token

sicarii has its own built in header auth-token authentication for both master and worker servers

* the auth-token can be configured at `config.authtoken` for workers
* the auth-token can be configured at `config.cache.authtoken` for the master server
* streams that do not have the correct auth-token header will be denied access to the master/worker servers
* this feature should be enabled for production on the master server