import { BbPage } from './src/bb.js';

const p = new BbPage();
// Already on the page, check result
const body = await p._bb('eval', 'document.body.innerText');
// Look for CF7 status
const status = await p._bb('eval', `(function(){
  const el = document.querySelector('.wpcf7-response-output, [aria-live], .wpcf7-mail-sent-ok, .wpcf7-validation-errors');
  return el ? el.textContent : 'no status element';
})()`);
console.log('CF7 status:', status);
await p._bb('screenshot', 'screenshots/aitoolsmasters-status.png');

// Scroll down to see submit button area
await p._bb('eval', 'window.scrollTo(0, document.body.scrollHeight)');
await new Promise(r => setTimeout(r, 1000));
await p._bb('screenshot', 'screenshots/aitoolsmasters-bottom.png');
