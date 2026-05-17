import { BbPage } from './src/bb.js';

const p = new BbPage();

// Click "Add URL" button - it was ref=22 in earlier snapshot
// Try using bb click on the ref or by element
p._bb('click', '@22');
await new Promise(r => setTimeout(r, 5000));

const finalUrl = p.url();
const title = p._bb('eval', 'document.title');
const body = p._bb('eval', '(function(){ return document.body.innerText.substring(0,600); })()');
console.log('URL:', finalUrl);
console.log('Title:', title);
console.log('Body:', body);
await p.screenshot('screenshots/freedirectory-after-submit.png');
