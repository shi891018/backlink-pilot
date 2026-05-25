import { BbPage } from './src/bb.js';
const p = new BbPage();

await p.goto('https://dev.to/new');
await new Promise(r=>setTimeout(r,5000));

// Fill title
const titleFill = p._bb('eval', `(function(){
  var t = document.getElementById('article-form-title');
  t.value = '5 Essential Unit Converters for Scientists and Engineers';
  t.dispatchEvent(new Event('input', {bubbles:true}));
  t.dispatchEvent(new Event('change', {bubbles:true}));
  return t.value;
})()`);
console.log('Title:', titleFill);

await new Promise(r=>setTimeout(r,1000));

// Find the markdown editor body area
const editorInfo = p._bb('eval', `(function(){
  // Look for CodeMirror editor or contenteditable area
  var cm = document.querySelector('.CodeMirror,.cm-editor,[data-testid=article-form-body]');
  var ta = document.querySelector('textarea[id*=body],textarea[name*=body],textarea[class*=editor]');
  return JSON.stringify({
    cm: cm ? cm.className.substring(0,50) : null,
    ta: ta ? ta.id : null,
    allTA: Array.from(document.querySelectorAll('textarea')).map(t=>({id:t.id,rows:t.rows}))
  });
})()`);
console.log('Editor:', editorInfo);
