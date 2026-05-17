import { BbPage } from './src/bb.js';

const p = new BbPage();

// Close all popups
p._bb('eval', `(function(){
  // Click "No" on notification popup
  var btns = Array.from(document.querySelectorAll('button'));
  var noBtn = btns.find(b => b.textContent.trim() === 'No');
  if(noBtn) { noBtn.click(); console.log('clicked No'); }
})()`);
await new Promise(r => setTimeout(r, 500));

// Accept cookies
p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var acceptBtn = btns.find(b => b.textContent.trim() === 'Accept All');
  if(acceptBtn) { acceptBtn.click(); }
})()`);
await new Promise(r => setTimeout(r, 1000));

// Check current state of fields
const name = p._bb('eval', `(function(){ var el = document.querySelector('[name="name-1"]'); return el ? el.value : 'not found'; })()`);
const cat = p._bb('eval', `(function(){ var el = document.querySelector('[name="select-1"]'); return el ? el.value : 'not found'; })()`);
console.log('Name:', name, '| Category:', cat);

// Make sure category is set properly using the native select
p._bb('eval', `(function(){
  var sel = document.querySelector('[name="select-1"]');
  if(sel) {
    // Find Education-Assistant option
    var opt = Array.from(sel.options).find(o => o.value === 'Education-Assistant');
    if(opt) {
      sel.value = 'Education-Assistant';
      sel.dispatchEvent(new Event('change', {bubbles:true}));
    }
  }
  var sel2 = document.querySelector('[name="select-2"]');
  if(sel2) {
    // Find Free option (value=43)
    sel2.value = '43';
    sel2.dispatchEvent(new Event('change', {bubbles:true}));
  }
})()`);
await new Promise(r => setTimeout(r, 500));

await p.screenshot('screenshots/aihunter-retry.png');
console.log('Retrying submit...');

// Click submit
const snap = await p.snapshot();
const submitLine = snap.split('\n').find(l => l.includes('Submit Your AI Tool'));
console.log('Submit button:', submitLine);
p._bb('click', '@28');
await new Promise(r => setTimeout(r, 5000));

const body = p._bb('eval', '(function(){ return document.body.innerText.substring(0,600); })()');
console.log('Result body:', body.substring(0, 400));
await p.screenshot('screenshots/aihunter-retry-result.png');
