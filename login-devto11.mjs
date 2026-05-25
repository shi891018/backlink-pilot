import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// Click some relevant tags and continue
const tagged = p._bb('eval', `(function(){
  // Try to find and click science/tools related tags
  var tags = Array.from(document.querySelectorAll('[class*=tag],[data-testid*=tag],button'));
  var relevant = tags.filter(t => {
    var text = t.textContent.trim().toLowerCase();
    return text.includes('science') || text.includes('python') || text.includes('webdev') || text.includes('tools');
  }).slice(0,3);
  relevant.forEach(t => t.click());
  return 'clicked ' + relevant.length + ' tags';
})()`);
console.log('Tags:', tagged);

await new Promise(r=>setTimeout(r,2000));

// Click Continue
const cont = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var btn = btns.find(b => b.textContent.trim() === 'Continue');
  if(!btn) btn = btns.find(b => b.textContent.trim().includes('Continue'));
  if(btn) { btn.click(); return 'clicked: ' + btn.textContent.trim(); }
  return 'not found: ' + btns.map(b=>b.textContent.trim().substring(0,20)).join('|');
})()`);
console.log('Continue:', cont);

await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,300)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,200));
