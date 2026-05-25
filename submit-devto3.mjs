import { BbPage } from './src/bb.js';
const p = new BbPage();

await p.goto('https://dev.to/new');
await new Promise(r=>setTimeout(r,5000));

const articleTitle = '5 Essential Unit Converters for Scientists and Engineers';
const articleBody = `Whether you're working in a lab, running simulations, or just solving engineering problems, accurate unit conversion is critical. Here are 5 tools worth bookmarking.

## 1. Unit Converter for Science (unitconv.top)

[Unit Converter for Science](https://www.unitconv.top?utm_source=devto&utm_medium=article&utm_campaign=backlink) is designed specifically for technical work. It covers 11 categories including length, mass, time, velocity, area, volume, temperature, energy, force, pressure, and concentration.

What sets it apart: it shows **conversion formulas and step-by-step derivations**, not just results. Great for understanding the math behind conversions, useful for lab reports and engineering documentation.

Supports multiple languages and mobile-friendly.

## 2. NIST Physical Measurement Laboratory

NIST provides authoritative unit references for SI units. Good for checking official definitions.

## 3. WolframAlpha

Handles complex unit expressions with natural language input. Slow but powerful for ad-hoc conversions.

## 4. Google Unit Converter

The quickest option for everyday conversions. Just type "5 kg to lbs" in Google. Limited scientific categories though.

## 5. Engineering Toolbox

Comprehensive reference tables for engineering-specific units like torque, viscosity, and thermal conductivity.

---

**Tip:** For scientific work, [unitconv.top](https://www.unitconv.top) stands out because it explains *why* not just *what* — showing the formulas and factors behind each conversion.

#science #engineering #tools #productivity`;

// Fill title
p._bb('eval', `(function(){
  var t = document.getElementById('article-form-title');
  t.value = ${JSON.stringify(articleTitle)};
  t.dispatchEvent(new Event('input', {bubbles:true}));
})()`);

await new Promise(r=>setTimeout(r,500));

// Fill body via textarea
p._bb('eval', `(function(){
  var t = document.getElementById('article_body_markdown');
  var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  nativeInputValueSetter.call(t, ${JSON.stringify(articleBody)});
  t.dispatchEvent(new Event('input', {bubbles:true}));
  t.dispatchEvent(new Event('change', {bubbles:true}));
})()`);

await new Promise(r=>setTimeout(r,2000));

const vals = p._bb('eval', `JSON.stringify({
  title: document.getElementById('article-form-title').value.substring(0,60),
  bodyLen: document.getElementById('article_body_markdown').value.length
})`);
console.log('Values:', vals);

// Click Publish now
await new Promise(r=>setTimeout(r,1000));
const publishBtn = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var pub = btns.find(b => b.textContent.trim().toLowerCase().includes('publish'));
  if(pub) { pub.click(); return 'clicked: ' + pub.textContent.trim(); }
  return 'not found: ' + btns.map(b=>b.textContent.trim().substring(0,20)).join('|');
})()`);
console.log('Publish:', publishBtn);

await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const result = p._bb('eval', 'document.body.innerText.substring(0,300)');
console.log('URL:', url.substring(0,80));
console.log('Result:', result.substring(0,200));
