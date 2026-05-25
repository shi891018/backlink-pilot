import { BbPage } from './src/bb.js';

const p = new BbPage();
// Should already be on Google account chooser from login-toolscout.mjs
// Re-navigate to avoid stale state
await p.goto('https://toolscout.ai/submit');
await new Promise(r=>setTimeout(r,5000));

// Click Login
p._bb('eval', `Array.from(document.querySelectorAll('*')).find(el => el.childNodes.length <= 2 && el.textContent.trim() === 'Login')?.click()`);
await new Promise(r=>setTimeout(r,5000));

// Now on Google account chooser — click the first account (shijm1989@gmail.com)
const url = p.url();
console.log('Current URL:', url.substring(0,80));

const acctClick = p._bb('eval', `(function(){
  // Google account chooser - click the email account
  var accts = Array.from(document.querySelectorAll('[data-email],[data-identifier]'));
  if(accts.length > 0){ accts[0].click(); return 'clicked acct: '+accts[0].getAttribute('data-email'); }
  // Try clicking the first li or div that contains an email
  var lis = Array.from(document.querySelectorAll('li,div[class*=account]'));
  var acct = lis.find(el => el.textContent.includes('@'));
  if(acct){ acct.click(); return 'clicked li with email: '+acct.textContent.trim().substring(0,50); }
  return 'no accounts found. body: '+document.body.innerText.substring(0,200);
})()`);
console.log('Account click:', acctClick);

await new Promise(r=>setTimeout(r,8000));
const afterUrl = p.url();
const afterBody = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('After URL:', afterUrl.substring(0,80));
console.log('After body:', afterBody);
