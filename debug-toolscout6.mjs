import { BbPage } from './src/bb.js';

const p = new BbPage();
// Already logged in, on toolscout.ai/submit
const url = p.url();
console.log('Current URL:', url.substring(0,80));

// Direct API call to check if authenticated
const testAuth = p._bb('eval', `(async function(){
  var resp = await fetch('/workflow/start', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({test:1})});
  var text = await resp.text();
  return JSON.stringify({status: resp.status, body: text.substring(0,200)});
})()`);
console.log('Auth test:', testAuth);
