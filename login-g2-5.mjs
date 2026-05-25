import { BbPage } from './src/bb.js';
const p = new BbPage();

// Get form data
const formData = p._bb('eval', `(function(){
  var form = document.querySelector('form[action*=tos_create]');
  if(!form) return 'no form';
  var inputs = Array.from(form.querySelectorAll('input'));
  return JSON.stringify(inputs.map(i=>({name:i.name,value:i.value.substring(0,50),type:i.type})));
})()`);
console.log('Form data:', formData);

// Try using evalClickReal to click the submit button
const r = p._bb('evalClickReal', `document.querySelector('.btn.btn--purple.js-action')`);
console.log('evalClickReal:', r);

await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('After URL:', url.substring(0,80));
console.log('Body:', body.substring(0,200));
