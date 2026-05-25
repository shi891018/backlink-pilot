import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// Skip plan selection - find "Continue for free" or "Skip" option
const skipped = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('a,button,[role=button]'));
  var skip = btns.find(b => {
    var t = b.textContent.trim().toLowerCase();
    return t.includes('free') || t.includes('skip') || t.includes('later') || t.includes('no thanks');
  });
  if(skip) { skip.click(); return 'clicked: ' + skip.textContent.trim(); }
  return 'options: ' + btns.map(b=>b.textContent.trim().substring(0,30)).filter(t=>t.length>2).join('|');
})()`);
console.log('Skip:', skipped);

await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,300)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,200));
