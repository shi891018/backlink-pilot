import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(__dirname, 'resources', 'logo.png');

// Connect to existing Chrome via CDP (bb-browser uses port 9222 by default)
let browser;
try {
  browser = await chromium.connectOverCDP('http://localhost:9222');
  console.log('Connected to existing Chrome');
} catch(e) {
  console.log('Could not connect to existing Chrome, launching new:', e.message);
  browser = await chromium.launch({ headless: false });
}

const contexts = browser.contexts();
const context = contexts[0] || await browser.newContext();
const pages = context.pages();
let page = pages.find(p => p.url().includes('airtable')) || await context.newPage();

await page.goto('https://airtable.com/appcBtIrBPDXk1Xvv/pagn3lWWO0YPfnkB1/form');
await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

// Fill Tool name
await page.fill('textarea[id^="857"]', 'Unit Converter for Science').catch(() => {});
// More robust: find by label
const toolNameInput = page.locator('textarea').first();
await toolNameInput.fill('Unit Converter for Science');

// Category dropdown - find and click
const categoryCombo = page.locator('[role="combobox"]').first();
await categoryCombo.click();
await page.waitForTimeout(1000);
await page.locator('[role="option"]').filter({ hasText: 'Productivity' }).click();
await page.waitForTimeout(500);

// URL field (contenteditable div)
const urlDiv = page.locator('div[contenteditable="true"]').first();
await urlDiv.click();
await urlDiv.fill('https://www.unitconv.top');

// Contact First Name
await page.locator('textarea').nth(1).fill('Shi');

// Email
const emailTextarea = page.locator('textarea').filter({ hasText: '' }).nth(2);
// Try by placeholder
await page.locator('textarea').nth(3).fill('shijm1989@gmail.com').catch(() => {});
// Find email textarea by index in form
const allTextareas = await page.locator('textarea').all();
console.log('Total textareas:', allTextareas.length);
for (let i = 0; i < allTextareas.length; i++) {
  const id = await allTextareas[i].getAttribute('id') || '';
  const val = await allTextareas[i].inputValue().catch(() => '?');
  console.log(`  textarea[${i}] id=${id} val=${val}`);
}

await page.screenshot({ path: 'screenshots/nextgentools-pw-filled.png' });
