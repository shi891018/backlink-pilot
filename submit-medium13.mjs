import { BbPage } from './src/bb.js';
const p = new BbPage();

const titleText = 'How to Choose the Right Unit Converter for Scientific Work';

await new Promise(r=>setTimeout(r,1000));

// Click on the textbox (ref=6) first
console.log('Clicking textbox...');
p._bb('click', '6');
await new Promise(r=>setTimeout(r,500));

// Try fill on textbox
console.log('Filling textbox...');
try {
  p._bb('fill', '6', titleText);
  console.log('Fill OK');
} catch(e) {
  console.log('Fill error:', e.message.substring(0,100));
  
  // Try typing instead
  try {
    p._bb('type', '6', titleText);
    console.log('Type OK');
  } catch(e2) {
    console.log('Type error:', e2.message.substring(0,100));
  }
}

await new Promise(r=>setTimeout(r,2000));
const titleCheck = p._bb('eval', `document.querySelector('h3')?.innerText?.substring(0,70)`);
console.log('Title:', titleCheck);
