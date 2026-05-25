#!/usr/bin/env node
/**
 * discover-targeted.mjs
 * Targeted discovery from specific productive niches found so far.
 * - Climate/science blogs (realclimate.org niche worked!)
 * - make.wordpress.org sub-blogs
 * - WordPress theme demo posts
 * - Phil-stat / statistics niche (errorstatistics.com worked!)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RESOURCES_PATH = resolve(ROOT, 'resources/backlink-resources.json');
const TIMEOUT_MS = 12000;

// Specific targets to check - known/likely WordPress with URL fields
const DIRECT_TARGETS = [
  // make.wordpress.org sub-blogs (official WP project blogs)
  'https://make.wordpress.org/core/',
  'https://make.wordpress.org/plugins/',
  'https://make.wordpress.org/themes/',
  'https://make.wordpress.org/accessibility/',
  'https://make.wordpress.org/marketing/',
  'https://make.wordpress.org/design/',
  'https://make.wordpress.org/training/',
  'https://make.wordpress.org/community/',
  'https://make.wordpress.org/polyglots/',
  'https://make.wordpress.org/support/',
  'https://make.wordpress.org/hosting/',
  'https://make.wordpress.org/mobile/',

  // Climate/environment science blogs (realclimate niche)
  'https://www.skepticalscience.com/',
  'https://scienceblogs.com/',
  'https://www.carbonbrief.org/',
  'https://www.climatesciencewatch.org/',
  'https://www.yaleclimateconnections.org/',
  'https://insideclimatenews.org/',
  'https://www.anthropocenemagazine.org/',
  'https://www.climatecentral.org/',
  'https://geoenergymath.com/',  // confirmed ✅ blogroll from realclimate
  'https://klimaatveranda.nl/',  // confirmed ✅

  // Statistics/data science personal blogs (errorstatistics niche)
  'https://statmodeling.stat.columbia.edu/',
  'https://andrewgelman.com/',
  'https://simplystatistics.org/',
  'https://www.fharrell.com/',
  'https://www.stat.columbia.edu/~gelman/blog/',
  'https://www.psychologytoday.com/us/blog/',
  'https://www.significancemagazine.com/',
  'https://chance.amstat.org/',

  // Philosophy of science blogs (errorstatistics niche)
  'https://leiterreports.typepad.com/',
  'https://dailynous.com/',
  'https://www.philosophersmag.com/',
  'https://philosophynow.org/',
  'https://blog.apaonline.org/',
  'https://ndpr.nd.edu/',
  'https://jeanbaptiste.in/',

  // WP theme demo blogs (guaranteed WP, likely standard forms)
  'https://preview.amplethemes.com/',
  'https://demo.themeisle.com/',
  'https://demo.themify.me/blog/',
  'https://demos.elegantthemes.com/divi/',
  'https://themes.themeisle.com/blog/',
  'https://accessthemes.com/demo/',
  'https://theme.co/apex/blog/',
  'https://demo.ait-themes.club/',
  'https://demos.webmastershub.com/',

  // Open source community blogs (gnome niche worked)
  'https://planet.mozilla.org/',
  'https://www.linux.com/topic/desktop/',
  'https://www.omgubuntu.co.uk/',
  'https://9to5linux.com/',
  'https://itsfoss.com/',
  'https://linuxize.com/',
  'https://www.howtogeek.com/',
  'https://www.tecmint.com/',
  'https://opensource.com/',
  'https://lwn.net/',

  // Self-improvement / positivity (positivityblog niche)
  'https://www.marcandangel.com/',
  'https://zenhabits.net/',
  'https://www.becomingminimalist.com/',
  'https://www.dumblittleman.com/',
  'https://tinybuddha.com/',
  'https://addicted2success.com/',
  'https://www.lifehack.org/',
  'https://www.goodreads.com/blog/',
  'https://www.psychologytoday.com/',
  'https://www.success.com/blog/',

  // Food blogs (similar to our successes)
  'https://www.thepioneerwoman.com/',
  'https://damndelicious.net/',
  'https://www.budgetbytes.com/',
  'https://tasty.co/',
  'https://www.delish.com/',
  'https://www.simplyrecipes.com/',
  'https://www.tasteandtellblog.com/',
  'https://www.iheartnaptime.net/',
  'https://www.twopeasandtheirpod.com/',
  'https://www.lecremedelacrumb.com/',
  'https://www.rachelcooks.com/',
  'https://www.fromvalerieskitchen.com/',
  'https://www.the-girl-who-ate-everything.com/',
  'https://www.sixsistersstuff.com/',
  'https://www.ambitiouskitchen.com/',
  'https://www.chelseasmessyapron.com/',
  'https://www.lifemadesweeter.com/',
  'https://www.crazyforcrust.com/',
  'https://www.butterwithasideofbread.com/',
  'https://www.livewellbakeoften.com/',
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

async function getRecentPost(origin) {
  for (const path of ['/feed/', '/feed', '/rss']) {
    const xml = await httpGet(origin + path, 7000);
    if (!xml) continue;
    const re = /<link>(https?:\/\/[^<]+)<\/link>/g;
    const re2 = /<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/g;
    let m; const posts = [];
    while ((m = re.exec(xml)) !== null) {
      try { const u = new URL(m[1]); if (u.hostname === new URL(origin).hostname && u.pathname !== '/') posts.push(m[1]); } catch {}
    }
    while ((m = re2.exec(xml)) !== null) {
      try { const u = new URL(m[1]); if (u.hostname === new URL(origin).hostname && u.pathname !== '/') posts.push(m[1]); } catch {}
    }
    if (posts.length > 0) return posts.filter(p => !p.match(/\/(tag|category|author|page)\//)).slice(0, 1)[0] || posts[0];
  }
  return null;
}

async function main() {
  const resources = JSON.parse(readFileSync(RESOURCES_PATH, 'utf-8'));
  const existingUrls = new Set(resources.map(r => r.url));
  const submittedDomains = new Set(resources.filter(r => r.submitted).map(r => getHostname(r.url)));
  const seenDomains = new Set(resources.map(r => getHostname(r.url)));
  console.log(`Existing: ${resources.length}, submitted: ${submittedDomains.size}, seen: ${seenDomains.size}`);

  const newEntries = [];

  for (let i = 0; i < DIRECT_TARGETS.length; i++) {
    const target = DIRECT_TARGETS[i].replace(/\/$/, '');
    const h = getHostname(target);
    if (seenDomains.has(h) || submittedDomains.has(h)) { continue; }

    process.stdout.write(`[${i+1}/${DIRECT_TARGETS.length}] ${h} ... `);
    seenDomains.add(h);

    // Get a recent post
    const postUrl = await getRecentPost(target) || target;
    const html = await httpGet(postUrl, 9000);
    if (!html) { console.log('unreachable'); continue; }

    if (hasOpenCommentForm(html)) {
      newEntries.push({
        type: 'blog_comment', url: postUrl,
        discovered_from: 'targeted:manual',
        has_captcha: false, link_strategy: 'url_field', link_format: 'html', has_url_field: true,
      });
      existingUrls.add(postUrl);
      console.log(`✅ ${postUrl.slice(0, 60)}`);
    } else if (isWordPress(html)) {
      newEntries.push({
        type: 'blog_comment', url: postUrl,
        discovered_from: 'targeted:manual',
        has_captcha: false, link_strategy: 'url_field', link_format: 'html', has_url_field: true,
        notes: 'wp_optimistic',
      });
      existingUrls.add(postUrl);
      console.log(`➕ WP ${postUrl.slice(0, 55)}`);
    } else {
      console.log('no form / not WP');
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅ Added ${newEntries.length} new targets`);
  const updated = [...resources, ...newEntries];
  writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`Total: ${updated.length}`);
}

main().catch(console.error);
