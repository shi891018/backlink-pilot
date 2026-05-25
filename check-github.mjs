import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://github.com');
await new Promise(r=>setTimeout(r,4000));
const url = p.url();
const loginState = p._bb('eval', `JSON.stringify({
  loggedIn: !!document.querySelector('[aria-label="View profile and more"]') || !!document.querySelector('.AppHeader-user'),
  signInLink: !!document.querySelector('[href*=login],[href*=signin]'),
  text: document.querySelector('[aria-label="View profile and more"]')?.getAttribute('aria-label') || document.title.substring(0,50)
})`);
console.log('URL:', url.substring(0,60));
console.log('Login state:', loginState);
