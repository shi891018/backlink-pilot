import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://www.superaitools.io/submit-a-tool');
await new Promise(r => setTimeout(r, 3000));

await p._bb('eval', 'window.scrollTo(0, 600)');
await new Promise(r => setTimeout(r, 500));

// Fill fields by ref
await p._bb('fill', '@5', 'Shi Jm');
await p._bb('fill', '@7', 'shijm1989@gmail.com');
await p._bb('fill', '@9', 'Unit Converter for Science');
await p._bb('fill', '@11', 'https://www.unitconv.top');
await p._bb('fill', '@16', 'unit converter, science, education, physics, chemistry');
await p._bb('fill', '@18', 'Free online unit converter for science & engineering. Supports 200+ units across physics, chemistry, and math. Ideal for students, researchers, and professionals.');
await new Promise(r => setTimeout(r, 500));

// Handle Pricing Model dropdown - click to open then select "Free"
await p._bb('click', '@13');
await new Promise(r => setTimeout(r, 1500));
const snap = await p._bb('snapshot');
const optLines = snap.split('\n').filter(l => l.includes('ref=') && (l.includes('option') || l.includes('menuitem') || l.includes('Free') || l.includes('Paid') || l.includes('Freemium')));
console.log('Dropdown options:', optLines.join('\n'));

await p._bb('screenshot', 'screenshots/superaitools-dropdown.png');
