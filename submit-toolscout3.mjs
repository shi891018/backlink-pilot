import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://toolscout.ai/submit');
await new Promise(r => setTimeout(r, 7000));

const fillResult = p._bb('eval', `(function(){
  function nativeSet(el, val) {
    var P = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(P, 'value').set.call(el, val);
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true}));
  }
  
  // Query all inputs, filter by .type property (not attribute!)
  var allInputs = Array.from(document.querySelectorAll('input')).filter(i => i.type === 'text');
  var textareas = Array.from(document.querySelectorAll('textarea'));
  
  console.log('text inputs found:', allInputs.length);
  allInputs.forEach((i,n) => console.log(n, i.placeholder, i.getAttribute('type')));
  
  // name = first text input
  if (allInputs[0]) nativeSet(allInputs[0], 'Unit Converter for Science');
  // url = second (placeholder https://)
  if (allInputs[1]) nativeSet(allInputs[1], 'https://www.unitconv.top');
  // description
  var desc = textareas.find(t => t.placeholder && t.placeholder.includes('Can It Do'));
  if (desc) nativeSet(desc, 'A precision unit converter for scientists, engineers, and students. Covers physics, chemistry, and everyday units with scientific notation support.');
  // email input
  var emailInp = allInputs.find(i => i.placeholder && i.placeholder.includes('@'));
  if (emailInp) nativeSet(emailInp, 'hi@unitconv.top');
  
  return {
    inputCount: allInputs.length,
    name: allInputs[0]?.value,
    url: allInputs[1]?.value,
    desc: desc?.value?.substring(0,30),
    email: emailInp?.value
  };
})()`);
console.log('Fill:', fillResult);

await new Promise(r => setTimeout(r, 1500));

// Select freemium pricing
p._bb('eval', `(function(){
  var inputs = Array.from(document.querySelectorAll('input')).filter(i => i.type === 'checkbox' || i.type === 'radio');
  var checkboxes = Array.from(document.querySelectorAll('input[type=checkbox]'));
  // Try clicking the "Freemium" label/option
  var allText = Array.from(document.querySelectorAll('*')).find(el => el.childNodes.length === 1 && el.textContent.trim() === 'Freemium');
  if (allText) allText.click();
  return 'done';
})()`);

await new Promise(r => setTimeout(r, 800));

// Click Submit
const clickRes = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var s = btns.find(b => /submit/i.test(b.textContent));
  if (s) { s.click(); return 'clicked: ' + s.textContent.trim(); }
  return 'no submit btn';
})()`);
console.log('Click:', clickRes);

await new Promise(r => setTimeout(r, 6000));
const afterUrl = p.url();
const afterBody = p._bb('eval', `document.body.innerText.substring(0,500)`);
console.log('URL:', afterUrl);
console.log('Body:', afterBody);
