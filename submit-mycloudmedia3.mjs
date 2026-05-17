import { BbPage } from './src/bb.js';

const p = new BbPage();
// Clear and refill description with ≤100 chars
const shortDesc = 'Free online unit converter for science & engineering. 200+ units across physics, chemistry & math.';
console.log('Desc length:', shortDesc.length);

await p.evalFill('textarea[name="49e9e36e-aeb4-4680-a2ac-6918130aecc4"]', shortDesc);
await new Promise(r => setTimeout(r, 500));

// Check errors
const errors = await p._bb('eval', `(function(){
  const errs = [...document.querySelectorAll('.hs-error-msg, [class*="error"]')];
  return errs.map(e => e.textContent.trim()).filter(t => t).join(' | ');
})()`);
console.log('Errors after fix:', errors);

await p._bb('screenshot', 'screenshots/mycloudmedia-ready.png');
console.log('Submitting...');

await p.evalClickReal('button[type="submit"]');
await new Promise(r => setTimeout(r, 6000));

await p._bb('screenshot', 'screenshots/mycloudmedia-submitted.png');
const url = await p._bb('eval', 'location.href');
const body = await p._bb('eval', 'document.body.innerText.slice(0, 400)');
console.log('URL:', url);
console.log('Body:', body);
