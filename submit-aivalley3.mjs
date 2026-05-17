import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://aivalley.ai/submit-tool/');
await new Promise(r => setTimeout(r, 6000));

// Get fresh snapshot to get current refs
const snap = await p.snapshot();
console.log(snap.substring(0, 500));

// Use evalFill with selectors instead of refs
await p.evalFill('input[name="your-name"]', 'Shijm');
await new Promise(r => setTimeout(r, 300));
await p.evalFill('input[name="your-email"]', 'shijm1989@gmail.com');
await new Promise(r => setTimeout(r, 300));
await p.evalFill('input[name="ToolName"]', 'Unit Converter for Science');
await new Promise(r => setTimeout(r, 300));
await p.evalFill('input[name="ToolURL"]', 'https://www.unitconv.top');
await new Promise(r => setTimeout(r, 300));

// Fill both message textareas
p._bb('eval', `(function(){
  var tas = document.querySelectorAll('textarea[name="your-message"]');
  if(tas[0]){tas[0].value='Unit Converter for Science is a free web app for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy, and frequency. Built for students, engineers, and researchers. No ads, no signup required.'; tas[0].dispatchEvent(new Event('input',{bubbles:true}));}
  if(tas[1]){tas[1].value='Free scientific unit converter — 20+ categories, no ads, for students and researchers'; tas[1].dispatchEvent(new Event('input',{bubbles:true}));}
})()`);
await new Promise(r => setTimeout(r, 300));

await p.screenshot('screenshots/aivalley-filled2.png');
console.log('Filled. Submitting with evalClickReal...');

await p.evalClickReal('button[type=submit]');
await new Promise(r => setTimeout(r, 5000));

const body = p._bb('eval', '(function(){ return document.body.innerText.substring(0,500); })()');
console.log('Body:', body);
await p.screenshot('screenshots/aivalley-result.png');
