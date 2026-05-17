import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://www.directory-free.com/submit/submit.php');
await new Promise(r => setTimeout(r, 5000));

// Get all category options from second select (free submission)
const catOpts = p._bb('eval', `Array.from(document.querySelectorAll('select')[1].options).map(o=>o.value).join('|')`);
const cats = catOpts.split('|');
const sciEduCats = cats.filter(c => /science|education|tech|software|tool/i.test(c));
console.log('Relevant categories:', sciEduCats.join('\n'));
console.log('Total categories:', cats.length);
