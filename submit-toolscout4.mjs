import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://toolscout.ai/submit');
await new Promise(r => setTimeout(r, 7000));

// Fill all fields
p._bb('eval', `(function(){
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
  var desc = textareas.find(t => t.placeholder && t.placeholder.includes('Can It Do'));
  if (desc) nativeSet(desc, 'A precision unit converter for scientists, engineers, and students. Covers 200+ unit types across physics, chemistry, and engineering with scientific notation support.');
  var emailInp = allInputs.find(i => i.placeholder && i.placeholder.includes('@'));
  if (emailInp) nativeSet(emailInp, 'hi@unitconv.top');
})()`);
await new Promise(r => setTimeout(r, 800));

// Click a "Free" or "Freemium" pricing tag
p._bb('eval', `(function(){
  var spans = Array.from(document.querySelectorAll('span,div,li,option'));
  var freeTag = spans.find(el => el.textContent.trim() === 'Free' && el.children.length === 0);
  if (freeTag) { freeTag.click(); return; }
})()`);
await new Promise(r => setTimeout(r, 600));

// Click Submit
p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var s = btns.find(b => /submit/i.test(b.textContent));
  if (s) s.click();
})()`);

await new Promise(r => setTimeout(r, 3000));

// Check for toasts, alerts, error messages
const msgs = p._bb('eval', `(function(){
  var toasts = Array.from(document.querySelectorAll('[class*=toast],[class*=alert],[class*=error],[class*=success],[role=alert],[aria-live]'));
  var required = Array.from(document.querySelectorAll(':invalid,[class*=error]'));
  return JSON.stringify({
    toasts: toasts.map(t => t.textContent.trim().substring(0,100)),
    required: required.map(r => r.tagName + ':' + r.name + ':' + r.placeholder).slice(0,5)
  });
})()`);
console.log('Messages after submit:', msgs);

// Check login state
const loginState = p._bb('eval', `(function(){
  var loginBtn = document.querySelector('[class*=login],[href*=login]');
  var avatar = document.querySelector('[class*=avatar],[class*=user-img]');
  var googleBtn = document.querySelector('[class*=google]');
  return JSON.stringify({
    loginBtnText: loginBtn?.textContent?.trim(),
    hasAvatar: !!avatar,
    googleBtn: !!googleBtn
  });
})()`);
console.log('Login state:', loginState);
