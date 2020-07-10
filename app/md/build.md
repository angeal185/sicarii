# Build

run the following line of code in any file inside your cwd to build sicarii.

```js

require('sicarii/build')();

```

Upon first run and if no config file is found, sicarii will attempt to generate the following.

* `./config` ~ default config directory.
* `./config/config.json` ~ default config file.
* `./config/ip_config.json` ~ default ip whitelist/blacklist file.
* `./render` ~ default render/document directory.
* `./render/index.html` ~ starter html file.
* `./static` ~ default static file directory.
* `./static/css/main.css` ~ starter css file.
* `./static/modules/main.mjs` ~ starter mjs file.
* `./uploads` ~ default upload directory.
* `./logs` ~ default logs directory.
* `./store/cache` ~ default cache write dir.
* `./store/session` ~ default session write dir.
* `./store/store` ~ default store write dir.

this action is sandboxed for security reasons. should you wish to, you can delete the associated build files:

* `/sicarii/build.js`
* `/sicarii/lib/utils/init.js`

```js

const { app } = require('sicarii');

app.del_build()

```