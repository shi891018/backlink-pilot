#!/usr/bin/env node
// Debug - check exact hidden field values and form structure
const r = await fetch('https://freewebsubmission.com/', { headers:{'User-Agent':'Mozilla/5.0'} });
const html = await r.text();

// Find all input tags
const inputs = [...html.matchAll(/<input[^>]+>/gi)];
console.log('All input tags:');
for(const inp of inputs){
  const name = inp[0].match(/name="([^"]+)"/i)?.[1];
  const type = inp[0].match(/type="([^"]+)"/i)?.[1];
  const value = inp[0].match(/value="([^"]+)"/i)?.[1];
  if(name) console.log(' ', type?.padEnd(8)||'(none)  ', name?.padEnd(20), '=', value||'(empty)');
}
console.log('\nForm tag:');
const form = html.match(/<form[^>]+>/i)?.[0];
console.log(form);
