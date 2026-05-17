import { BbPage } from './src/bb.js';

const p = new BbPage();
const cats = p._bb('eval', `(function(){ var sel = document.getElementById('category-select'); return sel ? Array.from(sel.options).map(o=>o.value).join(',') : 'not found'; })()`);
console.log('Categories:', cats);

const pricing = p._bb('eval', `(function(){ var sel = document.getElementById('pricing-select'); return sel ? Array.from(sel.options).map(o=>o.value).join(',') : 'not found'; })()`);
console.log('Pricing:', pricing);
