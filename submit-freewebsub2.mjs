#!/usr/bin/env node
// Submit to freewebsubmission.com — use submit-async.cgi (JS redirect)
const fd = new URLSearchParams();
fd.append('url', 'https://www.unitconv.top');
fd.append('Name', 'Unit Converter for Science');
fd.append('email', 'shijm1989@gmail.com');
fd.append('Agreed to Terms', 'Yes');
// Submit to a few key engines
for(const eng of ['ActiveSearchResults','Bing','Google','ExactSeek','SonicRun','SitesOnDisplay']){
  fd.append('engines', eng);
}
fd.append('submit', 'Submit Your Site');

const resp = await fetch('https://freewebsubmission.com/cgi-bin/submit-async.cgi', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
    'Referer': 'https://freewebsubmission.com/',
    'Origin': 'https://freewebsubmission.com',
  },
  body: fd.toString(),
  signal: AbortSignal.timeout(30000),
});
const body = await resp.text();
const text = body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const success = /(thank|success|submitted|complete|done|added|accepted)/i.test(body);
const error = /(error|invalid|failed|please fill)/i.test(body);
console.log('HTTP:', resp.status, '| success:', success, '| error:', error);
console.log('Response (800):', text.substring(0,800));
