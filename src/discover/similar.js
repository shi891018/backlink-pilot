// discover/similar.js — Discover directory candidates similar to a seed site.
// Uses only public page markup and a public web-search endpoint. It never submits forms.

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { stringify, parse } from 'yaml';

const TARGETS_FILE = 'targets.yaml';
const DIRECTORY_WORDS = /\b(ai tools?|tool directory|startup directory|product directory|software directory|launch(?:ed|ing)?|discover tools?)\b/i;
const SUBMIT_WORDS = /\b(submit|add (?:your )?(?:tool|product|startup|listing)|list (?:your )?(?:tool|product|startup)|suggest (?:a )?(?:tool|product))\b/i;
const LOGIN_WORDS = /\b(sign[ -]?in|log[ -]?in|create an? account|register)\b/i;
const PAID_WORDS = /\b(pricing|checkout|payment|paid submission|sponsor(?:ed)? listing)\b/i;

const TECHNOLOGIES = {
  wordpress: /wp-content|wp-includes|wordpress/i,
  webflow: /webflow(?:\.js|\.com)/i,
  framer: /framer(?:\.com|usercontent\.com)|framer-site/i,
  ghost: /ghost(?:\.io|\/assets\/built)/i,
  nextjs: /__next(?:\/|_data)|next-route-announcer/i,
  wix: /wixstatic\.com|wixsite\.com/i,
  squarespace: /static1\.squarespace\.com|squarespace-cdn/i,
};

const FORM_PROVIDERS = {
  typeform: /typeform\.com|typeform-embed/i,
  tally: /tally\.so|tally-embed/i,
  hubspot: /hsforms\.net|hubspotforms/i,
  jotform: /jotform\.com/i,
  google_forms: /docs\.google\.com\/forms/i,
};

function unescapeHtml(value = '') {
  return value.replace(/&amp;/gi, '&').replace(/&#x2F;/gi, '/').replace(/&quot;/gi, '"');
}

function matchNames(html, definitions) {
  return Object.entries(definitions)
    .filter(([, pattern]) => pattern.test(html))
    .map(([name]) => name);
}

function textFromHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normaliseUrl(value, base) {
  try {
    const url = new URL(unescapeHtml(value), base);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

export function extractLinks(html, baseUrl) {
  const links = [];
  const seen = new Set();
  const linkPattern = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(linkPattern)) {
    const url = normaliseUrl(match[1], baseUrl);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    links.push({ url, text: textFromHtml(match[2]).slice(0, 160) });
  }
  return links;
}

/** Extract the stable, public traits that can be used as discovery pivots. */
export function analyseSiteHtml(html, url) {
  const text = textFromHtml(html);
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim();
  const links = extractLinks(html, url);
  const submitLinks = links.filter(link => SUBMIT_WORDS.test(`${link.text} ${link.url}`));
  const directoryScore = (DIRECTORY_WORDS.test(`${title} ${text}`) ? 2 : 0)
    + (submitLinks.length > 0 ? 3 : 0)
    + (/<(?:form|input|textarea|select)\b/i.test(html) ? 1 : 0);

  return {
    url,
    title,
    technologies: matchNames(html, TECHNOLOGIES),
    formProviders: matchNames(html, FORM_PROVIDERS),
    submitLinks,
    directoryScore,
    signals: {
      hasForm: /<(?:form|input|textarea|select)\b/i.test(html),
      login: LOGIN_WORDS.test(text),
      paid: PAID_WORDS.test(text),
    },
  };
}

export function buildSearchQueries(fingerprint) {
  const tech = fingerprint.technologies[0];
  const provider = fingerprint.formProviders[0];
  const queries = [
    '"submit your tool" directory',
    '"add your startup" directory',
  ];
  if (tech) queries.push(`"${tech}" "submit your tool"`);
  if (provider) queries.push(`"${provider}" "submit" directory`);
  return [...new Set(queries)];
}

/** Parse result URLs from DuckDuckGo's non-JavaScript results page. */
export function extractSearchResultUrls(html) {
  const urls = new Set();
  const hrefPattern = /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["']/gi;
  for (const match of html.matchAll(hrefPattern)) {
    let href = unescapeHtml(match[1]);
    try {
      const parsed = new URL(href, 'https://html.duckduckgo.com');
      href = parsed.searchParams.get('uddg') || href;
    } catch {}
    const url = normaliseUrl(href);
    if (url) urls.add(url);
  }
  return [...urls];
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'backlink-pilot/2.1 (+https://github.com/s87343472/backlink-pilot)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { url: response.url || url, html: await response.text() };
}

async function searchPublicWeb(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const { html } = await fetchPage(url);
  return extractSearchResultUrls(html);
}

function domainsInTargets() {
  if (!existsSync(TARGETS_FILE)) return new Set();
  const data = parse(readFileSync(TARGETS_FILE, 'utf8')) || {};
  const domains = new Set();
  for (const entries of Object.values(data)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      const host = normaliseUrl(entry.submit_url)?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      if (host) domains.add(host);
    }
  }
  return domains;
}

function candidateScore(seed, candidate) {
  const techOverlap = candidate.technologies.filter(item => seed.technologies.includes(item)).length;
  const providerOverlap = candidate.formProviders.filter(item => seed.formProviders.includes(item)).length;
  return candidate.directoryScore + techOverlap * 2 + providerOverlap * 2;
}

function mergeSimilarTargets(candidates) {
  const data = existsSync(TARGETS_FILE) ? parse(readFileSync(TARGETS_FILE, 'utf8')) || {} : {};
  const category = 'similar_directories';
  data[category] ||= [];
  const existing = domainsInTargets();
  let added = 0;
  for (const candidate of candidates) {
    const host = new URL(candidate.submit_url).hostname.replace(/^www\./, '');
    if (existing.has(host)) continue;
    data[category].push({
      name: candidate.title || host,
      submit_url: candidate.submit_url,
      type: 'form',
      auto: false,
      status: 'manual',
      notes: `Discovered from technical fingerprint of ${candidate.seed_domain}; score ${candidate.score}; technologies: ${candidate.technologies.join(', ') || 'unknown'}`,
    });
    existing.add(host);
    added++;
  }
  if (added) writeFileSync(TARGETS_FILE, stringify(data), 'utf8');
  return added;
}

export async function discoverSimilar(seedUrl, opts = {}) {
  const { limit = 20, search = true, merge = false, output } = opts;
  const seed = normaliseUrl(seedUrl);
  if (!seed) throw new Error('Seed URL must be an http(s) URL');

  console.log(`\n🧭 Discovering sites similar to ${seed}\n`);
  let fetchedSeed;
  try {
    fetchedSeed = await fetchPage(seed);
  } catch (error) {
    console.warn(`  ⚠️ Cannot fetch seed site: ${error.message}`);
    return { fingerprint: null, results: [] };
  }
  const fingerprint = analyseSiteHtml(fetchedSeed.html, fetchedSeed.url);
  console.log(`  Stack: ${fingerprint.technologies.join(', ') || 'not detected'}`);
  console.log(`  Forms: ${fingerprint.formProviders.join(', ') || 'native/unknown'}`);
  console.log(`  Submit signals: ${fingerprint.submitLinks.length}`);

  const candidateUrls = new Set(fingerprint.submitLinks.map(link => link.url));
  if (search) {
    for (const query of buildSearchQueries(fingerprint)) {
      try {
        const results = await searchPublicWeb(query);
        results.forEach(result => candidateUrls.add(result));
      } catch (error) {
        console.warn(`  ⚠️ Search skipped for "${query}": ${error.message}`);
      }
    }
  }

  const existing = domainsInTargets();
  const seedHost = new URL(seed).hostname.replace(/^www\./, '');
  const inspected = [];
  for (const candidateUrl of candidateUrls) {
    if (inspected.length >= limit * 3) break;
    const host = new URL(candidateUrl).hostname.replace(/^www\./, '');
    if (host === seedHost || existing.has(host)) continue;
    try {
      const fetched = await fetchPage(candidateUrl);
      const candidate = analyseSiteHtml(fetched.html, fetched.url);
      if (candidate.directoryScore < 3 || candidate.signals.paid) continue;
      const submitUrl = candidate.submitLinks[0]?.url || fetched.url;
      inspected.push({
        title: candidate.title,
        url: fetched.url,
        submit_url: submitUrl,
        technologies: candidate.technologies,
        formProviders: candidate.formProviders,
        requires_login: candidate.signals.login,
        score: candidateScore(fingerprint, candidate),
        seed_domain: seedHost,
      });
    } catch {}
  }

  const results = inspected.sort((a, b) => b.score - a.score).slice(0, limit);
  console.log(`\n📊 ${results.length} reviewable directory candidates\n`);
  for (const item of results) {
    console.log(`  ${item.score.toString().padStart(2)}  ${item.submit_url}${item.requires_login ? '  (login signal)' : ''}`);
  }

  if (output) {
    writeFileSync(output, output.endsWith('.json') ? JSON.stringify(results, null, 2) : stringify(results), 'utf8');
    console.log(`\n💾 Saved to ${output}`);
  }
  if (merge) {
    const added = mergeSimilarTargets(results);
    console.log(`\n✅ Added ${added} manual-review targets to ${TARGETS_FILE}`);
  }
  return { fingerprint, results };
}
