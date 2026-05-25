#!/usr/bin/env node
// Search for the JS function definition
const r = await fetch('https://freewebsubmission.com/', { headers:{'User-Agent':'Mozilla/5.0'} });
const html = await r.text();
// Extract all <script> blocks
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
for(const s of scripts){
  if(s.includes('onsubmit') || s.includes('fws_') || s.includes('submitform')){
    console.log('Found script:', s.substring(0,500));
  }
}
// Also look for external script URLs
const externalScripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/gi)].map(m=>m[1]);
console.log('External scripts:', externalScripts);
