import { BbPage } from './src/bb.js';
const p = new BbPage();

// Should already be on the edit page
const url = p.url();
console.log('URL:', url.substring(0,60));

function fillInput(id, value) {
  return p._bb('eval', `(function(){
    var el = document.getElementById('${id}');
    if(!el) return 'not found: ${id}';
    // Angular Material needs native setter + input event
    var proto = el.tagName==='TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, '${value.replace(/'/g, "\\'")}');
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true}));
    el.dispatchEvent(new Event('blur', {bubbles:true}));
    return 'filled: '+el.value.substring(0,30);
  })()`);
}

await new Promise(r=>setTimeout(r,1000));

// Fill required fields
console.log('Name:', fillInput('mat-input-0', 'Unit Converter for Science'));
console.log('Short desc:', fillInput('mat-input-1', 'Online unit converter for scientists, engineers, and students'));
console.log('Founded year:', fillInput('mat-input-4', '2024'));
console.log('Website:', fillInput('mat-input-6', 'https://www.unitconv.top'));
console.log('Contact:', fillInput('mat-input-10', 'hi@unitconv.top'));
console.log('Full desc:', fillInput('mat-input-12', 'Unit Converter for Science is a precision online tool supporting 200+ unit types across physics, chemistry, astronomy, and engineering. Features include scientific notation input/output, one-click copying, and a clean mobile-friendly interface. Free to use for students, researchers, and professionals worldwide.'));

await new Promise(r=>setTimeout(r,1000));

// Select Industry: Software
const industryResult = p._bb('eval', `(function(){
  var industryInput = document.getElementById('mat-input-13');
  if(!industryInput) return 'industry input not found';
  var proto = HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(industryInput, 'Software');
  industryInput.dispatchEvent(new Event('input', {bubbles:true}));
  return 'typed Software';
})()`);
console.log('Industry:', industryResult);

await new Promise(r=>setTimeout(r,2000));

// Click the Software option from dropdown
const industrySelect = p._bb('eval', `(function(){
  var options = Array.from(document.querySelectorAll('mat-option,[role=option]'));
  var sw = options.find(o => /software/i.test(o.textContent));
  if(sw){ sw.click(); return 'selected: '+sw.textContent.trim(); }
  return 'options: '+options.map(o=>o.textContent.trim()).slice(0,5).join(' | ');
})()`);
console.log('Industry select:', industrySelect);

await new Promise(r=>setTimeout(r,1000));

// Verify filled values
const verify = p._bb('eval', `JSON.stringify({
  name: document.getElementById('mat-input-0')?.value,
  website: document.getElementById('mat-input-6')?.value,
  desc: document.getElementById('mat-input-1')?.value
})`);
console.log('Verified:', verify);
