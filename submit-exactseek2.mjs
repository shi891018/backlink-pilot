#!/usr/bin/env node
// Submit to exactseek.com via direct POST - check full response for success/error
const r = await fetch('https://www.exactseek.com/add.html', { headers:{'User-Agent':'Mozilla/5.0'} });
const html = await r.text();
const hidden = {};
for(const m of html.matchAll(/<input[^>]+type="hidden"[^>]*name="([^"]+)"[^>]*value="([^"]*)"[^>]*/gi)) hidden[m[1]] = m[2];

const formData = new URLSearchParams({
  ...hidden,
  url: 'https://www.unitconv.top',
  name: 'Unit Converter for Science',
  email: 'shijm1989@gmail.com',
  description: 'Free scientific unit converter for 20+ categories. Perfect for students, engineers, and researchers. No ads, no signup.',
  keywords: 'unit converter, scientific units, measurement conversion, free tool',
  agree: '1',
});
const resp = await fetch('https://www.exactseek.com/cgi-bin/eadd-t-new.cgi', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'https://www.exactseek.com/add.html',
  },
  body: formData.toString(),
  signal: AbortSignal.timeout(15000),
});
const body = await resp.text();
// Extract text content from HTML response
const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
console.log('HTTP:', resp.status);
console.log('Text (first 800):', text.substring(0, 800));
