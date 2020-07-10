# Static file server

sicarii has its own built in static file server

* the static file server can be configured at `config.static`
* the static file server will use and cache compressed files if compression is enabled
* `config.static.path` is the static file dir relative to cwd()
* `config.static.blocked` an array of paths to forbid static file server only access
* `config.static.etag` static file server etag options
* `config.static.headers` default headers to use for all static files
* `config.static.cache` enable static file cache

* the static file server will only serve content-types included at `config.mimetypes`