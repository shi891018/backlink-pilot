// sites/toolverto.js — toolverto.com adapter
// Auth: None, CAPTCHA: None

import { withBrowser, delay } from '../browser.js';

export default {
  name: 'toolverto.com',
  url: 'https://toolverto.com/submit',
  auth: 'none',
  captcha: 'none',

  async submit(product, config) {
    return withBrowser(config, async ({ page }) => {
      console.log('  📝 Loading submit page...');
      await page.goto('https://toolverto.com/submit', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await delay(1500);

      // Simple 3-field form: title + website + description
      console.log('  📝 Filling form...');

      const titleInput = page.locator('input[placeholder*="title" i], input[name*="title" i]').first();
      await titleInput.fill(product.name);
      await delay(300);

      // NOTE: toolverto rejects URLs with query params — submit clean URL
      const urlInput = page.locator('input[placeholder*="website" i], input[placeholder*="url" i], input[type="url"]').first();
      await urlInput.fill(product.url);  // Clean URL, no UTM
      await delay(300);

      const descInput = page.locator('textarea, input[placeholder*="description" i]').first();
      await descInput.fill(product.description);
      await delay(300);

      // Submit
      const submitBtn = page.locator('button[type="submit"], input[type="submit"], button:has-text("Submit")').first();
      await submitBtn.click();
      await delay(3000);

      const body = await page.textContent('body');
      const success = /success|thank|submitted|review/i.test(body);

      return {
        url: page.url(),
        confirmation: success ? 'Submitted (1-3 day review)' : 'Form submitted',
      };
    });
  },
};
