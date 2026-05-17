import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://airtable.com/appcBtIrBPDXk1Xvv/pagn3lWWO0YPfnkB1/form');
await new Promise(r => setTimeout(r, 3000));

// Get snapshot to find refs
const snap = await p._bb('snapshot');
// Print relevant portion
const lines = snap.split('\n').filter(l => 
  l.includes('ref=') || l.includes('combobox') || l.includes('listbox') || 
  l.includes('option') || l.includes('textbox') || l.includes('category') ||
  l.includes('Category') || l.includes('Tool name') || l.includes('URL') ||
  l.includes('Email') || l.includes('Description')
);
console.log(lines.slice(0, 60).join('\n'));
