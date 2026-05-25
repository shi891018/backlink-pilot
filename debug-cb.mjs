import { BbPage } from './src/bb.js';
const p = new BbPage();
const url = p.url();
console.log('Current URL:', url.substring(0,60));

// Get full button + link structure
const structure = p._bb('eval', `(function(){
  var r = {
    url: location.href.substring(0,60),
    h1s: Array.from(document.querySelectorAll('h1,h2,h3')).map(h=>h.textContent.trim()).filter(t=>t).slice(0,5),
    allBtns: Array.from(document.querySelectorAll('button')).map(b=>({text:b.textContent.trim(),cls:b.className.substring(0,50),disabled:b.disabled})).filter(b=>b.text),
    pageText: document.body.innerText.substring(0,200)
  };
  return JSON.stringify(r);
})()`);
console.log('Structure:', structure);
