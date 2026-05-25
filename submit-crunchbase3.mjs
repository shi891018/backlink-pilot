import { BbPage } from './src/bb.js';
const p = new BbPage();

// Already on edit page with filled form
const url = p.url();
console.log('URL:', url.substring(0,60));

// Check current values
const verify = p._bb('eval', `JSON.stringify({
  name: document.getElementById('mat-input-0')?.value,
  website: document.getElementById('mat-input-6')?.value,
  desc: document.getElementById('mat-input-1')?.value?.substring(0,30)
})`);
console.log('Current values:', verify);

// Find save/submit button
const saveBtn = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  return btns.map(b => ({text: b.textContent.trim(), disabled: b.disabled})).filter(b => b.text);
})()`);
console.log('Buttons:', JSON.stringify(saveBtn));

// Try to scroll to and click Save
const clickResult = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var save = btns.find(b => /save|submit|add|create/i.test(b.textContent) && !b.disabled);
  if(save){ save.scrollIntoView(); save.click(); return 'clicked: '+save.textContent.trim(); }
  // Try any enabled button
  var enabled = btns.filter(b => !b.disabled && b.textContent.trim());
  return 'all btns: '+enabled.map(b=>b.textContent.trim()).join(' | ');
})()`);
console.log('Save click:', clickResult);

await new Promise(r=>setTimeout(r,5000));
const afterUrl = p.url();
const afterBody = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('After URL:', afterUrl.substring(0,80));
console.log('After body:', afterBody.substring(0,300));
