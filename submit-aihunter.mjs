import { BbPage } from './src/bb.js';

const p = new BbPage();

// Accept cookies first
try { p._bb('click', '@2'); } catch(e) {} // Accept All
await new Promise(r => setTimeout(r, 1000));

// Fill form
p._bb('fill', '@11', 'Shijm');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@13', 'shijm1989@gmail.com');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@15', 'Unit Converter for Science');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@17', 'https://www.unitconv.top');
await new Promise(r => setTimeout(r, 200));

// Set category - use the select dropdown
p._bb('eval', `(function(){ var sel = document.querySelector('[name="select-1"]'); if(sel){ sel.value='Education-Assistant'; sel.dispatchEvent(new Event('change',{bubbles:true})); } })()`);
await new Promise(r => setTimeout(r, 300));

// Set pricing to Free
p._bb('eval', `(function(){ var sel = document.querySelector('[name="select-2"]'); if(sel){ sel.value='43'; sel.dispatchEvent(new Event('change',{bubbles:true})); } })()`);
await new Promise(r => setTimeout(r, 300));

p._bb('fill', '@27', 'Unit Converter for Science (unitconv.top) is a free web app for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy, frequency, and more. Built for students, engineers, and researchers who need accurate scientific unit conversions with clear SI unit relationships. No ads, no signup required, completely free.');
await new Promise(r => setTimeout(r, 200));

await p.screenshot('screenshots/aihunter-before-submit.png');
console.log('Form filled. Submitting...');

p._bb('click', '@28');
await new Promise(r => setTimeout(r, 5000));

const body = p._bb('eval', '(function(){ return document.body.innerText.substring(0,500); })()');
const url = p.url();
console.log('URL:', url);
console.log('Body:', body);
await p.screenshot('screenshots/aihunter-after-submit.png');
