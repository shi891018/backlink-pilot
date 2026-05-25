import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://ai-hunter.io/submit-ai-tool/');
await new Promise(r=>setTimeout(r,5000));

function fillByName(name, value) {
  return p._bb('eval', `(function(){
    var el = document.querySelector('[name="${name}"]');
    if(!el) return 'nf:${name}';
    var P = el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(P,'value').set.call(el,${JSON.stringify(value)});
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    return 'ok';
  })()`);
}

console.log('name:', fillByName('name-1', 'Shijm'));
console.log('email:', fillByName('email-1', 'hi@unitconv.top'));
console.log('toolname:', fillByName('name-3', 'Unit Converter for Science'));
console.log('url:', fillByName('url-1', 'https://www.unitconv.top'));
console.log('desc:', fillByName('textarea-1', 'A precision unit converter for scientists, engineers, and students. Supports 200+ unit types across physics, chemistry, astronomy, and engineering. Features scientific notation, instant conversion, and a clean mobile-friendly interface. Completely free at unitconv.top.'));

// Select category
const catResult = p._bb('eval', `(function(){
  var sel = document.querySelector('[name="select-1"]');
  if(!sel) return 'no category select';
  var opts = Array.from(sel.options);
  var matching = opts.find(o => /data|science|productivity|utilities|calculator/i.test(o.text));
  if(!matching) matching = opts[1]; // first non-empty option
  if(matching){ matching.selected=true; sel.dispatchEvent(new Event('change',{bubbles:true})); return 'selected: '+matching.text; }
  return 'no matching: '+opts.map(o=>o.text).join(', ');
})()`);
console.log('Category:', catResult);

await new Promise(r=>setTimeout(r,1000));

// Submit
const submitResult = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button[type=submit],input[type=submit],.forminator-btn-submit'));
  var btn = btns.find(b => !b.disabled);
  if(btn){ btn.click(); return 'clicked: '+btn.textContent.trim(); }
  return 'no submit. btns: '+btns.length;
})()`);
console.log('Submit:', submitResult);

await new Promise(r=>setTimeout(r,8000));
const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,500)');
const success = p._bb('eval', `document.querySelector('.forminator-success-notice,.forminator-response-message,[class*=success]')?.textContent?.trim()`);
console.log('After URL:', url.substring(0,80));
console.log('Success msg:', success);
console.log('Body:', body.substring(0,300));
