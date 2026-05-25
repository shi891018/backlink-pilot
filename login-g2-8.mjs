import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://www.g2.com/user_sessions/login_continued');
await new Promise(r=>setTimeout(r,6000));
const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,500)');
const loginState = p._bb('eval', `JSON.stringify({
  signInBtn: !!document.querySelector('[href*=signin],[href*=login],[class*=sign-in]'),
  avatar: !!document.querySelector('[class*=avatar]'),
  userName: document.querySelector('[class*=user-name],[class*=username],[aria-label*=profile]')?.textContent?.trim()
})`);
console.log('URL:', url.substring(0,80));
console.log('Login state:', loginState);
console.log('Body:', body.substring(0,300));
