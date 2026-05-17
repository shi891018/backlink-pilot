import { BbPage } from './src/bb.js';

const p = new BbPage();
// Wait for CF7 response
await new Promise(r => setTimeout(r, 5000));

const status = await p._bb('eval', `(function(){
  const els = document.querySelectorAll('.wpcf7-response-output, [role=alert], .wpcf7-mail-sent-ok, .wpcf7-validation-errors, .wpcf7-acceptance-missing');
  return [...els].map(e => e.className + ': ' + e.textContent.trim()).join(' | ') || 'none found';
})()`);
console.log('CF7 status:', status);

// Also check all text on page
const body = await p._bb('eval', 'document.body.innerText.slice(0, 1000)');
console.log('Body:', body);

await p._bb('eval', 'window.scrollTo(0, document.body.scrollHeight)');
await p._bb('screenshot', 'screenshots/aitoolsmasters-final.png');
