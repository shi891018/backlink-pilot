import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://toolscout.ai/submit');
await new Promise(r=>setTimeout(r,5000));

// Find and click the Login nav link
const loginResult = p._bb('eval', `(function(){
  // Try header nav Login link
  var allEls = Array.from(document.querySelectorAll('a[href],button'));
  var login = allEls.find(el => el.textContent.trim() === 'Login' || el.textContent.trim() === 'Sign In');
  if(login){ login.click(); return 'clicked: ' + (login.href||login.textContent); }
  // Try any element with Login text
  var anyLogin = Array.from(document.querySelectorAll('*')).find(el => el.childNodes.length <= 2 && el.textContent.trim() === 'Login');
  if(anyLogin){ anyLogin.click(); return 'clicked any: ' + anyLogin.tagName; }
  return 'no login found';
})()`);
console.log('Login click:', loginResult);

await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,600)');
console.log('URL:', url);
console.log('Body:', body);
