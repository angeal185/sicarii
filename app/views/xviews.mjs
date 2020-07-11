import { x } from '../jsnode/xscript.mjs';
import { xdata } from '../data/xdata.mjs';
import { router } from '../jsnode/jsnode.mjs';

let md = window.markdownit({
  langPrefix:   'language-',
}),
theme_lnk = x('link', {
  href: './app/css/dark.min.css',
  rel:'stylesheet'
}),
theme_clone = null,
theme = {
  dark(i){
    i.title = 'dark mode';
    i.classList.remove('icon-sun');
    i.classList.add('icon-moon');
    theme_clone = theme_lnk.cloneNode(true)
    document.head.append(theme_clone)
  },
  light(i){
    i.title = 'light mode';
    i.classList.remove('icon-moon');
    i.classList.add('icon-sun');
    if(theme_clone){
      theme_clone.remove()
    }
  }
},
theme_ico =  x('div',{
  class: 'theme-ico icon-sun',
  title: 'light theme',
  onclick: function(){
    let stat = parseInt(localStorage.getItem('dark'));
    if(!stat){
      theme.dark(this);
      localStorage.setItem('dark', '1');
    } else {
      theme.light(this);
      localStorage.setItem('dark', '0');
    }
  }
}),
theme_sb = x('div',{class:'theme-sb hide'},
  function(){
    let item = x('div',{class: 'theme-wrap'}),
    cthemes = xdata.code_themes;

    for (let i = 0; i < cthemes.length; i++) {
      item.append(x('div', {
          class: 'list-group-item',
          onclick: function(evt){
            evt = evt.target.textContent;
            localStorage.setItem('code_theme', evt);
            evt = new CustomEvent('code-theme', {detail: evt});
            window.dispatchEvent(evt);
          }
        },
        cthemes[i]
      ))

    }
    return item;
  }
),
bc = x('span', {class: 'bc'},'SICARII'),
bc_tpl = '<span>SICARII <i class="icon-chevron-right fs-12"></i> </span>',
side_block = x('div', {class: 'col-md-3 s-block'},
  function(){
    let nav_items = xdata.nav_items,
    item = x('div', {class: 'list-group'});

    for (let i = 0; i < nav_items.length; i++) {
      item.append(
        x('div', {
            class: 'list-group-item',
            onclick: function(){
              window.scroll({
                top: 0,
                left: 0,
                behavior: 'smooth'
              });
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
main_block = x('div', {class: 'col-md-9'});

if(parseInt(localStorage.getItem('dark'))){
  theme.dark(theme_ico)
}

window.addEventListener('bc-ud', function(evt){
  bc.innerHTML = bc_tpl + evt.detail;
})

function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    let context = this, args = arguments,
    later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    },
    callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow){
      func.apply(context, args);
    }
  }
}

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
    let toTop = x('div', {
      class: 'totop icon-chevron-up sh-95 hidden',
      onclick: function(){
        window.scroll({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }
    }),
    item = x('app-main',
    x('nav', {class:'navbar fixed-top'},
      x('div',{
        class: 'icon-bars',
        onclick: function(){
          if(main_block.classList.contains('col-md-9')){
            main_block.classList.remove('col-md-9')
            main_block.classList.add('col-12')
            side_block.classList.remove('col-md-3')
            side_block.classList.add('hidden')
          } else {
            main_block.classList.remove('col-12')
            main_block.classList.add('col-md-9')
            side_block.classList.remove('hidden')
            side_block.classList.add('col-md-3')
          }
        }
      }),
      x('img',{
        class: 'img-logo',
        src: './app/img/logo_md.png',
        onclick: function(){
          window.open(xdata.github_url)
        }
      }),
      x('div', {class: 'logo-txt'}, 'SICARII'),
      theme_ico,
      x('div',{
        class: 'code-ico icon-code',
        title: 'code theme',
        onclick: function(){
          theme_sb.classList.toggle('hide')
        }
      })
    ),
    x('div', {
          class: 'container-fluid'
        },
        x('div', {
            class: 'row'
          },
          side_block,
          function(){
            main_block.append(app_main);
            return main_block;
          },
          toTop
        )
      ),
      theme_sb,
      x('div',{class: 'b-nav'},
        bc,
        x('div',{
          class: 'icon-rss',
          title: 'atom feed',
          onclick: function(){
            window.open(xdata.atom_url)
          }
        }),
        x('div',{
          class: 'icon-github',
          title: 'view on github',
          onclick: function(){
            window.open(xdata.github_url)
          }
        }),
        x('div',{
          class: 'icon-npm',
          title: 'view on npm',
          onclick: function(){
            window.open(xdata.npm_url)
          }
        })
      )
    )

    window.addEventListener('scroll', debounce(function(evt){
      let top = window.pageYOffset || document.scrollTop
      if(top === NaN || !top){
        toTop.classList.add('hidden')
      } else if(toTop.classList.contains('hidden')){
        toTop.classList.remove('hidden');
      }
      top = null;
      return;
    }, 250))

    return item
  }
}

export { xtpl }
