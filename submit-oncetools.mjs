import { BbPage } from './src/bb.js';

const p = new BbPage();

// Fill all fields
p._bb('fill', '@2', 'Shijm');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@4', 'shijm1989@gmail.com');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@6', 'Unit Converter for Science');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@8', 'https://www.unitconv.top');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@10', 'Free scientific unit converter for 20+ categories — no ads, no signup');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@12', 'Unit Converter for Science (unitconv.top) is a free web app for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy, frequency, and more. Built for students, engineers, and researchers who need accurate scientific unit conversions. No ads, no signup required.');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@14', 'Free');
await new Promise(r => setTimeout(r, 200));

await p.screenshot('screenshots/once-tools-before-submit.png');
console.log('Form filled. Submitting...');

p._bb('click', '@17');
await new Promise(r => setTimeout(r, 5000));

const url = p.url();
const title = p._bb('eval', 'document.title');
const body = p._bb('eval', '(function(){ return document.body.innerText.substring(0,500); })()');
console.log('URL:', url);
console.log('Title:', title);
console.log('Body:', body);
await p.screenshot('screenshots/once-tools-after-submit.png');
