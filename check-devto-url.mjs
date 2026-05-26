import { BbPage } from './src/bb.js';
const p = new BbPage();

const links = p._bb('eval', `Array.from(document.querySelectorAll('a')).map(a=>a.href).filter(h=>h.includes('5-essential') || h.includes('alexs_tools')).join('\n')`);
console.log('Article links:', links);
