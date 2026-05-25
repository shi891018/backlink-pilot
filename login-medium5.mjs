import { BbPage } from './src/bb.js';
const p = new BbPage();

await new Promise(r=>setTimeout(r,1000));

// Select 3+ topics
const selected = p._bb('eval', `(function(){
  var topics = Array.from(document.querySelectorAll('button,[role=button]'));
  var targets = ['Technology', 'Science', 'Programming'];
  var clicked = 0;
  targets.forEach(target => {
    var btn = topics.find(b => b.textContent.trim() === target);
    if(btn) { btn.click(); clicked++; }
  });
  return 'clicked ' + clicked + ' topics';
})()`);
console.log('Topics:', selected);

await new Promise(r=>setTimeout(r,2000));

// Click Continue/Next
const cont = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,[role=button]'));
  var btn = btns.find(b => {
    var t = b.textContent.trim();
    return t === 'Continue' || t === 'Next' || t === 'Get started';
  });
  if(btn) { btn.click(); return 'clicked: ' + btn.textContent.trim(); }
  return 'not found: ' + btns.map(b=>b.textContent.trim().substring(0,20)).join('|');
})()`);
console.log('Continue:', cont);

await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const text = p._bb('eval', 'document.body.innerText.substring(0,300)');
console.log('URL:', url.substring(0,80));
console.log('Text:', text.substring(0,200));
