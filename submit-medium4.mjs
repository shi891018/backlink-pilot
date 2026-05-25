import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// Inspect the full editor structure
const info = p._bb('eval', `(function(){
  var all = Array.from(document.querySelectorAll('[contenteditable]'));
  return all.map(e => ({
    tag: e.tagName,
    ph: e.getAttribute('data-placeholder'),
    id: e.id,
    classes: e.className.substring(0,60),
    text: e.innerText.substring(0,50),
    parentClass: e.parentElement?.className?.substring(0,40)
  }));
})()`);
console.log('Editors:', JSON.stringify(info, null, 2));
