#!/usr/bin/env node
/**
 * Verify whether previously submitted blog-comment links are publicly visible.
 *
 * This is deliberately read-only: it never opens a browser session, fills forms,
 * or changes any target site.  It records evidence from the public response.
 *
 * Usage:
 *   node src/verify-blog-links.mjs --priority --limit 20
 *   node src/verify-blog-links.mjs --all --limit 50 --delay 10000
 *   node src/verify-blog-links.mjs --url https://example.com/post --target https://www.unitconv.top
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import YAML from 'yaml';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RESOURCES_PATH = resolve(ROOT, 'resources', 'backlink-resources.json');
const CONFIG_PATH = resolve(ROOT, 'config.yaml');
const LOG_DIR = resolve(ROOT, 'logs');
const REPORT_DIR = resolve(ROOT, 'reports');
const LOG_PATH = resolve(LOG_DIR, 'blog-link-verification.json');

const args = process.argv.slice(2);
const getOption = (name, fallback) => {
  const equals = args.find(arg => arg.startsWith(`${name}=`));
  if (equals) return equals.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const LIMIT = Math.max(1, Number.parseInt(getOption('--limit', '20'), 10) || 20);
const DELAY_MS = Math.max(0, Number.parseInt(getOption('--delay', '10000'), 10) || 0);
const REQUEST_TIMEOUT_MS = Math.max(1000, Number.parseInt(getOption('--timeout', '20000'), 10) || 20000);
const PRIORITY_ONLY = args.includes('--priority') || !args.includes('--all');
const DRY_RUN = args.includes('--dry-run');
const SINGLE_URL = getOption('--url', null);
const TARGET_OVERRIDE = getOption('--target', null);

const HIGH_VALUE_HOSTS = new Set([
  'madrimasd.org', 'terrytao.wordpress.com', 'mathwithbaddrawings.com',
  'profmattstrassler.com', 'statmodeling.stat.columbia.edu', 'realclimate.org',
  'polymathprojects.org', 'mathbabe.org', 'rjlipton.com', 'gilkalai.wordpress.com',
  'lucatrevisan.wordpress.com', 'wikiedu.org', 'geoenergymath.com',
]);
const RELEVANCE_WORDS = /math|stat|physics|science|climate|astro|engineering|algorithm|comput|data|research|education/i;
const MAX_BODY_BYTES = 2_000_000;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function canonicalTarget(value) {
  const url = new URL(value);
  return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`.toLowerCase();
}

function targetFromConfig() {
  if (TARGET_OVERRIDE) return TARGET_OVERRIDE;
  if (!existsSync(CONFIG_PATH)) throw new Error('config.yaml not found; provide --target <product-url>.');
  const config = YAML.parse(readFileSync(CONFIG_PATH, 'utf8'));
  if (!config?.product?.url) throw new Error('product.url is missing from config.yaml; provide --target <product-url>.');
  return config.product.url;
}

function loadSubmittedResources() {
  const raw = JSON.parse(readFileSync(RESOURCES_PATH, 'utf8'));
  const records = Array.isArray(raw) ? raw : raw.blog_comments || [];
  return records.filter(record => record.type === 'blog_comment' && record.submitted && record.url);
}

function hostFor(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

function priorityScore(record) {
  const host = hostFor(record.url);
  let score = HIGH_VALUE_HOSTS.has(host) ? 100 : 0;
  if (RELEVANCE_WORDS.test(`${host} ${record.url} ${record.name || ''} ${record.niche || ''}`)) score += 20;
  if (record.niche && record.niche !== 'general') score += 15;
  return score;
}

function extractMetaRobots(html) {
  const tags = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => match[0]);
  const values = tags
    .filter(tag => /\bname\s*=\s*["']?robots["']?/i.test(tag))
    .map(tag => (tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i) || [])[1] || '')
    .join(',');
  return values.toLowerCase();
}

function extractTitle(html) {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
  return title.replace(/\s+/g, ' ').trim().slice(0, 300);
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function attribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*(?:["']([^"']*)["']|([^\\s>]+))`, 'i'));
  return decodeEntities(match?.[1] ?? match?.[2] ?? '');
}

function normalizeLink(value, baseUrl) {
  try {
    const resolved = new URL(value, baseUrl);
    return canonicalTarget(resolved.href);
  } catch {
    return '';
  }
}

/** Exported for tests and for future report tooling. */
export function analyzeHtml(html, pageUrl, targetUrl) {
  const target = canonicalTarget(targetUrl);
  const robots = extractMetaRobots(html);
  const anchors = [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)[^>]*>[\s\S]*?<\/a\s*>/gi)]
    .map(match => match[0]);

  const matchingAnchors = anchors.map(tag => {
    const href = attribute(tag, 'href');
    return { tag, href, normalized: normalizeLink(href, pageUrl) };
  }).filter(link => link.normalized === target);

  if (matchingAnchors.length) {
    const link = matchingAnchors[0];
    const rel = attribute(link.tag, 'rel').toLowerCase().split(/\s+/).filter(Boolean);
    const anchorText = link.tag
      .replace(/<a\b[^>]*>/i, '')
      .replace(/<\/a\s*>/i, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300);
    const qualified = rel.some(value => ['nofollow', 'ugc', 'sponsored'].includes(value));
    return {
      status: qualified ? 'live_nofollow' : (robots.includes('noindex') ? 'live_on_noindex_page' : 'live_followed'),
      evidence: { href: link.href, rel, anchor_text: anchorText, robots },
    };
  }

  const targetHost = new URL(targetUrl).hostname.replace(/^www\./, '');
  const targetMentioned = html.toLowerCase().includes(targetHost.toLowerCase());
  return {
    status: targetMentioned ? 'target_text_only' : 'not_found',
    evidence: { robots },
  };
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'BacklinkPilotVerifier/2.1 (+https://www.unitconv.top; read-only public-link verification)',
        'accept': 'text/html,application/xhtml+xml',
      },
    });
    const bytes = new Uint8Array(await response.arrayBuffer());
    const body = new TextDecoder().decode(bytes.slice(0, MAX_BODY_BYTES));
    return { response, body, truncated: bytes.byteLength > MAX_BODY_BYTES };
  } finally {
    clearTimeout(timer);
  }
}

async function verify(record, targetUrl) {
  const checkedAt = new Date().toISOString();
  try {
    const { response, body, truncated } = await fetchPage(record.url);
    if (!response.ok) {
      return {
        url: record.url, host: hostFor(record.url), status: `http_${response.status}`,
        checked_at: checkedAt, final_url: response.url, page_title: extractTitle(body),
        evidence: { truncated },
      };
    }
    const analysis = analyzeHtml(body, response.url, targetUrl);
    return {
      url: record.url, host: hostFor(record.url), checked_at: checkedAt,
      final_url: response.url, http_status: response.status, page_title: extractTitle(body),
      ...analysis, evidence: { ...analysis.evidence, truncated },
    };
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'timeout' : (error?.message || String(error));
    return { url: record.url, host: hostFor(record.url), status: 'fetch_error', checked_at: checkedAt, error: reason };
  }
}

function readExistingLog(targetUrl) {
  if (!existsSync(LOG_PATH)) return [];
  try {
    const log = JSON.parse(readFileSync(LOG_PATH, 'utf8'));
    return log.target === targetUrl && Array.isArray(log.results) ? log.results : [];
  } catch {
    return [];
  }
}

function writeArtifacts(targetUrl, results) {
  mkdirSync(LOG_DIR, { recursive: true });
  mkdirSync(REPORT_DIR, { recursive: true });
  const ordered = [...results].sort((a, b) => a.url.localeCompare(b.url));
  const payload = { target: targetUrl, generated_at: new Date().toISOString(), results: ordered };
  writeFileSync(LOG_PATH, `${JSON.stringify(payload, null, 2)}\n`);

  const totals = Object.entries(ordered.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {})).sort(([a], [b]) => a.localeCompare(b));
  const rows = ordered.map(result => {
    const evidence = result.evidence?.href
      ? `${result.evidence.href}${result.evidence.rel?.length ? ` (rel=${result.evidence.rel.join(' ')})` : ''}`
      : (result.error || '—');
    return `| ${result.status} | ${result.http_status ?? '—'} | ${result.url} | ${evidence} |`;
  });
  const report = [
    '# Blog link verification', '', `Target: \`${targetUrl}\``, `Generated: ${payload.generated_at}`, '',
    '## Results', '', '| Status | HTTP | Submitted page | Evidence |', '| --- | ---: | --- | --- |',
    ...rows, '', '## Counts', '', ...totals.map(([status, count]) => `- ${status}: ${count}`), '',
    '> `submitted` means the original form submission was attempted. Only `live_*` statuses prove a public link was found.', '',
  ].join('\n');
  const reportPath = resolve(REPORT_DIR, 'blog-link-verification.md');
  writeFileSync(reportPath, report);
  return { reportPath, logPath: LOG_PATH };
}

async function main() {
  const targetUrl = targetFromConfig();
  const existing = readExistingLog(targetUrl);
  const verified = new Map(existing.map(result => [result.url, result]));
  let queue;
  if (SINGLE_URL) {
    queue = [{ url: SINGLE_URL, submitted: true }];
  } else {
    const resources = loadSubmittedResources();
    queue = resources.filter(record => !verified.has(record.url));
    if (PRIORITY_ONLY) queue = queue.filter(record => priorityScore(record) > 0);
    queue.sort((a, b) => priorityScore(b) - priorityScore(a) || a.url.localeCompare(b.url));
  }
  queue = queue.slice(0, LIMIT);

  console.log(`🔎 Blog link verification (${DRY_RUN ? 'dry run' : 'read-only'})`);
  console.log(`   Target: ${targetUrl}`);
  console.log(`   Queue: ${queue.length}${PRIORITY_ONLY && !SINGLE_URL ? ' priority candidates' : ' pages'}\n`);
  if (!queue.length) {
    console.log('Nothing new to verify. Use --all to include lower-priority pages.');
    return;
  }

  for (let index = 0; index < queue.length; index += 1) {
    const record = queue[index];
    if (DRY_RUN) {
      console.log(`  [dry-run] ${record.url}`);
      continue;
    }
    const result = await verify(record, targetUrl);
    verified.set(result.url, result);
    // Persist after every page: desktop terminal sessions can be interrupted while
    // a paced batch is still running, and a completed verification must not be lost.
    writeArtifacts(targetUrl, [...verified.values()]);
    console.log(`  ${index + 1}/${queue.length} ${result.status} — ${record.url}`);
    if (index < queue.length - 1 && DELAY_MS) await wait(DELAY_MS);
  }

  if (!DRY_RUN) {
    const artifacts = writeArtifacts(targetUrl, [...verified.values()]);
    console.log(`\nSaved evidence: ${artifacts.logPath}`);
    console.log(`Saved report: ${artifacts.reportPath}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))) {
  main().catch(error => {
    console.error(`Verification failed: ${error.message}`);
    process.exitCode = 1;
  });
}
