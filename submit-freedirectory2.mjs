import { BbPage } from './src/bb.js';

const p = new BbPage();

// Fill the form - we're on add.php in Science/Instruments category
await p.evalFill('[name=linkname]', 'Unit Converter for Science');
await new Promise(r => setTimeout(r, 300));

// Clear the URL field first then fill
p._bb('eval', `(function(){ var el = document.querySelector('[name=posturl],[name=url],[name=URL]') || document.querySelector('input[value="http://"]'); if(el){el.value='https://www.unitconv.top'; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); } })()`);
await new Promise(r => setTimeout(r, 300));

await p.evalFill('[name=descriere]', 'Unit Converter for Science is a free web application for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy, frequency, and more. Built for students, engineers, and researchers who need accurate scientific unit conversions. No ads, no signup required, completely free to use.');
await new Promise(r => setTimeout(r, 300));

await p.evalFill('[name=email]', 'shijm1989@gmail.com');
await new Promise(r => setTimeout(r, 300));

// Fill captcha - read from screenshot = 8257
await p.evalFill('#txtNumber', '8257');
await new Promise(r => setTimeout(r, 300));

await p.screenshot('screenshots/freedirectory-filled.png');
console.log('Form filled, submitting...');

// Click Add URL
await p.evalClick('input[value="Add URL"], button:contains("Add URL")');
await p.evalClick('[value="Add URL"]');
await new Promise(r => setTimeout(r, 4000));

const finalUrl = p.url();
const title = p._bb('eval', 'document.title');
const body = p._bb('eval', 'document.body.innerText.substring(0,600)');
console.log('URL:', finalUrl);
console.log('Title:', title);
console.log('Body:', body);
await p.screenshot('screenshots/freedirectory-after-submit.png');
