#!/usr/bin/env node
import { BbPage } from './src/bb.js';
const PRODUCT = {
  name: 'Unit Converter for Science',
  url: 'https://www.unitconv.top',
  desc: 'Free web app for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy. Built for students and engineers. No ads, no signup.',
};
const p = new BbPage();
await p.goto('https://aitoolsguide.com/submit');
await new Promise(r => setTimeout(r, 3000));
// Fill form
p._bb('eval', `(function(){
  function setVal(el, val){
    var nativeSetter = Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype,'value').set;
    nativeSetter.call(el, val); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  var nameInput = document.querySelector('input[placeholder="Tool name"]');
  if(nameInput) setVal(nameInput, '${PRODUCT.name}');
  var urlInput = document.querySelector('input[type="url"],input[placeholder*="http"]');
  if(urlInput) setVal(urlInput, '${PRODUCT.url}');
  var sel = document.querySelector('select');
  if(sel){ sel.value = 'Developer Tools'; sel.dispatchEvent(new Event('change',{bubbles:true})); }
  var desc = document.querySelector('textarea');
  if(desc) setVal(desc, '${PRODUCT.desc.replace(/'/g,"\\'")}');
})()`);
await new Promise(r => setTimeout(r, 500));

// Check current values
const before = p._bb('eval', `JSON.stringify({
  name: (document.querySelector('input[placeholder="Tool name"]')||{}).value,
  url: (document.querySelector('input[type="url"]')||{}).value,
})`);
console.log('Before submit:', before);

// Click Submit tool
p._bb('eval', `(function(){ var btns = Array.from(document.querySelectorAll('button')); var sb = btns.find(b => /submit tool/i.test(b.textContent.trim())); if(sb) sb.click(); })()`);
await new Promise(r => setTimeout(r, 6000));

// Check if form cleared = success
const after = p._bb('eval', `JSON.stringify({
  name: (document.querySelector('input[placeholder="Tool name"]')||{}).value,
  url: (document.querySelector('input[type="url"]')||{}).value,
  fullBody: document.body.innerText.substring(0,400)
})`);
console.log('After submit:', after);
