import { BbPage } from './src/bb.js';

const p = new BbPage();
// Clear and refill phone with valid format
await p.evalFill('input[name="f8f23b5b-22bf-4f70-bab8-e7b920303572"]', '1234567890');
await new Promise(r => setTimeout(r, 500));
await p._bb('screenshot', 'screenshots/mycloudmedia-phone-fixed.png');

// Check if phone error is gone
const phoneError = await p._bb('eval', `(function(){
  const errs = [...document.querySelectorAll('.hs-error-msg, .invalid-feedback, [class*="error"]')];
  return errs.map(e => e.textContent.trim()).filter(t => t).join(' | ');
})()`);
console.log('Errors:', phoneError);

// Submit
console.log('Submitting...');
await p.evalClickReal('button[type="submit"]');
await new Promise(r => setTimeout(r, 6000));

await p._bb('screenshot', 'screenshots/mycloudmedia-result.png');
const url = await p._bb('eval', 'location.href');
const body = await p._bb('eval', 'document.body.innerText.slice(0, 500)');
console.log('URL:', url);
console.log('Body:', body);
