#!/usr/bin/env node
// Extract fws_onsubmit JS function
const r = await fetch('https://freewebsubmission.com/', { headers:{'User-Agent':'Mozilla/5.0'} });
const html = await r.text();
// Find the onsubmit function
const idx = html.indexOf('fws_onsubmit');
console.log('Context around fws_onsubmit:');
console.log(html.substring(idx-50, idx+400));
