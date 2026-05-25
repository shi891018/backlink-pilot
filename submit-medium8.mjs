import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// First fix: The body was inserted after the title in the same element
// Need to position cursor after title and create new paragraph
// Let's check the current state first
const currentState = p._bb('eval', `(function(){
  var title = document.querySelector('.graf--title');
  var grafs = Array.from(document.querySelectorAll('.graf'));
  return {
    titleText: title?.innerText?.substring(0,100),
    grafCount: grafs.length,
    grafsText: grafs.map(g=>g.innerText.substring(0,40))
  };
})()`);
console.log('Current state:', currentState);

// Click Publish to see what happens (article body may be saved)
const publish = p._bb('eval', `(function(){
  var btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Publish');
  if(btn) { btn.click(); return 'clicked'; }
  return 'not found';
})()`);
console.log('Publish:', publish);

await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,400)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,300));
