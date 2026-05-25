#!/usr/bin/env node
/**
 * discover-wpcom-search.mjs
 * Uses WordPress.com search RSS and more Planet aggregators to find new blog targets.
 * Combines results to maximize unique-domain discoveries.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RESOURCES_PATH = resolve(ROOT, 'resources/backlink-resources.json');
const TIMEOUT_MS = 12000;

// More Planet aggregators (not tried before)
const MORE_PLANETS = [
  'https://planet.scipy.org/atom.xml',
  'https://planet.scipy.org/feed/',
  'https://planet.django.org/rss20.xml',
  'https://planet.gentoo.org/rss20.xml',
  'https://planet.archlinux.org/rss20.xml',
  'https://planet.centos.org/rss20.xml',
  'https://planet.opensuse.org/rss20.xml',
  'https://planet.apache.org/atom.xml',
  'https://planet.mysql.com/rss20.xml',
  'https://planet.gnome.org/atom.xml',
  'https://planet.ubuntu.com/atom.xml',
  'https://planet.openstreetmap.org/rss20.xml',
  'https://planet.nodejs.org/rss/',
  'https://aggregator.laravelphp.uk/rss/',
  'https://planet.symfony.com/rss.xml',
  'https://symfony.com/blog/feed',
  'https://news.ycombinator.com/rss',            // HN posts often link to personal blogs
  'https://lobste.rs/rss',
  'https://feeds.feedburner.com/PlanetMySQL',
  'https://planet.php.net/rss10.xml',
  'https://planet.erlang.se/',
  'https://planet.clojure.in/atom.xml',
  'https://planet.emacslife.com/atom.xml',
  'https://planet.scheme.org/atom.xml',
  'https://planet.lisp.org/rss.xml',
  'https://planet.openstreetmap.us/atom.xml',
  'https://planet.civictech.ca/feed/',
  'https://planethaskell.org/rss20.xml',
  'https://planet.ruby-lang.org/atom.xml',
  'https://planet.go-community.org/rss20.xml',
  'https://planet.go-community.org/atom.xml',
];

// WordPress.com tag/search RSS feeds (different niches = different blog populations)
const WPCOM_SEARCHES = [
  'https://en.search.wordpress.com/?q=science&orderby=lastmodified&feed=rss2',
  'https://en.search.wordpress.com/?q=mathematics&orderby=lastmodified&feed=rss2',
  'https://en.search.wordpress.com/?q=technology&orderby=lastmodified&feed=rss2',
  'https://en.search.wordpress.com/?q=cooking&orderby=lastmodified&feed=rss2',
  'https://en.search.wordpress.com/?q=programming&orderby=lastmodified&feed=rss2',
  'https://en.search.wordpress.com/?q=health&orderby=lastmodified&feed=rss2',
  'https://en.search.wordpress.com/?q=travel&orderby=lastmodified&feed=rss2',
  'https://en.search.wordpress.com/?q=education&orderby=lastmodified&feed=rss2',
  'https://en.search.wordpress.com/?q=finance&orderby=lastmodified&feed=rss2',
  'https://en.search.wordpress.com/?q=photography&orderby=lastmodified&feed=rss2',
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
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FeedReader/1.0)' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
  finally { clearTimeout(id); }
}

function extractLinksFromFeed(xml, filterHost = null) {
  const urls = new Set();
  const patterns = [
    /<link>(https?:\/\/[^<]+)<\/link>/g,
    /<link[^>]+href="(https?:\/\/[^"]+)"[^>]*\/>/g,
    /<id>(https?:\/\/[^<]+)<\/id>/g,
    /<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(xml)) !== null) {
      const u = m[1].trim();
      if (!u || u.includes('?feed=') || u.includes('/feed/') || u.includes('/rss')) continue;
      try {
        const h = new URL(u).hostname;
        if (h.includes('planet.') || h.includes('wordpress.com/tag') || h === 'en.search.wordpress.com') continue;
        if (filterHost && h !== filterHost) continue;
        urls.add(u);
      } catch {}
    }
  }
  return [...urls];
}

function hasOpenCommentForm(html) {
  if (!html) return false;
  const lower = html.toLowerCase();
  if (!lower.includes('name="comment"') && !lower.includes('id="comment"')) return false;
  const hasUrlField = lower.includes('name="url"') || lower.includes('id="url"') ||
    lower.includes('name="website"') || lower.includes('id="website"') ||
    lower.includes('type="url"') || lower.includes('placeholder="http') ||
    lower.includes('placeholder="website') || lower.includes('placeholder="url');
  if (!hasUrlField) return false;
  if (/recaptcha|hcaptcha|cf-turnstile/i.test(html)) return false;
  if (/you must be logged in|login to comment|sign in to comment/i.test(html)) return false;
  return true;
}

async function checkUrl(url) {
  const html = await httpGet(url, 10000);
  return hasOpenCommentForm(html);
}

async function processFeed(feedUrl, label, resources, existingUrls, submittedDomains, seenDomains, newEntries) {
  process.stdout.write(`[${label}] `);
  const xml = await httpGet(feedUrl, 12000);
  if (!xml) { console.log('unreachable'); return; }
  if (!xml.includes('<link>') && !xml.includes('<guid') && !xml.includes('href=')) {
    console.log('not a feed'); return;
  }

  const links = extractLinksFromFeed(xml);
  const candidates = [];
  const seen = new Set();
  for (const u of links) {
    try {
      const h = new URL(u).hostname;
      if (seen.has(h) || submittedDomains.has(h) || seenDomains.has(h)) continue;
      // Exclude major platforms that don't have URL fields
      if (h.endsWith('youtube.com') || h.endsWith('twitter.com') || h.endsWith('github.com') ||
          h.endsWith('linkedin.com') || h.endsWith('medium.com') || h.endsWith('substack.com') ||
          h.endsWith('hashnode.dev') || h.endsWith('dev.to') || h.endsWith('blogspot.com') ||
          h.endsWith('tumblr.com') || h.endsWith('wordpress.com') /* skip wp.com — they have login-required comments */) continue;
      seen.add(h);
      candidates.push({ url: u, hostname: h });
    } catch {}
  }

  console.log(`${candidates.length} new-domain links`);

  for (const { url, hostname } of candidates.slice(0, 6)) {
    if (existingUrls.has(url)) { seenDomains.add(hostname); continue; }
    process.stdout.write(`  ${url.slice(0, 72)} ... `);
    const valid = await checkUrl(url);
    if (valid) {
      newEntries.push({
        type: 'blog_comment', url,
        discovered_from: 'discovery:' + label,
        has_captcha: false, link_strategy: 'url_field',
        link_format: 'html', has_url_field: true,
      });
      existingUrls.add(url);
      seenDomains.add(hostname);
      console.log('✅');
    } else {
      seenDomains.add(hostname); // don't try again
      console.log('no form');
    }
    await new Promise(r => setTimeout(r, 250));
  }
}

async function main() {
  const resources = JSON.parse(readFileSync(RESOURCES_PATH, 'utf-8'));
  const existingUrls = new Set(resources.map(r => r.url));
  const submittedDomains = new Set(
    resources.filter(r => r.submitted).map(r => getHostname(r.url)).filter(Boolean)
  );
  const seenDomains = new Set(resources.map(r => getHostname(r.url)));
  console.log(`Existing: ${resources.length}, submitted domains: ${submittedDomains.size}, seen: ${seenDomains.size}`);

  const newEntries = [];

  const allFeeds = [
    ...MORE_PLANETS.map((f, i) => [f, 'planet' + (i+1)]),
    ...WPCOM_SEARCHES.map((f, i) => [f, 'wpcom' + (i+1)]),
  ];

  for (const [feed, label] of allFeeds) {
    await processFeed(feed, label, resources, existingUrls, submittedDomains, seenDomains, newEntries);
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n✅ Found ${newEntries.length} new targets`);
  const updated = [...resources, ...newEntries];
  writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`Total: ${updated.length}`);
}

main().catch(console.error);
