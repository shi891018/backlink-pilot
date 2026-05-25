import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://www.crunchbase.com/login');
await new Promise(r=>setTimeout(r,5000));

const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,600)');
console.log('URL:', url.substring(0,80));
console.log('Body:', body);

const googleBtn = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,a,[role=button]'));
  var g = btns.find(b => /google/i.test(b.textContent) || /google/i.test(b.getAttribute('aria-label')||''));
  return g ? {text: g.textContent.trim(), tag: g.tagName, href: g.href} : {notFound: true, btns: btns.map(b=>b.textContent.trim()).filter(t=>t).slice(0,8)};
})()`);
console.log('Google btn:', JSON.stringify(googleBtn));
