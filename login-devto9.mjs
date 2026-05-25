import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));
const url = p.url();
console.log('URL:', url.substring(0,80));

// Fill onboarding form
// Fill name field
const nameFilled = p._bb('eval', `(function(){
  var nameInput = document.querySelector('input[placeholder*=name],input[name=name],input[id*=name]');
  if(!nameInput) {
    var inputs = document.querySelectorAll('input[type=text],input:not([type])');
    nameInput = inputs[0];
  }
  if(nameInput) {
    nameInput.value = '';
    nameInput.dispatchEvent(new Event('input', {bubbles:true}));
    nameInput.focus();
    return 'found: ' + nameInput.id + ' ' + nameInput.placeholder;
  }
  return 'no name input';
})()`);
console.log('Name input:', nameFilled);

// Check current form fields
const fields = p._bb('eval', `(function(){
  return Array.from(document.querySelectorAll('input,textarea')).map(e => ({
    tag: e.tagName, type: e.type, id: e.id, name: e.name, 
    placeholder: e.placeholder, value: e.value.substring(0,30)
  }));
})()`);
console.log('Fields:', JSON.stringify(fields, null, 2));
