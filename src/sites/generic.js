// generic.js — Universal directory submission adapter using bb-browser
// Works with any directory site by auto-detecting form fields via snapshot

import { withBrowser, delay } from '../browser.js';

// Field detection patterns (reused from batch-submit.js proven selectors)
const FIELD_PATTERNS = {
  name: /name|title|product|app.?name|tool.?name/i,
  url: /url|website|link|homepage|site/i,
  email: /email|mail|e-mail/i,
  description: /desc|description|about|summary|detail|intro/i,
};

const SUBMIT_PATTERNS = /submit|send|add|post|create|list|suggest|save/i;

/**
 * Parse bb-browser snapshot output to find interactive elements
 * Snapshot format: lines like "@3 [textbox] Name ..." or "@7 [button] Submit"
 */
function parseSnapshot(snapshot) {
  const fields = { name: null, url: null, email: null, description: null, submit: null };
  const lines = snapshot.split('\n');

  for (const line of lines) {
    const refMatch = line.match(/^.*?(@\d+)\s+\[(\w+)\]\s*(.*)$/);
    if (!refMatch) continue;

    const [, ref, role, label] = refMatch;
    const labelLower = label.toLowerCase();

    // Match input/textarea fields
    if (role === 'textbox' || role === 'combobox') {
      if (!fields.name && FIELD_PATTERNS.name.test(labelLower)) fields.name = ref;
      else if (!fields.url && FIELD_PATTERNS.url.test(labelLower)) fields.url = ref;
      else if (!fields.email && FIELD_PATTERNS.email.test(labelLower)) fields.email = ref;
      else if (!fields.description && FIELD_PATTERNS.description.test(labelLower)) fields.description = ref;
    }

    // Match submit button
    if ((role === 'button' || role === 'link') && SUBMIT_PATTERNS.test(labelLower)) {
      if (!fields.submit) fields.submit = ref;
    }
  }

  return fields;
}

export default {
  name: 'generic',
  url: null,
  auth: 'none',
  captcha: 'none',
  engine: 'bb', // forces bb-browser

  async submit(product, config) {
    const targetUrl = config._genericUrl || config._targetUrl;
    if (!targetUrl) throw new Error('No target URL provided for generic submission');

    return withBrowser({ ...config, _engine: 'bb' }, async ({ page }) => {
      // 1. Navigate to submission page
      console.log(`  📄 Opening ${targetUrl}`);
      await page.goto(targetUrl);
      await delay(1000);

      // 2. Take interactive snapshot
      console.log('  🔍 Scanning form fields...');
      const snapshot = await page.snapshot();
      const fields = parseSnapshot(snapshot);

      const detected = Object.entries(fields)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      console.log(`  📋 Detected: ${detected || 'none'}`);

      if (!fields.name && !fields.url && !fields.description) {
        throw new Error('No recognizable form fields found. Use scout first.');
      }

      // 3. Fill detected fields
      if (fields.name) {
        console.log(`  ✏️  Filling name: ${product.name}`);
        await page.fill(fields.name, product.name);
        await delay(300);
      }

      if (fields.url) {
        const url = product.utm_url || product.url;
        console.log(`  ✏️  Filling URL: ${url}`);
        await page.fill(fields.url, url);
        await delay(300);
      }

      if (fields.email) {
        console.log(`  ✏️  Filling email: ${product.email}`);
        await page.fill(fields.email, product.email);
        await delay(300);
      }

      if (fields.description) {
        const desc = product.long_description || product.description;
        console.log(`  ✏️  Filling description`);
        await page.fill(fields.description, desc);
        await delay(300);
      }

      // 4. Screenshot before submit
      try {
        const screenshotDir = config.browser?.screenshot_dir || './screenshots';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await page.screenshot(`${screenshotDir}/generic-${timestamp}.png`);
      } catch {}

      // 5. Submit
      if (fields.submit) {
        console.log(`  🚀 Clicking submit (${fields.submit})`);
        await page.click(fields.submit);
        await delay(3000);
      } else {
        console.log('  ⚠️  No submit button found — form filled but not submitted');
      }

      const currentUrl = page.url();
      return {
        url: currentUrl,
        confirmation: fields.submit
          ? 'Generic submission completed — verify manually'
          : 'Form filled but no submit button found',
      };
    });
  },
};
