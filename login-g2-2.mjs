import { BbPage } from './src/bb.js';
const p = new BbPage();
// Select account
p._bb('eval', `Array.from(document.querySelectorAll('[data-email],[data-identifier]'))[0]?.click()`);
await new Promise(r=>setTimeout(r,6000));
const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('After account select URL:', url.substring(0,80));
console.log('Body:', body);

// If on consent page, click 次へ
if(url.includes('accounts.google.com')) {
  const next = p._bb('eval', `Array.from(document.querySelectorAll('button')).find(b=>/次へ|continue|next/i.test(b.textContent))?.click()`);
  await new Promise(r=>setTimeout(r,8000));
  const finalUrl = p.url();
  const finalBody = p._bb('eval', 'document.body.innerText.substring(0,500)');
  console.log('Final URL:', finalUrl.substring(0,80));
  console.log('Final body:', finalBody);
}
