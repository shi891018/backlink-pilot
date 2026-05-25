#!/usr/bin/env node
/**
 * submit-toolify.mjs — Submit to Toolify.ai
 * Form fields detected: tool name (placeholder "Copy AI"), tool url
 */
import { BbPage } from './src/bb.js';

const PRODUCT = {
  name: 'Unit Converter for Science',
  url: 'https://www.unitconv.top',
};

const p = new BbPage();
await p.goto('https://www.toolify.ai/submit');
await new Promise(r => setTimeout(r, 4000));

// Fill by placeholder using native setter
p._bb('eval', `(function(){
  function setVal(el, val){
    var proto = el.tagName==='TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto,'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  var nameEl = document.querySelector('input[placeholder*="Copy AI"], input[placeholder*="tool name"], input[placeholder*="Tool Name"]');
  if(nameEl) setVal(nameEl, 'Unit Converter for Science');
  var urlEl = document.querySelector('input[placeholder*="tool url"], input[placeholder*="https://www.copy.ai"]');
  if(urlEl) setVal(urlEl, 'https://www.unitconv.top');
  return 'filled';
})()`);
await new Promise(r => setTimeout(r, 600));

// Check filled values
const vals = p._bb('eval', `JSON.stringify({
  name: (document.querySelector('input[placeholder*="Copy AI"]')||{}).value,
  url: (document.querySelector('input[placeholder*="tool url"]')||{}).value,
  loggedIn: !!document.querySelector('[class*="avatar"],[class*="user"],[class*="profile"]')
})`);
console.log('Values:', vals);

// Skip screenshot to avoid timeout

// Click submit button
const clickResult = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var submit = btns.find(b => /submit/i.test(b.textContent));
  if(submit){ submit.click(); return 'clicked: '+submit.textContent.trim(); }
  return 'no submit btn: '+btns.map(b=>b.textContent.trim()).join(' | ');
})()`);
console.log('Click:', clickResult);
await new Promise(r => setTimeout(r, 5000));

const finalUrl = p.url();
const bodyText = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('Final URL:', finalUrl);
console.log('Body:', bodyText);
// skip screenshot
