import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://www.producthunt.com/');
await new Promise(r=>setTimeout(r,5000));
const url = p.url();
// Check if logged in
const loggedIn = p._bb('eval', `(function(){
  var signIn = Array.from(document.querySelectorAll('a,button')).find(el => /sign in|log in/i.test(el.textContent));
  var avatar = document.querySelector('[class*=avatar],[class*=Avatar]');
  return JSON.stringify({signInText: signIn?.textContent?.trim(), hasAvatar: !!avatar, nav: document.querySelector('nav')?.innerText?.substring(0,200)});
})()`);
console.log('URL:', url.substring(0,80));
console.log('Auth state:', loggedIn);
