import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

const articleTitle = 'How to Choose the Right Unit Converter for Scientific Work';

// Find and click the Title placeholder
const titleFill = p._bb('eval', `(function(){
  // Find element with "Title" placeholder
  var allEditable = Array.from(document.querySelectorAll('[contenteditable=true],[data-placeholder]'));
  var titleEl = allEditable.find(e => {
    var ph = e.getAttribute('data-placeholder') || '';
    return ph.toLowerCase() === 'title' || ph.toLowerCase().includes('title');
  });
  if(!titleEl) titleEl = allEditable[0]; // First contenteditable is usually title
  
  if(titleEl) {
    titleEl.focus();
    titleEl.click();
    titleEl.innerText = '';
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    document.execCommand('insertText', false, ${JSON.stringify(articleTitle)});
    return 'filled: ' + titleEl.getAttribute('data-placeholder') + ' => ' + titleEl.innerText.substring(0,50);
  }
  return 'not found: ' + allEditable.map(e=>e.getAttribute('data-placeholder')).join('|');
})()`);
console.log('Title fill:', titleFill);

await new Promise(r=>setTimeout(r,2000));

const check = p._bb('eval', `(function(){
  var all = Array.from(document.querySelectorAll('[contenteditable=true]'));
  return all.map(e => ({ph: e.getAttribute('data-placeholder'), text: e.innerText.substring(0,50)}));
})()`);
console.log('State:', check);

// Try clicking Publish  
const btns = p._bb('eval', `Array.from(document.querySelectorAll('button')).map(b=>({text:b.textContent.trim(),disabled:b.disabled})).filter(b=>b.text.length>0)`);
console.log('Buttons:', btns);
