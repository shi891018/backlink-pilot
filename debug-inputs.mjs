import { BbPage } from './src/bb.js';

const p = new BbPage();

// Get all input names/ids to debug
const allInputs = p._bb('eval', `(function(){ return JSON.stringify(Array.from(document.querySelectorAll('input[type=text],textarea')).map(e=>({name:e.name,id:e.id,val:e.value,placeholder:e.placeholder}))); })()`);
console.log('All inputs:', allInputs);
