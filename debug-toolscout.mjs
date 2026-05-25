import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://toolscout.ai/submit');
await new Promise(r=>setTimeout(r,7000));
const r = p._bb('eval', `JSON.stringify(Array.from(document.querySelectorAll('input')).map(i=>({type:i.type,ph:i.placeholder,id:i.id,name:i.name})))`);
console.log('All inputs:', r);
const labels = p._bb('eval', `JSON.stringify(Array.from(document.querySelectorAll('label, [class*=label]')).map(l=>l.textContent.trim()).filter(t=>t))`);
console.log('Labels:', labels);
