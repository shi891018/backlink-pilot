import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// Look inside the main editor
const inner = p._bb('eval', `(function(){
  var editor = document.getElementById('editor_7');
  if(!editor) return 'no editor_7';
  return {
    html: editor.innerHTML.substring(0,500),
    children: Array.from(editor.children).map(c => ({tag:c.tagName, class:c.className.substring(0,40), text:c.innerText.substring(0,50)}))
  };
})()`);
console.log('Editor inner:', JSON.stringify(inner, null, 2));
