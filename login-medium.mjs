import { BbPage } from './src/bb.js';
const p = new BbPage();

await p.goto('https://medium.com/m/signin');
await new Promise(r=>setTimeout(r,5000));

// Click Google sign in
const clicked = p._bb('eval', `(function(){
  var links = Array.from(document.querySelectorAll('a'));
  var g = links.find(a => a.textContent.toLowerCase().includes('sign in with google'));
  if(g) { g.click(); return 'clicked: ' + g.href.substring(0,80); }
  return 'not found';
})()`);
console.log('Clicked:', clicked);

await new Promise(r=>setTimeout(r,8000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,300)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,200));
