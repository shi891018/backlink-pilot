---
name: backlink-pilot
description: Automated backlink submission toolkit. Use when user wants to submit a product to directory sites, awesome-lists, or search engines. Handles stealth browser automation, form filling, CAPTCHA solving, and submission tracking.
---

# Backlink Pilot — OpenClaw Skill

Automated backlink submission for indie products. One config, one command.

## Installation

The tool is installed at: `~/Downloads/backlink-pilot/`

```bash
cd ~/Downloads/backlink-pilot && node src/cli.js <command>
```

## Config

Before using, ensure `config.yaml` exists in the project directory. Create from example:

```bash
cd ~/Downloads/backlink-pilot
cp config.example.yaml config.yaml
```

Then edit `config.yaml` with the product details.

## Commands

### Scout a site (discover form fields)
```bash
cd ~/Downloads/backlink-pilot && node src/cli.js scout https://example.com --deep
```
Output: list of submit-related links, form fields, auth requirements.

### Submit to a directory site
```bash
cd ~/Downloads/backlink-pilot && node src/cli.js submit submitaitools
cd ~/Downloads/backlink-pilot && node src/cli.js submit toolverto
```

### Dry run (show what would be submitted)
```bash
cd ~/Downloads/backlink-pilot && node src/cli.js submit submitaitools --dry-run
```

### Generate awesome-list issue body
```bash
cd ~/Downloads/backlink-pilot && node src/cli.js awesome chinese-independent-developer
cd ~/Downloads/backlink-pilot && node src/cli.js awesome awesome-cloudflare
```

### Ping search engines (IndexNow)
```bash
cd ~/Downloads/backlink-pilot && node src/cli.js indexnow https://example.com/new-page
```

### Check submission status
```bash
cd ~/Downloads/backlink-pilot && node src/cli.js status
```

## Available Site Adapters

| Site | Command | Auth | CAPTCHA | Notes |
|------|---------|------|---------|-------|
| submitaitools.org | `submit submitaitools` | None | Color ✅ auto | DA 73, free listing |
| toolverto.com | `submit toolverto` | None | None | Clean URL only (no UTM) |

## Available Awesome-List Targets

| Key | Repo | Language |
|-----|------|----------|
| `chinese-independent-developer` | nichetools/chinese-independent-developer | Chinese |
| `awesome-privacy` | Lissy93/awesome-privacy | English |
| `awesome-wasm` | mbasso/awesome-wasm | English |
| `awesome-cloudflare` | zhuima/awesome-cloudflare | Chinese |
| `awesome-pwa` | nichetools/awesome-pwa | English |
| `awesome-indie` | mezod/awesome-indie | English |
| `awesome-oss-alternatives` | RunaCapital/awesome-oss-alternatives | English |
| `awesome-free-apps` | Axorax/awesome-free-apps | English |
| `awesome-no-login-web-apps` | nichetools/awesome-no-login-web-apps | English |
| `awesome-astro` | one-aalam/awesome-astro | English |

## Adding New Site Adapters

Create `src/sites/<sitename>.js`:

```javascript
import { withBrowser, delay } from '../browser.js';

export default {
  name: 'example.com',
  url: 'https://example.com/submit',
  auth: 'none',        // none | email | oauth
  captcha: 'none',     // none | color | recaptcha

  async submit(product, config) {
    return withBrowser(config, async ({ page }) => {
      await page.goto('https://example.com/submit', { waitUntil: 'networkidle' });
      // Fill form fields...
      // Submit...
      // Check confirmation...
      return { url: page.url(), confirmation: 'success message' };
    });
  },
};
```

Then use: `node src/cli.js submit <sitename>`

## Workflow for Agent

1. **User says "submit to directories"** → check config.yaml exists
2. **Scout unknown sites first**: `node src/cli.js scout <url> --deep` to discover form fields
3. **Submit one at a time**: `node src/cli.js submit <site>` — check output for success/failure
4. **Track progress**: `node src/cli.js status` shows all submissions
5. **Pace submissions**: Wait 1-3 minutes between different sites
6. **If adapter doesn't exist**: Use scout to discover fields, then write a new adapter

## Key Constraints

- **rebrowser-playwright required**: Must be installed (`npm install` in project dir)
- **Chromium binary needed**: `~/Library/Caches/ms-playwright/chromium-1169/`
- **Some sites reject UTM params in URLs**: toolverto specifically rejects query strings
- **Google OAuth sites need manual first login**: Agent can't do 2FA without user
- **Cloudflare Turnstile is a hard wall**: Skip these sites (AlternativeTo, ProductHunt)
- **Never submit same product twice to same site**
- **Rate limit**: 1-3 min between sites, 30-60 min same site retry

## Troubleshooting

See `TROUBLESHOOTING.md` in the project directory for detailed solutions to common issues:
- OpenClaw browser returns 403 → switch to rebrowser
- Google OAuth needs manual 2FA on first login
- Some sites reject UTM params in URLs → submit clean URL
- Cloudflare Challenge = hard wall → skip the site
- Date picker widgets (flatpickr etc.) → use `page.evaluate()` to set value directly
- Reddit blocks all headless browsers at network level → manual only
