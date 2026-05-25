#!/usr/bin/env node
/**
 * submit-aitoolsguide.mjs — Submit to AIToolsGuide.com
 * Form has no name attrs, fill by placeholder/type
 */
import { BbPage } from './src/bb.js';

const PRODUCT = {
  name: 'Unit Converter for Science',
  url: 'https://www.unitconv.top',
  desc: 'Free web app for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy, and more. Built for students, engineers, and researchers. No ads, no signup required.',
};

const p = new BbPage();
await p.goto('https://aitoolsguide.com/submit');
await new Promise(r => setTimeout(r, 3000));

// Fill by placeholder
p._bb('eval', `(function(){
  function setVal(el, val){
    var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;
    nativeSetter.call(el, val);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  // Tool name
  var nameInput = document.querySelector('input[placeholder="Tool name"]');
  if(nameInput) setVal(nameInput, '${PRODUCT.name}');
  // URL
  var urlInput = document.querySelector('input[placeholder="https://"], input[type="url"]');
  if(urlInput) setVal(urlInput, '${PRODUCT.url}');
  // Category select
  var sel = document.querySelector('select');
  if(sel){ sel.value = 'Developer Tools'; sel.dispatchEvent(new Event('change',{bubbles:true})); }
  // Description
  var desc = document.querySelector('textarea');
  if(desc){ 
    var taProto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;
    taProto.call(desc, '${PRODUCT.desc.replace(/'/g,"\\'")}');
    desc.dispatchEvent(new Event('input',{bubbles:true}));
  }
  return 'filled';
})()`);
await new Promise(r => setTimeout(r, 500));

// Verify
const vals = p._bb('eval', `JSON.stringify({
  name: (document.querySelector('input[placeholder="Tool name"]')||{}).value,
  url: (document.querySelector('input[type="url"]')||{}).value,
  cat: (document.querySelector('select')||{}).value,
  desc: (document.querySelector('textarea')||{value:''}).value.substring(0,30)
})`);
console.log('Field values:', vals);

await p.screenshot('screenshots/aitoolsguide-before.png');

// Click submit button
p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var submitBtn = btns.find(b => /submit|send|add/i.test(b.textContent));
  if(submitBtn){ submitBtn.click(); return 'clicked: '+submitBtn.textContent; }
  return 'no button found';
})()`);
await new Promise(r => setTimeout(r, 5000));

const bodyText = p._bb('eval', '(function(){ return document.body ? document.body.innerText.substring(0,400) : ""; })()');
const finalUrl = p.url();
console.log('Final URL:', finalUrl);
console.log('Body:', bodyText);
await p.screenshot('screenshots/aitoolsguide-after.png');
