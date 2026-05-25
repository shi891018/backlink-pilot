#!/usr/bin/env node
// Check the full response from bestwebdirectory.info
const r = await fetch('https://www.bestwebdirectory.info/submit.php', { headers:{'User-Agent':'Mozilla/5.0'} });
const html = await r.text();
const formData = new URLSearchParams({
  url: 'https://www.unitconv.top',
  name: 'Unit Converter for Science',
  email: 'shijm1989@gmail.com',
  Classification: 'Science & Technology',
});
const resp = await fetch('https://www.bestwebdirectory.info/info.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.bestwebdirectory.info/submit.php' },
  body: formData.toString(),
  signal: AbortSignal.timeout(15000),
});
const body = await resp.text();
// Check for success/error keywords
const lower = body.toLowerCase();
const success = /(thank|success|submitted|received|added|listed)/i.test(body);
const error = /(error|invalid|failed|already|duplicate)/i.test(body);
const text = body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
console.log('success:', success, '| error:', error);
console.log('Text (1000):', text.substring(0,1000));
