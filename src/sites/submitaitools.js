// sites/submitaitools.js — submitaitools.org adapter
// Auth: None, CAPTCHA: Color CAPTCHA (auto-solvable)

import { withBrowser, delay } from '../browser.js';
import { solveColorCaptcha } from '../captcha.js';

export default {
  name: 'submitaitools.org',
  url: 'https://www.submitaitools.org/submit/',
  auth: 'none',
  captcha: 'color',

  async submit(product, config) {
    return withBrowser(config, async ({ page }) => {
      console.log('  📝 Loading submit page...');
      await page.goto('https://www.submitaitools.org/submit/', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await delay(1500);

      // Fill the form
      console.log('  📝 Filling form...');

      // Tool name
      const nameInput = page.locator('input[name="toolName"], input[placeholder*="name" i]').first();
      await nameInput.fill(product.name);
      await delay(300);

      // URL
      const urlInput = page.locator('input[name="toolUrl"], input[placeholder*="url" i], input[type="url"]').first();
      await urlInput.fill(product.utm_url);
      await delay(300);

      // Description
      const descInput = page.locator('textarea[name="toolDescription"], textarea[placeholder*="description" i]').first();
      await descInput.fill(product.long_description || product.description);
      await delay(300);

      // Email
      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      await emailInput.fill(product.email);
      await delay(300);

      // Select "Free" listing if available
      const freeOption = page.locator('text=/free listing/i').first();
      if (await freeOption.isVisible().catch(() => false)) {
        await freeOption.click();
        await delay(300);
      }

      // Solve color CAPTCHA
      await solveColorCaptcha(page);
      await delay(500);

      // Submit
      const submitBtn = page.locator('button[type="submit"], input[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();
      await submitBtn.click();
      await delay(3000);

      // Check for confirmation
      const body = await page.textContent('body');
      const success = /thank|success|review|received/i.test(body);

      return {
        url: page.url(),
        confirmation: success ? 'Submission received (pending review)' : 'Form submitted (check manually)',
      };
    });
  },
};
