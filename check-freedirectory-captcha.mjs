import { BbPage } from './src/bb.js';

const p = new BbPage();
// We should be on the add.php page already
const snap = await p.snapshot();
const url = p.url();
console.log('Current URL:', url);

if (!url.includes('add.php')) {
  // Navigate to the page
  await p.goto('https://www.directory-free.com/submit/submit.php');
  await new Promise(r => setTimeout(r, 5000));
  p._bb('eval', `
    var sel = document.querySelectorAll('select')[1];
    sel.value = 'Science/Instruments';
    sel.dispatchEvent(new Event('change', {bubbles:true}));
  `);
  await new Promise(r => setTimeout(r, 500));
  p._bb('eval', `document.querySelectorAll('input[name=Submit]')[1].click()`);
  await new Promise(r => setTimeout(r, 4000));
}

// Check for captcha label
const captchaLabel = p._bb('eval', `document.querySelector('label[for=txtNumber]')?.textContent || 'not found'`);
const captchaHtml = p._bb('eval', `document.getElementById('txtNumber')?.closest('tr')?.innerHTML.replace(/<[^>]+>/g,' ').trim() || 'not found'`);
console.log('Captcha label:', captchaLabel);
console.log('Captcha area:', captchaHtml);

await p.screenshot('screenshots/freedirectory-form.png');
