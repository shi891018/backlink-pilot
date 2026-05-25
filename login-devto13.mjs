import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// Check all visible buttons including hidden/skip ones
const info = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,a[href]'));
  return btns.map(b => ({
    text: b.textContent.trim().substring(0,40),
    href: b.href ? b.href.substring(0,60) : '',
    class: b.className.substring(0,50)
  })).filter(b => b.text.length > 0).slice(0,20);
})()`);
console.log('All btns:', JSON.stringify(info, null, 2));
