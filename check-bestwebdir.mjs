#!/usr/bin/env node
const r = await fetch('https://www.bestwebdirectory.info/submit.php', { headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(10000) });
const html = await r.text();
const forms = html.match(/<form[^>]*>/gi)||[];
const fields = [...html.matchAll(/name="([^"]+)"/gi)].map(m=>m[1]);
const bodyText = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
console.log('HTTP:', r.status);
console.log('Forms:', forms.map(f=>f.substring(0,80)).join('\n  '));
console.log('Fields:', fields.join(', '));
console.log('\nPage text (800):', bodyText.substring(0,800));
