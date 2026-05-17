import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:19825');
const context = browser.contexts()[0];
const page = context.pages()[0];

// Check file input details
const fileInputs = await page.evaluate(() => {
  const inputs = [...document.querySelectorAll('input[type="file"]')];
  return inputs.map(i => ({
    id: i.id,
    class: i.className.slice(0, 80),
    display: window.getComputedStyle(i).display,
    visibility: window.getComputedStyle(i).visibility,
    opacity: window.getComputedStyle(i).opacity,
    position: window.getComputedStyle(i).position,
    accept: i.accept
  }));
});
console.log('File inputs:', JSON.stringify(fileInputs, null, 2));

// Check current form state
const editables = await page.evaluate(() => {
  return [...document.querySelectorAll('div[contenteditable="plaintext-only"]')]
    .map(e => e.textContent.slice(0, 60));
});
console.log('Editable divs:', editables);

await page.screenshot({ path: 'screenshots/nextgentools-file-debug.png' });
