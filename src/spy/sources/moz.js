// spy/sources/moz.js — Moz Link Explorer backlink checker
// Requires free Moz account. Add credentials to config.yaml:
//   credentials:
//     moz:
//       email: ""
//       password: ""

import { withBrowser, delay, humanType } from '../../browser.js';

const MOZ_LOGIN_URL = 'https://moz.com/login';
const MOZ_LINK_EXPLORER = 'https://moz.com/link-explorer';

export async function fetchMozBacklinks(competitorUrl, config = {}) {
  const creds = config.credentials?.moz;
  if (!creds?.email || !creds?.password) {
    console.warn('  ⚠️  Moz: no credentials in config.yaml (credentials.moz.email/password). Skipping.');
    return [];
  }

  console.log(`  🔗 Moz: checking ${competitorUrl} ...`);

  return withBrowser(config, async ({ page }) => {
    // Login
    await page.goto(MOZ_LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(1000);

    await humanType(page, 'input[name="email"], input[type="email"]', creds.email);
    await humanType(page, 'input[name="password"], input[type="password"]', creds.password);
    await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first().click();
    await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
    await delay(2000);

    // Navigate to Link Explorer with target URL
    const url = `${MOZ_LINK_EXPLORER}/${encodeURIComponent(competitorUrl)}/inbound-links`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 40000 });
    await delay(3000);

    await page.waitForSelector('table tbody tr, [class*="link"], [class*="row"]', { timeout: 30000 });
    await delay(1500);

    const results = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const items = [];

      rows.forEach(row => {
        const domainEl = row.querySelector('a[href*="://"]');
        const domain = domainEl?.textContent?.trim();
        if (!domain || domain.length < 3) return;

        // Moz uses DA (Domain Authority) instead of DR
        let dr = 0;
        const cells = row.querySelectorAll('td');
        for (const cell of cells) {
          const val = parseInt(cell.textContent?.trim(), 10);
          if (!isNaN(val) && val > 0 && val <= 100) {
            dr = val;
            break;
          }
        }

        const rowText = row.textContent?.toLowerCase() || '';
        const dofollow = !rowText.includes('nofollow');

        items.push({ domain, dr, dofollow, source: 'moz' });
      });

      return items;
    });

    console.log(`  ✅ Moz: found ${results.length} backlinks`);
    return results;
  });
}
