import { BbPage } from './src/bb.js';
const p = new BbPage();
// Click the Login button on ToolScout
await p.goto('https://toolscout.ai');
await new Promise(r=>setTimeout(r,5000));
const loginBtn = p._bb('eval', `(function(){
  var links = Array.from(document.querySelectorAll('a,button'));
  var l = links.find(el => /login|sign in/i.test(el.textContent));
  if(l){ l.click(); return 'clicked: '+l.textContent.trim()+' href:'+(l.href||''); }
  return 'not found. links: '+links.map(el=>el.textContent.trim()).filter(t=>t).join(' | ');
})()`);
console.log('Login btn:', loginBtn);
await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,600)');
console.log('URL:', url);
console.log('Body:', body);
