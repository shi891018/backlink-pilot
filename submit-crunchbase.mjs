import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://www.crunchbase.com/add-new');
await new Promise(r=>setTimeout(r,5000));

// Click "Company"
const clickResult = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('button,a,[role=button]'));
  var company = btns.find(b => b.textContent.trim() === 'Company');
  if(company){ company.click(); return 'clicked Company'; }
  return 'not found. btns: '+btns.map(b=>b.textContent.trim()).join(' | ');
})()`);
console.log('Click:', clickResult);

await new Promise(r=>setTimeout(r,5000));
const url = p.url();
const body = p._bb('eval', 'document.body.innerText.substring(0,800)');
console.log('URL:', url.substring(0,80));
console.log('Body:', body);

// Check inputs
const inputs = p._bb('eval', `JSON.stringify(Array.from(document.querySelectorAll('input,textarea')).map(el=>({tag:el.tagName,type:el.type,ph:el.placeholder,name:el.name,id:el.id.substring(0,30)})))`);
console.log('Inputs:', inputs);
