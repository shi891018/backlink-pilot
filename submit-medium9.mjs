import { BbPage } from './src/bb.js';
const p = new BbPage();

// Get snapshot to find element references for Medium editor
const snap = p._bb('snapshot', '-i', '-d', '3');
console.log('Snapshot:\n', snap.substring(0, 3000));
