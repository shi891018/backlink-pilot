import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://github.com/login');
await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('URL:', url.substring(0,80));
console.log('Body:', body);
