import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// Click the continue/consent button
const clicked = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,[role=button]'));
  // Look for 次へ (Next) or Continue button
  var next = btns.find(b => {
    var t = b.textContent.trim();
    return t === '次へ' || t === 'Continue' || t === '続行' || t.includes('次へ');
  });
  if(next) { next.click(); return 'clicked: ' + next.textContent.trim(); }
  console.log('buttons:', btns.map(b=>b.textContent.trim()).join('|'));
  return 'not found, btns: ' + btns.map(b=>b.textContent.trim().substring(0,20)).join('|');
})()`);
console.log('Clicked:', clicked);

await new Promise(r=>setTimeout(r,10000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,300));
