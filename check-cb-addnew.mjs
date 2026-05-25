import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://www.crunchbase.com/add-new');
await new Promise(r=>setTimeout(r,5000));

const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,600)');
console.log('URL:', url.substring(0,80));
console.log('Body:', body);

// Check for entity type options
const options = p._bb('eval', `JSON.stringify(Array.from(document.querySelectorAll('button,a,[role=button],[class*=option]')).filter(el=>el.textContent.trim()).map(el=>el.textContent.trim()).slice(0,15))`);
console.log('Options:', options);
