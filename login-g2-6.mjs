import { BbPage } from './src/bb.js';
const p = new BbPage();

// Submit the TOS form directly via fetch
const result = p._bb('eval', `(async function(){
  var form = document.querySelector('form[action*=tos_create]');
  if(!form) return 'no form';
  var inputs = Array.from(form.querySelectorAll('input'));
  var data = new URLSearchParams();
  inputs.forEach(i => { if(i.name) data.append(i.name, i.value); });
  
  var resp = await fetch(form.action, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: data.toString()
  });
  return JSON.stringify({status: resp.status, url: resp.url.substring(0,80), redirected: resp.redirected});
})()`);
console.log('POST result:', result);

await new Promise(r=>setTimeout(r,3000));
const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('After URL:', url.substring(0,80));
console.log('Body:', body.substring(0,200));
