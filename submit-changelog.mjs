import { BbPage } from './src/bb.js';
const p = new BbPage();

// Check current state and submit
const urlVal = p._bb('eval', 'document.getElementById("news_item_url")?.value');
console.log('Current URL value:', urlVal);

if (!urlVal || urlVal.length < 5) {
  console.log('Form empty - filling...');
  await p.goto('https://changelog.com/news/submit');
  await new Promise(r => setTimeout(r, 5000));
  await p.evalFill('#news_item_url', 'https://www.unitconv.top');
  await new Promise(r => setTimeout(r, 300));
  await p.evalFill('#news_item_headline', 'Unit Converter for Science — free, precise, open-source unit converter');
  await new Promise(r => setTimeout(r, 300));
  await p.evalFill('#news_item_story', 'Unit Converter for Science (unitconv.top) is a free, open-source web app for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy, and more. Built for students, engineers, and researchers who need accurate conversions with clear SI unit relationships. No ads, no signup required.');
  await new Promise(r => setTimeout(r, 500));
}

await p.screenshot('screenshots/changelog-before-submit.png');
console.log('Submitting...');
p._bb('eval', 'document.querySelector("input[type=submit], button[type=submit]").click()');
await new Promise(r => setTimeout(r, 4000));
await p.screenshot('screenshots/changelog-after-submit.png');
const finalUrl = p.url();
const pageTitle = p._bb('eval', 'document.title');
console.log('Final URL:', finalUrl);
console.log('Page title:', pageTitle);
