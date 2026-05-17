import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(__dirname, 'resources', 'logo.png');

const browser = await chromium.connectOverCDP('http://localhost:19825');
const context = browser.contexts()[0];
const page = context.pages()[0];
console.log('URL:', page.url());

// Navigate fresh if needed
if (!page.url().includes('airtable.com')) {
  await page.goto('https://airtable.com/appcBtIrBPDXk1Xvv/pagn3lWWO0YPfnkB1/form');
  await page.waitForTimeout(3000);
}

// Clear and fill form fresh
// Tool name
const toolNameTA = page.locator('textarea').first();
await toolNameTA.fill('Unit Converter for Science');

// Category - check if already set
const categoryText = await page.locator('[role="combobox"]').first().textContent();
console.log('Category currently:', categoryText);
if (!categoryText.includes('Productivity')) {
  await page.locator('[role="combobox"]').first().click();
  await page.waitForTimeout(1000);
  await page.locator('[role="option"]').filter({ hasText: 'Productivity' }).click();
  await page.waitForTimeout(500);
}

// URL - use contenteditable="plaintext-only" divs
const editableDivs = page.locator('div[contenteditable="plaintext-only"]');
const editCount = await editableDivs.count();
console.log('Contenteditable divs:', editCount);

// URL is first contenteditable div
const urlDiv = editableDivs.first();
await urlDiv.click({ clickCount: 3 });
await urlDiv.fill('https://www.unitconv.top');

// Contact First Name (textarea 1)
await page.locator('textarea').nth(1).fill('Shi');

// Email (textarea 3)  
await page.locator('textarea').nth(3).fill('shijm1989@gmail.com');

// Description - second contenteditable div
const descDiv = editableDivs.nth(1);
await descDiv.click({ clickCount: 3 });
await descDiv.fill('Unit Converter for Science is a free online tool for scientific and engineering unit conversions. Supports 200+ units across physics, chemistry, and math. Ideal for students, researchers, and professionals.');

// Upload logo
console.log('Uploading logo...');
const fileInput = page.locator('input[type="file"]').first();
await fileInput.setInputFiles(logoPath);
await page.waitForTimeout(2000);

await page.screenshot({ path: 'screenshots/nextgentools-ready.png' });
console.log('Form ready for submission. Taking screenshot...');

// Verify form state
const textareas = await page.evaluate(() => {
  return [...document.querySelectorAll('textarea')].map((t,i) => ({i, val: t.value.slice(0,40)}));
});
console.log('Form state:', JSON.stringify(textareas));

const fileUploaded = await page.evaluate(() => {
  const fi = document.querySelector('input[type=file]');
  return fi ? fi.files.length : 0;
});
console.log('Files uploaded:', fileUploaded);

// Submit
console.log('Submitting...');
await page.locator('button:has-text("Submit")').last().click();
await page.waitForTimeout(6000);

await page.screenshot({ path: 'screenshots/nextgentools-result.png' });
const bodyText = await page.locator('body').innerText();
console.log('Result:', bodyText.slice(0, 500));
