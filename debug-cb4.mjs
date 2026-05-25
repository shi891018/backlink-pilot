import { BbPage } from './src/bb.js';
const p = new BbPage();

// Should be on crunchbase.com/edit
console.log('URL:', p.url()?.substring(0,60));

// Fill just the Name field first (mat-input-0)
const fillName = p._bb('eval', `(function(){
  var el = document.getElementById('mat-input-0');
  if(!el) return 'mat-input-0 not found. total inputs: '+document.querySelectorAll('input').length;
  var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, 'Unit Converter for Science');
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
  el.dispatchEvent(new Event('blur', {bubbles:true}));
  return 'filled: '+el.value;
})()`);
console.log('Name fill:', fillName);

await new Promise(r=>setTimeout(r,2000));

// Check if any save/save-draft button appeared
const btnsAfter = p._bb('eval', `JSON.stringify(Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.trim() && !/Resources|Talk With Sales|Advanced Search|Dashboard|Log Out|Create New|Do Not|New/.test(b.textContent.trim())).map(b=>({text:b.textContent.trim(),disabled:b.disabled})))`);
console.log('New buttons after name fill:', btnsAfter);

// Also check for any validation message
const validation = p._bb('eval', `document.querySelector('[class*=error],[class*=required],[class*=invalid],[class*=warning]')?.textContent?.trim()`);
console.log('Validation msg:', validation);

// Look at full body text to find save button
const body = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('Body preview:', body);
