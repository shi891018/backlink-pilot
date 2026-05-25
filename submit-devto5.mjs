import { BbPage } from './src/bb.js';
const p = new BbPage();

const articleTitle = '5 Essential Unit Converters for Scientists and Engineers';
const articleBody = `Whether you're working in a lab, running simulations, or just solving engineering problems, accurate unit conversion is critical. Here are 5 tools worth bookmarking.

## 1. Unit Converter for Science (unitconv.top)

[Unit Converter for Science](https://www.unitconv.top?utm_source=devto&utm_medium=article&utm_campaign=backlink) is designed specifically for technical work. It covers 11 categories including length, mass, time, velocity, area, volume, temperature, energy, force, pressure, and concentration.

What sets it apart: it shows **conversion formulas and step-by-step derivations**, not just results. Great for lab reports and engineering documentation.

## 2. NIST Physical Measurement Laboratory

NIST provides authoritative unit references for SI units. Good for official definitions.

## 3. WolframAlpha

Handles complex unit expressions naturally. Powerful for ad-hoc conversions.

## 4. Google Unit Converter

Quickest for everyday conversions. Limited scientific categories.

## 5. Engineering Toolbox

Comprehensive reference for engineering-specific units like torque and viscosity.

---

**Tip:** For scientific work, [unitconv.top](https://www.unitconv.top) stands out because it explains *why* not just *what* — showing formulas and conversion factors.

#science #engineering #tools #productivity`;

await p.goto('https://dev.to/new');
await new Promise(r=>setTimeout(r,8000));

// Verify page loaded
const checkLoaded = p._bb('eval', `JSON.stringify({loaded: !!document.getElementById('article-form-title'), url: location.href.substring(0,50)})`);
console.log('Loaded:', checkLoaded);

// Fill title
p._bb('eval', `(function(){
  var t = document.getElementById('article-form-title');
  var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  nativeSetter.call(t, ${JSON.stringify(articleTitle)});
  t.dispatchEvent(new Event('input', {bubbles:true}));
  t.dispatchEvent(new Event('change', {bubbles:true}));
})()`);

await new Promise(r=>setTimeout(r,1000));

// Fill body
p._bb('eval', `(function(){
  var t = document.getElementById('article_body_markdown');
  var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  nativeSetter.call(t, ${JSON.stringify(articleBody)});
  t.dispatchEvent(new Event('input', {bubbles:true}));
  t.dispatchEvent(new Event('change', {bubbles:true}));
})()`);

await new Promise(r=>setTimeout(r,2000));

const vals = p._bb('eval', `JSON.stringify({
  title: document.getElementById('article-form-title').value.substring(0,60),
  bodyLen: document.getElementById('article_body_markdown').value.length
})`);
console.log('Values:', vals);

// Click Publish now button
await new Promise(r=>setTimeout(r,1000));
const btns = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  return btns.map(b => b.textContent.trim()).filter(t=>t.length>0);
})()`);
console.log('Buttons:', btns);
