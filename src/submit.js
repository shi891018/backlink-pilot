// submit.js — Dispatch submissions to site-specific or generic adapters

import { readdirSync } from 'fs';
import { utmUrl } from './config.js';
import { recordSubmission } from './tracker.js';

// Dynamic import of site adapters
async function loadAdapter(site) {
  // URL as site → use generic bb-browser adapter
  if (site.startsWith('http')) {
    const generic = await import('./sites/generic.js');
    return { ...generic.default, _targetUrl: site };
  }

  try {
    const mod = await import(`./sites/${site}.js`);
    return mod.default || mod;
  } catch (e) {
    return null;
  }
}

export async function submit(site, opts) {
  const { config } = opts;

  const adapter = await loadAdapter(site);
  if (!adapter) {
    console.error(`❌ No adapter for "${site}".`);
    console.log('\nAvailable sites:');
    const files = readdirSync(new URL('./sites/', import.meta.url));
    for (const f of files) {
      if (f.endsWith('.js')) console.log(`  - ${f.replace('.js', '')}`);
    }
    console.log('\nOr pass a URL directly for generic submission:');
    console.log('  node src/cli.js submit https://example.com/submit --engine bb');
    process.exit(1);
  }

  // Adapter-level engine override
  if (adapter.engine) config._engine = adapter.engine;

  // Pass target URL for generic adapter
  if (adapter._targetUrl) config._targetUrl = adapter._targetUrl;

  const product = {
    ...config.product,
    utm_url: utmUrl(config, site),
  };

  console.log(`\n🚀 Submitting "${product.name}" to ${site}`);
  if (opts.dryRun) {
    console.log('  [DRY RUN] Would submit:', JSON.stringify(product, null, 2));
    return;
  }

  try {
    const result = await adapter.submit(product, config);
    recordSubmission(site, 'submitted', {
      url: result?.url,
      confirmation: result?.confirmation,
    });
    console.log(`✅ Submitted to ${site}!`);
    if (result?.confirmation) console.log(`  Confirmation: ${result.confirmation}`);
  } catch (e) {
    recordSubmission(site, 'failed', { error: e.message });
    console.error(`❌ Failed: ${e.message}`);
  }
}
