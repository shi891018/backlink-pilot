import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://nextgentools.me/submit-your-tool');
await new Promise(r => setTimeout(r, 4000));

// Scroll down to see the form
await p._bb('eval', 'window.scrollTo(0, 800)');
await new Promise(r => setTimeout(r, 2000));
await p._bb('screenshot', 'screenshots/nextgentools-scrolled.png');

// Check for iframes
const iframes = await p._bb('eval', `(function(){
  return [...document.querySelectorAll('iframe')].map(f => ({src: f.src, id: f.id, class: f.className}));
})()`);
console.log('Iframes:', JSON.stringify(iframes));
