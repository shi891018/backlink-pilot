import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// Inspect all clickable elements on the Google account chooser page
const info = p._bb('eval', `(function(){
  var all = Array.from(document.querySelectorAll('[role=link],[role=button],a,button'));
  return all.map(e => ({
    role: e.getAttribute('role') || e.tagName,
    text: e.textContent.trim().substring(0,50),
    id: e.id.substring(0,30),
    class: e.className.substring(0,40)
  })).slice(0,20);
})()`);
console.log('Elements:', JSON.stringify(info, null, 2));
