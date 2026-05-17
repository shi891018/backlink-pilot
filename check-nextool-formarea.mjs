import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://nextool.ai/submit-a-tool');
await new Promise(r => setTimeout(r, 3000));

// Scroll to form area
await p._bb('eval', 'window.scrollTo(0, 1400)');
await new Promise(r => setTimeout(r, 800));
await p._bb('screenshot', 'screenshots/nextool-form-area.png');

// Get snapshot refs near form
const snap = await p._bb('snapshot');
const lines = snap.split('\n').filter(l => 
  l.includes('ref=') && (l.includes('textbox') || l.includes('button') || l.includes('combobox'))
).slice(0, 20);
console.log('Form refs:\n', lines.join('\n'));
