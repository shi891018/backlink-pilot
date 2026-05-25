import { BbPage } from './src/bb.js';
const p = new BbPage();
// Should be on alternativeto auth page
const url = p.url();
console.log('Current URL:', url.substring(0,80));
const body = p._bb('eval', 'document.body.innerText.substring(0,300)');
console.log('Body:', body);

// Click Continue with Google
const clickResult = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,a,[role=button]'));
  var g = btns.find(b => /continue with google/i.test(b.textContent));
  if(g){ g.click(); return 'clicked: '+g.textContent.trim(); }
  return 'not found. btns: '+btns.map(b=>b.textContent.trim()).filter(t=>t).join(' | ');
})()`);
console.log('Google click:', clickResult);

await new Promise(r=>setTimeout(r,8000));
const afterUrl = p.url();
const afterBody = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('After URL:', afterUrl.substring(0,80));
console.log('After body:', afterBody);
