#!/usr/bin/env node
const r = await fetch('https://slashdot.org/submission', {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(10000)});
const html = await r.text();
const forms = html.match(/<form[^>]*action="([^"]+)"/gi)||[];
const fields = [...html.matchAll(/name="([^"]+)"/gi)].map(m=>m[1]).filter(n=>!['viewport','description'].includes(n));
const bodyText = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
console.log('HTTP:', r.status);
console.log('Form actions:', forms.map(f=>f.match(/action="([^"]+)"/)?.[1]).join(', '));
console.log('Fields (first 20):', fields.slice(0,20).join(', '));
console.log('Page text (400):', bodyText.substring(0,400));
