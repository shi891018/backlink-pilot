import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://landing.mycloudmedia.co.uk/apps-and-websites-submit-ai-or-saas-tool/new-submission.html');
await new Promise(r => setTimeout(r, 3000));

await p._bb('screenshot', 'screenshots/mycloudmedia-before.png');

// Fill all fields by name
await p.evalFill('input[name="337f1839-9bad-4b63-bac7-904b61855b20"]', 'Shi');
await p.evalFill('input[name="5386196e-ae7f-4140-b403-db5644517c47"]', 'Jm');
await p.evalFill('input[name="e682bde7-56ab-448f-a799-209f7574a1d7"]', 'shijm1989@gmail.com');
await p.evalFill('input[name="de904e22-3fec-4812-8700-812910520f46"]', 'Unit Converter for Science');
await p.evalFill('input[name="f8f23b5b-22bf-4f70-bab8-e7b920303572"]', '+1 000 000 0000');

// Type dropdown: AI
await p._bb('eval', `document.querySelector('select[name="055fc74f-23d9-420f-a367-93276f0d0421"]').value = 'AI'`);
await p._bb('eval', `document.querySelector('select[name="055fc74f-23d9-420f-a367-93276f0d0421"]').dispatchEvent(new Event('change', {bubbles:true}))`);

// URL
await p.evalFill('input[name="46a57c52-3f9f-4bfc-92e0-99c1db697493"]', 'https://www.unitconv.top');

// Description
await p.evalFill('textarea[name="49e9e36e-aeb4-4680-a2ac-6918130aecc4"]', 'Unit Converter for Science is a free online tool for scientific and engineering unit conversions. Supports 200+ units across physics, chemistry, and math. Ideal for students, researchers, and professionals.');

// Category: Productivity
await p._bb('eval', `document.querySelector('select[name="430ece87-c5df-4ac3-9a83-047d4615ac2f"]').value = 'Productivity'`);
await p._bb('eval', `document.querySelector('select[name="430ece87-c5df-4ac3-9a83-047d4615ac2f"]').dispatchEvent(new Event('change', {bubbles:true}))`);

// Pricing: Free
await p._bb('eval', `document.querySelector('select[name="a7b16854-67c4-4b8c-930a-19cf4a7bf675"]').value = 'Free'`);
await p._bb('eval', `document.querySelector('select[name="a7b16854-67c4-4b8c-930a-19cf4a7bf675"]').dispatchEvent(new Event('change', {bubbles:true}))`);

await new Promise(r => setTimeout(r, 1000));
await p._bb('screenshot', 'screenshots/mycloudmedia-filled.png');
console.log('Form filled. Submitting...');

await p.evalClickReal('button[type="submit"]');
await new Promise(r => setTimeout(r, 5000));

await p._bb('screenshot', 'screenshots/mycloudmedia-after.png');
const url = await p._bb('eval', 'location.href');
const body = await p._bb('eval', 'document.body.innerText.slice(0,500)');
console.log('URL:', url);
console.log('Body:', body);
