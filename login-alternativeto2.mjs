import { BbPage } from './src/bb.js';
const p = new BbPage();
// On Google account chooser
const acctClick = p._bb('eval', `(function(){
  var accts = Array.from(document.querySelectorAll('[data-email],[data-identifier]'));
  if(accts.length > 0){ accts[0].click(); return 'clicked: '+accts[0].getAttribute('data-email'); }
  var lis = Array.from(document.querySelectorAll('li,div'));
  var acct = lis.find(el => el.textContent.includes('shijm1989'));
  if(acct){ acct.click(); return 'clicked shijm1989 div'; }
  return 'not found. body: '+document.body.innerText.substring(0,100);
})()`);
console.log('Account click:', acctClick);

await new Promise(r=>setTimeout(r,8000));
const afterUrl = p.url();
const afterBody = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('After URL:', afterUrl.substring(0,80));
console.log('After body:', afterBody);
