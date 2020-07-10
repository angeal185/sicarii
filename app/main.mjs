import { router, x } from './jsnode/jsnode.mjs';
import { xdata } from './data/xdata.mjs';

let nav_items = xdata.nav_items;
window.docStore = {}

for (let i = 0; i < nav_items.length; i++) {

  router.on('/'+ nav_items[i], function(request, stream) {

    let doc = window.docStore[nav_items[i]];

    if(doc){
      stream.render('include', doc, function(err){
        if(err){return stream.renderErr();}
        document.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightBlock(block);
        });
      })
    } else {
      stream.fetch('./app/md/'+ nav_items[i] +'.md',function(err, data){
        if(err){return console.error(err)}
        data = {item: nav_items[i], md: data.body};
        window.docStore[nav_items[i]] = data;
        stream.render('include', data, function(err){
          if(err){return stream.renderErr();}
          document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
          });
        })
      })
    }
  })
}

router.on('/home', function(request, stream) {

  stream.render('home', function(err){
    if(err){
      stream.renderErr();
      return;
    }
  })

})
.on('/error', function(request, stream) {
  stream.render('error', request.data, function(err){
    if(err){return console.error(err)}
  })

})

.init().listen().validate();
