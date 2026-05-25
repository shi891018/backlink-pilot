import { BbPage } from './src/bb.js';
const p = new BbPage();

// Navigate to Medium integration tokens settings
await p.goto('https://medium.com/me/settings/security');
await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,300));

// Look for API/integration token section
const tokenSection = p._bb('eval', `(function(){
  var all = document.body.innerText;
  var idx = all.indexOf('ntegration');
  return idx >= 0 ? all.substring(idx-20, idx+200) : 'not found';
})()`);
console.log('Token section:', tokenSection.substring(0,200));
