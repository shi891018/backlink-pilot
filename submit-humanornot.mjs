import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://www.humanornot.co/submit-tool');
await new Promise(r => setTimeout(r, 3000));

// Take before screenshot
await p._bb('screenshot', 'screenshots/humanornot-before.png');

// Fill email
await p.evalFill('input[type="email"]', 'shijm1989@gmail.com');
// Fill URL
await p.evalFill('input[type="text"]', 'https://www.unitconv.top');

await new Promise(r => setTimeout(r, 1000));
await p._bb('screenshot', 'screenshots/humanornot-filled.png');
console.log('Form filled. Submitting...');

await p.evalClickReal('input[type="submit"]');
await new Promise(r => setTimeout(r, 4000));

await p._bb('screenshot', 'screenshots/humanornot-after.png');
const body = await p._bb('eval', 'document.body.innerText.slice(0,500)');
console.log('URL:', await p._bb('eval', 'location.href'));
console.log('Body:', body);
