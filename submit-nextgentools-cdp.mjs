import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(__dirname, 'resources', 'logo.png');

const browser = await chromium.connectOverCDP('http://localhost:19825');
const context = browser.contexts()[0];
const page = context.pages()[0];

// Create CDP session for direct CDP calls
const cdpSession = await context.newCDPSession(page);

// Listen for file chooser before clicking
await cdpSession.send('Page.setInterceptFileChooserDialog', { enabled: true });
console.log('File chooser interception enabled');

// Listen for file chooser event
cdpSession.on('Page.fileChooserOpened', async (event) => {
  console.log('File chooser opened! BackendNodeId:', event.backendNodeId);
  // Set files using DOM.setFileInputFiles
  try {
    await cdpSession.send('DOM.setFileInputFiles', {
      files: [logoPath],
      backendNodeId: event.backendNodeId
    });
    console.log('Files set via CDP!');
  } catch(e) {
    console.log('Error setting files:', e.message);
  }
});

// Now click browse
console.log('Clicking browse...');
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(500);

// Find and click the "browse" link
const browseLink = page.locator('text=browse').or(page.locator('[class*="browse"]')).first();
await browseLink.click({ timeout: 5000 }).catch(async (e) => {
  console.log('Direct click failed:', e.message, '- trying coordinate click');
  const box = await browseLink.boundingBox().catch(() => null);
  if (box) {
    await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
  }
});

await page.waitForTimeout(3000);
await page.screenshot({ path: 'screenshots/nextgentools-cdp-upload.png' });

const bodyText = await page.locator('body').innerText();
const hasFile = bodyText.includes('logo') || bodyText.includes('Remove') || bodyText.includes('.png');
console.log('File uploaded:', hasFile);
console.log('Body excerpt:', bodyText.slice(bodyText.indexOf('File upload'), bodyText.indexOf('File upload') + 200));
