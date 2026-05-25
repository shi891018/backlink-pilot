import { BbPage } from './src/bb.js';
const p = new BbPage();

await p.goto('https://medium.com/m/signin');
await new Promise(r=>setTimeout(r,5000));

const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,300)');
const googleHref = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,a'));
  var g = btns.find(b => b.textContent.toLowerCase().includes('sign in with google'));
  return g ? (g.href || g.getAttribute('data-action') || 'no-href class:' + g.className.substring(0,50)) : 'not found';
})()`);
console.log('URL:', url.substring(0,80));
console.log('Google btn:', googleHref);
console.log('Text:', text.substring(0,200));
