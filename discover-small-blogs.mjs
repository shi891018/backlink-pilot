#!/usr/bin/env node
/**
 * discover-small-blogs.mjs
 * Targets SMALL niche blogs via science/hobby aggregators.
 * Small blogs (< 20K/mo) rarely have CAPTCHA and often keep URL fields.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RESOURCES_PATH = resolve(ROOT, 'resources/backlink-resources.json');
const TIMEOUT_MS = 12000;

// Small/niche blog aggregators and community feeds
const FEEDS = [
  // Science bloggers (small, academic, no CAPTCHA)
  'https://scienceseeker.org/feed/',
  'https://scienceseeker.org/rss/',
  'https://www.researchblogging.org/feed/',
  'https://scientopia.org/blogs/feed/',
  'https://occamstypewriter.org/feed/',
  'https://sciblogs.co.nz/feed/',
  'https://blogs.plos.org/feed/',
  'https://blogs.scientificamerican.com/feed/',
  'https://www.sciencebasedmedicine.org/feed/',
  'https://praxtime.com/feed/',
  'https://backreaction.blogspot.com/feeds/posts/default',
  'https://www.math.columbia.edu/~woit/wordpress/?feed=rss2',
  'https://golem.ph.utexas.edu/category/atom10.xml',
  'https://www.3quarksdaily.com/3quarksdaily/atom.xml',
  'https://nautil.us/feed/',
  'https://www.pnas.org/rss/current.xml',

  // Hobby/maker (small, personal blogs)
  'https://blog.arduino.cc/feed/',
  'https://hackaday.com/feed/',
  'https://www.adafruit.com/blog/feed/',
  'https://www.sparkfun.com/feeds/blog',
  'https://makezine.com/feed/',
  'https://www.instructables.com/feed.atom',
  'https://blog.diyelectronics.co.za/feed/',
  'https://www.electronics-lab.com/feed/',

  // Small philosophy/academic blogs
  'https://plato.stanford.edu/feed.xml',
  'https://www.philosophyetc.net/feeds/posts/default',
  'https://leiterreports.typepad.com/blog/atom.xml',
  'https://jonturbull.com/feed/',
  'https://aestheticsforbirds.com/feed/',
  'https://www.philosophyofbrains.com/feed',

  // Open source / small dev blogs
  'https://www.phoronix.com/rss.php',
  'https://www.osnews.com/feed/',
  'https://distrowatch.com/news/dw.xml',
  'https://fossforce.com/feed/',
  'https://linuxinsider.com/rss-feed/',
  'https://www.ghacks.net/feed/',
  'https://www.jupiterbroadcasting.com/show/linux-action-news/feed/',
  'https://tilvids.com/feeds/videos.xml',

  // Local / community news blogs (small WordPress installs)
  'https://thetyee.ca/feed/',
  'https://rabble.ca/feed/',
  'https://www.commondreams.org/rss.xml',
  'https://wagingnonviolence.org/feed/',
  'https://truthout.org/feed/',
  'https://otherwords.org/feed/',

  // Small personal finance blogs
  'https://www.getrichslowly.org/feed/',
  'https://frugalwoods.com/feed/',
  'https://www.madfientist.com/feed/',
  'https://rootofgood.com/feed/',
  'https://affordanything.com/feed/',
  'https://www.yourmoneygeek.com/feed/',

  // Small garden/nature blogs
  'https://gardenrant.com/feed',
  'https://www.finegardening.com/feed',
  'https://awaytogarden.com/feed/',
  'https://savvygardening.com/feed/',
  'https://www.the-tao-of-travel.com/feed/',
  'https://www.growingagreenerworld.com/feed/',

  // Small craft/DIY blogs
  'https://www.craftsy.com/feed/',
  'https://www.crochetme.com/feed/',
  'https://knitting.about.com/feed/',
  'https://www.thesprucecrafts.com/feed/',
  'https://www.allfreecrochet.com/feed/',
  'https://crochetverse.com/feed/',
  'https://www.crochetconcupiscence.com/feed',
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

function extractPostLinks(xml) {
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
      if (!u || u.includes('/feed') || u.includes('/rss') || u.includes('?feed=')) continue;
      found.add(u);
    }
  }
  return [...found];
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

function isWordPress(html) {
  return html && (html.includes('wp-content') || html.includes('wp-json') || html.includes('/wp-includes/'));
}

async function main() {
  const resources = JSON.parse(readFileSync(RESOURCES_PATH, 'utf-8'));
  const existingUrls = new Set(resources.map(r => r.url));
  const submittedDomains = new Set(resources.filter(r => r.submitted).map(r => getHostname(r.url)));
  const seenDomains = new Set(resources.map(r => getHostname(r.url)));
  console.log(`Existing: ${resources.length}, submitted: ${submittedDomains.size}, seen domains: ${seenDomains.size}`);

  const newEntries = [];

  for (let i = 0; i < FEEDS.length; i++) {
    const feed = FEEDS[i];
    const feedHost = getHostname(feed);
    process.stdout.write(`[${i+1}/${FEEDS.length}] ${feedHost} `);

    const xml = await httpGet(feed, 10000);
    if (!xml || (!xml.includes('<link>') && !xml.includes('<guid') && !xml.includes('href='))) {
      console.log('unreachable');
      continue;
    }

    const links = extractPostLinks(xml);
    const candidates = [];
    const seen = new Set();
    for (const u of links) {
      try {
        const h = new URL(u).hostname;
        if (seen.has(h) || submittedDomains.has(h) || seenDomains.has(h)) continue;
        if (h.includes('youtube.com') || h.includes('twitter.com') || h.includes('github.com') ||
            h.includes('linkedin.com') || h.includes('medium.com') || h.includes('substack.com') ||
            h.includes('blogspot.com') || h.includes('tumblr.com')) continue;
        seen.add(h);
        candidates.push({ url: u, hostname: h });
      } catch {}
    }
    console.log(`→ ${candidates.length} new-domain`);

    for (const { url, hostname } of candidates.slice(0, 5)) {
      if (existingUrls.has(url)) { seenDomains.add(hostname); continue; }
      process.stdout.write(`  ${hostname} ... `);

      const html = await httpGet(url, 9000);
      if (!html) { console.log('unreachable'); seenDomains.add(hostname); continue; }

      if (hasOpenCommentForm(html)) {
        newEntries.push({
          type: 'blog_comment', url,
          discovered_from: 'small:' + feedHost,
          has_captcha: false, link_strategy: 'url_field', link_format: 'html', has_url_field: true,
        });
        existingUrls.add(url); seenDomains.add(hostname);
        console.log('✅');
      } else if (isWordPress(html)) {
        newEntries.push({
          type: 'blog_comment', url,
          discovered_from: 'small:' + feedHost,
          has_captcha: false, link_strategy: 'url_field', link_format: 'html', has_url_field: true,
          notes: 'wp_optimistic',
        });
        existingUrls.add(url); seenDomains.add(hostname);
        console.log('➕ WP');
      } else {
        seenDomains.add(hostname);
        console.log('no form');
      }
      await new Promise(r => setTimeout(r, 250));
    }
  }

  console.log(`\n✅ Added ${newEntries.length} new candidates`);
  const updated = [...resources, ...newEntries];
  writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`Total: ${updated.length}`);
}

main().catch(console.error);
