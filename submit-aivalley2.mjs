import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://aivalley.ai/submit-tool/');
await new Promise(r => setTimeout(r, 5000));

p._bb('fill', '@6', 'Shijm');
await new Promise(r => setTimeout(r, 300));
p._bb('fill', '@8', 'shijm1989@gmail.com');
await new Promise(r => setTimeout(r, 300));
p._bb('fill', '@10', 'Unit Converter for Science');
await new Promise(r => setTimeout(r, 300));
p._bb('fill', '@12', 'https://www.unitconv.top');
await new Promise(r => setTimeout(r, 300));
p._bb('fill', '@14', 'Unit Converter for Science is a free web app for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy, and frequency. Built for students, engineers, and researchers. No ads, no signup required.');
await new Promise(r => setTimeout(r, 300));
p._bb('fill', '@16', 'Free scientific unit converter for students and engineers — 20+ categories, no ads');
await new Promise(r => setTimeout(r, 300));

await p.screenshot('screenshots/aivalley-filled.png');
console.log('Using evalClickReal for submit button...');

// Use evalClickReal for React/CF7 compatibility
await p.evalClickReal('button[type=submit]');
await new Promise(r => setTimeout(r, 5000));

const body = p._bb('eval', '(function(){ return document.body.innerText.substring(0,600); })()');
const sentMsg = body.includes('sent') || body.includes('Thank') || body.includes('success') || body.includes('submitted');
console.log('Success keywords found:', sentMsg);
console.log('Body:', body.substring(0, 400));
await p.screenshot('screenshots/aivalley-after2.png');
