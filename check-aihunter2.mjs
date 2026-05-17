import { BbPage } from './src/bb.js';

const p = new BbPage();
// Should be on ai-hunter page already
const url = p.url();
console.log('Current URL:', url);

if (!url.includes('ai-hunter')) {
  await p.goto('https://ai-hunter.io/submit-ai-tool/');
  await new Promise(r => setTimeout(r, 5000));
}

// Get fresh snapshot
const snap = await p.snapshot();
const nameField = snap.match(/\[ref=(\d+)\].*?First Name/);
console.log('Name field:', nameField?.[1]);
console.log(snap.substring(0, 1500));
