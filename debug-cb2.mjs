import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://www.crunchbase.com/edit');
await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,800)');
console.log('URL:', url.substring(0,60));
console.log('Body:', body);

// Find save button
const btns = p._bb('eval', `JSON.stringify(Array.from(document.querySelectorAll('button')).map(b=>({text:b.textContent.trim(),disabled:b.disabled})).filter(b=>b.text))`);
console.log('Buttons:', btns);
