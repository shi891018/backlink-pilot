import { BbPage } from './src/bb.js';
const p = new BbPage();

// Navigate to new story
await p.goto('https://medium.com/new-story');
await new Promise(r=>setTimeout(r,6000));

const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,300)');
const editableAreas = p._bb('eval', `JSON.stringify(
  Array.from(document.querySelectorAll('[contenteditable],[data-placeholder]')).map(e => ({
    tag: e.tagName, placeholder: e.getAttribute('data-placeholder') || e.placeholder,
    contenteditable: e.getAttribute('contenteditable'),
    id: e.id.substring(0,30)
  })).slice(0,10)
)`);
console.log('URL:', url.substring(0,80));
console.log('Editable areas:', editableAreas);
console.log('Text:', text.substring(0,200));
