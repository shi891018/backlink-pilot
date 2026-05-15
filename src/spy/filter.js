// spy/filter.js — Filter and deduplicate backlink results

import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

const TARGETS_FILE = 'targets.yaml';

/** Load all domains already in targets.yaml */
function loadExistingDomains() {
  if (!existsSync(TARGETS_FILE)) return new Set();
  const data = parse(readFileSync(TARGETS_FILE, 'utf-8')) || {};
  const domains = new Set();
  for (const category of Object.values(data)) {
    if (!Array.isArray(category)) continue;
    for (const site of category) {
      if (site.submit_url) {
        try {
          const host = new URL(site.submit_url).hostname.replace(/^www\./, '');
          domains.add(host);
        } catch {}
      }
    }
  }
  return domains;
}

/**
 * Filter and deduplicate a list of backlink results.
 * @param {Array} results - Raw results from all sources
 * @param {Object} opts
 * @param {number} opts.minDr - Minimum DR score (default 20)
 * @param {boolean} opts.dofollowOnly - Only keep dofollow links
 * @param {boolean} opts.excludeExisting - Remove domains already in targets.yaml
 * @returns {Array} Filtered, deduplicated list sorted by DR desc
 */
export function filterBacklinks(results, opts = {}) {
  const { minDr = 20, dofollowOnly = false, excludeExisting = true } = opts;

  const existingDomains = excludeExisting ? loadExistingDomains() : new Set();

  // Deduplicate: keep highest DR per domain, merge sources
  const domainMap = new Map();
  for (const item of results) {
    // Normalize domain
    let domain = item.domain?.trim().toLowerCase().replace(/^www\./, '').replace(/\/.*$/, '');
    if (!domain || domain.length < 3) continue;

    if (domainMap.has(domain)) {
      const existing = domainMap.get(domain);
      // Keep max DR and union of sources
      existing.dr = Math.max(existing.dr, item.dr);
      if (!existing.sources.includes(item.source)) {
        existing.sources.push(item.source);
      }
      if (item.dofollow) existing.dofollow = true;
    } else {
      domainMap.set(domain, {
        domain,
        dr: item.dr || 0,
        dofollow: item.dofollow,
        sources: [item.source],
      });
    }
  }

  let filtered = [...domainMap.values()];

  // Apply filters
  if (minDr > 0) {
    filtered = filtered.filter(item => item.dr >= minDr);
  }
  if (dofollowOnly) {
    filtered = filtered.filter(item => item.dofollow);
  }
  if (excludeExisting) {
    filtered = filtered.filter(item => !existingDomains.has(item.domain));
  }

  // Sort by DR descending
  filtered.sort((a, b) => b.dr - a.dr);

  return filtered;
}
