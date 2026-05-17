import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://ailib.ru/en/add-ai/');
await new Promise(r => setTimeout(r, 3000));

// Click "Choose a plan" for Standard (free)
const snap = await p._bb('snapshot');
console.log('Snapshot:', JSON.stringify(snap).slice(0, 2000));
await p._bb('screenshot', 'screenshots/ailib-plan.png');
