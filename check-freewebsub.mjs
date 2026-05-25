#!/usr/bin/env node
const r = await fetch('https://freewebsubmission.com/', { headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(10000) });
const html = await r.text();
const forms = html.match(/<form[^>]*>/gi)||[];
const fields = [...html.matchAll(/name="([^"]+)"/gi)].map(m=>m[1]);
const action = html.match(/<form[^>]*action="([^"]+)"/i)?.[1];
const bodyText = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
console.log('HTTP:', r.status);
console.log('Action:', action);
console.log('Fields:', fields.join(', '));
console.log('\nPage text (600):', bodyText.substring(0,600));
