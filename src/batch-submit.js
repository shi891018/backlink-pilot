#!/usr/bin/env node

// batch-submit.js — Batch backlink submission with resume support

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { launchBrowser, delay, humanType } from './browser.js';

const TIMEOUT_MS = 30000;
const MIN_DELAY = 10000;
const MAX_DELAY = 30000;

// Load resources
function loadResources() {
  const backlinks = JSON.parse(readFileSync('resources/backlink-resources.json', 'utf-8'));
  const sites = JSON.parse(readFileSync('resources/sites.json', 'utf-8'));

  const allResources = [
    ...(backlinks.profiles || []),
    ...(backlinks.blog_comments || [])
  ];

  return { resources: allResources, sites: sites.sites };
}

// Get today's log file
function getLogPath() {
  const date = new Date().toISOString().split('T')[0];
  return `logs/submissions-${date}.json`;
}

// Load submission log (for resume)
function loadLog() {
  const logPath = getLogPath();
  if (!existsSync('logs')) {
    mkdirSync('logs', { recursive: true });
  }
  if (existsSync(logPath)) {
    return JSON.parse(readFileSync(logPath, 'utf-8'));
  }
  return { date: new Date().toISOString().split('T')[0], submissions: [] };
}

// Save submission log
function saveLog(log) {
  const logPath = getLogPath();
  writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf-8');
}

// Check if URL already submitted today
function isSubmitted(log, url) {
  return log.submissions.some(s => s.url === url);
}

// Try to submit a profile
async function submitProfile(page, resource, site) {
  await page.goto(resource.url, { waitUntil: 'networkidle', timeout: TIMEOUT_MS });

  // Look for URL/website input fields
  const urlSelectors = [
    'input[name*="url" i]',
    'input[name*="website" i]',
    'input[name*="site" i]',
    'input[placeholder*="url" i]',
    'input[placeholder*="website" i]',
    'input[type="url"]',
    'textarea[name*="url" i]'
  ];

  let urlInput = null;
  for (const selector of urlSelectors) {
    try {
      urlInput = await page.$(selector);
      if (urlInput && await urlInput.isVisible()) break;
    } catch (e) {
      continue;
    }
  }

  if (!urlInput) {
    throw new Error('No URL field found');
  }

  // Fill URL field
  await humanType(page, urlSelectors.find(s => page.$(s)), site.url);
  await delay(500);

  // Try to fill name field
  const nameSelectors = [
    'input[name*="name" i]',
    'input[name*="title" i]',
    'input[placeholder*="name" i]'
  ];

  for (const selector of nameSelectors) {
    try {
      const input = await page.$(selector);
      if (input && await input.isVisible()) {
        await humanType(page, selector, site.name);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  await delay(500);

  // Try to fill description field
  const descSelectors = [
    'textarea[name*="desc" i]',
    'textarea[name*="bio" i]',
    'textarea[name*="about" i]',
    'input[name*="desc" i]'
  ];

  for (const selector of descSelectors) {
    try {
      const input = await page.$(selector);
      if (input && await input.isVisible()) {
        await humanType(page, selector, site.description);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  await delay(500);

  // Try to submit
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Submit")',
    'button:has-text("Save")',
    'button:has-text("Update")'
  ];

  for (const selector of submitSelectors) {
    try {
      const button = await page.$(selector);
      if (button && await button.isVisible()) {
        await button.click();
        await delay(2000);
        break;
      }
    } catch (e) {
      continue;
    }
  }
}

// Try to submit a blog comment
async function submitBlogComment(page, resource, site) {
  await page.goto(resource.url, { waitUntil: 'networkidle', timeout: TIMEOUT_MS });

  // Look for comment form
  const commentSelectors = [
    'textarea[name*="comment" i]',
    'textarea[name*="message" i]',
    'textarea[id*="comment" i]',
    'textarea[placeholder*="comment" i]'
  ];

  let commentField = null;
  for (const selector of commentSelectors) {
    try {
      commentField = await page.$(selector);
      if (commentField && await commentField.isVisible()) break;
    } catch (e) {
      continue;
    }
  }

  if (!commentField) {
    throw new Error('No comment field found');
  }

  // Create comment with backlink
  const comment = `Great content! For those interested, check out ${site.name} at ${site.url} - ${site.description}`;

  const commentSelector = commentSelectors.find(s => page.$(s));
  await humanType(page, commentSelector, comment);
  await delay(500);

  // Try to fill name/email if needed
  const nameSelectors = ['input[name*="name" i]', 'input[name*="author" i]'];
  for (const selector of nameSelectors) {
    try {
      const input = await page.$(selector);
      if (input && await input.isVisible()) {
        await humanType(page, selector, site.name);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  const emailSelectors = ['input[name*="email" i]', 'input[type="email"]'];
  for (const selector of emailSelectors) {
    try {
      const input = await page.$(selector);
      if (input && await input.isVisible()) {
        await humanType(page, selector, site.email);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  await delay(500);

  // Submit
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Submit")',
    'button:has-text("Post")',
    'button:has-text("Send")'
  ];

  for (const selector of submitSelectors) {
    try {
      const button = await page.$(selector);
      if (button && await button.isVisible()) {
        await button.click();
        await delay(2000);
        break;
      }
    } catch (e) {
      continue;
    }
  }
}

// Check for blockers (captcha, login, etc)
async function checkBlockers(page) {
  const bodyText = await page.textContent('body').catch(() => '');
  const html = await page.content().catch(() => '');

  // Check for captcha
  if (html.includes('recaptcha') || html.includes('hcaptcha') || html.includes('captcha')) {
    return 'captcha';
  }

  // Check for login
  if (bodyText.toLowerCase().includes('sign in') ||
      bodyText.toLowerCase().includes('log in') ||
      bodyText.toLowerCase().includes('login required')) {
    return 'login_required';
  }

  return null;
}

// Process a single resource
async function processResource(resource, site, page, log) {
  const result = {
    url: resource.url,
    type: resource.type,
    site: site.name,
    timestamp: new Date().toISOString(),
    status: 'unknown'
  };

  try {
    console.log(`  🔄 Processing: ${resource.url}`);

    // Check for blockers first
    const blocker = await checkBlockers(page);
    if (blocker) {
      result.status = 'skipped';
      result.reason = blocker;
      console.log(`    ⏭️  Skipped (${blocker})`);
      return result;
    }

    // Try submission based on type
    if (resource.type === 'profile') {
      await submitProfile(page, resource, site);
    } else if (resource.type === 'blog_comment') {
      await submitBlogComment(page, resource, site);
    }

    // Check again for blockers after interaction
    const blockerAfter = await checkBlockers(page);
    if (blockerAfter) {
      result.status = 'skipped';
      result.reason = blockerAfter;
      console.log(`    ⏭️  Skipped (${blockerAfter})`);
      return result;
    }

    result.status = 'success';
    console.log(`    ✅ Success`);

  } catch (error) {
    if (error.message.includes('Timeout') || error.message.includes('timeout')) {
      result.status = 'skipped';
      result.reason = 'timeout';
      console.log(`    ⏭️  Skipped (timeout)`);
    } else {
      result.status = 'failed';
      result.error = error.message;
      console.log(`    ❌ Failed: ${error.message}`);
    }
  }

  return result;
}

// Main batch submission
async function batchSubmit(opts = {}) {
  const limit = opts.limit || 20;
  const siteIndex = opts.siteIndex || 0;

  console.log('🚀 Batch Backlink Submission\n');

  const { resources, sites } = loadResources();
  const log = loadLog();

  // Select site (rotate through them)
  const site = sites[siteIndex % sites.length];
  console.log(`📍 Target site: ${site.name}\n`);

  // Filter unsubmitted resources
  const pending = resources.filter(r => !isSubmitted(log, r.url));

  if (pending.length === 0) {
    console.log('✨ All resources already submitted today!');
    return;
  }

  console.log(`📊 Pending: ${pending.length} resources`);
  console.log(`🎯 Processing: up to ${limit} resources\n`);

  const toProcess = pending.slice(0, limit);

  // Launch browser
  const { browser, page } = await launchBrowser({ browser: { headless: true } });

  try {
    for (let i = 0; i < toProcess.length; i++) {
      const resource = toProcess[i];

      console.log(`[${i + 1}/${toProcess.length}]`);

      const result = await processResource(resource, site, page, log);
      log.submissions.push(result);
      saveLog(log);

      // Random delay between submissions
      if (i < toProcess.length - 1) {
        const delayMs = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
        console.log(`    ⏳ Waiting ${Math.round(delayMs / 1000)}s...\n`);
        await delay(delayMs);
      }
    }
  } finally {
    await browser.close();
  }

  // Summary
  const success = log.submissions.filter(s => s.status === 'success').length;
  const skipped = log.submissions.filter(s => s.status === 'skipped').length;
  const failed = log.submissions.filter(s => s.status === 'failed').length;

  console.log('\n📈 Summary:');
  console.log(`  ✅ Success: ${success}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📁 Log: ${getLogPath()}\n`);
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opts = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' || args[i] === '-l') {
      opts.limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--site' || args[i] === '-s') {
      opts.siteIndex = parseInt(args[i + 1], 10);
      i++;
    }
  }

  batchSubmit(opts).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

export { batchSubmit };
