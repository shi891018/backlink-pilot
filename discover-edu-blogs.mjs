#!/usr/bin/env node
/**
 * discover-edu-blogs.mjs
 * Targets university/institutional WordPress blog platforms that use standard WP comment forms.
 * Uses RSS feeds to find active post URLs, adds them to backlink-resources.json.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RESOURCES_PATH = resolve(ROOT, 'resources/backlink-resources.json');

const TIMEOUT_MS = 10000;

// University/institutional blog platforms + specific niche personal blogs
// These tend to use standard WordPress with URL fields intact
const PLATFORMS = [
  // North American university blog platforms
  'blogs.kent.edu',
  'blogs.psu.edu',
  'blogs.vt.edu',
  'blogs.umass.edu',
  'blogs.uiowa.edu',
  'blogs.unl.edu',
  'blogs.ncsu.edu',
  'blogs.cornell.edu',
  'blogs.syr.edu',
  'blogs.tulane.edu',
  'blogs.bu.edu',
  'blogs.gwu.edu',
  'blogs.uoregon.edu',
  'blogs.utah.edu',
  'blogs.temple.edu',
  'blogs.brandeis.edu',
  'blogs.davidson.edu',
  'blogs.pacific.edu',
  'blogs.rochester.edu',
  'blogs.drexel.edu',
  'sites.gmu.edu',
  'commons.trincoll.edu',
  'sites.williams.edu',
  'openlab.citytech.cuny.edu',
  'blogs.depaul.edu',
  'blogs.fordham.edu',
  'blogs.jhu.edu',
  'blogs.ithaca.edu',
  'blogs.kennesaw.edu',
  'blogs.elon.edu',
  'blogs.colostate.edu',
  'blogs.oregonstate.edu',
  'blogs.unh.edu',
  'blogs.uri.edu',
  'blogs.villanova.edu',
  'sites.allegheny.edu',
  'sites.miis.edu',
  'sites.coloradocollege.edu',
  'blogs.stlawu.edu',
  'sites.westga.edu',
  'sites.hampshire.edu',

  // Community/nonprofit blogs (often simple WP)
  'blog.mozilla.org',
  'blog.archive.org',
  'blog.wikimedia.org',
  'blog.wikimedia.de',
  'blog.eff.org',
  'community.fastly.com',

  // Personal niche blogs known to use standard WP
  'www.makezine.com',
  'www.sparkfun.com/news',
  'makezine.com',
  'www.hackster.io',
  'www.instructables.com',

  // Specific personal WP blogs (hobby/niche - smaller traffic)
  'www.treesforlife.org.uk',
  'www.rambleruk.com',
  'blog.mountaingoatsoftware.com',
  'blog.codinghorror.com',
  'www.joelonsoftware.com',
  'www.paulgraham.com',
  'blog.cleancoder.com',
  'blog.asmartbear.com',
  'www.iwillteachyoutoberich.com',
  'www.mrmoneymustache.com',
  'www.earlyretirementextreme.com',
  'millionairebymortgage.com',
  'www.whitecoatinvestor.com',
  'blog.seldomsweet.com',
  'www.thepaleomom.com',
  'www.againstallgrain.com',
  'www.marksdailyapple.com',
  'www.kidsareallright.net',
  'www.wholesomeyum.com',

  // Local/community news blogs
  'www.siliconholler.com',
  'www.medcitynews.com',
  'www.brooklynpaper.com',
  'thewestsiderag.com',

  // Genealogy blogs (old-school WP users)
  'www.ancestryhounds.com',
  'www.genealogygems.com',
  'www.legacynews.com',
  'www.genealogyjunkie.net',
  'uncoveryourancestors.com',

  // Amateur science/nature
  'www.backyardchickens.com',
  'www.thespruce.com',
  'www.gardenersworld.com',
  'coldclimategardening.com',
  'gardentherapy.ca',
  'prairiehomestead.com',
  'www.motherearthliving.com',
  'www.mtnhomesteader.com',
  'homesteadlady.com',

  // Christian/religious (often simple WP)
  'blog.acer.ac.uk',
  'christianitytoday.com',
  'www.desiringgod.org',
  'thegospelcoalition.org',
  'blog.bethinking.org',
  'www.challies.com',

  // Model/hobby/gaming blogs  
  'www.beasts-of-war.com',
  'www.fromthewarp.com',
  'natfka.blogspot.com', // skip - blogspot
  'www.tabletopbelloflostshe.blogspot.com', // skip
  'rocketfinch.net',
  'www.coolminiornot.com',
  'www.goonhammer.com',
  'www.belloflostsouls.net',

  // Photography personal blogs
  'blog.karimanzoor.com',
  'www.outdoorphotographer.com',
  'onlandscape.co.uk',
  'www.opblog.org',
  'www.andrewgibson.co',
  'farbspiel.blog',

  // Language/linguistics blogs
  'languagelog.ldc.upenn.edu',
  'languagehat.com',
  'www.lexicallyspeaking.com',
  'www.allthingslinguistic.com',
  'bradshawfoundation.com',
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
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
  finally { clearTimeout(id); }
}

function extractFromRss(xml, host) {
  const found = [];
  const re = /<link>(https?:\/\/[^<]+)<\/link>/g;
  const re2 = /<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    try { const u = new URL(m[1]); if (u.hostname === host && u.pathname !== '/') found.push(m[1]); } catch {}
  }
  while ((m = re2.exec(xml)) !== null) {
    try { const u = new URL(m[1]); if (u.hostname === host && u.pathname !== '/' && !found.includes(m[1])) found.push(m[1]); } catch {}
  }
  return found.filter(u => !u.match(/\/(author|category|tag|page|feed|wp-content|wp-json)\//)).slice(0, 3);
}

function extractFromHtml(html, host) {
  const found = new Set();
  const patterns = [
    /href="(https?:\/\/[^"#?]+\/\d{4}\/\d{2}\/[^"#?/][^"#?]*)"/g,
    /href="(https?:\/\/[^"#?]+\/\d{4}\/[^"#?/][^"#?]*)"/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      try { const u = new URL(m[1]); if (u.hostname === host) found.add(m[1]); } catch {}
    }
  }
  return [...found].filter(u => !u.match(/\/(author|category|tag|page|feed|wp-content|wp-json)\//)).slice(0, 3);
}

function hasOpenCommentForm(html) {
  if (!html) return false;
  const lower = html.toLowerCase();
  if (!lower.includes('name="comment"') && !lower.includes('id="comment"')) return false;
  // Accept any URL/website input (broader check)
  const hasUrlField = lower.includes('name="url"') ||
    lower.includes('id="url"') ||
    lower.includes('name="website"') ||
    lower.includes('id="website"') ||
    lower.includes('type="url"') ||
    lower.includes('placeholder="http') ||
    lower.includes('placeholder="website') ||
    lower.includes('placeholder="url');
  if (!hasUrlField) return false;
  if (/recaptcha|hcaptcha|cf-turnstile|g-recaptcha/i.test(html)) return false;
  if (/you must be logged in|login to comment|sign in to comment/i.test(html)) return false;
  return true;
}

async function main() {
  const resources = JSON.parse(readFileSync(RESOURCES_PATH, 'utf-8'));
  const existing = new Set(resources.map(r => r.url));
  const submittedDomains = new Set(
    resources.filter(r => r.submitted).map(r => getHostname(r.url)).filter(Boolean)
  );

  console.log(`Existing: ${resources.length}, submitted domains: ${submittedDomains.size}`);

  let added = 0;
  const newEntries = [];

  for (let i = 0; i < PLATFORMS.length; i++) {
    const host = PLATFORMS[i];
    if (submittedDomains.has(host)) {
      console.log(`[${i+1}/${PLATFORMS.length}] SKIP (submitted): ${host}`);
      continue;
    }

    process.stdout.write(`[${i+1}/${PLATFORMS.length}] ${host} ... `);

    // Try RSS feed
    let postUrls = [];
    for (const feedPath of ['/feed/', '/rss', '/feed', '/blog/feed/']) {
      const xml = await httpGet(`https://${host}${feedPath}`, 8000);
      if (xml && (xml.includes('<rss') || xml.includes('<feed') || xml.includes('<?xml'))) {
        postUrls = extractFromRss(xml, host);
        if (postUrls.length > 0) break;
      }
    }

    // Fallback: homepage HTML
    if (postUrls.length === 0) {
      const html = await httpGet(`https://${host}/`, 8000);
      if (!html) { console.log('unreachable'); continue; }
      postUrls = extractFromHtml(html, host);
    }

    if (postUrls.length === 0) { console.log('no posts found'); continue; }

    // Check first post for comment form
    let addedThis = false;
    for (const postUrl of postUrls) {
      if (existing.has(postUrl)) continue;
      const postHtml = await httpGet(postUrl, 8000);
      if (!postHtml) continue;
      if (hasOpenCommentForm(postHtml)) {
        newEntries.push({
          type: 'blog_comment', url: postUrl,
          discovered_from: 'manual:discover-edu',
          has_captcha: false, link_strategy: 'url_field',
          link_format: 'html', has_url_field: true,
        });
        existing.add(postUrl);
        added++;
        addedThis = true;
        console.log(`✅ ${postUrl.slice(0, 80)}`);
        break;
      }
    }
    if (!addedThis) console.log(`no valid comment form`);

    await new Promise(r => setTimeout(r, 400));
  }

  const updated = [...resources, ...newEntries];
  writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`\n✅ Added ${added} new targets. Total: ${updated.length}`);
}

main().catch(console.error);
