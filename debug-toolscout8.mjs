import { BbPage } from './src/bb.js';

const p = new BbPage();
// Navigate fresh to set up interceptor before form loads
await p.goto('https://toolscout.ai/submit');
await new Promise(r=>setTimeout(r,2000));

// Set up fetch interceptor EARLY
p._bb('eval', `(function(){
  window._reqs = [];
  var origFetch = window.fetch;
  window.fetch = async function(url, opts) {
    var body = '';
    if(opts && opts.body) {
      if(typeof opts.body === 'string') body = opts.body;
      else if(opts.body instanceof FormData) {
        var parts = [];
        opts.body.forEach((v,k) => parts.push(k+'='+v));
        body = parts.join('&');
      }
    }
    var entry = {url: url.toString(), method: (opts||{}).method||'GET', body: body.substring(0,500)};
    window._reqs.push(entry);
    var resp = await origFetch.apply(this, arguments);
    var clone = resp.clone();
    clone.text().then(t => { entry.status = resp.status; entry.respBody = t.substring(0,400); });
    return resp;
  };
  console.log('fetch interceptor installed');
})()`);

await new Promise(r=>setTimeout(r,5000));

// Fill form
p._bb('eval', `(function(){
  function nativeSet(el, val) {
    var P = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(P, 'value').set.call(el, val);
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true}));
  }
  var textInputs = Array.from(document.querySelectorAll('input')).filter(i => i.type === 'text');
  if(textInputs[0]) nativeSet(textInputs[0], 'Unit Converter for Science');
  if(textInputs[1]) nativeSet(textInputs[1], 'https://www.unitconv.top');
  var desc = Array.from(document.querySelectorAll('textarea')).find(t => t.placeholder?.includes('Can It Do'));
  if(desc) nativeSet(desc, 'A precision unit converter for scientists and engineers. 200+ unit types including physics, chemistry, and astronomy.');
  var emailInp = textInputs.find(i => i.placeholder?.includes('@'));
  if(emailInp) nativeSet(emailInp, 'hi@unitconv.top');
})()`);

await new Promise(r=>setTimeout(r,800));

// Submit
p._bb('eval', `Array.from(document.querySelectorAll('button')).find(b=>/submit/i.test(b.textContent))?.click()`);

await new Promise(r=>setTimeout(r,6000));

// Read captured requests
const reqs = p._bb('eval', `JSON.stringify(window._reqs)`);
console.log('Captured requests:', reqs);
