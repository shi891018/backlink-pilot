import { BbPage } from './src/bb.js';

// Should be on OAuth consent page already
const p = new BbPage();
const url = p.url();
console.log('Current URL:', url.substring(0,80));

// Click 次へ (Next) button
const clickResult = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var next = btns.find(b => /次へ|continue|allow|permit|next/i.test(b.textContent));
  if(next){ next.click(); return 'clicked: '+next.textContent.trim(); }
  // Try span/div buttons
  var allBtns = Array.from(document.querySelectorAll('[role=button]'));
  var nb = allBtns.find(b => /次へ|continue|allow|next/i.test(b.textContent));
  if(nb){ nb.click(); return 'clicked role=button: '+nb.textContent.trim(); }
  return 'btns: '+btns.map(b=>b.textContent.trim()).join(' | ');
})()`);
console.log('Click next:', clickResult);

await new Promise(r=>setTimeout(r,8000));
const afterUrl = p.url();
const afterBody = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('After URL:', afterUrl.substring(0,100));
console.log('After body:', afterBody);
