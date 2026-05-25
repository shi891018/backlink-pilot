#!/usr/bin/env node
/**
 * discover-planet-blogs.mjs
 * Fetches blog lists from community "Planet" RSS aggregators.
 * These are lists of real, self-hosted WordPress blogs still maintained by developers/hobbyists.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RESOURCES_PATH = resolve(ROOT, 'resources/backlink-resources.json');

const TIMEOUT_MS = 12000;

// Planet aggregators that have real blog RSS
const PLANET_FEEDS = [
  'https://planet.wordpress.org/feed/',
  'https://planet.gnome.org/rss20.xml',
  'https://planet.fedoraproject.org/rss20.xml',
  'https://planet.ubuntu.com/rss20.xml',
  'https://planet.debian.org/rss20.xml',
  'https://planet.python.org/rss20.xml',
  'https://planet.libreoffice.org/rss20.xml',
  'https://planet.wikimedia.org/rss20.xml',
  'https://planet.kde.org/rss20.xml',
  'https://planet.freedesktop.org/rss20.xml',
  'https://planet.openstreetmap.org/rss20.xml',
  'https://planet.ruby-lang.org/rss20.xml',
  'https://planettex.net/feed.xml',
  'https://planet.emacsen.org/atom.xml',
  'https://planet.haskell.org/rss20.xml',
  'https://planet.mozilla.org/rss20.xml',
  'https://planet.inkscape.org/rss20.xml',
  'https://planet.postgresql.org/rss20.xml',
  'https://planet.drupal.org/rss.xml',
  'https://planet.joomla.org/feed.xml',
  'https://planet.typo3.org/feed/',
  'https://planet.perl.org/rss20.xml',
  'https://planet.php.net/rss20.xml',
  'https://planet.openstack.org/rss20.xml',
];

function getHostname(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

async function httpGet(url, timeoutMs = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BacklinkBot/1.0)' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
  finally { clearTimeout(id); }
}

function extractLinksFromFeed(xml) {
  const urls = new Set();
  // Match <link> tags (RSS) and <id> (Atom) — actual post URLs
  const patterns = [
    /<link>(https?:\/\/[^<]+)<\/link>/g,
    /<link[^>]*href="(https?:\/\/[^"]+)"[^>]*\/>/g,
    /<id>(https?:\/\/[^<]+)<\/id>/g,
    /<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(xml)) !== null) {
      const u = m[1].trim();
      if (u && !u.includes('planet.') && !u.match(/\/(tag|category|author|page)\//)) {
        urls.add(u);
      }
    }
  }
  return [...urls];
}

function hasOpenCommentForm(html) {
  if (!html) return false;
  const lower = html.toLowerCase();
  if (!lower.includes('name="comment"') && !lower.includes('id="comment"')) return false;
  const hasUrlField = lower.includes('name="url"') ||
    lower.includes('id="url"') ||
    lower.includes('name="website"') ||
    lower.includes('id="website"') ||
    lower.includes('type="url"') ||
    lower.includes('placeholder="http') ||
    lower.includes('placeholder="website') ||
    lower.includes('placeholder="url');
  if (!hasUrlField) return false;
  if (/recaptcha|hcaptcha|cf-turnstile/i.test(html)) return false;
  if (/you must be logged in|login to comment|sign in to comment/i.test(html)) return false;
  return true;
}

async function checkPost(url) {
  const html = await httpGet(url, 10000);
  if (!html) return false;
  return hasOpenCommentForm(html);
}

async function main() {
  const resources = JSON.parse(readFileSync(RESOURCES_PATH, 'utf-8'));
  const existingUrls = new Set(resources.map(r => r.url));
  const submittedDomains = new Set(
    resources.filter(r => r.submitted).map(r => getHostname(r.url)).filter(Boolean)
  );
  const seenDomains = new Set(resources.map(r => getHostname(r.url)));

  console.log(`Existing: ${resources.length}, submitted domains: ${submittedDomains.size}`);

  const newEntries = [];
  let checked = 0;

  for (const planetFeed of PLANET_FEEDS) {
    process.stdout.write(`Planet: ${planetFeed.split('/')[2]} ... `);
    const xml = await httpGet(planetFeed, 12000);
    if (!xml) { console.log('unreachable'); continue; }

    const links = extractLinksFromFeed(xml);
    const uniqueDomainLinks = [];
    const seen = new Set();
    for (const u of links) {
      try {
        const h = new URL(u).hostname;
        if (seen.has(h)) continue;
        if (submittedDomains.has(h)) continue;
        if (seenDomains.has(h)) continue; // already in our DB
        seen.add(h);
        uniqueDomainLinks.push({ url: u, hostname: h });
      } catch {}
    }

    console.log(`${uniqueDomainLinks.length} new-domain posts`);

    for (const { url, hostname } of uniqueDomainLinks.slice(0, 5)) {
      if (existingUrls.has(url)) continue;
      checked++;
      process.stdout.write(`  Check ${url.slice(0, 70)} ... `);
      const valid = await checkPost(url);
      if (valid) {
        newEntries.push({
          type: 'blog_comment', url,
          discovered_from: 'planet:' + planetFeed.split('/')[2],
          has_captcha: false, link_strategy: 'url_field',
          link_format: 'html', has_url_field: true,
        });
        existingUrls.add(url);
        seenDomains.add(hostname);
        console.log('✅');
      } else {
        console.log('no form');
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log(`\nChecked: ${checked}, added: ${newEntries.length}`);

  const updated = [...resources, ...newEntries];
  writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`Total: ${updated.length}`);
}

main().catch(console.error);
