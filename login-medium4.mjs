import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// Click "Sign up with Google" to create account
const clicked = p._bb('eval', `(function(){
  var links = Array.from(document.querySelectorAll('a,button'));
  var signup = links.find(b => b.textContent.toLowerCase().includes('sign up with google'));
  if(signup) { signup.click(); return 'clicked: ' + signup.textContent.trim(); }
  return 'buttons: ' + links.map(b=>b.textContent.trim().substring(0,30)).join('|');
})()`);
console.log('Clicked:', clicked);

await new Promise(r=>setTimeout(r,8000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,300));
