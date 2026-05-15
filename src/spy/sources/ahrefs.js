// spy/sources/ahrefs.js — Ahrefs free backlink checker scraper
// Fetches top 100 backlinks for a competitor URL (no login required)

import { withBrowser, delay } from '../../browser.js';

const AHREFS_URL = 'https://ahrefs.com/backlink-checker/';

export async function fetchAhrefsBacklinks(competitorUrl, config = {}) {
  console.log(`  🔗 Ahrefs: checking ${competitorUrl} ...`);

  return withBrowser(config, async ({ page }) => {
    await page.goto(AHREFS_URL, { waitUntil: 'networkidle', timeout: 40000 });
    await delay(1500);

    // Fill in the URL input
    const input = page.locator('input[type="text"], input[type="url"], input[name="target"], input[placeholder*="Enter"], input[placeholder*="URL"], input[placeholder*="domain"]').first();
    await input.fill(competitorUrl);
    await delay(500);

    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("Check"), button:has-text("Analyze")').first();
    await submitBtn.click();

    // Wait for results table
    await page.waitForSelector('table, [class*="result"], [class*="backlink"]', { timeout: 30000 });
    await delay(2000);

    const results = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const items = [];

      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return;

        // Try to extract domain/URL from first meaningful cell
        const domainEl = row.querySelector('a[href*="://"]');
        const domain = domainEl?.textContent?.trim() || cells[0]?.textContent?.trim();
        if (!domain) return;

        // DR is usually a number cell
        let dr = 0;
        for (const cell of cells) {
          const val = parseInt(cell.textContent?.trim(), 10);
          if (!isNaN(val) && val >= 0 && val <= 100) {
            dr = val;
            break;
          }
        }

        // Detect dofollow
        const rowText = row.textContent?.toLowerCase() || '';
        const dofollow = !rowText.includes('nofollow');

        items.push({ domain, dr, dofollow, source: 'ahrefs' });
      });

      return items;
    });

    console.log(`  ✅ Ahrefs: found ${results.length} backlinks`);
    return results;
  });
}
