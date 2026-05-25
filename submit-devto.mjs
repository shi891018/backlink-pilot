import { BbPage } from './src/bb.js';
const p = new BbPage();

await p.goto('https://dev.to/new');
await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const fields = p._bb('eval', `(function(){
  return Array.from(document.querySelectorAll('input,textarea,[contenteditable]')).map(e => ({
    tag: e.tagName, id: e.id, name: e.name, placeholder: e.placeholder?.substring(0,40),
    contenteditable: e.getAttribute('contenteditable')
  })).slice(0,10);
})()`);
console.log('URL:', url.substring(0,60));
console.log('Fields:', JSON.stringify(fields, null, 2));
