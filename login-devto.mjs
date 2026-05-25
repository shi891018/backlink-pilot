import { BbPage } from './src/bb.js';
const p = new BbPage();

// Login to DEV.to with Google
await p.goto('https://dev.to/enter');
await new Promise(r=>setTimeout(r,3000));

// Click "Continue with Google" button
const clicked = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('a,button'));
  var google = btns.find(b => b.textContent.includes('Continue with Google'));
  if(google) { google.click(); return 'clicked:' + google.href; }
  return 'not found';
})()`);
console.log('Google btn:', clicked);

// Wait for OAuth redirect
await new Promise(r=>setTimeout(r,8000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,300)');
console.log('After click URL:', url.substring(0,80));
console.log('Text:', text.substring(0,200));
