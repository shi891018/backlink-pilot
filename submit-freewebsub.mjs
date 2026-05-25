#!/usr/bin/env node
// Submit to freewebsubmission.com — CGI multi-engine submission
// Get the full form to extract hidden fields and engine values
const r = await fetch('https://freewebsubmission.com/', { headers:{'User-Agent':'Mozilla/5.0'} });
const html = await r.text();

const hidden = {};
for(const m of html.matchAll(/<input[^>]+type="hidden"[^>]*name="([^"]+)"[^>]*value="([^"]*)"[^>]*/gi)) hidden[m[1]] = m[2];
for(const m of html.matchAll(/<input[^>]+name="([^"]+)"[^>]*type="hidden"[^>]*value="([^"]*)"[^>]*/gi)) hidden[m[1]] = m[2];

// Get all engine checkbox values
const engines = [...html.matchAll(/name="engines"\s+value="([^"]+)"/gi)].map(m=>m[1]);
console.log('Hidden:', JSON.stringify(hidden));
console.log('Engines (first 5):', engines.slice(0,5));

// Build form data (URLSearchParams handles duplicate keys via append)
const fd = new URLSearchParams();
for(const [k, v] of Object.entries(hidden)) fd.append(k, v);
fd.append('url', 'https://www.unitconv.top');
fd.append('Name', 'Unit Converter for Science');
fd.append('email', 'shijm1989@gmail.com');
fd.append('Agreed to Terms', '1');
// Submit to all available engines
for(const eng of engines) fd.append('engines', eng);

console.log('Submitting to', engines.length, 'engines...');
const resp = await fetch('https://freewebsubmission.com/cgi-bin/submit.cgi', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'https://freewebsubmission.com/',
  },
  body: fd.toString(),
  signal: AbortSignal.timeout(30000),
});
const body = await resp.text();
const text = body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const success = /(thank|success|submitted|received|complete|done)/i.test(body);
const error = /(error|invalid|failed)/i.test(body);
console.log('HTTP:', resp.status, '| success:', success, '| error:', error);
console.log('Response (800):', text.substring(0,800));
