import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://airtable.com/appcBtIrBPDXk1Xvv/pagn3lWWO0YPfnkB1/form');
await new Promise(r => setTimeout(r, 3000));

// Get the category dropdown options
const snap = await p._bb('snapshot');
// Find category select
const cats = await p._bb('eval', `(function(){
  const selects = [...document.querySelectorAll('select')];
  return selects.map(s => ({id: s.id, options: [...s.options].map(o => o.text + ':' + o.value)}));
})()`);
console.log('Select options:', JSON.stringify(cats));

// Also check combobox/listbox
const combos = await p._bb('eval', `(function(){
  const roles = [...document.querySelectorAll('[role=option],[role=listbox],[role=combobox]')];
  return roles.slice(0,30).map(r => ({role: r.getAttribute('role'), text: r.textContent.slice(0,50)}));
})()`);
console.log('Combos:', JSON.stringify(combos));
