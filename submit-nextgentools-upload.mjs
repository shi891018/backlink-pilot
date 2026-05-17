import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(__dirname, 'resources', 'logo.png');

const browser = await chromium.connectOverCDP('http://localhost:19825');
const context = browser.contexts()[0];
const page = context.pages()[0];

// Scroll to bottom to see file upload area
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/nextgentools-bottom.png' });

// Try to find the upload area  
const uploadArea = await page.locator('text=Drop files here').or(page.locator('text=browse')).first();
const isVisible = await uploadArea.isVisible().catch(() => false);
console.log('Upload area visible:', isVisible);

// Use filechooser approach
console.log('Setting up file chooser handler...');
const [fileChooser] = await Promise.all([
  page.waitForEvent('filechooser', { timeout: 10000 }),
  // Click the browse link
  page.locator('text=browse').first().click()
]);
console.log('File chooser opened!');
await fileChooser.setFiles(logoPath);
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/nextgentools-after-upload.png' });
console.log('Logo uploaded!');

// Submit
console.log('Submitting...');
await page.locator('button:has-text("Submit")').last().click();
await page.waitForTimeout(5000);
await page.screenshot({ path: 'screenshots/nextgentools-result.png' });
const bodyText = await page.locator('body').innerText();
console.log('Result:', bodyText.slice(0, 500));
