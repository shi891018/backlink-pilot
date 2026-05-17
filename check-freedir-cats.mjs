import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://www.directory-free.com/submit/submit.php');
await new Promise(r => setTimeout(r, 5000));

// Get category options from second select (free submission)
const catOpts = p._bb('eval', `Array.from(document.querySelectorAll('select')[1].options).map(o=>o.value+':'+o.text.trim()).join('|')`);
console.log('Categories:', catOpts.substring(0, 2000));
