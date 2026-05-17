import { BbPage } from './src/bb.js';

const p = new BbPage();
// Already on page, scroll to middle area where form should be
await p._bb('eval', 'window.scrollTo(0, 3000)');
await new Promise(r => setTimeout(r, 800));
await p._bb('screenshot', 'screenshots/nextool-middle.png');

// Try to find the form inputs' positions
const formPos = await p._bb('eval', `(function(){
  const inputs = document.querySelectorAll('input[placeholder*="ChatGPT"], input[placeholder*="yourtool"]');
  return [...inputs].map(i => {
    const r = i.getBoundingClientRect();
    return {ph: i.placeholder, top: r.top + window.scrollY, bottom: r.bottom + window.scrollY};
  });
})()`);
console.log('Form positions:', JSON.stringify(formPos));
