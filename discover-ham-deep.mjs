#!/usr/bin/env node
/**
 * discover-ham-deep.mjs
 * Deep scan of blog.radioartisan.com and k0nr.com blogrolls (ALL links, not just first 8).
 * Also scans eHam.net review blogroll links and common HAM radio site aggregators.
 * HAM radio personal sites: elderly operators, never upgraded WP → URL fields intact.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RESOURCES_PATH = resolve(ROOT, 'resources/backlink-resources.json');
const TIMEOUT_MS = 12000;

function getHostname(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

async function httpGet(url, timeoutMs = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
  finally { clearTimeout(id); }
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

function isWpOptimistic(html) {
  return html && (html.includes('wp-content') || html.includes('wp-json') || html.toLowerCase().includes('wordpress'));
}

function extractAllLinks(html, sourceHostname) {
  const found = new Set();
  const linkRe = /href="(https?:\/\/[^"#?]+)"/g;
  const skip = ['google.','facebook.','twitter.','youtube.','instagram.','wordpress.org','wp.com',
                 'gravatar.','amazonaws.','t.co','bit.ly','fb.me','linkedin.','pinterest.',
                 'qrz.com','eham.net','arrl.org','amazon.','ebay.'];
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    try {
      const u = new URL(m[1]);
      if (u.hostname === sourceHostname) continue;
      if (skip.some(s => u.hostname.includes(s))) continue;
      found.add(u.origin + '/');
    } catch {}
  }
  return [...found];
}

async function getRecentPost(origin) {
  for (const path of ['/feed/', '/feed', '/rss', '/rss.xml']) {
    const xml = await httpGet(origin + path, 8000);
    if (!xml) continue;
    const re = /<link>(https?:\/\/[^<]+)<\/link>/g;
    const posts = [];
    let m;
    while ((m = re.exec(xml)) !== null) {
      try {
        const u = new URL(m[1]);
        if (u.hostname === new URL(origin).hostname && u.pathname !== '/') posts.push(m[1]);
      } catch {}
    }
    if (posts.length > 0) return posts[0];
  }
  return origin;
}

// HAM radio aggregator feeds and pages
const HAM_SEED_URLS = [
  // Direct blogroll pages - deep scan
  { url: 'https://blog.radioartisan.com/', label: 'radioartisan-blogroll' },
  { url: 'https://www.k0nr.com/wordpress/', label: 'k0nr-blogroll' },
  // HAM radio blog aggregators
  { url: 'https://ham-radio-deluxe.com/blog/', label: 'hamradio-deluxe' },
  { url: 'https://www.kb6nu.com/', label: 'kb6nu' },
  // Additional HAM sites that may have blogrolls
  { url: 'https://www.hamradioschool.com/', label: 'hamradioschool' },
  { url: 'https://aa9pw.com/', label: 'aa9pw' },
  { url: 'https://k7nv.com/', label: 'k7nv' },
  // eHam.net reviews section for operator blog links
  { url: 'https://www.eham.net/reviews/', label: 'eham-reviews' },
];

// Additional individual HAM radio operator sites to check directly
const HAM_DIRECT_SITES = [
  'https://kd9cpb.com/', 'https://w7iuv.com/', 'https://wb4iuy.com/',
  'https://w6op.com/', 'https://k3ng.blogspot.com/', 'https://kd8bxp.github.io/',
  'https://vk3ye.com/', 'https://g4ilo.com/', 'https://w8ji.com/',
  'https://on4un.com/', 'https://k7ra.com/', 'https://wb8nut.com/',
  'https://kd9ms.com/', 'https://w1ip.com/', 'https://n0hv.net/',
  'https://k9yw.net/', 'https://ka1bzn.com/', 'https://kd2rud.com/',
  'https://w9xt.net/', 'https://ve3sqb.com/', 'https://g3xbm.blogspot.com/',
  'https://kf7p.net/', 'https://n8lx.net/', 'https://kg4oye.com/',
  'https://ae6ty.com/', 'https://n5ntn.com/', 'https://kd0bik.net/',
  'https://ve7sl.blogspot.com/', 'https://vk2bv.org/', 'https://g8jnj.net/',
  'https://www.g3cqe.com/', 'https://m0mcx.co.uk/', 'https://sv9ove.blogspot.com/',
  'https://pa3ake.nl/', 'https://dl4mea.de/', 'https://oe5jfl.at/',
];

async function main() {
  const resources = JSON.parse(readFileSync(RESOURCES_PATH, 'utf-8'));
  const seenDomains = new Set(resources.map(r => getHostname(r.url)));

  const newEntries = [];
  let checked = 0;
  let confirmed = 0;

  // Phase 1: Deep scan of HAM seed URLs for blogroll links
  console.log('=== Phase 1: HAM Seed Blogroll Deep Scan ===\n');
  for (const seed of HAM_SEED_URLS) {
    console.log(`\n📡 ${seed.label}: ${seed.url}`);
    const html = await httpGet(seed.url, 12000);
    if (!html) { console.log('  unreachable'); continue; }

    const links = extractAllLinks(html, getHostname(seed.url));
    console.log(`  ${links.length} outbound links found`);

    for (const linkUrl of links) {
      const h = getHostname(linkUrl);
      if (seenDomains.has(h)) continue;
      seenDomains.add(h);
      checked++;

      process.stdout.write(`  ${h} ... `);
      const postUrl = await getRecentPost(linkUrl);
      const postHtml = await httpGet(postUrl, 8000);
      if (!postHtml) { console.log('unreachable'); continue; }

      if (hasOpenCommentForm(postHtml)) {
        newEntries.push({
          type: 'blog_comment', url: postUrl,
          discovered_from: seed.label,
          has_captcha: false, link_strategy: 'url_field',
          link_format: 'html', has_url_field: true,
        });
        confirmed++;
        console.log('✅ CONFIRMED');
      } else if (isWpOptimistic(postHtml)) {
        newEntries.push({
          type: 'blog_comment', url: postUrl,
          discovered_from: seed.label,
          has_captcha: false, link_strategy: 'url_field',
          link_format: 'html',
          notes: 'wp_optimistic',
        });
        console.log('➕ WP optimistic');
      } else {
        console.log('skip');
      }
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // Phase 2: Direct HAM operator sites
  console.log('\n=== Phase 2: Direct HAM Operator Sites ===\n');
  for (const siteUrl of HAM_DIRECT_SITES) {
    const h = getHostname(siteUrl);
    if (seenDomains.has(h)) { continue; }
    seenDomains.add(h);
    checked++;

    process.stdout.write(`  ${h} ... `);
    const postUrl = await getRecentPost(siteUrl);
    const postHtml = await httpGet(postUrl, 8000);
    if (!postHtml) { console.log('unreachable'); continue; }

    if (hasOpenCommentForm(postHtml)) {
      newEntries.push({
        type: 'blog_comment', url: postUrl,
        discovered_from: 'ham-direct',
        has_captcha: false, link_strategy: 'url_field',
        link_format: 'html', has_url_field: true,
      });
      confirmed++;
      console.log('✅ CONFIRMED');
    } else if (isWpOptimistic(postHtml)) {
      newEntries.push({
        type: 'blog_comment', url: postUrl,
        discovered_from: 'ham-direct',
        has_captcha: false, link_strategy: 'url_field',
        link_format: 'html',
        notes: 'wp_optimistic',
      });
      console.log('➕ WP');
    } else {
      console.log('skip');
    }
    await new Promise(r => setTimeout(r, 350));
  }

  console.log(`\n✅ Confirmed: ${confirmed}, Total new: ${newEntries.length}, Checked: ${checked}`);
  const updated = [...resources, ...newEntries];
  writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`Resources: ${resources.length} → ${updated.length}`);
}

main().catch(console.error);
