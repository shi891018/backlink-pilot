// browser.js — Stealth browser wrapper using rebrowser-playwright

import { chromium } from 'rebrowser-playwright';

export async function launchBrowser(config = {}) {
  const browserOpts = config.browser || {};

  const browser = await chromium.launch({
    headless: browserOpts.headless !== false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });

  const page = await context.newPage();

  return { browser, context, page };
}

export async function withBrowser(config, fn) {
  const { browser, context, page } = await launchBrowser(config);
  try {
    return await fn({ browser, context, page });
  } finally {
    await browser.close();
  }
}

// Human-like delays
export function delay(ms) {
  const jitter = Math.random() * ms * 0.3;
  return new Promise(r => setTimeout(r, ms + jitter));
}

export async function humanType(page, selector, text, opts = {}) {
  await page.click(selector);
  await delay(200);
  // Clear existing text
  await page.fill(selector, '');
  // Type character by character with random delays
  for (const char of text) {
    await page.type(selector, char, { delay: 30 + Math.random() * 70 });
  }
}
