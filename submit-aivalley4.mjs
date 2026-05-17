import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://aivalley.ai/submit-tool/');
await new Promise(r => setTimeout(r, 6000));

// Fill all fields
await p.evalFill('input[name="your-name"]', 'Shijm');
await new Promise(r => setTimeout(r, 300));
await p.evalFill('input[name="your-email"]', 'shijm1989@gmail.com');
await new Promise(r => setTimeout(r, 300));
await p.evalFill('input[name="ToolName"]', 'Unit Converter for Science');
await new Promise(r => setTimeout(r, 300));
await p.evalFill('input[name="ToolURL"]', 'https://www.unitconv.top');
await new Promise(r => setTimeout(r, 300));
p._bb('eval', `(function(){
  var tas = document.querySelectorAll('textarea[name="your-message"]');
  if(tas[0]){tas[0].value='Unit Converter for Science is a free web app for converting scientific units across 20+ categories. Built for students, engineers, and researchers. No ads, no signup.'; tas[0].dispatchEvent(new Event('input',{bubbles:true}));}
  if(tas[1]){tas[1].value='Free scientific unit converter - 20+ categories, no ads'; tas[1].dispatchEvent(new Event('input',{bubbles:true}));}
})()`);
await new Promise(r => setTimeout(r, 300));

// Get snapshot to find submit button ref  
const snap = await p.snapshot();
const lines = snap.split('\n');
const submitLine = lines.find(l => l.includes('Submit') && l.includes('[ref='));
console.log('Submit button line:', submitLine);

// Click the button submit (should be ref=17)
p._bb('click', '@17');
await new Promise(r => setTimeout(r, 5000));

const body = p._bb('eval', '(function(){ return document.body.innerText.substring(0,400); })()');
const url = p.url();
console.log('Final URL:', url);
console.log('Body:', body);
await p.screenshot('screenshots/aivalley-final.png');
