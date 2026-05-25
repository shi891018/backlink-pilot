import { BbPage } from './src/bb.js';
const p = new BbPage();

await p.goto('https://dev.to/enter');
await new Promise(r=>setTimeout(r,5000));

// Click the Google button
const clicked = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var g = btns.find(b => b.textContent.trim() === 'Continue with Google');
  if(g) { g.click(); return 'clicked'; }
  return 'not found';
})()`);
console.log('Clicked:', clicked);

await new Promise(r=>setTimeout(r,8000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,300)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,200));
