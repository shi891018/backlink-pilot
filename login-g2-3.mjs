import { BbPage } from './src/bb.js';
const p = new BbPage();
console.log('URL:', p.url()?.substring(0,80));

const body = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('Body:', body);

// Find and click the agree/continue button
const clickResult = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,input[type=submit],[type=button]'));
  var agree = btns.find(b => /agree|continue|accept|confirm/i.test(b.textContent||b.value||''));
  if(agree){ agree.click(); return 'clicked: '+agree.textContent; }
  return 'all buttons: '+btns.map(b=>b.textContent||b.value).join(' | ');
})()`);
console.log('Click agree:', clickResult);

await new Promise(r=>setTimeout(r,6000));
const afterUrl = p.url();
const afterBody = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('After URL:', afterUrl.substring(0,80));
console.log('After body:', afterBody.substring(0,300));
