// spy/sources/openlinkprofiler.js — Open Link Profiler scraper
// No login required; provides 200+ backlinks for free

import { withBrowser, delay } from '../../browser.js';

export async function fetchOpenLinkProfilerBacklinks(competitorUrl, config = {}) {
  console.log(`  🔗 OpenLinkProfiler: checking ${competitorUrl} ...`);

  // Strip protocol to get bare domain
  const domain = competitorUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const url = `https://openlinkprofiler.org/r/${encodeURIComponent(domain)}`;

  return withBrowser(config, async ({ page }) => {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 40000 });
    await delay(2000);

    // Wait for results table
    await page.waitForSelector('table, .link-list, [class*="backlink"]', { timeout: 30000 });
    await delay(1000);

    const results = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const items = [];

      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return;

        const domainEl = row.querySelector('a[href*="://"]');
        const domain = domainEl?.textContent?.trim() || cells[0]?.textContent?.trim();
        if (!domain || domain.length < 3) return;

        let dr = 0;
        for (const cell of cells) {
          const val = parseInt(cell.textContent?.trim(), 10);
          if (!isNaN(val) && val > 0 && val <= 100) {
            dr = val;
            break;
          }
        }

        const rowText = row.textContent?.toLowerCase() || '';
        const dofollow = !rowText.includes('nofollow');

        items.push({ domain, dr, dofollow, source: 'openlinkprofiler' });
      });

      return items;
    });

    console.log(`  ✅ OpenLinkProfiler: found ${results.length} backlinks`);
    return results;
  });
}
