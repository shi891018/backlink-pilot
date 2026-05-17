import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:19825');
const context = browser.contexts()[0];
const page = context.pages()[0];

// Check current state
console.log('URL:', page.url());

// Find contenteditable elements
const editables = await page.evaluate(() => {
  const els = document.querySelectorAll('[contenteditable]');
  return [...els].map(e => ({
    tag: e.tagName,
    ce: e.getAttribute('contenteditable'),
    class: e.className.slice(0, 50),
    text: e.textContent.slice(0, 30)
  }));
});
console.log('Contenteditable elements:', JSON.stringify(editables, null, 2));

// Get form state
const textareas = await page.evaluate(() => {
  const ts = document.querySelectorAll('textarea');
  return [...ts].map((t, i) => ({i, id: t.id, val: t.value.slice(0,50)}));
});
console.log('Textareas:', JSON.stringify(textareas));

await page.screenshot({ path: 'screenshots/nextgentools-debug.png' });
