import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(__dirname, 'resources', 'logo.png');

const browser = await chromium.connectOverCDP('http://localhost:19825');
const context = browser.contexts()[0];
const page = context.pages()[0];

// Create CDP session
const cdpSession = await context.newCDPSession(page);

// Check if Uppy modal is open
const uppyOpen = await page.locator('.uppy-Dashboard-AddFiles, [class*="uppy-Dashboard"]').isVisible().catch(() => false);
console.log('Uppy modal open:', uppyOpen);

// Enable file chooser interception
await cdpSession.send('Page.setInterceptFileChooserDialog', { enabled: true });
console.log('File chooser interception enabled');

// Set up listener BEFORE clicking
let fileSet = false;
cdpSession.on('Page.fileChooserOpened', async (event) => {
  console.log('FILE CHOOSER OPENED! backendNodeId:', event.backendNodeId);
  try {
    await cdpSession.send('DOM.setFileInputFiles', {
      files: [logoPath],
      backendNodeId: event.backendNodeId
    });
    console.log('Files set via CDP!');
    fileSet = true;
  } catch(e) {
    console.log('Error setting files:', e.message);
  }
});

// Click "Local Files" in Uppy
if (uppyOpen) {
  console.log('Clicking Local Files in Uppy...');
  await page.locator('text=Local Files').first().click();
} else {
  // Re-open Uppy by clicking browse area 
  console.log('Uppy not open, clicking upload area...');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  // Click on the main drop zone (not browse link to avoid overlay issues)
  const dropArea = page.locator('[class*="drop"], [class*="Drop"], text=Drop files here').first();
  const box = await dropArea.boundingBox().catch(() => null);
  if (box) {
    await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
  }
  await page.waitForTimeout(1000);
  await page.locator('text=Local Files').first().click({ timeout: 5000 }).catch(e => console.log('Local Files click:', e.message));
}

// Wait for file chooser to be handled
await page.waitForTimeout(3000);
console.log('File set:', fileSet);

await page.screenshot({ path: 'screenshots/nextgentools-after-local-files.png' });

if (!fileSet) {
  console.log('Trying direct click on browse files...');
  await page.locator('text=browse files').click({ force: true }).catch(e => console.log(e.message));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/nextgentools-after-browse.png' });
}

// Check body for upload confirmation
const bodyText = await page.locator('body').innerText();
const hasUpload = bodyText.includes('logo.png') || bodyText.includes('Remove') || bodyText.includes('upload complete');
console.log('Upload confirmed:', hasUpload);
console.log('Body:', bodyText.slice(Math.max(0, bodyText.indexOf('File')), bodyText.indexOf('File') + 300));
