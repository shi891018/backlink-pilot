import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://toolscout.ai/submit');
await new Promise(r=>setTimeout(r,7000));

// Intercept fetch/XHR to see what happens on submit
p._bb('eval', `(function(){
  window._reqs = [];
  var origFetch = window.fetch;
  window.fetch = function(url, opts) {
    window._reqs.push({url: url.toString(), method: (opts||{}).method||'GET', body: ((opts||{}).body||'').toString().substring(0,200)});
    return origFetch.apply(this, arguments);
  };
  var origXHR = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function(method, url) {
    window._reqs.push({url: url.toString(), method: method});
    return origXHR.apply(this, arguments);
  };
})()`);

// Fill the form
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
p._bb('eval', `(function(){
  var s = Array.from(document.querySelectorAll('button')).find(b => /submit/i.test(b.textContent));
  if (s) s.click();
})()`);

await new Promise(r=>setTimeout(r,4000));

// Check captured requests
const requests = p._bb('eval', `JSON.stringify(window._reqs)`);
console.log('Network requests made on submit:', requests);

// Check full page state
const pageState = p._bb('eval', `JSON.stringify({
  url: location.href,
  alerts: Array.from(document.querySelectorAll('[role=alert],[class*=toast],[class*=modal],[class*=success],[class*=notification]')).map(e=>e.textContent.trim().substring(0,100))
})`);
console.log('Page state:', pageState);
