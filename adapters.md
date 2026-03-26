# Site Adapters & Awesome-List Targets

## Directory Site Adapters

| Site | Command | Auth | CAPTCHA | Notes |
|------|---------|------|---------|-------|
| submitaitools.org | `submit submitaitools` | None | Color (auto) | DA 73, free listing |
| toolverto.com | `submit toolverto` | None | None | Clean URL only (no UTM) |

## Awesome-List Targets

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
