#!/usr/bin/env node
/**
 * submit-aivalley5.mjs — AI Valley with category selection
 * Fills all form fields including category dropdown
 */
import { BbPage } from './src/bb.js';

const PRODUCT = {
  name: 'Unit Converter for Science',
  url: 'https://www.unitconv.top',
  email: 'shijm1989@gmail.com',
  short: 'Free scientific unit converter - 20+ categories, no ads',
  desc: 'Unit Converter for Science is a free web app for converting units across 20+ categories including length, mass, temperature, pressure, energy, frequency, and more. Built for students, engineers, and researchers. No ads, no signup required.',
};

const p = new BbPage();
await p.goto('https://aivalley.ai/submit-tool/');
await new Promise(r => setTimeout(r, 5000));

// Fill text fields using evalFill (bypasses React synthetic events)
await p.evalFill('input[name="your-name"]', 'Shijm');
await new Promise(r => setTimeout(r, 300));
await p.evalFill('input[name="your-email"]', PRODUCT.email);
await new Promise(r => setTimeout(r, 300));
await p.evalFill('input[name="ToolName"]', PRODUCT.name);
await new Promise(r => setTimeout(r, 300));
await p.evalFill('input[name="ToolURL"]', PRODUCT.url);
await new Promise(r => setTimeout(r, 300));

// Fill both textareas
p._bb('eval', `(function(){
  var tas = document.querySelectorAll('textarea');
  if(tas[0]){ tas[0].value='${PRODUCT.desc.replace(/'/g,"\\'")}'; tas[0].dispatchEvent(new Event('input',{bubbles:true})); }
  if(tas[1]){ tas[1].value='${PRODUCT.short.replace(/'/g,"\\'")}'; tas[1].dispatchEvent(new Event('input',{bubbles:true})); }
})()`);
await new Promise(r => setTimeout(r, 400));

// Select category — try to find and click the category select
// Look for "select" element or a custom dropdown
const catResult = p._bb('eval', `(function(){
  var sel = document.querySelector('select');
  if(sel){ 
    // Find the "Data" option
    var opts = Array.from(sel.options);
    var dataOpt = opts.find(o => /data|utility|tools/i.test(o.text));
    if(dataOpt){ sel.value = dataOpt.value; sel.dispatchEvent(new Event('change',{bubbles:true})); return 'selected:'+dataOpt.text; }
    return 'options:'+opts.map(o=>o.text).join(',');
  }
  return 'no-select';
})()`);
console.log('Category result:', catResult);
await new Promise(r => setTimeout(r, 500));

await p.screenshot('screenshots/aivalley5-before.png');

// Get snapshot to find the submit button
const snap = await p.snapshot();
const lines = snap.split('\n');
const submitLine = lines.find(l => /submit/i.test(l) && l.includes('[ref='));
console.log('Submit button:', submitLine);

// Try to click submit
if(submitLine){
  const refMatch = submitLine.match(/\[ref=(\d+)\]/);
  if(refMatch){
    p._bb('click', '@'+refMatch[1]);
  }
} else {
  // Fallback: click submit by selector
  p._bb('eval', 'document.querySelector("input[type=submit],button[type=submit]").click()');
}
await new Promise(r => setTimeout(r, 6000));

const bodyText = p._bb('eval', '(function(){ return document.body ? document.body.innerText.substring(0,500) : ""; })()');
const finalUrl = p.url();
console.log('Final URL:', finalUrl);
console.log('Body:', bodyText);
await p.screenshot('screenshots/aivalley5-after.png');
