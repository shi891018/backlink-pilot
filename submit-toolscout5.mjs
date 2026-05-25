import { BbPage } from './src/bb.js';

const p = new BbPage();
// Should already be logged in on toolscout.ai/submit
const url = p.url();
console.log('Current URL:', url.substring(0,80));

await new Promise(r=>setTimeout(r,3000));

// Verify login state
const loginState = p._bb('eval', `document.body.innerText.includes('Login') ? 'not logged in' : 'logged in (no Login btn)'`);
console.log('Login state:', loginState);

// Fill form
const fillResult = p._bb('eval', `(function(){
  function nativeSet(el, val) {
    var P = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(P, 'value').set.call(el, val);
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true}));
  }
  var allInputs = Array.from(document.querySelectorAll('input')).filter(i => i.type === 'text');
  var textareas = Array.from(document.querySelectorAll('textarea'));
  
  if (allInputs[0]) nativeSet(allInputs[0], 'Unit Converter for Science');
  if (allInputs[1]) nativeSet(allInputs[1], 'https://www.unitconv.top');
  var desc = textareas.find(t => t.placeholder?.includes('Can It Do'));
  if (desc) nativeSet(desc, 'A precision unit converter for scientists, engineers, and students. Covers 200+ unit types across physics, chemistry, astronomy, and engineering with full scientific notation support.');
  var emailInp = allInputs.find(i => i.placeholder?.includes('@'));
  if (emailInp) nativeSet(emailInp, 'hi@unitconv.top');
  
  return {
    inputCount: allInputs.length,
    name: allInputs[0]?.value,
    url: allInputs[1]?.value,
    desc: desc?.value?.substring(0,40)
  };
})()`);
console.log('Fill:', fillResult);

await new Promise(r=>setTimeout(r,1000));

// Click Submit
const clickRes = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var s = btns.find(b => /submit/i.test(b.textContent));
  if (s && !s.disabled) { s.click(); return 'clicked: ' + s.textContent.trim(); }
  return 'buttons: ' + btns.map(b=>b.textContent.trim()).join(' | ');
})()`);
console.log('Click:', clickRes);

await new Promise(r=>setTimeout(r,6000));

// Intercept the POST response
const finalUrl = p.url();
const finalBody = p._bb('eval', `document.body.innerText.substring(0,400)`);
// Check for any success/error notification
const notification = p._bb('eval', `(function(){
  var alerts = Array.from(document.querySelectorAll('[role=alert],[class*=toast],[class*=notification],[class*=success],[class*=snack]'));
  return alerts.map(a => a.textContent.trim()).join(' | ') || 'none';
})()`);
console.log('Final URL:', finalUrl.substring(0,80));
console.log('Notification:', notification);
console.log('Final body preview:', finalBody.substring(0,200));
