import { BbPage } from './src/bb.js';
const p = new BbPage();
// On OAuth consent page - click 次へ
const clickResult = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,[role=button]'));
  var next = btns.find(b => /次へ|continue|allow|next/i.test(b.textContent));
  if(next){ next.click(); return 'clicked: '+next.textContent.trim(); }
  return 'not found. btns: '+btns.map(b=>b.textContent.trim()).join(' | ');
})()`);
console.log('Click next:', clickResult);

await new Promise(r=>setTimeout(r,8000));
const afterUrl = p.url();
const afterBody = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('After URL:', afterUrl.substring(0,80));
console.log('After body:', afterBody);
