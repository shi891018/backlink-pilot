import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(__dirname, 'resources', 'logo.png');

// Connect to existing Chrome via CDP on port 19825
const browser = await chromium.connectOverCDP('http://localhost:19825');
console.log('Connected to Chrome on port 19825');

const contexts = browser.contexts();
const context = contexts[0];
const pages = context.pages();
console.log('Open pages:', pages.map(p => p.url()).join(', '));

let page = pages[0];
await page.goto('https://airtable.com/appcBtIrBPDXk1Xvv/pagn3lWWO0YPfnkB1/form');
await page.waitForTimeout(3000);

// Fill Tool name
console.log('Filling tool name...');
await page.locator('textarea').first().fill('Unit Converter for Science');

// Select Productivity category
console.log('Selecting category...');
await page.locator('[role="combobox"]').first().click();
await page.waitForTimeout(1000);
await page.locator('[role="option"]').filter({ hasText: 'Productivity' }).click();
await page.waitForTimeout(500);

// URL field (contenteditable)
console.log('Filling URL...');
const urlEditable = page.locator('div[contenteditable="true"]').first();
await urlEditable.click();
await urlEditable.fill('https://www.unitconv.top');

// Contact First Name
console.log('Filling contact name...');
const textareas = page.locator('textarea');
const count = await textareas.count();
console.log('Textarea count:', count);
await textareas.nth(1).fill('Shi');

// Email
await textareas.nth(2).fill('shijm1989@gmail.com');

// Description (second contenteditable)
console.log('Filling description...');
const allEditables = page.locator('div[contenteditable="true"]');
const editCount = await allEditables.count();
console.log('Contenteditable count:', editCount);
if (editCount > 1) {
  await allEditables.nth(1).fill('Unit Converter for Science is a free online tool for scientific and engineering unit conversions. Supports 200+ units across physics, chemistry, and math. Ideal for students, researchers, and professionals.');
}

// Upload logo file
console.log('Uploading logo from:', logoPath);
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles(logoPath);
await page.waitForTimeout(1500);

await page.screenshot({ path: 'screenshots/nextgentools-pw-filled.png' });
console.log('Screenshot saved. Checking form state...');

// Check form values
const toolName = await page.locator('textarea').first().inputValue();
console.log('Tool name:', toolName);

console.log('Submitting...');
await page.locator('button[type="submit"], button:has-text("Submit")').last().click();
await page.waitForTimeout(5000);

await page.screenshot({ path: 'screenshots/nextgentools-pw-submitted.png' });
const bodyText = await page.locator('body').innerText();
console.log('Result:', bodyText.slice(0, 400));
