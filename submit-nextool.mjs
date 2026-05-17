import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://nextool.ai/submit-a-tool');
await new Promise(r => setTimeout(r, 3000));
await p._bb('eval', 'window.scrollTo(0, 1400)');
await new Promise(r => setTimeout(r, 500));

await p._bb('screenshot', 'screenshots/nextool-before.png');

// Fill form
await p._bb('fill', '@17', 'Unit Converter for Science');
await p._bb('fill', '@19', 'https://www.unitconv.top');
await p._bb('fill', '@21', 'Education, Productivity, Science');
await p._bb('fill', '@23', 'Free online unit converter for science & engineering. Supports 200+ units across physics, chemistry, and math. Ideal for students, researchers, and professionals needing quick unit conversions.');
await p._bb('fill', '@25', 'shijm1989@gmail.com');

await new Promise(r => setTimeout(r, 500));
await p._bb('screenshot', 'screenshots/nextool-filled.png');
console.log('Form filled. Submitting...');

await p._bb('click', '@26');
await new Promise(r => setTimeout(r, 5000));

await p._bb('screenshot', 'screenshots/nextool-after.png');
const body = await p._bb('eval', 'document.body.innerText.slice(0, 500)');
const url = await p._bb('eval', 'location.href');
console.log('URL:', url);
console.log('Body:', body);
