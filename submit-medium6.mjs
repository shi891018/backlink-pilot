import { BbPage } from './src/bb.js';
const p = new BbPage();

await p.goto('https://medium.com/new-story');
await new Promise(r=>setTimeout(r,8000));

// Get full page structure 
const structure = p._bb('eval', `(function(){
  // Find the title input area - Medium uses a specific editor
  var titleEl = document.querySelector('h3[class*=title],[class*=graf--title],[class*=postTitle]');
  var bodyEl = document.querySelector('[class*=editor-content],[class*=postContent]');
  
  // Also check for data-placeholder="Title"
  var allWithPH = Array.from(document.querySelectorAll('[data-placeholder]'));
  
  return {
    title: titleEl ? {class: titleEl.className, ph: titleEl.getAttribute('data-placeholder')} : null,
    body: bodyEl ? {class: bodyEl.className.substring(0,50)} : null,
    placeholders: allWithPH.map(e => ({tag: e.tagName, ph: e.getAttribute('data-placeholder'), class: e.className.substring(0,40)}))
  };
})()`);
console.log('Structure:', JSON.stringify(structure, null, 2));
