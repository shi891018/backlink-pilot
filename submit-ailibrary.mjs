import { BbPage } from './src/bb.js';

const p = new BbPage();

p._bb('fill', '@4', 'https://www.unitconv.top');
await new Promise(r => setTimeout(r, 300));

p._bb('fill', '@6', 'Unit Converter for Science is a free web app for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy, frequency, force, volume, and more. Built for students, engineers, and researchers who need accurate scientific unit conversions. No ads, no signup required, completely free to use. Available at unitconv.top');
await new Promise(r => setTimeout(r, 300));

p._bb('fill', '@8', 'shijm1989@gmail.com');
await new Promise(r => setTimeout(r, 300));

await p.screenshot('screenshots/ailbrary-before-submit.png');
console.log('Form filled. Submitting...');

p._bb('click', '@9');
await new Promise(r => setTimeout(r, 5000));

const url = p.url();
const body = p._bb('eval', '(function(){ return document.body.innerText.substring(0,400); })()');
console.log('URL:', url);
console.log('Body:', body);
await p.screenshot('screenshots/ailbrary-after-submit.png');
