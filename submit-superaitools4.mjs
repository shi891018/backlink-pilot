import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://www.superaitools.io/submit-a-tool');
await new Promise(r => setTimeout(r, 6000));

await p._bb('eval', 'window.scrollTo(0, 500)');
await new Promise(r => setTimeout(r, 1000));

// Fill using JS eval with name + input events
function fillInput(bb, selector, value) {
  const v = value.replace(/'/g, "\\'");
  const s = selector.replace(/'/g, "\\'");
  return bb._bb('eval', `(function(){
    var el = document.querySelector('${s}');
    if (!el) return 'not found';
    el.scrollIntoView();
    el.focus();
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) nativeInputValueSetter.call(el, '${v}');
    else el.value = '${v}';
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true}));
    return 'ok:' + el.id;
  })()`);
}

// Use the known IDs
const r1 = await fillInput(p, 'input[placeholder="Your Name"]', 'Shi Jm');
console.log('name:', r1);

const r2 = await fillInput(p, 'input[placeholder="Your Business Email"]', 'shijm1989@gmail.com');
console.log('email:', r2);

const r3 = await fillInput(p, 'input[placeholder="Tool Name"]', 'Unit Converter for Science');
console.log('tool name:', r3);

const r4 = await fillInput(p, 'input[placeholder="Tool link"]', 'https://www.unitconv.top');
console.log('url:', r4);

const r5 = await fillInput(p, 'input[placeholder="Tool Tags"]', 'unit converter, science, education, physics');
console.log('tags:', r5);

// Textarea needs different prototype
const descVal = 'Free online unit converter for science & engineering. Supports 200+ units across physics, chemistry, and math. Ideal for students, researchers, and professionals.';
const r6 = await p._bb('eval', `(function(){
  var el = document.querySelector('textarea[placeholder="Describe your product"]');
  if (!el) return 'not found';
  el.scrollIntoView();
  el.focus();
  var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
  if (setter) setter.call(el, '${descVal.replace(/'/g, "\\'")}');
  else el.value = '${descVal.replace(/'/g, "\\'")}';
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
  return 'ok';
})()`);
console.log('desc:', r6);

await new Promise(r => setTimeout(r, 500));
await p._bb('screenshot', 'screenshots/superaitools-filled2.png');
console.log('Fields filled. Now handling dropdown...');

// Click the pricing dropdown
await p._bb('click', '@13');
await new Promise(r => setTimeout(r, 1500));

// Click Free option
const snap = await p._bb('snapshot');
const freeRef = snap.match(/option \[ref=(\d+)\] "Free"/)?.[1];
console.log('Free ref:', freeRef);
if (freeRef) {
  await p._bb('click', `@${freeRef}`);
  await new Promise(r => setTimeout(r, 1000));
}

await p._bb('screenshot', 'screenshots/superaitools-before-submit.png');
console.log('Submitting...');

await p._bb('click', '@21');
await new Promise(r => setTimeout(r, 7000));

await p._bb('screenshot', 'screenshots/superaitools-result.png');
const url2 = await p._bb('eval', 'location.href');
const body2 = await p._bb('eval', 'document.body.innerText.slice(0,800)');
console.log('URL:', url2);
console.log('Body:', body2);
