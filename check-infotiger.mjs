#!/usr/bin/env node
const r = await fetch('https://www.infotiger.com/addurl.html', {headers:{'User-Agent':'Mozilla/5.0'}});
const html = await r.text();
const bodyText = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const forms = html.match(/<form[^>]*>/gi)||[];
const allInputs = [...html.matchAll(/<input[^>]+>/gi)];
console.log('HTTP:', r.status);
console.log('Forms:', forms.map(f=>f.substring(0,80)).join('\n'));
console.log('Inputs:');
allInputs.forEach(m=>{
  const name = m[0].match(/name="([^"]+)"/i)?.[1];
  const type = m[0].match(/type="([^"]+)"/i)?.[1];
  const placeholder = m[0].match(/placeholder="([^"]+)"/i)?.[1];
  if(name || type) console.log(' ', type||'?', name||'(no name)', placeholder||'');
});
console.log('Page (300):', bodyText.substring(0,300));
