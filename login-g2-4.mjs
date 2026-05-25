import { BbPage } from './src/bb.js';
const p = new BbPage();
// Inspect TOS page
const structure = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,input[type=submit],a[class*=btn]'));
  var forms = Array.from(document.querySelectorAll('form'));
  return JSON.stringify({
    btns: btns.map(b=>({tag:b.tagName,text:b.textContent.trim(),type:b.type,cls:b.className.substring(0,50)})),
    forms: forms.map(f=>({action:f.action,method:f.method}))
  });
})()`);
console.log('Structure:', structure);

// Try clicking by form submit
const submitResult = p._bb('eval', `(function(){
  var form = document.querySelector('form');
  if(form){
    // Find the submit button
    var sub = form.querySelector('[type=submit]') || form.querySelector('button');
    if(sub){ sub.click(); return 'form submit clicked: '+sub.textContent; }
    form.submit(); return 'form.submit()';
  }
  return 'no form';
})()`);
console.log('Submit:', submitResult);

await new Promise(r=>setTimeout(r,5000));
const url = p.url();
console.log('After URL:', url.substring(0,80));
