import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://aitoolsmasters.com/add-ai-tools/');
await new Promise(r => setTimeout(r, 3000));

await p._bb('screenshot', 'screenshots/aitoolsmasters-before.png');

// Fill form using field names
await p.evalFill('input[name="your-name"]', 'Unit Converter for Science');
await p.evalFill('input[name="url"]', 'https://www.unitconv.top');
await p.evalFill('input[name="your-category"]', 'Education, Science, Productivity');

// PricingType: Free is already selected (first radio)
// Verify: click Free radio
await p.evalFill('input[name="PricingType"][value="Free"]', '');
await p._bb('eval', 'document.querySelector(\'input[name="PricingType"]\').click()');

// Features
await p.evalFill('textarea[name="features"]', '200+ unit conversions across physics, chemistry, and math. Supports length, mass, temperature, pressure, energy, speed, and more. Clean interface with instant results.');

// Use Cases
await p.evalFill('textarea[name="useCases"]', 'Scientific research and calculations, engineering conversions, student homework and exams, laboratory work, everyday unit conversion needs.');

await new Promise(r => setTimeout(r, 1000));
await p._bb('screenshot', 'screenshots/aitoolsmasters-filled.png');
console.log('Form filled. Submitting...');

// Submit via CF7
await p.evalClickReal('input[type="submit"]');
await new Promise(r => setTimeout(r, 5000));

await p._bb('screenshot', 'screenshots/aitoolsmasters-after.png');
const body = await p._bb('eval', 'document.body.innerText.slice(0,500)');
console.log('URL:', await p._bb('eval', 'location.href'));
console.log('Body:', body);
