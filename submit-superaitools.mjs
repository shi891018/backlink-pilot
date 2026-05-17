import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://www.superaitools.io/submit-a-tool');
await new Promise(r => setTimeout(r, 3000));

await p._bb('screenshot', 'screenshots/superaitools-before.png');

// Fill by ID
await p.evalFill('#form1-Yourname-845622360', 'Shi Jm');
await p.evalFill('#form1-Youremailaddress-1055599683', 'shijm1989@gmail.com');
await p.evalFill('#form1-ToolName-90177075', 'Unit Converter for Science');
await p.evalFill('#form1-ToolURL--689821497', 'https://www.unitconv.top');
await p.evalFill('#form1-Pricingmodel--2090496945', 'Free');
await p.evalFill('#form1-ToolTags-90355649', 'unit converter, science, education, physics, chemistry, math');
await p.evalFill('#form1-ToolDescription-272962388', 'Free online unit converter for science & engineering. Supports 200+ units across physics, chemistry, and math. Ideal for students, researchers, and professionals needing quick unit conversions.');

await new Promise(r => setTimeout(r, 1000));
await p._bb('screenshot', 'screenshots/superaitools-filled.png');
console.log('Form filled. Submitting...');

await p.evalClickReal('button[type="submit"]');
await new Promise(r => setTimeout(r, 5000));

await p._bb('screenshot', 'screenshots/superaitools-after.png');
const url = await p._bb('eval', 'location.href');
const body = await p._bb('eval', 'document.body.innerText.slice(0, 500)');
console.log('URL:', url);
console.log('Body:', body);
