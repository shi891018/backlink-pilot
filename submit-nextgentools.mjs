import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://airtable.com/appcBtIrBPDXk1Xvv/pagn3lWWO0YPfnkB1/form');
await new Promise(r => setTimeout(r, 3000));

await p._bb('screenshot', 'screenshots/nextgentools-before.png');
console.log('Filling Tool name...');
await p._bb('fill', '@2', 'Unit Converter for Science');

// Click category combobox
console.log('Opening category...');
await p._bb('click', '@5');
await new Promise(r => setTimeout(r, 1500));

// Get snapshot after dropdown opens to find Productivity ref
const snap = await p._bb('snapshot');
const lines = snap.split('\n');
const prodLine = lines.find(l => l.includes('"Productivity"'));
console.log('Productivity line:', prodLine);

// Click Productivity option
await p._bb('click', '@49');
await new Promise(r => setTimeout(r, 1000));

// Fresh snapshot after category selected
const snap2 = await p._bb('snapshot');
const lines2 = snap2.split('\n').filter(l => l.includes('ref=') && (l.includes('textbox') || l.includes('combobox') || l.includes('button')));
console.log('After category - refs:\n', lines2.slice(0, 20).join('\n'));

await p._bb('screenshot', 'screenshots/nextgentools-category-selected.png');

// Fill URL (contenteditable div - use evalFill)
console.log('Filling URL...');
await p.evalFill('[placeholder="https://"]', 'https://www.unitconv.top');
// Fallback: try fill by ref
await p._bb('fill', '@8', 'https://www.unitconv.top');

// Fill Contact First Name
console.log('Filling contact name...');
await p._bb('fill', '@10', 'Shi');

// Fill Email
console.log('Filling email...');
await p._bb('fill', '@15', 'shijm1989@gmail.com');

// Fill Description
console.log('Filling description...');
const desc = 'Unit Converter for Science is a free online tool for scientific and engineering unit conversions. Supports 200+ units across physics, chemistry, and math. Ideal for students, researchers, and professionals.';
await p._bb('fill', '@18', desc);

await new Promise(r => setTimeout(r, 1000));
await p._bb('screenshot', 'screenshots/nextgentools-filled.png');
console.log('Form filled. Submitting...');

await p._bb('click', '@20');
await new Promise(r => setTimeout(r, 4000));
await p._bb('screenshot', 'screenshots/nextgentools-after.png');
const url = await p._bb('eval', 'location.href');
const body = await p._bb('eval', 'document.body.innerText.slice(0,400)');
console.log('URL:', url);
console.log('Body:', body);
