import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://toolscout.ai/submit');
await new Promise(r=>setTimeout(r,7000));

// Manually call the submit endpoint
const result = p._bb('eval', `(async function(){
  try {
    var resp = await fetch('/workflow/start', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        name: 'Unit Converter for Science',
        url: 'https://www.unitconv.top',
        description: 'A precision unit converter for scientists and engineers.',
        email: 'hi@unitconv.top'
      })
    });
    var text = await resp.text();
    return JSON.stringify({status: resp.status, body: text.substring(0,500)});
  } catch(e) {
    return 'error: ' + e.message;
  }
})()`);
console.log('Direct POST result:', result);
