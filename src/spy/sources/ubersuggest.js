// spy/sources/ubersuggest.js — Ubersuggest (Neil Patel) backlink checker
// Free tier: up to ~50 results per day without login

import { withBrowser, delay } from '../../browser.js';

const UBERSUGGEST_URL = 'https://app.neilpatel.com/en/ubersuggest/backlinks';

export async function fetchUbersuggestBacklinks(competitorUrl, config = {}) {
  console.log(`  🔗 Ubersuggest: checking ${competitorUrl} ...`);

  return withBrowser(config, async ({ page }) => {
    const targetUrl = `${UBERSUGGEST_URL}?domain=${encodeURIComponent(competitorUrl)}&lang=en&locId=2840`;
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 40000 });
    await delay(3000);

    // Handle cookie / popup
    const closeBtn = page.locator('[aria-label="Close"], [class*="close"], button:has-text("Close"), button:has-text("Got it")').first();
    const hasCookieBtn = await closeBtn.isVisible().catch(() => false);
    if (hasCookieBtn) {
      await closeBtn.click().catch(() => {});
      await delay(500);
    }

    // Wait for backlink rows
    await page.waitForSelector('table tbody tr, [class*="BacklinkRow"], [class*="backlink-row"]', { timeout: 30000 });
    await delay(1500);

    const results = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr, [class*="BacklinkRow"]');
      const items = [];

      rows.forEach(row => {
        const domainEl = row.querySelector('a[href*="://"]');
        const domain = domainEl?.textContent?.trim();
        if (!domain || domain.length < 3) return;

        let dr = 0;
        const cells = row.querySelectorAll('td, [class*="cell"]');
        for (const cell of cells) {
          const val = parseInt(cell.textContent?.trim(), 10);
          if (!isNaN(val) && val > 0 && val <= 100) {
            dr = val;
            break;
          }
        }

        const rowText = row.textContent?.toLowerCase() || '';
        const dofollow = !rowText.includes('nofollow');

        items.push({ domain, dr, dofollow, source: 'ubersuggest' });
      });

      return items;
    });

    console.log(`  ✅ Ubersuggest: found ${results.length} backlinks`);
    return results;
  });
}
