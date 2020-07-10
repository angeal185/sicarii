# Template engines

sicarii has the ability to render, cache and compress templates engine templates.
refer to `stream.render` for further details

* template engines can be configured at `config.template_engine`
* templates are rendered with `stream.render`
* templates use settings from `config.render`
* templates are compresses if compression is enabled
* templates are cached if `config.render.cache` is enabled
* all sicarii template engine adapters are asynchronous.
* automatic error handling is provided for consistency across all engines
* each engines individual error messages are still provided in the callback


```js
/**
 *  stream.render(path, obj, callback)
 *  @param {string} path // file path relative to render dir
 *  @param {object} obj // data for rendered file
 *  @param {function} callback ~ optional
 **/

 //send headers and rendered doc
 stream.render('index.html', {title: 'basic'})

 //or

 // send headers and rendered doc
 stream.render('index.html', {title: 'basic'}, function(err){
   if(err){
     // the stream has ended and automatic error handling has been provided.
     return console.log(err)
   }

   // do something...
 })
```

sicarii currently supports the following engines:

#### default

* default engine, renders html files with javascript template literals included
* the default engine is ideal for single page apps or when you do not require extra features
* the default engine does not require any additional installation

 ```js

 router.get('/', function(stream, headers, flags){

   // send default headers and render index.html
   stream.render('index.html', {title: 'basic'})

 });

 ```

 index.html
 ```html
 <title>${title}</title>

 ```

#### poorboy

* renders html from javascript
* write your templates in plain javascript
* poorboy engine does not require any additional installation
* poorboy can be extended to use html parsing modules
* poorboy can be used to render pre-compiled templates from any other engine
* poorboy is fast

```js

router.get('/', function(stream, headers, flags){

  // send default headers and render index.js
  stream.render('index.js', {
    title: 'poorboy',
    people: ['bob', 'alice']
  })

});

```

basic example

```js
// /render/index.js

module.exports = (data) => `
<html>
  <head>
    <title>${data.title}</title>
  </head>
  <body></body>
</html>
`

```

advanced example

```js
// /render/index.js

const includes = require('./includes'); //cached
module.exports = (data) => `
<html>
  <head>
    ${includes.title(data.title)}
  </head>
  <body>
   ${includes.group(data.people)}
  </body>
</html>
`

```

```js
// /render/includes.js

const includes = module.exports = {
  title: (i) => '<title>'+ i +'</title>',
  li: (i) => '<li>'+ i +'</li>',
  group: (i) => {
    let ul = '<ul>';
    for (let x = 0; x < i.length; x++) {
      ul += includes.li(i[x])
    }
    ul += '</ul>';
    return ul;
  }
}

```

extended example

```js
// /render/index.js
const cheerio = require('cheerio'); // cached
const includes = require('./includes'); //cached

module.exports = (data) => {

  const $ = cheerio.load(includes.body(data.title))

  let test = $('<ul />').attr({id: 'test'})
  $(data.people).each(function(i){
    test.append(includes.li(data.people[i]))
  })

  $('body').append(
    $('<h1 />').text('Hello world'),
    test
  )

  return $.html()

}

```

```js
// /render/includes.js

const includes = module.exports = {
  body: (i) => '<html><head><title>'+ i +'</title></head><body></body></html>',
  li: (i) => '<li>'+ i +'</li>'
}

```

#### nunjucks

* usage of nunjucks requires nunjucks to be pre installed
* do not set nunjucks to cache templates as this will be done by sicarii
* `config.template_engine.nunjucks.filters` is a path to filters file relative to cwd
* `config.template_engine.nunjucks.globals.vars` are added to all renders
* refer to nunjucks documentation for further details

```js

router.get('/', function(stream, headers, flags){
  // send default headers and render index.njk
  stream.render('index.njk', {title: 'nunjucks'})
});

```

index.njk
```html
<title>{{title}}</title>

```

custom filters can be added like so:

```js
/*
"nunjucks": {
  "enabled": true,
  "filters": "/path/to/filters.js"
}
*/


// filters.js
module.exports = {
  shorten: function(str, count) {
    return str.slice(0, count || 1);
  }
}

```


#### liquidjs

* usage of liquidjs requires liquidjs to be pre installed
* do not set liquidjs to cache templates as this will be done by sicarii
* refer to liquidjs documentation for further details

```js

router.get('/', function(stream, headers, flags){

  // send default headers and render index.liquid
  stream.render('index.liquid', {title: 'liquidjs'})

});

```

index.liquid
```html
<title>{{title}}</title>

```

#### squirrelly

* usage of squirrelly requires nunjucks to be pre installed
* do not set squirrelly to cache templates as this will be done by sicarii
* refer to squirrelly documentation for further details

```js

router.get('/', function(stream, headers, flags){

  // send default headers and render index.html
  stream.render('index.html', {title: 'squirrelly'})

});

```

index.html
```html
<title>{{it.title}}</title>

```

#### twig

* usage of twig requires twig to be pre installed
* refer to twig documentation for further details

```js

router.get('/', function(stream, headers, flags){

  // send default headers and render index.twig
  stream.render('index.twig', {title: 'twig'})

});

```

index.twig
```html
<title>{{title}}</title>

```

#### ejs

 * usage of ejs requires ejs to be pre installed
 * do not set ejs to cache templates as this will be done by sicarii
 * refer to ejs documentation for further details

```js

router.get('/', function(stream, headers, flags){

 // send default headers and render index.ejs
 stream.render('index.ejs', {title: 'ejs'})

});

```

index.ejs
```html
<title><%= title %></title>

```

#### ect

 * usage of ect requires ect to be pre installed
 * do not set ect to cache templates as this will be done by sicarii
 * refer to ect documentation for further details

```js

router.get('/', function(stream, headers, flags){

 // send default headers and render index.ect
 stream.render('index.ect', {title: 'ect'})

});

```

index.ect
```html
<title><%= @title %></title>

```

#### eta

 * usage of eta requires eta to be pre installed
 * do not set eta to cache templates as this will be done by sicarii
 * refer to eta documentation for further details

```js

router.get('/', function(stream, headers, flags){

 // send default headers and render index.eta
 stream.render('index.eta', {title: 'eta'})

});

```

index.eta
```html
<title><%= it.title %></title>

```


#### pug

 * usage of pug requires pug to be pre installed
 * do not set pug to cache templates as this will be done by sicarii
 * refer to pug documentation for further details

 ```js

 router.get('/', function(stream, headers, flags){

    // send default headers and render index.pug
   stream.render('index.pug', {title: 'pug'})

 });

 ```

 index.pug
 ```pug
 html
      head
          title #{title}

 ```

#### mustache

* usage of mustache requires mustache to be pre installed
* this async adapter is specific to sicarii
* mustache has 0 dependencies

* refer to mustache documentation for further details

```js

router.get('/', function(stream, headers, flags){
   // send default headers and render index.html with included partial
  stream.status(300).render('index.html', {
    partials: { // include mustache partials in external docs here
      user: '/partial_user.html', // path to partial relative to render dir
      years: '/partial_age.html' // path to partial relative to render dir
    },
    title: 'test title', // template vars
    name: 'jack',
    age: '999'
  })

});

```

index.html
```html
<html>
  <head>
    <title>{{title}}</title>
  </head>
  <body>
    my name is {{#name}}{{> user}}{{/name}}<br>
    i am {{#age}}{{> years}}{{/age}} years old
  </body>
</html>

```

partial_user.html
```html
<strong>{{name}}</strong>
```

partial_age.html
```html
<strong>{{age}}</strong>
```

#### extend
sicarii template engines is easily extendable

* note ~ extra template engines are currently being added to sicarii
* template engines can be added or removed

#### add engine
extra engines can be added using `app.engine.add`:
* `sicarii/lib/adapters` will contain your new engine template.
* `config.template_engine` will automatically be updated with your settings


```js

/**
 *  app.engine.add(title, obj, callback)
 *  @param {string} title // template engine title in snake_case
 *  @param {object} obj // data new engine
 *  @param {function} callback function(err)
 **/

app.engine.add('test', {
  "enabled": false, // must have enabled
  "settings": {
    "use_globals": false,
    "globals":{}
  }
}, function(err){
  if(err){return console.error(err)}
})

```

extra engines can be manually added the following way:

* `sicarii/lib/adapters` contains templates that you can use as a base to adapt any template engine.
* clone one of the template files and rename it
* edit the cloned file to accept your template engine
* add the template engine to `config.template_engine.engines` using the same cloned files name
* duplicate `config.template_engine.default`, rename it, add your settings and enable it.
* the file name must be the same ass `config.template_engine[your_file_name]`
* the adapters you are not using can be deleted and removed from config for production

an example of how easy it is to add a template engine to sicarii:

```js

// /sicarii/lib/adapters/ejs.js

const ejs = require("ejs"),
config = require(process.env.config_file),
utils = require('../utils'),
settings = config.template_engine.ejs.settings;

module.exports = function(stream, file, src, url, data, cb){
  ejs.renderFile(file, data, settings, function(err, data){
    if(err){
      utils.err(stream, 'GET', url, 500, 'ejs template render error')
      if(cb){cb(err)}
      return;
    }
    utils.render_sort(stream, data, url, cb);
  });
}

```

you are simply passing your template engines data through
to `utils.render_sort` in an async way.


#### delete engine
extra engines can be deleted using `app.engine.del`:
* `sicarii/lib/adapters` will have the adapter removed
* `config.template_engine` will automatically remove the engine/s
* this action should be called for production to minimize sicarii's size
* this action cannot be undone.


```js

/**
 *  app.engine.del(items, callback)
 *  @param {array} items // template engine items to remove
 *  @param {function} callback function(err)
 **/

app.engine.del(['pug','twig', 'nunjucks', 'ejs'], function(err){
  if(err){return console.error(err)}
})

```
