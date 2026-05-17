#!/usr/bin/env node
/**
 * batch-blog-comments.mjs
 * Batch blog comment submission via bb-browser (CDP eval-based, no Playwright).
 * Usage: node src/batch-blog-comments.mjs [--limit N] [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { BbPage } from './bb.js';

const ROOT          = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RESOURCES_PATH = resolve(ROOT, 'resources/backlink-resources.json');
const CONFIG_PATH    = resolve(ROOT, 'config.yaml');
const LOG_DIR        = resolve(ROOT, 'logs');
const LOG_PATH       = resolve(LOG_DIR, `blog-comments-${new Date().toISOString().split('T')[0]}.json`);

// --- CLI args ---
const args      = process.argv.slice(2);
const LIMIT     = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] ?? args[args.indexOf('--limit') + 1] ?? '20');
const DRY_RUN   = args.includes('--dry-run');
const MIN_DELAY = 15_000;
const MAX_DELAY = 28_000;

// --- Comment templates ---
const TEMPLATES = [
  "Great article! Really appreciate the depth of explanation here.",
  "This was exactly what I was looking for. Thanks for the detailed write-up.",
  "Bookmarked for future reference. Solid content.",
  "Well explained and easy to follow. Keep up the great work!",
  "This is a helpful resource. Learned something new today.",
  "Thanks for breaking this down so clearly — very informative.",
  "Appreciate the thoroughness here. Shared with a few colleagues.",
  "Interesting perspective, well supported with examples. Thanks!",
  "One of the better articles I've found on this topic. Very useful.",
  "Practical and to the point. Exactly what the internet needs more of.",
  "Really enjoyed reading this. Looking forward to more posts like this.",
  "Clear and well-structured post. Thanks for putting this together.",
  "This answered a question I've been sitting on for a while. Cheers!",
  "Quality content. Came across this while researching — glad I did.",
  "Good stuff! The step-by-step approach makes it very accessible.",
];

const PERSONAS = [
  { name: 'Alex Chen',    email: 'alexc.dev@outlook.com' },
  { name: 'Jamie Liu',    email: 'jamie.liu.writes@gmail.com' },
  { name: 'Morgan Lee',   email: 'morganlee.tech@outlook.com' },
  { name: 'Sam Rivera',   email: 'sam.r.creates@gmail.com' },
  { name: 'Taylor Kim',   email: 'taylork.web@outlook.com' },
  { name: 'Jordan Park',  email: 'jordan.park.io@outlook.com' },
  { name: 'Casey Nguyen', email: 'caseyn.dev@gmail.com' },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// --- Read product config ---
function readConfig() {
  const raw = readFileSync(CONFIG_PATH, 'utf-8');
  const get = k => raw.match(new RegExp(`^\\s*${k}:\\s*["']?([^\\n#"']+)["']?`, 'm'))?.[1]?.trim() ?? '';
  return { url: get('url'), name: get('name'), email: get('email') };
}

// --- Resources ---
function loadResources()     { return JSON.parse(readFileSync(RESOURCES_PATH, 'utf-8')); }
function saveResources(data) { writeFileSync(RESOURCES_PATH, JSON.stringify(data, null, 2), 'utf-8'); }

// --- Log ---
function loadLog() {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
  if (existsSync(LOG_PATH)) return JSON.parse(readFileSync(LOG_PATH, 'utf-8'));
  return { date: new Date().toISOString().split('T')[0], results: [] };
}
function saveLog(log) { writeFileSync(LOG_PATH, JSON.stringify(log, null, 2), 'utf-8'); }

// --- Submit one blog comment using BbPage.evalRun() ---
async function submitComment(page, resource, site) {
  await page.goto(resource.url);
  await delay(3000); // extra wait for lazy-loaded forms

  const comment = pick(TEMPLATES);
  const persona = pick(PERSONAS);
  const siteUrl  = site.url;

  const js = `(function() {
    var html = document.body ? document.body.innerHTML : '';
    if (/recaptcha|hcaptcha|cf-turnstile|g-recaptcha/i.test(html))
      return '{"status":"skip","reason":"captcha"}';
    var bodyText = document.body ? document.body.innerText : '';
    if (/comments\\s*(are\\s*)?(closed|disabled)/i.test(bodyText))
      return '{"status":"skip","reason":"comments_closed"}';
    if (/login to comment|must be logged in|sign in to comment/i.test(bodyText))
      return '{"status":"skip","reason":"login_required"}';

    var commentSels = [
      'textarea[name="comment"]','textarea#comment',
      'textarea[name*="comment"]','textarea[id*="comment"]',
      'textarea[name*="message"]','textarea'
    ];
    var commentEl = null;
    for (var i = 0; i < commentSels.length; i++) {
      var el = document.querySelector(commentSels[i]);
      if (el) { commentEl = el; break; }
    }
    if (!commentEl) return '{"status":"skip","reason":"no_comment_field"}';

    commentEl.value = ${JSON.stringify(comment)};
    commentEl.dispatchEvent(new Event('input',{bubbles:true}));
    commentEl.dispatchEvent(new Event('change',{bubbles:true}));

    var nameSels = ['input[name="author"]','input#author','input[name*="name"]'];
    for (var i = 0; i < nameSels.length; i++) {
      var el = document.querySelector(nameSels[i]);
      if (el && el.type !== 'hidden') { el.value = ${JSON.stringify(persona.name)}; el.dispatchEvent(new Event('input',{bubbles:true})); break; }
    }

    var emailSels = ['input[name="email"]','input#email','input[type="email"]'];
    for (var i = 0; i < emailSels.length; i++) {
      var el = document.querySelector(emailSels[i]);
      if (el && el.type !== 'hidden') { el.value = ${JSON.stringify(persona.email)}; el.dispatchEvent(new Event('input',{bubbles:true})); break; }
    }

    var urlSels = ['input[name="url"]','input#url','input[name*="website"]','input[type="url"]'];
    var urlFilled = false;
    for (var i = 0; i < urlSels.length; i++) {
      var el = document.querySelector(urlSels[i]);
      if (el && el.type !== 'hidden') { el.value = ${JSON.stringify(siteUrl)}; el.dispatchEvent(new Event('input',{bubbles:true})); urlFilled = true; break; }
    }

    var submitSels = ['input#submit','input[name="submit"]','button[type="submit"]','input[type="submit"]'];
    var btn = null;
    for (var i = 0; i < submitSels.length; i++) {
      var b = document.querySelector(submitSels[i]);
      if (b) { btn = b; break; }
    }
    if (!btn) return '{"status":"skip","reason":"no_submit_btn"}';

    btn.click();
    return JSON.stringify({status:'submitted', urlFilled: urlFilled, persona: ${JSON.stringify(persona.name)}});
  })()`;

  let raw = '';
  try {
    raw = await page.evalRun(js);
    const match = raw.match(/\{[^{}]*"status"[^{}]*\}/);
    return match ? JSON.parse(match[0]) : { status: 'error', reason: 'no_json: ' + raw?.substring(0, 60) };
  } catch (e) {
    return { status: 'error', reason: e.message?.substring(0, 80) };
  }
}

// --- Main ---
async function main() {
  const limitVal = isNaN(LIMIT) ? 20 : LIMIT;
  console.log(`\n🔗 Batch Blog Comment Submission — limit: ${limitVal}${DRY_RUN ? ' (DRY RUN)' : ''}\n`);

  const site = readConfig();
  console.log(`📦 ${site.name} → ${site.url}\n`);

  // Init BbPage (also validates Chrome is running)
  let page;
  try {
    page = new BbPage();
  } catch (e) {
    console.error('❌ ' + e.message);
    process.exit(1);
  }

  const resources = loadResources();
  const log = loadLog();

  // Already submitted today
  const doneTodayUrls = new Set(log.results.filter(r => r.status === 'submitted').map(r => r.url));

  const candidates = resources.filter(r =>
    r.type === 'blog_comment' &&
    !r.submitted &&
    !r.has_captcha &&
    r.has_url_field &&
    !doneTodayUrls.has(r.url)
  );

  console.log(`📋 Eligible: ${candidates.length} targets → will submit ${Math.min(candidates.length, limitVal)}\n`);

  const queue = candidates.slice(0, limitVal);
  let ok = 0, skipped = 0, failed = 0;

  for (let i = 0; i < queue.length; i++) {
    const res = queue[i];
    const short = res.url.length > 80 ? res.url.substring(0, 80) + '…' : res.url;
    console.log(`[${i + 1}/${queue.length}] ${short}`);

    if (DRY_RUN) { console.log('    🔍 dry-run\n'); continue; }

    let result;
    try {
      result = await submitComment(page, res, site);
    } catch (e) {
      result = { status: 'error', reason: e.message?.substring(0, 80) };
    }

    // Persist resource state
    const idx = resources.findIndex(r => r.url === res.url);
    if (idx !== -1) {
      if (result.status === 'submitted') {
        resources[idx].submitted = true;
        resources[idx].status = 'submitted';
        resources[idx].submitted_at = new Date().toISOString();
      } else if (result.status === 'skip') {
        resources[idx].status = result.reason;
      }
    }

    log.results.push({
      url: res.url,
      status: result.status,
      reason: result.reason,
      persona: result.persona,
      timestamp: new Date().toISOString(),
    });

    if (result.status === 'submitted') {
      console.log(`    ✅ OK  — ${result.persona}, url_field: ${result.urlFilled}`);
      ok++;
    } else if (result.status === 'skip') {
      console.log(`    ⏭  Skip — ${result.reason}`);
      skipped++;
    } else {
      console.log(`    ❌ Err  — ${result.reason}`);
      failed++;
    }

    saveResources(resources);
    saveLog(log);

    if (i < queue.length - 1) {
      if (result.status === 'submitted') {
        const wait = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
        console.log(`    ⏳ ${(wait / 1000).toFixed(0)}s pacing...\n`);
        await delay(wait);
      } else {
        await delay(2000);
        console.log('');
      }
    }
  }

  console.log('\n' + '─'.repeat(52));
  console.log(`✅ ${ok} submitted  ⏭ ${skipped} skipped  ❌ ${failed} failed`);
  console.log(`📄 Log: ${LOG_PATH}`);
}

main().catch(console.error);
