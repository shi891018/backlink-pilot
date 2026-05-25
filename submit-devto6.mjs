import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// Click the Publish button (confirm dialog may appear)
const publishClicked = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var pub = btns.find(b => b.textContent.trim() === 'Publish');
  if(pub) { pub.click(); return 'clicked Publish'; }
  return 'not found: ' + btns.map(b=>b.textContent.trim().substring(0,20)).join('|');
})()`);
console.log('Publish:', publishClicked);

await new Promise(r=>setTimeout(r,5000));

const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,300));

// Check for confirmation modal or success
const btns = p._bb('eval', `Array.from(document.querySelectorAll('button')).map(b=>b.textContent.trim()).filter(t=>t.length>0).slice(0,10).join('|')`);
console.log('Buttons now:', btns);
