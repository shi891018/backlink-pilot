import { BbPage } from './src/bb.js';
const p = new BbPage();

await p.goto('https://www.reddit.com/login');
await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,300)');
const googleBtn = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,a'));
  var g = btns.find(b => b.textContent.toLowerCase().includes('google') || b.textContent.toLowerCase().includes('continue with'));
  return g ? g.textContent.trim() + ' href:' + (g.href || '') : 'not found: ' + btns.map(b=>b.textContent.trim().substring(0,20)).filter(t=>t.length>2).join('|');
})()`);
console.log('URL:', url.substring(0,80));
console.log('Google btn:', googleBtn);
console.log('Text:', text.substring(0,200));
