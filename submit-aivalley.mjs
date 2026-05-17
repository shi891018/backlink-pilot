import { BbPage } from './src/bb.js';

const p = new BbPage();

p._bb('fill', '@6', 'Shijm');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@8', 'shijm1989@gmail.com');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@10', 'Unit Converter for Science');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@12', 'https://www.unitconv.top');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@14', 'Unit Converter for Science (unitconv.top) is a free web app for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy, frequency, force, and more. Built for students, engineers, and researchers who need accurate scientific unit conversions. No ads, no signup required, completely free.');
await new Promise(r => setTimeout(r, 200));

p._bb('fill', '@16', 'Free scientific unit converter for students, engineers, and researchers — 20+ categories, no ads');
await new Promise(r => setTimeout(r, 200));

await p.screenshot('screenshots/aivalley-before-submit.png');
console.log('Form filled. Submitting...');

p._bb('click', '@17');
await new Promise(r => setTimeout(r, 5000));

const url = p.url();
const title = p._bb('eval', 'document.title');
const body = p._bb('eval', '(function(){ return document.body.innerText.substring(0,500); })()');
console.log('URL:', url);
console.log('Title:', title);
console.log('Body:', body);
await p.screenshot('screenshots/aivalley-after-submit.png');
