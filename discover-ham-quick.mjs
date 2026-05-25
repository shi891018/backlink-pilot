#!/usr/bin/env node
/**
 * discover-ham-quick.mjs — Quick check of HAM operator personal sites
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RESOURCES_PATH = resolve(ROOT, 'resources/backlink-resources.json');

const CANDIDATES = [
  // More HAM radio personal sites
  'https://n9sil.com/', 'https://ve3lsr.ca/', 'https://k8gu.com/',
  'https://vk2tti.com/', 'https://w7hjt.com/', 'https://n3jt.com/',
  'https://ve3wdm.ca/', 'https://wb4spe.com/', 'https://k4swr.com/',
  'https://n0oiy.com/', 'https://kd4e.com/', 'https://w3bbo.com/',
  'https://km6lyw.com/', 'https://ae6rh.com/', 'https://kd9vbr.com/',
  'https://kg4jjh.com/', 'https://wb0smx.com/', 'https://k7kys.com/',
  // HAM radio WP.com blogs
  'https://k8dsy.wordpress.com/', 'https://w8rf.wordpress.com/',
  'https://kd0bru.wordpress.com/', 'https://wb8nbs.wordpress.com/',
  'https://k9hi.wordpress.com/', 'https://n4jqq.wordpress.com/',
  'https://kf0nzr.wordpress.com/', 'https://w0lae.wordpress.com/',
  'https://ve3ztl.wordpress.com/', 'https://vc3luc.wordpress.com/',
  // Niche hobby blogs (old WP, hobbyist)
  'https://www.thegeekpub.com/', 'https://www.rcgroups.com/',
  'https://www.therailwire.net/', 'https://birdnote.org/',
  'https://www.allaboutbirds.org/', 'https://britishbirds.co.uk/',
  'https://www.freeiconic.com/', 'https://mycoinshop.us/',
  'https://coincollectingworld.com/', 'https://coincollector.org/',
];

async function httpGet(url) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
    });
    if (!r.ok) return null;
    return await r.text();
  } catch { return null; }
  finally { clearTimeout(id); }
}

async function getRecentPost(origin) {
  for (const path of ['/feed/', '/feed', '/rss']) {
    const xml = await httpGet(origin + path);
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

function check(html) {
  if (!html) return 'unreachable';
  const low = html.toLowerCase();
  const hasComment = low.includes('name="comment"') || low.includes('id="comment"');
  const hasUrl = low.includes('name="url"') || low.includes('name="website"') ||
    low.includes('type="url"') || low.includes('placeholder="http');
  const hasCaptcha = /recaptcha|hcaptcha|cf-turnstile/i.test(html);
  const isWP = html.includes('wp-content') || html.includes('wp-json');
  if (hasComment && hasUrl && !hasCaptcha) return 'CONFIRMED';
  if (isWP && !hasCaptcha) return 'WP';
  return 'skip';
}

async function main() {
  const resources = JSON.parse(readFileSync(RESOURCES_PATH, 'utf-8'));
  const seenDomains = new Set(resources.map(r => { try { return new URL(r.url).hostname; } catch { return ''; } }));
  const newEntries = [];

  for (const site of CANDIDATES) {
    const host = new URL(site).hostname;
    if (seenDomains.has(host)) { console.log(`${host} (skip — already seen)`); continue; }
    seenDomains.add(host);

    const postUrl = await getRecentPost(site);
    const html = await httpGet(postUrl);
    const result = check(html);
    console.log(`${host} → ${result}`);

    if (result === 'CONFIRMED') {
      newEntries.push({ type: 'blog_comment', url: postUrl, discovered_from: 'ham-quick',
        has_captcha: false, link_strategy: 'url_field', link_format: 'html', has_url_field: true });
    } else if (result === 'WP') {
      newEntries.push({ type: 'blog_comment', url: postUrl, discovered_from: 'ham-quick',
        has_captcha: false, link_strategy: 'url_field', link_format: 'html', notes: 'wp_optimistic' });
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nNew confirmed: ${newEntries.filter(x=>!x.notes).length}, WP optimistic: ${newEntries.filter(x=>x.notes).length}`);
  const updated = [...resources, ...newEntries];
  writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`Resources: ${resources.length} → ${updated.length}`);
}

main().catch(console.error);
