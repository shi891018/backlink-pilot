import { BbPage } from './src/bb.js';
const p = new BbPage();
console.log('URL:', p.url()?.substring(0,60));

function fillMat(id, value) {
  return p._bb('eval', `(function(){
    var el = document.getElementById('${id}');
    if(!el) return 'not found: ${id}';
    var P = el.tagName==='TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(P,'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el.dispatchEvent(new Event('blur',{bubbles:true}));
    return 'ok:'+el.value.substring(0,30);
  })()`);
}

// Fill required fields
console.log('Name:', fillMat('mat-input-0', 'Unit Converter for Science'));
await new Promise(r=>setTimeout(r,500));
console.log('Desc:', fillMat('mat-input-1', 'Online unit converter for scientists and engineers'));
await new Promise(r=>setTimeout(r,500));
console.log('Website:', fillMat('mat-input-6', 'https://www.unitconv.top'));  // wait- index might differ
await new Promise(r=>setTimeout(r,500));

// Check all mat-input IDs and what we see on the page
const allIds = p._bb('eval', `JSON.stringify(Array.from(document.querySelectorAll('[id^=mat-input]')).map(el=>({id:el.id,ph:el.placeholder,val:el.value,tag:el.tagName})))`);
console.log('All mat-inputs:', allIds);

await new Promise(r=>setTimeout(r,1000));

// Check if save button is now enabled
const saveState = p._bb('eval', `(function(){
  var btn = document.querySelector('[data-heap-save-edits-button]');
  return JSON.stringify({disabled: btn?.disabled, hasDisabledClass: btn?.classList?.contains('mat-mdc-button-disabled'), text: btn?.getAttribute('aria-label')});
})()`);
console.log('Save button state:', saveState);
