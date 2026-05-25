#!/usr/bin/env node
/**
 * submit-toolscout.mjs — Submit to ToolScout.ai
 */
import { BbPage } from './src/bb.js';

const PRODUCT = {
  name: 'Unit Converter for Science',
  url: 'https://www.unitconv.top',
  description: 'A precision unit converter built for scientists, engineers, and students. Covers physics, chemistry, astronomy, engineering, and everyday units. Instant conversion with scientific notation support.',
  email: 'hi@unitconv.top',
};

const p = new BbPage();
await p.goto('https://toolscout.ai/submit');
await new Promise(r => setTimeout(r, 7000));

// Get label info to understand field order
const labelInfo = p._bb('eval', `JSON.stringify(
  Array.from(document.querySelectorAll('label')).map(l => ({
    text: l.textContent.trim().substring(0,50),
    forAttr: l.htmlFor
  }))
)`);
console.log('Labels:', labelInfo);

// Fill form using native setter
p._bb('eval', `(function(){
  function setVal(el, val){
    var proto = el.tagName==='TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto,'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  // First text input = tool name
  var allInputs = Array.from(document.querySelectorAll('input[type=text]'));
  var allTextareas = Array.from(document.querySelectorAll('textarea'));
  
  // name (first plain text input)
  var nameEl = allInputs.find(i => !i.placeholder || i.placeholder === '');
  if(nameEl) setVal(nameEl, '${PRODUCT.name}');
  
  // URL (placeholder https://)
  var urlEls = allInputs.filter(i => i.placeholder === 'https://');
  if(urlEls[0]) setVal(urlEls[0], '${PRODUCT.url}');
  
  // description textarea
  var descEl = allTextareas.find(t => t.placeholder && t.placeholder.includes('Can It Do'));
  if(descEl) setVal(descEl, '${PRODUCT.description}');
  
  // email
  var emailEl = allInputs.find(i => i.placeholder && i.placeholder.includes('@'));
  if(emailEl) setVal(emailEl, '${PRODUCT.email}');
  
  return JSON.stringify({
    name: allInputs[0]?.value,
    url: urlEls[0]?.value,
    desc: allTextareas[0]?.value?.substring(0,40),
    email: emailEl?.value
  });
})()`);

await new Promise(r => setTimeout(r, 1000));

// Check values
const vals = p._bb('eval', `JSON.stringify({
  inputs: Array.from(document.querySelectorAll('input[type=text]')).map(i => ({ph: i.placeholder, val: i.value})),
  textareas: Array.from(document.querySelectorAll('textarea')).map(t => ({ph: t.placeholder, val: t.value.substring(0,40)}))
})`);
console.log('Filled values:', vals);

// Click submit
const clickResult = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button[type=submit], button'));
  var sub = btns.find(b => /submit|send|add tool/i.test(b.textContent));
  if(sub && !sub.disabled){ sub.click(); return 'clicked: '+sub.textContent.trim(); }
  return 'buttons: '+btns.map(b=>b.textContent.trim().substring(0,20)).join(' | ');
})()`);
console.log('Click:', clickResult);

await new Promise(r => setTimeout(r, 5000));

const finalUrl = p.url();
const bodyText = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('Final URL:', finalUrl);
console.log('Body:', bodyText);
