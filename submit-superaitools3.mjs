import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://www.superaitools.io/submit-a-tool');
await new Promise(r => setTimeout(r, 3000));

await p._bb('eval', 'window.scrollTo(0, 600)');
await new Promise(r => setTimeout(r, 500));

// Fill fields
await p._bb('fill', '@5', 'Shi Jm');
await p._bb('fill', '@7', 'shijm1989@gmail.com');
await p._bb('fill', '@9', 'Unit Converter for Science');
await p._bb('fill', '@11', 'https://www.unitconv.top');
await p._bb('fill', '@16', 'unit converter, science, education, physics, chemistry');
await p._bb('fill', '@18', 'Free online unit converter for science & engineering. Supports 200+ units across physics, chemistry, and math. Ideal for students, researchers, and professionals.');
await new Promise(r => setTimeout(r, 500));

// Select pricing model
await p._bb('click', '@13'); // open dropdown
await new Promise(r => setTimeout(r, 1500));
await p._bb('click', '@25'); // click "Free" option
await new Promise(r => setTimeout(r, 1000));

// Take before-submit screenshot
await p._bb('screenshot', 'screenshots/superaitools-filled.png');
console.log('Form filled. Submitting...');

// Submit
await p._bb('click', '@21');
await new Promise(r => setTimeout(r, 6000));

await p._bb('screenshot', 'screenshots/superaitools-after.png');
const url = await p._bb('eval', 'location.href');
const body = await p._bb('eval', 'document.body.innerText.slice(0,600)');
console.log('URL:', url);
console.log('Body:', body);
