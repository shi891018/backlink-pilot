import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

const articleTitle = 'How to Choose the Right Unit Converter for Scientific Work';
const articleBody = `Unit conversion is a daily task for scientists, engineers, and researchers. But not all converters are created equal.

The Problem With Generic Unit Converters

Most online converters give you a number and nothing else. For academic work, lab reports, or engineering calculations, you need to understand the relationship between units — the formula, the factor, and how to trace your steps.

A Better Approach: Converters That Explain

Unit Converter for Science (unitconv.top) takes a different approach. It covers 11 categories:

- Length, Mass, Time
- Velocity, Area, Volume
- Temperature, Energy, Force
- Pressure, Concentration

For each conversion, it shows the formula and derivation steps, not just the result. This is invaluable when you need to document your methodology or teach others.

Try it at https://www.unitconv.top

Key Features to Look For

When choosing a unit converter for technical work, prioritize:

1. Formula transparency — shows how the conversion was derived
2. SI unit support — covers the full metric system
3. Scientific categories — not just everyday units
4. Mobile-friendly — accessible in the field or lab

Conclusion

The best unit converter is one that helps you understand the math, not just do it faster. For scientific and engineering work, tools that show their work are far more valuable than black-box calculators.`;

// Click on Title area (first contenteditable)
p._bb('eval', `(function(){
  var editor = document.querySelector('[data-placeholder="Title"]') || document.querySelector('[contenteditable]');
  if(editor) {
    editor.focus();
    editor.innerText = '';
    // Use execCommand to insert text
    document.execCommand('insertText', false, ${JSON.stringify(articleTitle)});
  }
})()`);

await new Promise(r=>setTimeout(r,1000));

// Click on body area (second contenteditable or the "Tell your story" area)
p._bb('eval', `(function(){
  var editors = Array.from(document.querySelectorAll('[contenteditable=true]'));
  var body = editors.find(e => e.getAttribute('data-placeholder') && e.getAttribute('data-placeholder').includes('story'));
  if(!body) body = editors[1];
  if(body) {
    body.focus();
    body.innerText = '';
    document.execCommand('insertText', false, ${JSON.stringify(articleBody)});
  }
})()`);

await new Promise(r=>setTimeout(r,2000));

const vals = p._bb('eval', `(function(){
  var editors = Array.from(document.querySelectorAll('[contenteditable=true]'));
  return editors.map(e => e.innerText.substring(0,60));
})()`);
console.log('Editor content:', vals);

// Click Publish
const publish = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,a'));
  var pub = btns.find(b => b.textContent.trim() === 'Publish');
  if(pub) { pub.click(); return 'clicked Publish'; }
  return 'not found: ' + btns.map(b=>b.textContent.trim().substring(0,20)).join('|');
})()`);
console.log('Publish:', publish);

await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,300));
