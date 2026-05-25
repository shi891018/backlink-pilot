import { BbPage } from './src/bb.js';
const p = new BbPage();

await p.goto('https://changelog.com/news/submit');
await new Promise(r => setTimeout(r, 4000));

await p.evalFill('#news_item_url', 'https://www.unitconv.top');
await new Promise(r => setTimeout(r, 300));
await p.evalFill('#news_item_headline', 'Unit Converter for Science — free tool for 20+ scientific unit categories');
await new Promise(r => setTimeout(r, 300));
await p.evalFill('#news_item_story', 'Unit Converter for Science (unitconv.top) is a free web app for converting scientific units across 20+ categories including length, mass, temperature, pressure, energy, frequency, and more. Built for students, engineers, and researchers who need accurate conversions. No ads, no signup required.');
await new Promise(r => setTimeout(r, 500));

await p.screenshot('screenshots/changelog-before-submit.png');
console.log('Submitting...');
p._bb('eval', 'document.querySelector("form input[type=submit]").click()');
await new Promise(r => setTimeout(r, 5000));
await p.screenshot('screenshots/changelog-after-submit.png');
const finalUrl = p.url();
const bodyText = p._bb('eval', 'document.body ? document.body.innerText.substring(0,400) : ""');
console.log('Final URL:', finalUrl);
console.log('Body:', bodyText);
