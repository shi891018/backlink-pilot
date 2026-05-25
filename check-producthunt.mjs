import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://www.producthunt.com/signin');
await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('URL:', url.substring(0,80));
console.log('Body:', body);
// Check for Google login option
const googleBtn = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,a'));
  var g = btns.find(b => /google/i.test(b.textContent) || /google/i.test(b.getAttribute('aria-label')||''));
  return g ? 'found: '+g.textContent.trim() : 'no google btn';
})()`);
console.log('Google btn:', googleBtn);
