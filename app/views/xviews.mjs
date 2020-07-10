import { x } from '../jsnode/xscript.mjs';
import { xdata } from '../data/xdata.mjs';
import { router } from '../jsnode/jsnode.mjs';

let md = window.markdownit({
  langPrefix:   'language-',
})

const xtpl = {
  home(stream, data){
    let item = x('div',
      x('img', {class: 'img-fluid', src: './app/img/logo.png'})
    )
    return item;
  },
  include(stream, data){
    let doc = new DOMParser().parseFromString(md.render(data.md), "text/html");
    doc.body.classList.add('mt-0');
    return doc.body;
  },
  error(stream, data){
    return x('code', stream.js(data))
  },
  build(app_main){
    let item = x('div',
    x('nav', {class:'navbar fixed-top'},
      x('img',{
        class: 'img-logo',
        src: './app/img/logo_md.png'
      }),
      x('div', {class: 'logo-txt'}, 'SICARII')
    ),
    x('div', {
          class: 'container-fluid'
        },
        x('div', {
            class: 'row'
          },
          x('div', {class: 'col-lg-3'},
            function(){
              let nav_items = xdata.nav_items,
              item = x('div', {class: 'list-group'});

              for (let i = 0; i < nav_items.length; i++) {
                item.append(
                  x('div', {
                      class: 'list-group-item',
                      onclick: function(){
                        window.scrollTo(0, 0);
                        router.rout('/' + nav_items[i], {})
                      }
                    },
                    nav_items[i].replace(/-/g, ' '),
                    x('span', {class: 'icon-chevron-right float-right'})
                  )
                )
              }
              return item;
            }
          ),
          x('div', {class: 'col-lg-9'}, app_main),
          x('div', {
            class: 'totop icon-chevron-up sh-95',
            onclick: function(){
              window.scrollTo(0, 0);
            }
          })
        )
      )
    )

    return item
  }
}

export { xtpl }
