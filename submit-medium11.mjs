import { BbPage } from './src/bb.js';
const p = new BbPage();

// Start fresh
await p.goto('https://medium.com/new-story');
await new Promise(r=>setTimeout(r,8000));

// Get snapshot to find element refs
const snap = p._bb('snapshot', '-i', '-d', '2');
const lines = snap.split('\n').slice(0, 20);
console.log('Snapshot (first 20 lines):');
lines.forEach(l => console.log(l));
