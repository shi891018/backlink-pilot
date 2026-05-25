#!/usr/bin/env node
const r = await fetch('https://www.betabound.com/announce/', {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(10000)});
const html = await r.text();
const forms = html.match(/<form[^>]*action="([^"]+)"/gi)||[];
const fields = [...html.matchAll(/name="([^"]+)"/gi)].map(m=>m[1]).filter(n=>n.length<40);
const bodyText = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
console.log('HTTP:', r.status);
console.log('Form actions:', forms.map(f=>f.match(/action="([^"]+)"/)?.[1]).join(', '));
console.log('Fields:', fields.slice(0,15).join(', '));
console.log('Page (400):', bodyText.substring(0,400));
