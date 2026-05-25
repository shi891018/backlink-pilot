#!/usr/bin/env node
// Submit to AI Valley via CF7 REST API
// Form ID: 2086 (from action: /submit-tool/#wpcf7-f2086-p2088-o1)

const fd = new FormData();
fd.append('your-name', 'Shijm');
fd.append('your-email', 'shijm1989@gmail.com');
fd.append('ToolName', 'Unit Converter for Science');
fd.append('ToolURL', 'https://www.unitconv.top');
// Optional fields
fd.append('your-message', 'Unit Converter for Science (unitconv.top) is a free web app for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy, frequency, and more. Built for students, engineers, and researchers. No ads, no signup required.');
fd.append('your-message-2', 'Free scientific unit converter - 20+ categories, no ads');

const resp = await fetch('https://aivalley.ai/wp-json/contact-form-7/v1/contact-forms/2086/feedback', {
  method: 'POST',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://aivalley.ai/submit-tool/',
    'Origin': 'https://aivalley.ai',
  },
  body: fd,
  signal: AbortSignal.timeout(15000),
});
const json = await resp.json();
console.log('HTTP:', resp.status);
console.log('Response:', JSON.stringify(json, null, 2));
