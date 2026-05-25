import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// Check if save error is gone
const errorMsg = p._bb('eval', `document.body.innerText.includes('Something is wrong')`);
console.log('Has error:', errorMsg);

// Click Publish (ref=2)
const result = p._bb('click', '2');
console.log('Click Publish result:', result);

await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,300));
