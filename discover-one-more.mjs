#!/usr/bin/env node
/**
 * discover-one-more.mjs — harvest blogrolls from newly-submitted HAM radio WP blogs
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RESOURCES_PATH = resolve(ROOT, 'resources/backlink-resources.json');

const SEEDS = [
  'https://aa7ee.wordpress.com/',
  'https://ke2yk.wordpress.com/',
  'https://wb8nbs.wordpress.com/',
  'https://wb3gck.com/',
  'https://w6op.com/',
];

const SKIP = ['google.','facebook.','twitter.','youtube.','instagram.',
              'wordpress.org','wp.com','gravatar.','amazon.','ebay.',
              'qrz.com','eham.net','arrl.org','t.co','bit.ly'];

async function get(url) {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(9000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
    });
    if (!r.ok) return null;
    return await r.text();
  } catch { return null; }
}

async function getRecentPost(origin) {
  for (const p of ['/feed/', '/feed', '/rss']) {
    const xml = await get(origin + p);
    if (!xml) continue;
    const re = /<link>(https?:\/\/[^<]+)<\/link>/g;
    let m; const posts = [];
    while ((m = re.exec(xml)) !== null) {
      try {
        const u = new URL(m[1]);
        if (u.hostname === new URL(origin).hostname && u.pathname !== '/') posts.push(m[1]);
      } catch {}
    }
    if (posts.length) return posts[0];
  }
  return origin;
}

function classify(html) {
  if (!html) return 'unreachable';
  const low = html.toLowerCase();
  const hasC = low.includes('name="comment"') || low.includes('id="comment"');
  const hasU = low.includes('name="url"') || low.includes('name="website"') || low.includes('type="url"');
  const cap = /recaptcha|hcaptcha|cf-turnstile/i.test(html);
  const isWP = html.includes('wp-content') || html.includes('wp-json');
  if (hasC && hasU && !cap) return 'CONFIRMED';
  if (isWP && !cap) return 'WP';
  return 'skip';
}

async function main() {
  const resources = JSON.parse(readFileSync(RESOURCES_PATH, 'utf-8'));
  const seen = new Set(resources.map(r => { try { return new URL(r.url).hostname; } catch { return ''; } }));
  const newEntries = [];

  for (const seed of SEEDS) {
    const seedHost = new URL(seed).hostname;
    console.log(`\nSeed: ${seedHost}`);
    const html = await get(seed);
    if (!html) { console.log('  unreachable'); continue; }

    // Extract all outbound links
    const links = new Set();
    for (const m of html.matchAll(/href="(https?:\/\/[^"#?]+)"/g)) {
      try {
        const u = new URL(m[1]);
        if (u.hostname !== seedHost && !SKIP.some(s => u.hostname.includes(s))) {
          links.add(u.origin + '/');
        }
      } catch {}
    }
    console.log(`  ${links.size} outbound links`);

    for (const link of links) {
      const host = new URL(link).hostname;
      if (seen.has(host)) continue;
      seen.add(host);

      const postUrl = await getRecentPost(link);
      const postHtml = await get(postUrl);
      const result = classify(postHtml);
      process.stdout.write(`  ${host} → ${result}\n`);

      if (result === 'CONFIRMED') {
        newEntries.push({ type: 'blog_comment', url: postUrl, discovered_from: `blogroll:${seedHost}`,
          has_captcha: false, link_strategy: 'url_field', link_format: 'html', has_url_field: true });
      } else if (result === 'WP') {
        newEntries.push({ type: 'blog_comment', url: postUrl, discovered_from: `blogroll:${seedHost}`,
          has_captcha: false, link_strategy: 'url_field', link_format: 'html', notes: 'wp_optimistic' });
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log(`\nNew confirmed: ${newEntries.filter(x => !x.notes).length}, WP: ${newEntries.filter(x => x.notes).length}`);
  const updated = [...resources, ...newEntries];
  writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`Resources: ${resources.length} → ${updated.length}`);
}

main().catch(console.error);
