import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));
// Click account link
const clicked = p._bb('eval', `(function(){
  var links = Array.from(document.querySelectorAll('[role=link]'));
  var acc = links.find(l => l.textContent.includes('shijm1989'));
  if(acc) { acc.click(); return 'clicked account'; }
  return 'not found: ' + links.map(l=>l.textContent.trim().substring(0,30)).join('|');
})()`);
console.log('Clicked:', clicked);

await new Promise(r=>setTimeout(r,8000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,300)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,200));
