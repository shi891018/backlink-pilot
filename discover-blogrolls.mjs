#!/usr/bin/env node
/**
 * discover-blogrolls.mjs
 * Harvests blogroll/sidebar links from previously-submitted WordPress blogs.
 * These "same-era" blogs are most likely to still have URL fields.
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
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
  finally { clearTimeout(id); }
}

function extractBlogrollLinks(html, sourceHostname) {
  const found = new Set();
  // Blogrolls are typically in <ul class="blogroll">, widget areas, or <aside>
  // Focus on links in sidebar/widget areas
  const sidebarRe = /<(?:aside|div|ul|section)[^>]*(?:class|id)="[^"]*(?:sidebar|widget|blogroll|links|bloglist)[^"]*"[^>]*>([\s\S]*?)<\/(?:aside|div|ul|section)>/gi;
  const linkRe = /href="(https?:\/\/[^"#?]+)"/g;

  // First try sidebar extraction
  let m;
  while ((m = sidebarRe.exec(html)) !== null) {
    const block = m[1];
    let lm;
    while ((lm = linkRe.exec(block)) !== null) {
      try {
        const h = new URL(lm[1]).hostname;
        if (h !== sourceHostname && !h.includes('google.') && !h.includes('facebook.') &&
            !h.includes('twitter.') && !h.includes('youtube.') && !h.includes('wordpress.org') &&
            !h.includes('wp.com') && !h.includes('gravatar.') && !h.includes('amazonaws.') &&
            lm[1].includes('://')) {
          found.add(lm[1].split('#')[0].split('?')[0].replace(/\/$/, ''));
        }
      } catch {}
    }
  }

  // Also look for links with class="blogroll" or rel="bookmark"
  const rollRe = /href="(https?:\/\/[^"#]+)"[^>]*(?:class="[^"]*blogroll[^"]*"|rel="bookmark")[^>]*>/gi;
  while ((m = rollRe.exec(html)) !== null) {
    try {
      const h = new URL(m[1]).hostname;
      if (h !== sourceHostname) found.add(m[1].split('#')[0].split('?')[0].replace(/\/$/, ''));
    } catch {}
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

async function getRecentPost(origin) {
  for (const path of ['/feed/', '/feed', '/rss']) {
    const xml = await httpGet(origin + path, 8000);
    if (!xml) continue;
    const re = /<link>(https?:\/\/[^<]+)<\/link>/g;
    let m;
    const posts = [];
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

async function main() {
  const resources = JSON.parse(readFileSync(RESOURCES_PATH, 'utf-8'));
  const existingUrls = new Set(resources.map(r => r.url));
  const submittedDomains = new Set(resources.filter(r => r.submitted).map(r => getHostname(r.url)));
  const seenDomains = new Set(resources.map(r => getHostname(r.url)));

  // Use our successfully submitted blogs as seed sources
  const submitted = resources.filter(r => r.type === 'blog_comment' && r.submitted && r.submitted_at);
  console.log(`Seeding from ${submitted.length} submitted blogs`);

  const newEntries = [];
  let found = 0;
  let checked = 0;

  for (const seed of submitted.slice(-30)) { // Use last 30 (most recent)
    const seedHost = getHostname(seed.url);
    const origin = `https://${seedHost}`;
    process.stdout.write(`\nSeed: ${seedHost} ... `);

    const html = await httpGet(origin, 10000);
    if (!html) { console.log('unreachable'); continue; }

    const blogrollLinks = extractBlogrollLinks(html, seedHost);
    if (blogrollLinks.length === 0) { console.log('no blogroll'); continue; }

    console.log(`${blogrollLinks.length} blogroll links`);

    for (const linkUrl of blogrollLinks.slice(0, 8)) {
      const h = getHostname(linkUrl);
      if (seenDomains.has(h)) continue;
      seenDomains.add(h);
      checked++;

      // Get a recent post
      process.stdout.write(`  ${h} ... `);
      const postUrl = await getRecentPost(linkUrl);
      const postHtml = await httpGet(postUrl, 8000);
      if (!postHtml) { console.log('unreachable'); continue; }

      if (hasOpenCommentForm(postHtml)) {
        newEntries.push({
          type: 'blog_comment', url: postUrl,
          discovered_from: 'blogroll:' + seedHost,
          has_captcha: false, link_strategy: 'url_field',
          link_format: 'html', has_url_field: true,
        });
        existingUrls.add(postUrl);
        found++;
        console.log(`✅`);
      } else if (postHtml.includes('wp-content') || postHtml.includes('wp-json') || postHtml.includes('wordpress')) {
        // WP blog but static check failed - add as optimistic
        newEntries.push({
          type: 'blog_comment', url: postUrl,
          discovered_from: 'blogroll:' + seedHost,
          has_captcha: false, link_strategy: 'url_field',
          link_format: 'html', has_url_field: true,
          notes: 'wp_optimistic',
        });
        existingUrls.add(postUrl);
        found++;
        console.log(`➕ WP`);
      } else {
        console.log('not WP / no form');
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log(`\nChecked ${checked}, added ${newEntries.length}`);
  const updated = [...resources, ...newEntries];
  writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`Total: ${updated.length}`);
}

main().catch(console.error);
