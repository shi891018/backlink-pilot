// spy/index.js — Competitor backlink spy: fetch → filter → output/merge

import { writeFileSync } from 'fs';
import { stringify } from 'yaml';
import chalk from 'chalk';
import { fetchAhrefsBacklinks } from './sources/ahrefs.js';
import { fetchOpenLinkProfilerBacklinks } from './sources/openlinkprofiler.js';
import { fetchUbersuggestBacklinks } from './sources/ubersuggest.js';
import { fetchMozBacklinks } from './sources/moz.js';
import { filterBacklinks } from './filter.js';
import { mergeIntoTargets } from './merge.js';

const SOURCES = {
  ahrefs: fetchAhrefsBacklinks,
  openlinkprofiler: fetchOpenLinkProfilerBacklinks,
  ubersuggest: fetchUbersuggestBacklinks,
  moz: fetchMozBacklinks,
};

/**
 * Main spy command handler.
 * @param {string} competitorUrl - The competitor website URL to analyze
 * @param {Object} opts
 * @param {string}  opts.source         - 'ahrefs'|'openlinkprofiler'|'ubersuggest'|'moz'|'all' (default: 'all')
 * @param {number}  opts.limit          - Max results to keep after filtering (default: 50)
 * @param {number}  opts.minDr          - Minimum DR score (default: 20)
 * @param {boolean} opts.dofollowOnly   - Only keep dofollow links
 * @param {string}  opts.output         - Save results to a YAML/JSON file
 * @param {boolean} opts.merge          - Append to targets.yaml
 * @param {Object}  opts.config         - App config (browser engine, credentials, etc.)
 */
export async function spy(competitorUrl, opts = {}) {
  const {
    source = 'all',
    limit = 50,
    minDr = 20,
    dofollowOnly = false,
    output,
    merge,
    config = {},
  } = opts;

  console.log(chalk.bold(`\n🕵️  Spy: analyzing competitor ${chalk.cyan(competitorUrl)}\n`));

  // 1. Determine which sources to use
  const sourceKeys = source === 'all' ? Object.keys(SOURCES) : [source];
  const invalidSources = sourceKeys.filter(k => !SOURCES[k]);
  if (invalidSources.length) {
    console.error(chalk.red(`❌ Unknown source(s): ${invalidSources.join(', ')}`));
    console.error(`   Valid: ${Object.keys(SOURCES).join(', ')}, all`);
    process.exit(1);
  }

  // 2. Fetch from all selected sources (sequentially to avoid rate-limiting)
  const allResults = [];
  for (const key of sourceKeys) {
    try {
      const results = await SOURCES[key](competitorUrl, config);
      allResults.push(...results);
    } catch (err) {
      console.warn(chalk.yellow(`  ⚠️  ${key} failed: ${err.message}`));
    }
  }

  if (allResults.length === 0) {
    console.log(chalk.yellow('\n⚠️  No backlinks found. Try a different source or URL.'));
    return;
  }

  // 3. Filter
  const filtered = filterBacklinks(allResults, { minDr, dofollowOnly, excludeExisting: true }).slice(0, limit);

  // 4. Report
  console.log(chalk.bold(`\n📊 Results: ${filtered.length} new sites found (DR ≥ ${minDr})\n`));
  for (const item of filtered.slice(0, 20)) {
    const tag = item.dofollow ? chalk.green('dofollow') : chalk.gray('nofollow');
    const drStr = item.dr ? chalk.yellow(`DR${item.dr}`) : chalk.gray('DR?');
    const srcStr = chalk.dim(`[${item.sources.join('+')}]`);
    console.log(`  ${drStr}  ${tag}  ${item.domain}  ${srcStr}`);
  }
  if (filtered.length > 20) {
    console.log(chalk.dim(`  ... and ${filtered.length - 20} more`));
  }

  // 5. Save to file
  if (output) {
    const isJson = output.endsWith('.json');
    const content = isJson ? JSON.stringify(filtered, null, 2) : stringify(filtered);
    writeFileSync(output, content, 'utf-8');
    console.log(chalk.green(`\n💾 Saved to ${output}`));
  }

  // 6. Merge into targets.yaml
  if (merge) {
    const added = mergeIntoTargets(filtered);
    console.log(chalk.green(`\n✅ Added ${added} new sites to targets.yaml`));
    if (added > 0) {
      console.log(chalk.dim('   Run: node src/cli.js submit --help to start submitting'));
    }
  }

  return filtered;
}
