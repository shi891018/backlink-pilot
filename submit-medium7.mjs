import { BbPage } from './src/bb.js';
const p = new BbPage();

const articleTitle = 'How to Choose the Right Unit Converter for Scientific Work';
const articleBody = `Unit conversion is a daily task for scientists, engineers, and researchers. But not all converters are created equal.

The Problem With Generic Unit Converters

Most online converters give you a number and nothing else. For academic work, lab reports, or engineering calculations, you need to understand the relationship between units — the formula, the factor, and how to trace your steps.

A Better Approach: Converters That Explain

Unit Converter for Science (unitconv.top) takes a different approach. It covers 11 categories including length, mass, time, velocity, area, volume, temperature, energy, force, pressure, and concentration.

For each conversion, it shows the formula and derivation steps, not just the result. Try it at https://www.unitconv.top

Key Features to Look For

When choosing a unit converter for technical work:

1. Formula transparency — shows how the conversion was derived
2. SI unit support — covers the full metric system
3. Scientific categories — not just everyday units
4. Mobile-friendly — accessible in the field or lab

Conclusion

For scientific and engineering work, tools that show their work are far more valuable than black-box calculators. Check out unitconv.top for a unit converter that helps you understand the math, not just do it faster.`;

await new Promise(r=>setTimeout(r,1000));

// Fill title using Medium's graf structure
const titleFilled = p._bb('eval', `(function(){
  var titleEl = document.querySelector('.graf--title');
  if(!titleEl) return 'no title element';
  titleEl.focus();
  titleEl.click();
  document.execCommand('selectAll', false, null);
  document.execCommand('delete', false, null);
  document.execCommand('insertText', false, ${JSON.stringify(articleTitle)});
  return 'filled: ' + titleEl.innerText.substring(0,60);
})()`);
console.log('Title:', titleFilled);

await new Promise(r=>setTimeout(r,1000));

// Find and fill body - click on the "Tell your story" area
const bodyFilled = p._bb('eval', `(function(){
  // The body is the graf after the title
  var grafs = Array.from(document.querySelectorAll('.graf'));
  var body = grafs.find(g => g.classList.contains('postField') || (!g.classList.contains('graf--title') && g.getAttribute('contenteditable') === 'true'));
  if(!body) {
    // Try clicking the main editor area
    var editor = document.getElementById('editor_7');
    if(editor) {
      editor.focus();
      editor.click();
      document.execCommand('insertText', false, ${JSON.stringify(articleBody)});
      return 'filled editor_7';
    }
    return 'no body found, grafs: ' + grafs.map(g=>g.className.substring(0,30)).join('|');
  }
  body.focus();
  body.click();
  document.execCommand('selectAll', false, null);
  document.execCommand('delete', false, null);
  document.execCommand('insertText', false, ${JSON.stringify(articleBody)});
  return 'filled body: ' + body.className.substring(0,40);
})()`);
console.log('Body:', bodyFilled);

await new Promise(r=>setTimeout(r,3000));

const state = p._bb('eval', `(function(){
  var titleEl = document.querySelector('.graf--title');
  var btns = Array.from(document.querySelectorAll('button')).map(b=>b.textContent.trim()).filter(t=>t.length>0);
  return {title: titleEl?.innerText?.substring(0,60), buttons: btns};
})()`);
console.log('State:', state);
