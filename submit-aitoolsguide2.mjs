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
    nativeSetter.call(el, val);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
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
await new Promise(r => setTimeout(r, 1000));

// Click submit
const clickResult = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var sb = btns.find(b => /submit tool/i.test(b.textContent.trim()));
  if(sb){ sb.click(); return 'clicked: '+sb.textContent.trim(); }
  // Fallback: last button
  var last = btns[btns.length-1];
  if(last){ last.click(); return 'clicked fallback: '+last.textContent.trim(); }
  return 'no button';
})()`);
console.log('Click result:', clickResult);
await new Promise(r => setTimeout(r, 4000));

// Check for success
const pageState = p._bb('eval', `(function(){
  var body = document.body.innerText;
  var success = /(success|thank|submitted|review|received)/i.test(body);
  var error = /(error|failed|invalid)/i.test(body);
  var toasts = Array.from(document.querySelectorAll('[class*="toast"],[class*="alert"],[class*="notification"],[role="alert"]')).map(el=>el.textContent.trim()).filter(Boolean);
  return {success, error, toasts, url: location.href, bodySnip: body.substring(0,200)};
})()`);
console.log('Page state:', pageState);
await p.screenshot('screenshots/aitoolsguide2-after.png');
