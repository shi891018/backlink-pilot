import { BbPage } from './src/bb.js';
const p = new BbPage();

// Try checking the response body of the POST
const result = p._bb('eval', `(async function(){
  var form = document.querySelector('form[action*=tos_create]');
  var inputs = Array.from(form.querySelectorAll('input'));
  var data = new URLSearchParams();
  inputs.forEach(i => { if(i.name) data.append(i.name, i.value); });
  
  var resp = await fetch(form.action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json, text/javascript, */*'
    },
    body: data.toString()
  });
  var text = await resp.text();
  return JSON.stringify({status: resp.status, body: text.substring(0,300), ct: resp.headers.get('content-type')});
})()`);
console.log('Response:', result);
