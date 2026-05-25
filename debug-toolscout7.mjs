import { BbPage } from './src/bb.js';

const p = new BbPage();
console.log('URL:', p.url()?.substring(0,80));

// Check cookies
const cookies = p._bb('eval', `document.cookie.substring(0,500)`);
console.log('Cookies:', cookies);

// Check localStorage for auth tokens
const ls = p._bb('eval', `(function(){
  var keys = Object.keys(localStorage);
  var res = {};
  keys.forEach(k => { if(/token|auth|user|session/i.test(k)) res[k] = localStorage[k].substring(0,100); });
  return JSON.stringify(res);
})()`);
console.log('LocalStorage auth:', ls);

// Check if there's user info in the page
const userInfo = p._bb('eval', `(function(){
  var text = document.body.innerText;
  var hasEmail = text.includes('shijm') || text.includes('@gmail');
  var hasLogin = text.includes('Login');
  var navText = document.querySelector('nav,header')?.innerText?.trim();
  return JSON.stringify({hasEmail, hasLogin, navText: (navText||'').substring(0,100)});
})()`);
console.log('User info:', userInfo);
