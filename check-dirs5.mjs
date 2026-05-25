#!/usr/bin/env node
for(const [name, url] of [
  ['Changelog', 'https://changelog.com/news/submit'],
  ['AllTopStartups', 'https://alltopstartups.com/submit-startup/'],
  ['MicroLaunch', 'https://microlaunch.net/submit'],
]){
  const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(10000)});
  const html = await r.text();
  const forms = html.match(/<form[^>]*action="([^"]+)"/gi)||[];
  const fields = [...html.matchAll(/name="([^"]+)"/gi)].map(m=>m[1]);
  const bodyText = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  console.log(`\n=== ${name} ===`);
  console.log('HTTP:', r.status);
  console.log('Form actions:', forms.map(f=>f.match(/action="([^"]+)"/)?.[1]).join(', '));
  console.log('Fields:', fields.filter(f=>!['viewport','description','og:title'].includes(f)).slice(0,15).join(', '));
  console.log('Page (300):', bodyText.substring(0,300));
}
