import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(__dirname, 'resources', 'logo.png');

const browser = await chromium.connectOverCDP('http://localhost:19825');
const context = browser.contexts()[0];
const page = context.pages()[0];

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1000);

// Get the drop zone bounding box
const dropZone = page.locator('text=Drop files here').first();
const box = await dropZone.boundingBox();
console.log('Drop zone:', box);

// Read the logo file as base64
const logoData = fs.readFileSync(logoPath);
const logoBase64 = logoData.toString('base64');
const logoSize = logoData.length;
console.log('Logo size:', logoSize, 'bytes');

// Simulate file drop using DataTransfer
const dropped = await page.evaluate(({ base64, name, size }) => {
  return new Promise((resolve) => {
    // Find the drop area
    const dropArea = document.querySelector('[data-testid="dropzone"], .attachmentCellUploader, [class*="upload"], [class*="Upload"]');
    const allDivs = [...document.querySelectorAll('div')];
    const dropDiv = allDivs.find(d => d.textContent && d.textContent.includes('Drop files here'));
    
    if (!dropDiv) {
      resolve('drop area not found');
      return;
    }
    
    // Create file from base64
    const byteChars = atob(base64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArr[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteArr], { type: 'image/png' });
    const file = new File([blob], name, { type: 'image/png' });
    
    // Create DataTransfer with file
    const dt = new DataTransfer();
    dt.items.add(file);
    
    // Dispatch drag events
    const dragEnter = new DragEvent('dragenter', { bubbles: true, dataTransfer: dt });
    const dragOver = new DragEvent('dragover', { bubbles: true, dataTransfer: dt });
    const drop = new DragEvent('drop', { bubbles: true, dataTransfer: dt });
    
    dropDiv.dispatchEvent(dragEnter);
    dropDiv.dispatchEvent(dragOver);
    dropDiv.dispatchEvent(drop);
    
    resolve('drop events dispatched, files: ' + dt.files.length);
  });
}, { base64: logoBase64, name: 'logo.png', size: logoSize });

console.log('Drop result:', dropped);
await page.waitForTimeout(3000);
await page.screenshot({ path: 'screenshots/nextgentools-after-drop.png' });

// Check if file was accepted
const formState = await page.evaluate(() => {
  const body = document.body.innerText;
  return body.includes('logo.png') || body.includes('Remove') ? 'file shown' : 'no file shown';
});
console.log('File state:', formState);
