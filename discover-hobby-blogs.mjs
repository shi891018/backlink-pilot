#!/usr/bin/env node
/**
 * discover-hobby-blogs.mjs
 * Targets ultra-small hobby/community blogs that haven't upgraded WP.
 * Pattern: HAM radio, amateur astronomy, birdwatching, crafts, local church, small artisan.
 * These communities = elderly bloggers + old WordPress themes = URL fields intact.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RESOURCES_PATH = resolve(ROOT, 'resources/backlink-resources.json');
const TIMEOUT_MS = 12000;

const HOBBY_FEEDS = [
  // HAM radio blog aggregators (very old community, old WP installs)
  'https://hamradio.me/feed/',
  'https://www.qrz.com/blog/feed',
  'https://www.hamuniverse.com/feed.xml',
  'https://n4uf.blogspot.com/feeds/posts/default', // skip - blogspot
  'https://www.kb6nu.com/feed/',
  'https://www.k0nr.com/wordpress/feed/',
  'https://ham-digital.org/feed/',
  'https://www.arrl.org/feed/news',
  'https://blog.radioartisan.com/feed/',
  'https://g4ilo.com/feed.xml',

  // Amateur astronomy blogs
  'https://www.cloudynights.com/blog/index.rss',
  'https://skyandtelescope.org/feed/',
  'https://www.universetoday.com/feed/',
  'https://earthsky.org/feed/',
  'https://www.astronomynow.com/feed/',
  'https://www.space.com/feeds/all',
  'https://skyandtelescope.org/observing/feed/',
  'https://www.astroblog.net/feed/',
  'https://cosmoquest.org/feed/',
  'https://www.nightskyobserver.com/feed/',
  'https://www.starlightmag.com/feed/',
  'https://telescopicwatch.com/feed/',
  'https://agenaastro.com/blog/feed/',

  // Birdwatching blogs (small personal sites)
  'https://www.surfbirds.com/feed/',
  'https://cobirds.org/feed.xml',
  'https://abcbirds.org/feed/',
  'https://www.birdguides.com/feed/',
  'https://www.nhbs.com/blog/feed/',
  'https://fatbirder.com/feed/',
  'https://www.birdwatchingdaily.com/feed/',
  'https://www.thebirdersbug.com/feed/',
  'https://10000birds.com/feed/',

  // Small artisan/handmade business blogs (moonsoap pattern)
  'https://www.modernsoapmaking.com/feed/',
  'https://www.soapqueen.com/feed/',
  'https://lovinsoap.com/feed/',
  'https://www.naturesgardencandles.com/blog/feed/',
  'https://www.candlemaking.com/feed/',
  'https://www.millersoap.com/feed.xml',
  'https://www.brambleberry.com/blog/feed/',
  'https://thesagesorrows.com/feed/',
  'https://www.makingsoapfromscratch.com/feed/',

  // Genealogy community (very old community, old WP)
  'https://www.familytreemagazine.com/feed/',
  'https://blog.myheritage.com/feed/',
  'https://www.ancestry.com/corporate/blog/feed/',
  'https://www.geni.com/blog/feed/',
  'https://genealogyroots.wordpress.com/feed/',
  'https://www.thoughtco.com/genealogy-4133006?format=rss',
  'https://blog.findmypast.com/feed/',
  'https://www.genealogyintime.com/articles.xml',
  'https://www.thegenealogist.co.uk/blog/feed.xml',

  // Small church / ministry blogs (very old WP installs)
  'https://www.thegospelcoalition.org/feed/',
  'https://www.ligonier.org/blog/feed/',
  'https://www.9marks.org/feed/',
  'https://www.desiringgod.org/features/feed',
  'https://www.crossway.org/blog/feed/',
  'https://www.albertmohler.com/feed/',
  'https://firstthings.com/feed',
  'https://www.christianitytoday.com/ct/feed.rss',

  // Model train / hobby (very old community)
  'https://www.mrhmag.com/node/feed',
  'https://mrhmag.com/blog/feed',
  'https://www.trains.com/feed/',
  'https://www.railroadforums.com/forum/external.php?type=RSS2',
  'https://www.nmra.org/feed',

  // Coin collecting
  'https://www.numismaticnews.net/feed/',
  'https://www.coinsweekly.com/en/feed/',
  'https://blog.pcgs.com/feed/',
  'https://coinweek.com/feed/',
  'https://www.ngccoin.com/news/feed/',
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
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
  finally { clearTimeout(id); }
}

function extractLinks(xml) {
  const found = new Set();
  const patterns = [
    /<link>(https?:\/\/[^<]+)<\/link>/g,
    /<link[^>]+href="(https?:\/\/[^"]+)"[^>]*\/>/g,
    /<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(xml)) !== null) {
      const u = m[1].trim();
      if (!u || u.includes('/feed') || u.includes('?feed=') || u.includes('/rss')) continue;
      found.add(u);
    }
  }
  return [...found];
}

function hasOpenCommentForm(html) {
  if (!html) return false;
  const lower = html.toLowerCase();
  if (!lower.includes('name="comment"') && !lower.includes('id="comment"')) return false;
  const hasUrl = lower.includes('name="url"') || lower.includes('id="url"') ||
    lower.includes('name="website"') || lower.includes('id="website"') ||
    lower.includes('type="url"') || lower.includes('placeholder="http') ||
    lower.includes('placeholder="website');
  if (!hasUrl) return false;
  if (/recaptcha|hcaptcha|cf-turnstile/i.test(html)) return false;
  if (/you must be logged in|login to comment|sign in to comment/i.test(html)) return false;
  return true;
}

function isWordPress(html) {
  return html && (html.includes('wp-content') || html.includes('wp-json') || html.includes('/wp-includes/'));
}

async function main() {
  const resources = JSON.parse(readFileSync(RESOURCES_PATH, 'utf-8'));
  const existingUrls = new Set(resources.map(r => r.url));
  const submittedDomains = new Set(resources.filter(r => r.submitted).map(r => getHostname(r.url)));
  const seenDomains = new Set(resources.map(r => getHostname(r.url)));
  console.log(`Existing: ${resources.length}, seen: ${seenDomains.size}`);

  const newEntries = [];

  for (let i = 0; i < HOBBY_FEEDS.length; i++) {
    const feed = HOBBY_FEEDS[i];
    if (feed.includes('blogspot.com')) continue;
    const feedHost = getHostname(feed);
    process.stdout.write(`[${i+1}/${HOBBY_FEEDS.length}] ${feedHost} `);

    const xml = await httpGet(feed, 10000);
    if (!xml || (!xml.includes('<link>') && !xml.includes('<guid'))) { console.log('unreachable'); continue; }

    const links = extractLinks(xml);
    const candidates = [];
    const seen = new Set();
    for (const u of links) {
      try {
        const h = new URL(u).hostname;
        if (seen.has(h) || submittedDomains.has(h) || seenDomains.has(h)) continue;
        if (['youtube.com','twitter.com','github.com','linkedin.com','medium.com',
             'substack.com','blogspot.com','tumblr.com','facebook.com','instagram.com',
             'pinterest.com','amazon.com','etsy.com'].some(x => h.endsWith(x))) continue;
        seen.add(h);
        candidates.push({ url: u, hostname: h });
      } catch {}
    }
    if (candidates.length === 0) { console.log('0 new'); continue; }
    console.log(`→ ${candidates.length} new`);

    for (const { url, hostname } of candidates.slice(0, 4)) {
      process.stdout.write(`  ${hostname} ... `);
      const html = await httpGet(url, 9000);
      if (!html) { console.log('unreachable'); seenDomains.add(hostname); continue; }

      if (hasOpenCommentForm(html)) {
        newEntries.push({ type: 'blog_comment', url, discovered_from: 'hobby:'+feedHost,
          has_captcha: false, link_strategy: 'url_field', link_format: 'html', has_url_field: true });
        existingUrls.add(url); seenDomains.add(hostname);
        console.log('✅');
      } else if (isWordPress(html)) {
        newEntries.push({ type: 'blog_comment', url, discovered_from: 'hobby:'+feedHost,
          has_captcha: false, link_strategy: 'url_field', link_format: 'html', has_url_field: true,
          notes: 'wp_optimistic' });
        existingUrls.add(url); seenDomains.add(hostname);
        console.log('➕ WP');
      } else {
        seenDomains.add(hostname); console.log('no form');
      }
      await new Promise(r => setTimeout(r, 250));
    }
  }

  console.log(`\n✅ Added ${newEntries.length}`);
  const updated = [...resources, ...newEntries];
  writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`Total: ${updated.length}`);
}

main().catch(console.error);
