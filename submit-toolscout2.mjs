import { BbPage } from './src/bb.js';

const PRODUCT = {
  name: 'Unit Converter for Science',
  url: 'https://www.unitconv.top',
  description: 'A precision unit converter built for scientists, engineers, and students. Covers physics, chemistry, astronomy, engineering, and everyday units with scientific notation support.',
  email: 'hi@unitconv.top',
};

const p = new BbPage();
// Force navigate and wait longer
await p.goto('https://toolscout.ai/submit');
await new Promise(r => setTimeout(r, 8000));

// Check what page we're on
const currentUrl = p.url();
console.log('Current URL:', currentUrl);

// Count all inputs
const inputCount = p._bb('eval', `document.querySelectorAll('input').length`);
console.log('Total inputs:', inputCount);

// Try to fill all at once
const fillResult = p._bb('eval', `(function(){
  function nativeSet(el, val) {
    var P = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(P, 'value').set.call(el, val);
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true}));
  }
  var inputs = Array.from(document.querySelectorAll('input[type=text]'));
  var textareas = Array.from(document.querySelectorAll('textarea'));
  
  if (inputs.length === 0) return 'NO TEXT INPUTS found. Total inputs: ' + document.querySelectorAll('input').length;
  
  // name = first text input (no placeholder)
  nativeSet(inputs[0], 'Unit Converter for Science');
  // url = second text input (placeholder https://)
  if (inputs[1]) nativeSet(inputs[1], 'https://www.unitconv.top');
  // description textarea
  var desc = textareas.find(t => t.placeholder && t.placeholder.includes('Can It Do'));
  if (desc) nativeSet(desc, 'A precision unit converter for scientists, engineers, and students. Covers physics, chemistry, astronomy, engineering, and everyday units with scientific notation support.');
  // email
  var emailInp = inputs.find(i => i.placeholder && i.placeholder.includes('@'));
  if (emailInp) nativeSet(emailInp, 'hi@unitconv.top');
  
  return 'filled: name=' + inputs[0].value + ' url=' + (inputs[1]||{}).value + ' desc=' + (desc||{}).value?.substring(0,20);
})()`);
console.log('Fill result:', fillResult);

await new Promise(r => setTimeout(r, 1500));

// Select pricing: Freemium
const pricingResult = p._bb('eval', `(function(){
  var opts = Array.from(document.querySelectorAll('option'));
  var freemium = opts.find(o => o.text === 'Freemium');
  if (freemium) { freemium.selected = true; freemium.parentElement.dispatchEvent(new Event('change',{bubbles:true})); return 'selected freemium'; }
  return 'no freemium option';
})()`);
console.log('Pricing:', pricingResult);

await new Promise(r => setTimeout(r, 1000));

// Click Submit
const clickRes = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var s = btns.find(b => /submit/i.test(b.textContent));
  if (s && !s.disabled) { s.click(); return 'clicked: ' + s.textContent.trim(); }
  return 'no submit: ' + btns.map(b=>b.textContent.trim()).slice(0,5).join(' | ');
})()`);
console.log('Click:', clickRes);

await new Promise(r => setTimeout(r, 5000));

const afterUrl = p.url();
const afterBody = p._bb('eval', `document.body.innerText.substring(0,400)`);
console.log('After URL:', afterUrl);
console.log('After body:', afterBody);
