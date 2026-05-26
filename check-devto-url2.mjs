import { BbPage } from './src/bb.js';
const p = new BbPage();

const links = p._bb('eval', `(function(){
  return Array.from(document.querySelectorAll('a'))
    .map(a=>a.href)
    .filter(h=>h.includes('5-essential') || h.includes('converters'))
    .join('|');
})()`);
console.log('Article links:', links);
