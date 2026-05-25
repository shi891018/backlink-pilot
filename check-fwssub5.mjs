#!/usr/bin/env node
// Check what submit.js does
const r = await fetch('https://freewebsubmission.com/submit.js', { headers:{'User-Agent':'Mozilla/5.0'} });
const js = await r.text();
console.log('submit.js content:\n', js);
