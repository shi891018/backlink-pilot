import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://www.superaitools.io/submit-a-tool');
await new Promise(r => setTimeout(r, 3000));

// Scroll to form
await p._bb('eval', 'window.scrollTo(0, 600)');
await new Promise(r => setTimeout(r, 500));

const snap = await p._bb('snapshot');
const lines = snap.split('\n').filter(l => l.includes('ref=') && (l.includes('textbox') || l.includes('combobox') || l.includes('button') || l.includes('spinbutton')));
console.log('Refs:\n', lines.slice(0,20).join('\n'));
