import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// Skip onboarding - there's a "Skip for now" button
const skipped = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,a'));
  var skip = btns.find(b => b.textContent.trim().toLowerCase().includes('skip'));
  if(skip) { skip.click(); return 'skipped: ' + skip.textContent.trim(); }
  return 'no skip button: ' + btns.map(b=>b.textContent.trim().substring(0,20)).join('|');
})()`);
console.log('Skip:', skipped);

await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,200));
