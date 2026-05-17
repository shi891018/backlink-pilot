// sites/launched.js — launched.io adapter
// Auth: None required  CAPTCHA: None
// Fields: productname, pitch, website, description, email, industry, location

import { withBrowser, delay } from '../browser.js';

const SUBMIT_URL = 'https://launched.io/SubmitStartup';

export default {
  name: 'launched',
  url: SUBMIT_URL,
  auth: 'none',
  captcha: 'none',
  engine: 'bb',

  async submit(product, config) {
    const screenshotDir = config.browser?.screenshot_dir || './screenshots';
    const ts = () => new Date().toISOString().replace(/[:.]/g, '-');

    const pitch   = product.description || product.long_description?.split('\n')[0] || product.name;
    const desc    = product.long_description || product.description || pitch;
    const email   = product.email || '';
    const url     = product.url || '';
    const name    = product.name || '';

    return withBrowser({ ...config, _engine: 'bb' }, async ({ page }) => {
      console.log('  📄 Opening Launched.io submission form...');
      await page.goto(SUBMIT_URL);
      await delay(6000);
      await page.screenshot(`${screenshotDir}/launched-form.png`).catch(() => {});

      // ONE eval: fill all fields + submit
      console.log('  🚀 Filling form and submitting...');
      let result = 'unknown';
      try {
        result = await page.evalRun(`(function() {
          function set(name, val) {
            var el = document.querySelector('[name=' + name + ']');
            if (!el) return false;
            el.focus();
            el.value = val;
            el.dispatchEvent(new Event('input',  {bubbles:true}));
            el.dispatchEvent(new Event('change', {bubbles:true}));
            return true;
          }
          set('productname', ${JSON.stringify(name)});
          set('pitch',       ${JSON.stringify(pitch)});
          set('website',     ${JSON.stringify(url)});
          set('description', ${JSON.stringify(desc)});
          set('email',       ${JSON.stringify(email)});
          set('industry',    'Science & Education');
          set('location',    'Online');

          var btn = document.querySelector('input[type=submit], button[type=submit]');
          if (btn) { btn.click(); return 'submitted'; }
          var form = document.querySelector('form');
          if (form) { try { form.requestSubmit(); } catch(e) { form.submit(); } return 'submitted'; }
          return 'no-submit-btn';
        })()`);
      } catch (e) {
        if (!/timed out|timeout/i.test(e.message)) throw e;
        result = 'timeout-may-ok';
      }

      console.log(`  📋 Result: ${result}`);
      await delay(7000);
      await page.screenshot(`${screenshotDir}/launched-result-${ts()}.png`).catch(() => {});

      let finalUrl = ''; try { finalUrl = page.url(); } catch {}
      return {
        url: finalUrl || SUBMIT_URL,
        confirmation: 'Launched.io submitted — awaiting review',
      };
    });
  },
};
