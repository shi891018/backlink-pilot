import { BbPage } from './src/bb.js';
const p = new BbPage();

const titleText = 'How to Choose the Right Unit Converter for Scientific Work';
const bodyIntro = 'Unit conversion is a daily task for scientists, engineers, and researchers. But not all converters are equal.';

await new Promise(r=>setTimeout(r,1000));

// Fill title using heading ref=10
console.log('Filling title...');
p._bb('fill', '10', titleText);
await new Promise(r=>setTimeout(r,1000));

// Check title was set
const titleCheck = p._bb('eval', `document.querySelector('h3')?.innerText?.substring(0,70)`);
console.log('Title after fill:', titleCheck);

// Press Enter to move to body
console.log('Pressing Enter...');
p._bb('press', 'Enter');
await new Promise(r=>setTimeout(r,500));

// Now type the body text
const bodyFull = `Unit conversion is a daily task for scientists, engineers, and researchers. But not all converters are equal.

Most online converters give you a number and nothing else. For academic work, lab reports, or engineering calculations, you need the formula and derivation — not just the result.

Unit Converter for Science (unitconv.top) takes a different approach. It covers 11 categories: length, mass, time, velocity, area, volume, temperature, energy, force, pressure, and concentration.

For each conversion, it shows the formula and step-by-step derivation. Try it at https://www.unitconv.top

When choosing a unit converter for technical work, look for:
- Formula transparency (shows derivation)
- Full SI unit support
- Scientific categories
- Mobile-friendly interface

For scientific and engineering work, a tool that shows its work is far more valuable than a black-box calculator.`;

console.log('Typing body...');
p._bb('type', '12', bodyFull.substring(0, 200));

await new Promise(r=>setTimeout(r,3000));
const snap2 = p._bb('snapshot', '-i', '-d', '2');
const lines = snap2.split('\n').slice(0, 15);
console.log('After typing:');
lines.forEach(l => console.log(l));
