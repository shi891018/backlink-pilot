import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://www.crunchbase.com/add-new');
await new Promise(r=>setTimeout(r,5000));

// Click Company
p._bb('eval', `Array.from(document.querySelectorAll('button,a')).find(b=>b.textContent.trim()==='Company')?.click()`);
await new Promise(r=>setTimeout(r,5000));

const url = p.url();
console.log('URL:', url.substring(0,60));

// IMMEDIATELY check all buttons before filling anything
const allBtns = p._bb('eval', `JSON.stringify({
  buttons: Array.from(document.querySelectorAll('button')).map(b=>({text:b.textContent.trim(),cls:b.className.substring(0,60),disabled:b.disabled})).filter(b=>b.text),
  pageH1: document.querySelector('h1,h2')?.textContent?.trim()
})`);
console.log('All buttons on edit page:', allBtns);

// Check for any sticky header
const sticky = p._bb('eval', `(function(){
  var els = Array.from(document.querySelectorAll('[class*=sticky],[class*=header],[class*=toolbar],[class*=action]'));
  return JSON.stringify(els.map(e=>({cls:e.className.substring(0,40), text:e.innerText?.substring(0,100)})).filter(e=>e.text).slice(0,10));
})()`);
console.log('Sticky elements:', sticky);
