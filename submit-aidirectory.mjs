import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://www.aidirectory.org/user-submit/');
await new Promise(r=>setTimeout(r,5000));

// Extract nonce
const nonce = p._bb('eval', `document.getElementById('_wpnonce')?.value`);
const formId = p._bb('eval', `document.querySelector('[name=form_id]')?.value`);
const pageId = p._bb('eval', `document.querySelector('[name=page_id]')?.value`);
console.log('nonce:', nonce, 'formId:', formId, 'pageId:', pageId);

// Fill form using name attributes
function fillByName(name, value) {
  return p._bb('eval', `(function(){
    var el = document.querySelector('[name="${name}"]');
    if(!el) return 'nf:${name}';
    var P = el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(P,'value').set.call(el,${JSON.stringify(value)});
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    return 'ok:${name}';
  })()`);
}

fillByName('post_title', 'Unit Converter for Science');
fillByName('company_name', 'UnitConv');
fillByName('website_address', 'https://www.unitconv.top');
fillByName('email', 'hi@unitconv.top');
fillByName('country', 'Japan');
fillByName('post_content', 'A precision unit converter for scientists, engineers, and students. Supports 200+ unit types across physics, chemistry, astronomy, and engineering with scientific notation support. Free tool available at unitconv.top.');

// Select category
p._bb('eval', `(function(){
  var sel = document.getElementById('category');
  if(sel){
    Array.from(sel.options).forEach(o => { if(/data|analytic|productivity/i.test(o.text)) o.selected = true; });
    sel.dispatchEvent(new Event('change',{bubbles:true}));
  }
})()`);

await new Promise(r=>setTimeout(r,1000));

// Submit
const submitResult = p._bb('eval', `(function(){
  var sub = document.querySelector('[name=submit]');
  if(sub){ sub.click(); return 'clicked submit'; }
  return 'no submit btn';
})()`);
console.log('Submit:', submitResult);

await new Promise(r=>setTimeout(r,6000));
const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('After URL:', url);
console.log('After body:', body);
