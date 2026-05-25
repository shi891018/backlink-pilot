#!/usr/bin/env node
/**
 * discover-feedspot.mjs
 * Scrapes Feedspot curated blog lists to get RSS feed URLs.
 * Adds them directly as candidates (no pre-screening) - batch script will screen in real time.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RESOURCES_PATH = resolve(ROOT, 'resources/backlink-resources.json');
const TIMEOUT_MS = 15000;

// Feedspot "Top N blogs" pages - these are curated lists
const FEEDSPOT_PAGES = [
  'https://rss.feedspot.com/food_blogs_rss_feeds/',
  'https://rss.feedspot.com/science_blogs_rss_feeds/',
  'https://rss.feedspot.com/health_blogs_rss_feeds/',
  'https://rss.feedspot.com/personal_finance_blogs_rss_feeds/',
  'https://rss.feedspot.com/diy_crafts_blogs_rss_feeds/',
  'https://rss.feedspot.com/travel_blogs_rss_feeds/',
  'https://rss.feedspot.com/fitness_blogs_rss_feeds/',
  'https://rss.feedspot.com/photography_blogs_rss_feeds/',
  'https://rss.feedspot.com/education_blogs_rss_feeds/',
  'https://rss.feedspot.com/parenting_blogs_rss_feeds/',
  'https://rss.feedspot.com/gardening_blogs_rss_feeds/',
  'https://rss.feedspot.com/cooking_blogs_rss_feeds/',
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
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
  finally { clearTimeout(id); }
}

function extractBlogUrlsFromFeedspot(html) {
  const urls = new Set();
  // Feedspot lists blog URLs in various patterns
  const patterns = [
    /href="(https?:\/\/(?!rss\.feedspot|feedspot|www\.feedspot)[^"]+)"[^>]*>(?:Visit Website|RSS Feed|Blog|Site)/gi,
    /data-url="(https?:\/\/[^"]+)"/g,
    /"website_url":"(https?:\/\/[^"]+)"/g,
    /class="ext[^"]*"[^>]*href="(https?:\/\/[^"]+)"/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      const u = m[1];
      try {
        const h = new URL(u).hostname;
        if (h.includes('feedspot') || h.includes('google') || h.includes('facebook') ||
            h.includes('twitter') || h.includes('youtube') || h.includes('pinterest')) continue;
        urls.add(u.replace(/\/$/, '')); // Remove trailing slash
      } catch {}
    }
  }
  // Also extract RSS feed URLs and convert to blog URLs
  const rssRe = /href="(https?:\/\/[^"]+\/feed[^"]*)"[^>]*>/gi;
  let m;
  while ((m = rssRe.exec(html)) !== null) {
    try {
      const feedUrl = m[1];
      const u = new URL(feedUrl);
      const blogUrl = `${u.protocol}//${u.hostname}`;
      if (!blogUrl.includes('feedspot') && !blogUrl.includes('feedburner')) {
        urls.add(blogUrl);
      }
    } catch {}
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

async function getRecentPost(blogUrl) {
  // Try RSS feed first
  for (const path of ['/feed/', '/rss', '/feed', '/blog/feed/']) {
    const xml = await httpGet(blogUrl + path, 8000);
    if (xml && (xml.includes('<rss') || xml.includes('<?xml') || xml.includes('<feed'))) {
      const re = /<link>(https?:\/\/[^<]+)<\/link>/g;
      const re2 = /<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/g;
      let m;
      const found = [];
      while ((m = re.exec(xml)) !== null) {
        try { const u = new URL(m[1]); if (u.hostname === new URL(blogUrl).hostname && u.pathname !== '/') found.push(m[1]); } catch {}
      }
      while ((m = re2.exec(xml)) !== null) {
        try { const u = new URL(m[1]); if (u.hostname === new URL(blogUrl).hostname && u.pathname !== '/') found.push(m[1]); } catch {}
      }
      if (found.length > 0) return found[0];
    }
  }
  return blogUrl; // fall back to homepage
}

async function main() {
  const resources = JSON.parse(readFileSync(RESOURCES_PATH, 'utf-8'));
  const existingUrls = new Set(resources.map(r => r.url));
  const submittedDomains = new Set(
    resources.filter(r => r.submitted).map(r => getHostname(r.url)).filter(Boolean)
  );
  const seenDomains = new Set(resources.map(r => getHostname(r.url)));

  console.log(`Existing: ${resources.length}, seen domains: ${seenDomains.size}`);

  const newEntries = [];
  let totalChecked = 0;

  for (const page of FEEDSPOT_PAGES) {
    const niche = page.split('/').filter(Boolean).pop().replace(/_rss_feeds$/, '');
    process.stdout.write(`\n--- ${niche} ---\n`);

    const html = await httpGet(page);
    if (!html) { console.log('unreachable'); continue; }

    const blogUrls = extractBlogUrlsFromFeedspot(html);
    console.log(`Found ${blogUrls.length} blog URLs on page`);

    const candidates = [];
    for (const blogUrl of blogUrls) {
      const h = getHostname(blogUrl);
      if (submittedDomains.has(h) || seenDomains.has(h)) continue;
      candidates.push({ blogUrl, hostname: h });
    }
    console.log(`New domains: ${candidates.length}`);

    for (const { blogUrl, hostname } of candidates.slice(0, 10)) {
      totalChecked++;
      process.stdout.write(`  ${hostname} ... `);

      // Get a recent post
      const postUrl = await getRecentPost(blogUrl);
      if (!postUrl) { console.log('no post'); seenDomains.add(hostname); continue; }

      // Quick static check
      const html2 = await httpGet(postUrl, 8000);
      const valid = hasOpenCommentForm(html2);

      if (valid) {
        newEntries.push({
          type: 'blog_comment', url: postUrl,
          discovered_from: 'feedspot:' + niche,
          has_captcha: false, link_strategy: 'url_field',
          link_format: 'html', has_url_field: true,
        });
        existingUrls.add(postUrl);
        seenDomains.add(hostname);
        console.log(`✅ ${postUrl.slice(0, 60)}`);
      } else {
        // Add as optimistic candidate anyway if it's a WP blog (batch will screen)
        if (html2 && (html2.includes('wp-content') || html2.includes('wp-json') || html2.includes('wordpress'))) {
          const entry = {
            type: 'blog_comment', url: postUrl,
            discovered_from: 'feedspot:' + niche,
            has_captcha: false, link_strategy: 'url_field',
            link_format: 'html', has_url_field: true, // optimistic
            notes: 'wp_blog_static_check_failed',
          };
          newEntries.push(entry);
          existingUrls.add(postUrl);
          seenDomains.add(hostname);
          console.log(`➕ WP (optimistic) ${postUrl.slice(0, 55)}`);
        } else {
          seenDomains.add(hostname);
          console.log('no form / not WP');
        }
      }
      await new Promise(r => setTimeout(r, 350));
    }
  }

  console.log(`\n✅ Added ${newEntries.length} candidates (checked ${totalChecked})`);
  const updated = [...resources, ...newEntries];
  writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`Total resources: ${updated.length}`);
}

main().catch(console.error);
