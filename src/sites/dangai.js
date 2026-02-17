// sites/dangai.js — dang.ai adapter
// Auth: None (free submission), CAPTCHA: None
// Review time: 3-4 weeks

import { withBrowser, delay, humanType } from '../browser.js';

export default {
  name: 'dang.ai',
  url: 'https://dang.ai/submit',
  auth: 'none',
  captcha: 'none',
  pricing: 'free',
  reviewTime: '3-4 weeks',

  async submit(product, config) {
    return withBrowser(config, async ({ page }) => {
      console.log('  🌐 Navigating to Dang.ai...');
      await page.goto('https://dang.ai/submit', { waitUntil: 'networkidle' });
      await delay(2000);

      // Fill standard form
      const fields = [
        { selector: 'input[name="name"], input[placeholder*="name" i]', value: product.name },
        { selector: 'input[name="url"], input[placeholder*="url" i], input[type="url"]', value: product.url },
        { selector: 'input[name="email"], input[placeholder*="email" i], input[type="email"]', value: product.email },
        { selector: 'textarea[name="description"], textarea[placeholder*="description" i]', value: product.long_description || product.description },
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

      // Select pricing if dropdown exists
      try {
        const pricingSelect = await page.$('select[name*="pricing"], select[name*="price"]');
        if (pricingSelect) {
          await pricingSelect.selectOption({ label: product.pricing === 'free' ? 'Free' : 'Freemium' });
        }
      } catch (e) {}

      // Submit
      const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await delay(3000);
        console.log('  ✅ Submitted to Dang.ai (review: 3-4 weeks)');
        return { success: true, site: 'dang.ai' };
      }

      throw new Error('Submit button not found');
    });
  }
};
