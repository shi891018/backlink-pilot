import { BbPage } from './src/bb.js';
const p = new BbPage();

// Deep inspect all clickable elements 
const clickables = p._bb('eval', `(function(){
  // Get ALL elements with click handlers or button-like role
  var els = Array.from(document.querySelectorAll('[class*=save],[class*=submit],[class*=publish],[class*=done],[class*=finish],[mat-raised-button],[mat-flat-button]'));
  var spans = Array.from(document.querySelectorAll('span')).filter(s => /save|submit|publish|done|finish/i.test(s.textContent));
  var divBtns = Array.from(document.querySelectorAll('[role=button]')).filter(d => /save|submit|done/i.test(d.textContent));
  return JSON.stringify({
    saveClassEls: els.map(e=>({tag:e.tagName,cls:e.className.substring(0,50),text:e.textContent.trim().substring(0,30)})),
    saveSpans: spans.map(s=>({text:s.textContent.trim(),cls:s.className.substring(0,40)})).slice(0,5),
    roleBtns: divBtns.map(d=>d.textContent.trim().substring(0,30)),
    totalBtns: document.querySelectorAll('button').length
  });
})()`);
console.log('Clickables:', clickables);

// Look at the actual inner HTML of the header area
const headerHTML = p._bb('eval', `document.querySelector('.header-contents')?.innerHTML?.substring(0,1000)`);
console.log('Header HTML:', headerHTML);
