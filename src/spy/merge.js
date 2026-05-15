// spy/merge.js — Append newly discovered competitor backlink sites to targets.yaml

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse, stringify } from 'yaml';

const TARGETS_FILE = 'targets.yaml';
const CATEGORY = 'competitor_backlinks';

/**
 * Merge filtered backlink results into targets.yaml.
 * New sites are added under the "competitor_backlinks" category.
 * @param {Array} items - Filtered backlink items from filter.js
 * @returns {number} Count of newly added sites
 */
export function mergeIntoTargets(items) {
  const data = existsSync(TARGETS_FILE)
    ? parse(readFileSync(TARGETS_FILE, 'utf-8')) || {}
    : {};

  if (!data[CATEGORY]) {
    data[CATEGORY] = [];
  }

  // Collect existing submit URLs to avoid dups within this category
  const existingUrls = new Set(
    data[CATEGORY].map(s => s.submit_url?.toLowerCase()).filter(Boolean)
  );

  let added = 0;
  for (const item of items) {
    const submitUrl = `https://${item.domain}`;
    if (existingUrls.has(submitUrl.toLowerCase())) continue;

    data[CATEGORY].push({
      name: item.domain,
      submit_url: submitUrl,
      type: 'form',
      auto: false,
      dr: item.dr,
      dofollow: item.dofollow,
      sources: item.sources,
      notes: `Discovered via competitor analysis (${item.sources.join(', ')})`,
    });

    existingUrls.add(submitUrl.toLowerCase());
    added++;
  }

  writeFileSync(TARGETS_FILE, stringify(data), 'utf-8');
  return added;
}
