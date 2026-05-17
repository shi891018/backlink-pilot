import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://airtable.com/appcBtIrBPDXk1Xvv/pagn3lWWO0YPfnkB1/form');
await new Promise(r => setTimeout(r, 3000));

// Click category combobox to see options
await p._bb('click', '@5');
await new Promise(r => setTimeout(r, 1500));
await p._bb('screenshot', 'screenshots/nextgentools-category-open.png');

// Get the opened dropdown options
const snap2 = await p._bb('snapshot');
const lines = snap2.split('\n').filter(l => l.includes('ref=') && (l.includes('option') || l.includes('listitem') || l.includes('menuitem')));
console.log('Options:', lines.slice(0, 30).join('\n'));

// Also try getting all visible text in the dropdown
const opts = await p._bb('eval', `(function(){
  const items = [...document.querySelectorAll('[role=option],[role=menuitem],[role=listitem]')];
  return items.map(i => i.textContent.trim()).filter(t => t.length > 0);
})()`);
console.log('Option texts:', JSON.stringify(opts));
