import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://toolscout.ai/submit');
await new Promise(r=>setTimeout(r,7000));

// Intercept fetch with full response capture
p._bb('eval', `(function(){
  window._responses = [];
  var origFetch = window.fetch;
  window.fetch = async function(url, opts) {
    var resp = await origFetch.apply(this, arguments);
    var clone = resp.clone();
    clone.text().then(body => {
      window._responses.push({url: url.toString(), method: (opts||{}).method||'GET', reqBody: ((opts||{}).body||'').toString().substring(0,300), status: resp.status, body: body.substring(0,400)});
    });
    return resp;
  };
})()`);

// Fill form
p._bb('eval', `(function(){
  function nativeSet(el, val) {
    var P = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(P, 'value').set.call(el, val);
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true}));
  }
  var allInputs = Array.from(document.querySelectorAll('input')).filter(i => i.type === 'text');
  if (allInputs[0]) nativeSet(allInputs[0], 'Unit Converter for Science');
  if (allInputs[1]) nativeSet(allInputs[1], 'https://www.unitconv.top');
  var desc = Array.from(document.querySelectorAll('textarea')).find(t => t.placeholder?.includes('Can It Do'));
  if (desc) nativeSet(desc, 'A precision unit converter for scientists and engineers. 200+ unit types including physics, chemistry, and astronomy.');
  var emailInp = allInputs.find(i => i.placeholder?.includes('@'));
  if (emailInp) nativeSet(emailInp, 'hi@unitconv.top');
})()`);
await new Promise(r=>setTimeout(r,1000));

// Click Submit
p._bb('eval', `Array.from(document.querySelectorAll('button')).find(b=>/submit/i.test(b.textContent))?.click()`);

await new Promise(r=>setTimeout(r,5000));

const responses = p._bb('eval', `JSON.stringify(window._responses)`);
console.log('Responses:', responses);
