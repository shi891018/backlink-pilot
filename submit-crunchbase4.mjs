import { BbPage } from './src/bb.js';
const p = new BbPage();

// Go back to main company edit
p._bb('eval', `history.back()`);
await new Promise(r=>setTimeout(r,4000));

const url = p.url();
console.log('URL:', url.substring(0,60));

// Scroll to top and look for save button
const topBtns = p._bb('eval', `(function(){
  window.scrollTo(0, 0);
  // Look for sticky/fixed save button
  var allEls = Array.from(document.querySelectorAll('[class*=save],[class*=Save],button[class*=primary]'));
  var btns = Array.from(document.querySelectorAll('button'));
  // Get text of first/last few buttons
  return JSON.stringify({
    matchedSave: allEls.map(e=>e.textContent.trim().substring(0,30)),
    allBtnsText: btns.map(b=>({text:b.textContent.trim(),cls:b.className.substring(0,40)})).filter(b=>b.text).slice(0,20)
  });
})()`);
console.log('Top btns:', topBtns);

// Check the nav/header for save
const header = p._bb('eval', `document.querySelector('[class*=header],[class*=toolbar],[class*=sticky]')?.innerText?.substring(0,300)`);
console.log('Header:', header);
