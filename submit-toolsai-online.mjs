#!/usr/bin/env node
/**
 * submit-toolsai-online.mjs — Direct submission to tools-ai.online
 * Form fields: toolName, toolUrl, pricing (select), contactEmail, file (optional)
 */
import { BbPage } from './src/bb.js';

const PRODUCT = {
  name: 'Unit Converter for Science',
  url:  'https://www.unitconv.top',
  email: 'shijm1989@gmail.com',
  desc: 'Free web tool for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy, and more. Built for students, engineers, and researchers. No ads, no signup required.',
};

const p = new BbPage();
await p.goto('https://www.tools-ai.online/submit-tool');
await new Promise(r => setTimeout(r, 3000));

// Fill fields using evalFill (bypasses React synthetic events)
await p.evalFill('#toolName',     PRODUCT.name);
await new Promise(r => setTimeout(r, 300));
await p.evalFill('#toolUrl',      PRODUCT.url);
await new Promise(r => setTimeout(r, 300));
await p.evalFill('#contactEmail', PRODUCT.email);
await new Promise(r => setTimeout(r, 300));

// Set pricing select to "Free"
p._bb('eval', `(function(){
  var sel = document.querySelector('#pricing');
  if(sel){ sel.value='free'; sel.dispatchEvent(new Event('change',{bubbles:true})); }
})()`);
await new Promise(r => setTimeout(r, 400));

// Verify fields filled
const vals = p._bb('eval', `JSON.stringify({
  name: (document.querySelector('#toolName')||{}).value,
  url:  (document.querySelector('#toolUrl')||{}).value,
  email:(document.querySelector('#contactEmail')||{}).value
})`);
console.log('Field values:', vals);

await p.screenshot('screenshots/toolsai-before.png');

// Click submit
p._bb('eval', `(function(){
  var btn = document.querySelector('button[type="submit"]');
  if(btn){ btn.click(); }
})()`);
await new Promise(r => setTimeout(r, 4000));

const bodyText = p._bb('eval', '(function(){ return document.body ? document.body.innerText.substring(0,300) : ""; })()');
const url = p.url();
console.log('Final URL:', url);
console.log('Body:', bodyText);
await p.screenshot('screenshots/toolsai-after.png');
