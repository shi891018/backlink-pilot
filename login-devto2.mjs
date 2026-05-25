import { BbPage } from './src/bb.js';
const p = new BbPage();

// Navigate and verify we're on dev.to
await p.goto('https://dev.to/enter');
await new Promise(r=>setTimeout(r,5000));
const curUrl = p.url();
console.log('Current URL:', curUrl.substring(0,80));

if (!curUrl.includes('dev.to')) {
  console.log('Not on dev.to, trying again');
  await p.goto('https://dev.to/enter');
  await new Promise(r=>setTimeout(r,5000));
}

const text = p._bb('eval', 'document.body.innerText.substring(0,200)');
console.log('Page text:', text);

// Find Google button href
const googleHref = p._bb('eval', `(function(){
  var links = Array.from(document.querySelectorAll('a'));
  var g = links.find(a => a.textContent.trim().includes('Google'));
  return g ? g.href : 'not found';
})()`);
console.log('Google href:', googleHref);
