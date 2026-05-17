import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://www.superaitools.io/submit-a-tool');
await new Promise(r => setTimeout(r, 5000)); // longer wait for Wix

await p._bb('eval', 'window.scrollTo(0, 700)');
await new Promise(r => setTimeout(r, 1500));

const snap = await p._bb('snapshot');
const lines = snap.split('\n').filter(l => l.includes('ref=') && (l.includes('textbox') || l.includes('combobox') || l.includes('button') || l.includes('listbox') || l.includes('option')));
console.log('Refs:\n', lines.join('\n'));
