import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://nextool.ai/submit-a-tool');
await new Promise(r => setTimeout(r, 3000));
await p._bb('eval', 'window.scrollTo(0, document.body.scrollHeight)');
await new Promise(r => setTimeout(r, 1000));
await p._bb('screenshot', 'screenshots/nextool-bottom.png');
