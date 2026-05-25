#!/usr/bin/env node
for(const [name, url] of [
  ['PR.com', 'https://www.pr.com/'],
  ['OpenPR', 'https://www.openpr.com/'],
]){
  const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(10000)});
  const html = await r.text();
  const forms = html.match(/<form[^>]*action="([^"]+)"/gi)||[];
  const fields = [...html.matchAll(/name="([^"]+)"/gi)].map(m=>m[1]).filter(n=>n.length<30);
  const bodyText = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  console.log(`\n=== ${name} ===`);
  console.log('HTTP:', r.status);
  console.log('Forms:', forms.map(f=>f.match(/action="([^"]+)"/)?.[1]).join(', '));
  console.log('Fields:', fields.slice(0,15).join(', '));
  console.log('Page (300):', bodyText.substring(0,300));
}
