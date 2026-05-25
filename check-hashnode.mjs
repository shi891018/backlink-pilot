import { BbPage } from './src/bb.js';
const p = new BbPage();

// Check Hashnode - has Google login
await p.goto('https://hashnode.com');
await new Promise(r=>setTimeout(r,4000));
const url = p.url();
const body = p._bb('eval', `JSON.stringify({
  url: location.href.substring(0,60),
  loggedIn: !!(document.querySelector('[href*=dashboard],[href*=profile]') && !document.querySelector('[href*=login]')),
  googleBtn: !!document.querySelector('[class*=google],[aria-label*=Google]'),
  title: document.title.substring(0,40)
})`);
console.log('Hashnode:', body);
