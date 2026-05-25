import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://www.producthunt.com/');
await new Promise(r=>setTimeout(r,5000));

// Click Sign In
p._bb('eval', `Array.from(document.querySelectorAll('a,button')).find(el => /sign in/i.test(el.textContent))?.click()`);
await new Promise(r=>setTimeout(r,4000));

const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('URL:', url.substring(0,80));
console.log('Body:', body);

// Find Google login button
const googleBtn = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,a,[role=button]'));
  var g = btns.find(b => /google/i.test(b.textContent) || /google/i.test(b.getAttribute('aria-label')||''));
  if(g){ g.click(); return 'clicked google: '+g.textContent.trim(); }
  return 'btns: '+btns.map(b=>b.textContent.trim()).filter(t=>t).slice(0,10).join(' | ');
})()`);
console.log('Google login:', googleBtn);

await new Promise(r=>setTimeout(r,6000));
const afterUrl = p.url();
const afterBody = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('After URL:', afterUrl.substring(0,100));
console.log('After body:', afterBody);
