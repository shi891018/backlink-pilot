import { BbPage } from './src/bb.js';
const p = new BbPage();
console.log('URL:', p.url()?.substring(0,60));

// Verify save button is still enabled
const saveState = p._bb('eval', `(function(){
  var btn = document.querySelector('[data-heap-save-edits-button]');
  return {disabled: btn?.disabled, val: document.getElementById('mat-input-0')?.value};
})()`);
console.log('Save state:', saveState);

// Fill optional fields for better quality profile
function fillMat(id, value) {
  return p._bb('eval', `(function(){
    var el = document.getElementById('${id}');
    if(!el) return 'nf';
    var P = el.tagName==='TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(P,'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el.dispatchEvent(new Event('blur',{bubbles:true}));
    return 'ok';
  })()`);
}

// mat-input-10 = Contact Email (textarea)
// mat-input-12 = Full Description (textarea)  
fillMat('mat-input-10', 'hi@unitconv.top');
fillMat('mat-input-12', 'Unit Converter for Science is a free online tool supporting 200+ unit types across physics, chemistry, astronomy, engineering, and everyday use. Features include scientific notation, instant conversion, and a clean mobile-friendly interface. Ideal for students, researchers, and professionals worldwide.');
fillMat('mat-input-4', '2024');  // Founded year

await new Promise(r=>setTimeout(r,1000));

// NOW CLICK SAVE
const clickResult = p._bb('eval', `(function(){
  var btn = document.querySelector('[data-heap-save-edits-button]');
  if(btn && !btn.disabled){ btn.click(); return 'CLICKED SAVE - aria: '+btn.getAttribute('aria-label'); }
  return 'button disabled or not found. disabled: '+btn?.disabled;
})()`);
console.log('SAVE CLICK:', clickResult);

await new Promise(r=>setTimeout(r,8000));

// Check result
const afterUrl = p.url();
const afterBody = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('After URL:', afterUrl.substring(0,80));
console.log('After body:', afterBody);

// Check for notifications
const notif = p._bb('eval', `Array.from(document.querySelectorAll('[class*=toast],[class*=snack],[role=alert],[class*=notification],[class*=success]')).map(e=>e.textContent.trim()).join(' | ')`);
console.log('Notifications:', notif);
