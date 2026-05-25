#!/usr/bin/env node
// Submit to exactseek.com - simple search engine/directory
const r = await fetch('https://www.exactseek.com/add.html', {
  headers:{'User-Agent':'Mozilla/5.0'},
  signal:AbortSignal.timeout(10000)
});
const html = await r.text();
// Find the form action and field names
const formMatch = html.match(/<form[^>]+action="([^"]+)"/i);
const allInputs = [...html.matchAll(/name="([^"]+)"/gi)].map(m=>m[1]);
console.log('Form action:', formMatch?.[1]);
console.log('All field names:', allInputs.slice(0,15).join(', '));

// Also print surrounding context around url/email fields
const urlCtx = html.indexOf('name="url"');
if(urlCtx>0) console.log('URL field context:', html.substring(urlCtx-100, urlCtx+100));
