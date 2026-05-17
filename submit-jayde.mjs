import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://www.jayde.com/submit.html');
await new Promise(r => setTimeout(r, 5000));

// Fill URL (ref=8) 
p._bb('fill', '@8', 'https://www.unitconv.top');
await new Promise(r => setTimeout(r, 300));

// Fill Email (ref=9)
p._bb('fill', '@9', 'shijm1989@gmail.com');
await new Promise(r => setTimeout(r, 300));

// Fill NAME (ref=12)
p._bb('fill', '@12', 'Shijm');
await new Promise(r => setTimeout(r, 300));

// Fill BUSINESS_NAME (ref=13)
p._bb('fill', '@13', 'Unit Converter for Science');
await new Promise(r => setTimeout(r, 300));

// Fill XDESCRIPTION (ref=20)
p._bb('fill', '@20', 'Unit Converter for Science is a free web app for converting scientific units across 20+ categories including length, mass, temperature, pressure, and energy. Built for students, engineers, and researchers.');
await new Promise(r => setTimeout(r, 300));

// Set COUNTRY to United States (ref=17)
p._bb('eval', 'document.getElementById("COUNTRY").value = "US"; document.getElementById("COUNTRY").dispatchEvent(new Event("change",{bubbles:true}))');
await new Promise(r => setTimeout(r, 300));

// Set INDUSTRY (ref=19) - try "Computers And Software" or "Internet"
p._bb('eval', 'document.getElementById("INDUSTRY").value = "Internet"; document.getElementById("INDUSTRY").dispatchEvent(new Event("change",{bubbles:true}))');
await new Promise(r => setTimeout(r, 300));

await p.screenshot('screenshots/jayde-before-submit.png');
console.log('Form filled, taking screenshot...');

// Click "Add my Site" button (ref=28)
p._bb('click', '@28');
await new Promise(r => setTimeout(r, 5000));

const finalUrl = p.url();
const title = p._bb('eval', 'document.title');
const body = p._bb('eval', 'document.body.innerText.substring(0, 500)');
console.log('Final URL:', finalUrl);
console.log('Page title:', title);
console.log('Body:', body);
await p.screenshot('screenshots/jayde-after-submit.png');
