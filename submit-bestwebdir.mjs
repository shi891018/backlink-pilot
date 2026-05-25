#!/usr/bin/env node
// Submit to bestwebdirectory.info
const r = await fetch('https://www.bestwebdirectory.info/submit.php', { headers:{'User-Agent':'Mozilla/5.0'} });
const html = await r.text();
// Get hidden fields
const hidden = {};
for(const m of html.matchAll(/<input[^>]+type="hidden"[^>]*name="([^"]+)"[^>]*value="([^"]*)"[^>]*/gi)) hidden[m[1]] = m[2];
for(const m of html.matchAll(/<input[^>]+name="([^"]+)"[^>]*type="hidden"[^>]*value="([^"]*)"[^>]*/gi)) hidden[m[1]] = m[2];
console.log('Hidden:', JSON.stringify(hidden));

const formData = new URLSearchParams({
  ...hidden,
  url: 'https://www.unitconv.top',
  name: 'Unit Converter for Science',
  email: 'shijm1989@gmail.com',
  Classification: 'Science & Technology',
});
const resp = await fetch('https://www.bestwebdirectory.info/info.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'https://www.bestwebdirectory.info/submit.php',
  },
  body: formData.toString(),
  signal: AbortSignal.timeout(15000),
});
const body = await resp.text();
const text = body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
console.log('HTTP:', resp.status, '| Final URL:', resp.url);
console.log('Response text (500):', text.substring(0,500));
