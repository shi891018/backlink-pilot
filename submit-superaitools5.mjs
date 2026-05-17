import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://www.superaitools.io/submit-a-tool');
await new Promise(r => setTimeout(r, 6000));

await p._bb('eval', 'window.scrollTo(0, 500)');
await new Promise(r => setTimeout(r, 1000));

// Fill using JS eval
async function fillEl(bb, selector, value) {
  const v = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/&/g, '\\x26');
  const s = selector.replace(/'/g, "\\'");
  return bb._bb('eval', `(function(){
    var el = document.querySelector('${s}');
    if (!el) return 'not found';
    el.scrollIntoView({block:'center'});
    var setVal = Object.getOwnPropertyDescriptor(
      el.tagName==='TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
      'value')?.set;
    if (setVal) setVal.call(el, '${v}'); else el.value='${v}';
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    return 'ok';
  })()`);
}

await fillEl(p, 'input[placeholder="Your Name"]', 'Shi Jm');
await fillEl(p, 'input[placeholder="Your Business Email"]', 'shijm1989@gmail.com');
await fillEl(p, 'input[placeholder="Tool Name"]', 'Unit Converter for Science');
await fillEl(p, 'input[placeholder="Tool link"]', 'https://www.unitconv.top');
await fillEl(p, 'input[placeholder="Tool Tags"]', 'unit converter, science, education, physics');
await fillEl(p, 'textarea[placeholder="Describe your product"]',
  'Free online unit converter for science and engineering. Supports 200+ units across physics, chemistry, and math. Ideal for students, researchers, and professionals.');

// Pricing dropdown — click, wait, select Free
await p._bb('click', '@13');
await new Promise(r => setTimeout(r, 2000));
const s1 = await p._bb('snapshot');
const freeRef = s1.match(/option \[ref=(\d+)\] "Free"/)?.[1];
if (freeRef) {
  await p._bb('click', `@${freeRef}`);
  await new Promise(r => setTimeout(r, 1000));
}

// Scroll to Submit button and find its ref
await p._bb('eval', 'window.scrollTo(0, 99999)');
await new Promise(r => setTimeout(r, 1000));
const s2 = await p._bb('snapshot');
const submitRef = s2.match(/button \[ref=(\d+)\] "Submit"/)?.[1];
console.log('Submit ref:', submitRef);
await p._bb('screenshot', 'screenshots/superaitools-pre-submit.png');

if (submitRef) {
  await p._bb('click', `@${submitRef}`);
  console.log('Clicked submit @' + submitRef);
} else {
  // Fallback: click by CSS
  await p._bb('eval', `document.querySelector('button[data-testid], button[type="submit"], button')?.click()`);
  console.log('Clicked submit via JS');
}

await new Promise(r => setTimeout(r, 3000));
await p._bb('screenshot', 'screenshots/superaitools-toast.png');
await new Promise(r => setTimeout(r, 5000));
await p._bb('screenshot', 'screenshots/superaitools-final.png');

const url = await p._bb('eval', 'location.href');
const body = await p._bb('eval', 'document.body.innerText.slice(0,600)');
console.log('URL:', url);
console.log('Body:', body);
