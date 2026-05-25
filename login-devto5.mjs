import { BbPage } from './src/bb.js';
const p = new BbPage();

// Google account chooser should be loaded
await new Promise(r=>setTimeout(r,1000));
const url = p.url();
console.log('URL:', url.substring(0,80));

// Click the account (史鏡明 / shijm1989@gmail.com)
const clicked = p._bb('eval', `(function(){
  var items = Array.from(document.querySelectorAll('[data-authuser],[role=listitem],li'));
  var account = items.find(e => e.textContent.includes('shijm1989'));
  if(account) { account.click(); return 'clicked account'; }
  // Try clicking any account
  var allItems = Array.from(document.querySelectorAll('[data-identifier],[class*=account]'));
  if(allItems[0]) { allItems[0].click(); return 'clicked first account'; }
  return 'not found';
})()`);
console.log('Clicked:', clicked);

await new Promise(r=>setTimeout(r,8000));
const url2 = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,300)');
console.log('After URL:', url2.substring(0,80));
console.log('Text:', text.substring(0,200));
