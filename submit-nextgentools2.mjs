import { BbPage } from './src/bb.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(__dirname, 'resources', 'logo.png');

const p = new BbPage();
await p.goto('https://airtable.com/appcBtIrBPDXk1Xvv/pagn3lWWO0YPfnkB1/form');
await new Promise(r => setTimeout(r, 3000));

// Fill Tool name
await p._bb('fill', '@2', 'Unit Converter for Science');

// Select Productivity category
await p._bb('click', '@5');
await new Promise(r => setTimeout(r, 1500));
await p._bb('click', '@49');
await new Promise(r => setTimeout(r, 500));

// Fill URL - use evalFill to avoid double https://
await p.evalFill('[placeholder="https://"]', 'www.unitconv.top');
await new Promise(r => setTimeout(r, 300));

// Fill Contact First Name
await p._bb('fill', '@10', 'Shi');

// Fill Email  
await p._bb('fill', '@15', 'shijm1989@gmail.com');

// Fill Description
const desc = 'Unit Converter for Science is a free online tool for scientific and engineering unit conversions. Supports 200+ units across physics, chemistry, and math. Ideal for students, researchers, and professionals.';
await p._bb('fill', '@18', desc);

// Upload logo via file input
console.log('Uploading logo from:', logoPath);
const fileInputs = await p._bb('eval', `(function(){
  return [...document.querySelectorAll('input[type=file]')].length;
})()`);
console.log('File inputs found:', fileInputs);

// Use CDP to set file input
await p._bb('eval', `(function(){
  const fi = document.querySelector('input[type=file]');
  if(fi) { fi.style.display = 'block'; fi.style.opacity = '1'; fi.style.visibility = 'visible'; fi.style.position = 'fixed'; fi.style.top = '0'; fi.style.left = '0'; fi.style.zIndex = '9999'; return 'shown'; }
  return 'not found';
})()`);

// Try to use CDP setFiles
try {
  const client = await p._bb('cdp', 'DOM.getDocument', {});
  console.log('CDP available');
} catch(e) {
  console.log('CDP method:', e.message);
}

await p._bb('screenshot', 'screenshots/nextgentools-before-upload.png');
await p._bb('uploadFile', 'input[type=file]', logoPath);
await new Promise(r => setTimeout(r, 2000));
await p._bb('screenshot', 'screenshots/nextgentools-after-upload.png');
console.log('Upload done. Submitting...');

await p._bb('click', '@20');
await new Promise(r => setTimeout(r, 5000));
await p._bb('screenshot', 'screenshots/nextgentools-submitted.png');
const body = await p._bb('eval', 'document.body.innerText.slice(0,400)');
console.log('Result:', body);
