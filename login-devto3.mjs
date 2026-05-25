import { BbPage } from './src/bb.js';
const p = new BbPage();

await p.goto('https://dev.to/enter');
await new Promise(r=>setTimeout(r,5000));

// Find all clickable Google elements
const info = p._bb('eval', `(function(){
  var all = Array.from(document.querySelectorAll('a,button,input[type=submit]'));
  var google = all.filter(e => e.textContent.trim().includes('Google') || e.value?.includes('Google'));
  return google.map(e => ({
    tag: e.tagName,
    text: e.textContent.trim(),
    href: e.href || '',
    onclick: e.getAttribute('onclick') || '',
    classes: e.className.substring(0,50)
  }));
})()`);
console.log('Google elements:', info);
