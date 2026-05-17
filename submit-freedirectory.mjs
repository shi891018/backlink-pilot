import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://www.directory-free.com/submit/submit.php');
await new Promise(r => setTimeout(r, 5000));

// Select "Science/Instruments" in the second select (free submit)
p._bb('eval', `
  var sel = document.querySelectorAll('select')[1];
  sel.value = 'Science/Instruments';
  sel.dispatchEvent(new Event('change', {bubbles:true}));
`);
await new Promise(r => setTimeout(r, 500));

// Check selected value
const selVal = p._bb('eval', `document.querySelectorAll('select')[1].value`);
console.log('Selected category:', selVal);

// Click "Submit Regular Site" button
p._bb('eval', `
  var btn = Array.from(document.querySelectorAll('input[type=submit]')).find(b => b.value === 'Submit');
  var btns = Array.from(document.querySelectorAll('input[name=Submit]'));
  if (btns.length > 0) btns[1].click(); // second Submit button = Regular Site
`);
await new Promise(r => setTimeout(r, 4000));

const url = p.url();
const title = p._bb('eval', 'document.title');
console.log('URL after category click:', url);
console.log('Title:', title);

const snap = await p.snapshot();
console.log(snap.substring(0, 2000));
await p.screenshot('screenshots/freedirectory-submit.png');
