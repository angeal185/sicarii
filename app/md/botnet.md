# Botnet

sicarii has its own built in bot detect and block features

* block unwanted bots from accessing data.
* create targeted seo responses for search engines.

#### bot block

* bot blocking can be configured at `config.bot.block`
* bot user-agent sub-strings can be manually added to `config.bot.block.items`
* `config.bot.block.enabled` will enable blocking of all bot user-agent
  sub-string matches within `config.bot.block.items`

#### bot detect

* bot detection can be configured at `config.bot.detect`
* bot user-agent sub-strings can be manually added to `config.bot.detect.items`


```js

 router.get('/', function(stream, headers, flags){


   if(headers.bot()){
     // render template containing seo data only
     let useragent = headers.ua();

     if(useragent.includes('google')){
       stream.render('index_seo_google.html', {
         data: {
           some: 'google data',
           specifically: 'relating',
           to: 'google seo'
         }
       })
     } else if(useragent.includes('facebook')) {
       stream.render('index_seo_facebook.html', {
         data: {
           some: 'facebook data',
           specifically: 'relating',
           to: 'facebook seo'
         }
       })
     } else {
       stream.render('index_seo_default.html', {
         data: {
           some: 'default data',
           specifically: 'relating',
           to: 'default seo'
         }
       })
     }
   } else {
     // render normal template not polluted with seo
     stream.render('index.html', {title: 'basic'})
   }


 })

```