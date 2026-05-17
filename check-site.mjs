import { BbPage } from './src/bb.js';

const url = process.argv[2];
if (!url) { console.error('Usage: node check-site.mjs <url>'); process.exit(1); }

const p = new BbPage();
await p.goto(url);
await new Promise(r => setTimeout(r, 4000));
const currentUrl = p.url();
console.log('URL:', currentUrl);
const inputs = p._bb('eval', `JSON.stringify(Array.from(document.querySelectorAll('input,textarea,select,button[type=submit]')).map(e=>({tag:e.tagName,type:e.type,name:e.name,placeholder:e.placeholder,id:e.id,text:e.textContent.trim().substring(0,50)})))`);
console.log('Inputs:', inputs);
const siteName = url.replace(/[^a-z0-9]/gi, '-');
await p.screenshot(`screenshots/${siteName}.png`);
console.log(`Screenshot saved: screenshots/${siteName}.png`);
