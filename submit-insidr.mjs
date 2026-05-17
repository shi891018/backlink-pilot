import { BbPage } from './src/bb.js';

const p = new BbPage();

p._bb('fill', '@15', 'Unit Converter for Science is a free web app for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy, frequency, force, and more. Built for students, engineers, and researchers who need accurate scientific unit conversions. No ads, no signup required.');
await new Promise(r => setTimeout(r, 300));

p._bb('fill', '@17', 'https://www.unitconv.top');
await new Promise(r => setTimeout(r, 300));

p._bb('fill', '@19', 'Education, Science, Productivity');
await new Promise(r => setTimeout(r, 300));

await p.screenshot('screenshots/insidr-before-submit.png');
console.log('Filled. Submitting...');

// Find and click submit button
await p.evalClickReal('button[type=submit]');
await new Promise(r => setTimeout(r, 5000));

const body = p._bb('eval', '(function(){ return document.body.innerText.substring(0,400); })()');
const url = p.url();
console.log('URL:', url);
console.log('Body:', body);
await p.screenshot('screenshots/insidr-after-submit.png');
