// sites/600tools.js — 600.tools adapter
// Auth: None (free submission), CAPTCHA: None
// Results: 3 dofollow links per listing

import { withBrowser, delay, humanType } from '../browser.js';

export default {
  name: '600.tools',
  url: 'https://600.tools/submit',
  auth: 'none',
  captcha: 'none',
  pricing: 'free',
  dofollow: true,

  async submit(product, config) {
    return withBrowser(config, async ({ page }) => {
      console.log('  🌐 Navigating to 600.tools submit page...');
      await page.goto('https://600.tools/submit', { waitUntil: 'networkidle' });
      await delay(2000);

      // Fill form fields
      const fields = [
        { selector: 'input[name="name"], input[placeholder*="name" i]', value: product.name },
        { selector: 'input[name="url"], input[placeholder*="url" i], input[type="url"]', value: product.url },
        { selector: 'input[name="email"], input[placeholder*="email" i], input[type="email"]', value: product.email },
        { selector: 'textarea[name="description"], textarea[placeholder*="description" i]', value: product.description },
      ];

      for (const field of fields) {
        try {
          const el = await page.$(field.selector);
          if (el) {
            await el.click();
            await humanType(page, field.selector, field.value);
            await delay(500);
          }
        } catch (e) {
          console.log(`  ⚠️ Could not fill: ${field.selector}`);
        }
      }

      // Select category if available
      try {
        const categorySelect = await page.$('select[name="category"], select');
        if (categorySelect) {
          const options = await categorySelect.$$eval('option', opts => opts.map(o => ({ value: o.value, text: o.textContent })));
          const match = options.find(o => 
            o.text.toLowerCase().includes('tool') || 
            o.text.toLowerCase().includes('developer') ||
            o.text.toLowerCase().includes('productivity')
          );
          if (match) {
            await categorySelect.selectOption(match.value);
          }
        }
      } catch (e) {
        // Category selection is optional
      }

      // Submit
      const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await delay(3000);
        console.log('  ✅ Submitted to 600.tools');
        return { success: true, site: '600.tools' };
      }

      throw new Error('Submit button not found');
    });
  }
};
