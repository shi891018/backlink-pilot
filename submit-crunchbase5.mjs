import { BbPage } from './src/bb.js';
const p = new BbPage();

// There should be a STAY/LEAVE dialog
const url = p.url();
console.log('URL:', url.substring(0,60));

// Click STAY to go back to edit
p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var stay = btns.find(b => b.textContent.trim() === 'STAY');
  if(stay){ stay.click(); return 'clicked STAY'; }
  var leave = btns.find(b => b.textContent.trim() === 'LEAVE');
  if(leave){ console.log('LEAVE found'); }
  return 'btns: '+btns.map(b=>b.textContent.trim()).join(' | ');
})()`);
await new Promise(r=>setTimeout(r,3000));

const url2 = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,300)');
console.log('After STAY URL:', url2.substring(0,60));
console.log('Body:', body);

// Now look for the save button in the edit form - scroll to top
const saveCheck = p._bb('eval', `(function(){
  window.scrollTo(0,0);
  // Check for save button using different selectors
  var possible = Array.from(document.querySelectorAll('button,[type=submit]'));
  var pageTitle = document.querySelector('[class*=page-title],[class*=pageTitle],h1,h2')?.textContent?.trim();
  // Look for the edit form header area
  var editHeader = document.querySelector('[class*=edit-header],[class*=editHeader],[class*=form-header]');
  return JSON.stringify({
    pageTitle,
    editHeaderText: editHeader?.textContent?.trim()?.substring(0,100),
    buttonCount: possible.length,
    btnsWithSave: possible.filter(b=>/save|submit|done|finish/i.test(b.textContent)).map(b=>b.textContent.trim())
  });
})()`);
console.log('Save check:', saveCheck);
