// viesearch.js — Viesearch adapter
// Flow: register (HTTP POST) → auto-verify email (Gmail IMAP) → submit site (browser)
// Requires config.credentials.viesearch.{username, password}
// Requires config.credentials.gmail.app_password  (for email verification)

import zlib from 'zlib';
import { promisify } from 'util';
import { withBrowser, delay } from '../browser.js';
import { waitForVerificationLink } from '../email-verify.js';

const SUBMIT_URL = 'https://viesearch.com/submit';
const SIGNIN_URL = 'https://viesearch.com/signin';
const JOIN_URL   = 'https://viesearch.com/join';
const RESEND_URL = 'https://viesearch.com/resend';

const deflate = promisify(zlib.deflate);

/**
 * Generate a minimal valid 200x200 PNG (solid blue) — required by Viesearch avatar upload.
 */
async function makeAvatar200() {
  const W = 200, H = 200;
  const rows = [];
  for (let y = 0; y < H; y++) {
    const row = Buffer.alloc(1 + W * 3);
    row[0] = 0; // filter None
    for (let x = 0; x < W; x++) { row[1+x*3]=70; row[2+x*3]=130; row[3+x*3]=200; }
    rows.push(row);
  }
  const compressed = await deflate(Buffer.concat(rows));

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (const b of buf) { c ^= b; for (let i=0;i<8;i++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function chunk(type, data) {
    const tb = Buffer.from(type,'ascii');
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([tb,data])));
    return Buffer.concat([len, tb, data, crcBuf]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W,0); ihdr.writeUInt32BE(H,4); ihdr[8]=8; ihdr[9]=2;

  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a','hex'),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Register a new Viesearch account via direct HTTP POST (no browser needed).
 * Returns { ok: true } on success, { ok: false, reason } on failure.
 */
async function httpRegister(username, password, email, displayName = 'Unit Converter') {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36';
  // Step 1: get session cookie
  const r1 = await fetch(JOIN_URL, { headers: { 'User-Agent': UA } });
  const sessionCookie = r1.headers.get('set-cookie')?.split(';')[0] || '';

  // Step 2: build multipart form with 200x200 PNG avatar
  const avatarBytes = await makeAvatar200();
  const fd = new FormData();
  fd.set('join_username',         username);
  fd.set('join_password',         password);
  fd.set('join_password_confirm', password);
  fd.set('join_name',             displayName);
  fd.set('join_email',            email);
  fd.set('join_about_me',         'Scientific unit converter for science and engineering.');
  fd.set('join_terms',            '1');
  fd.set('join_picture', new Blob([avatarBytes], { type: 'image/png' }), 'avatar.png');

  const r2 = await fetch(JOIN_URL, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Cookie': sessionCookie, 'Referer': JOIN_URL, 'Origin': 'https://viesearch.com' },
    body: fd,
    redirect: 'manual',
  });

  const location = r2.headers.get('location') || '';
  if (r2.status === 302 && location.includes('/joined')) return { ok: true };

  // Parse error from response body
  const html = await r2.text();
  const errDivs = [...html.matchAll(/<(?:div|p)[^>]*(?:class|id)="[^"]*error[^"]*"[^>]*>([\s\S]*?)<\/(?:div|p)>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g,'').trim())
    .filter(s => s.length > 3 && !/javascript.*browser/i.test(s)); // filter out the generic JS notice
  return { ok: false, reason: errDivs.join('; ') || `HTTP ${r2.status}` };
}

/**
 * Request resend of verification email via HTTP POST.
 */
async function httpResend(usernameOrEmail) {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0';
  const body = new URLSearchParams({ resend_for: usernameOrEmail });
  await fetch(RESEND_URL, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': RESEND_URL, 'Origin': 'https://viesearch.com' },
    body: body.toString(),
  });
}

export default {
  name: 'viesearch',
  url: SUBMIT_URL,
  auth: 'register',
  captcha: 'none',
  engine: 'bb',

  async submit(product, config) {
    const creds = config.credentials?.viesearch;
    if (!creds?.username || !creds?.password) {
      throw new Error(
        'Viesearch credentials missing.\n' +
        '  Add to config.yaml:\n' +
        '    credentials:\n' +
        '      viesearch:\n' +
        '        username: "yourname"\n' +
        '        password: "yourpassword"'
      );
    }

    // ── Step 1: Register via HTTP (fast, reliable) ──────────────────────────
    const regEmail = creds.email || product.email;
    // Use a proper display name (no underscores) — Viesearch validates name format
    const displayName = creds.display_name || product.name.split(' ').slice(0, 2).join(' ') || 'Unit Converter';
    console.log('  📝 Registering account via HTTP POST...');
    const regResult = await httpRegister(creds.username, creds.password, regEmail, displayName);
    if (regResult.ok) {
      console.log('  ✅ Registration succeeded!');
    } else if (/taken|already|exist|duplicate/i.test(regResult.reason)) {
      console.log(`  ℹ️  Username/email already registered — skipping to verification`);
    } else {
      console.log(`  ⚠️  Registration returned: ${regResult.reason}`);
      console.log('      Will attempt to continue (account may already exist)...');
    }

    // ── Step 2: Request/resend verification email ───────────────────────────
    console.log('  📧 Requesting verification email...');
    await httpResend(regEmail);
    await delay(2000);

    // ── Step 3: Auto-verify via Gmail IMAP (best-effort, 60s timeout) ─────────────
    const gmailCreds = config.credentials?.gmail;
    if (gmailCreds?.app_password) {
      try {
        const verifyLink = await waitForVerificationLink({
          email: product.email,  // Gmail receives alias emails in same inbox
          appPassword: gmailCreds.app_password,
          fromFilter: 'viesearch',
          linkPattern: /https?:\/\/viesearch\.com\/confirm\/[a-f0-9]+/gi,
          timeoutMs: 60000,      // only wait 60s — if already verified, skip gracefully
          pollMs: 8000,
          searchWindowMs: 5 * 60 * 1000,  // only look at emails from last 5 min
        });
        console.log('  🔗 Confirming verification link...');
        const vr = await fetch(verifyLink, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0' } });
        console.log(`  ✅ Email verified! (status ${vr.status})`);
      } catch (e) {
        if (/timed out/i.test(e.message)) {
          console.log('  ℹ️  No new verification email found — account may already be verified, continuing...');
        } else {
          throw e;
        }
      }
    } else {
      console.log('  ⚠️  No Gmail App Password — cannot auto-verify. Add credentials.gmail.app_password to config.yaml');
      console.log('      Continuing anyway (submission may fail if verification is required)...');
    }

    // ── Step 4: Submit site via browser (requires login session) ───────────
    return withBrowser({ ...config, _engine: 'bb' }, async ({ page }) => {
      // Sign in
      console.log('  🔐 Signing in...');
      await page.goto(SIGNIN_URL);
      await delay(2000);
      const signinSnap = await page.snapshot();
      const signinFields = parseFields(signinSnap);
      console.log(`  🔍 Snapshot fields: user=${signinFields.username} pass=${signinFields.password} submit=${signinFields.submit}`);
      if (signinFields.username && signinFields.password) {
        await page.fill(signinFields.username, creds.username);
        await delay(500);
        await page.fill(signinFields.password, creds.password);
        await delay(500);
        // evalSubmitForm uses native btn.click() which reliably triggers form submission
        await page.evalSubmitForm('form[method="post"]');
        await delay(5000); // wait for redirect
      }
      // Take screenshot so we can diagnose issues
      const dir = config.browser?.screenshot_dir || './screenshots';
      await page.screenshot(`${dir}/viesearch-signin-result.png`).catch(() => {});
      const postSigninUrl = page.url();
      if (postSigninUrl.includes('/signin')) {
        throw new Error('Sign in failed — account may not be verified yet. Check your email.');
      }
      console.log('  ✅ Signed in!');

      // Open submission form
      console.log('  📄 Opening submission form...');
      await page.goto(SUBMIT_URL);
      await delay(2500);

      const submitSnap = await page.snapshot();
      const submitFields = parseSubmitFields(submitSnap);
      console.log(`  🔍 Submit form fields: url=${submitFields.url} title=${submitFields.title} submit=${submitFields.submit}`);
      // Debug: print first 10 lines of snapshot
      const snapLines = submitSnap.split('\n').filter(l => l.trim()).slice(0, 20);
      console.log('  📋 Snapshot preview:', snapLines.join(' | ').substring(0, 300));
      await page.screenshot(`${config.browser?.screenshot_dir || './screenshots'}/viesearch-submit-page.png`).catch(() => {});

      if (!submitFields.url && !submitFields.title) {
        throw new Error('Could not find Viesearch site submission form (may need email verification first)');
      }

      if (submitFields.ownerName)  { await page.fill(submitFields.ownerName, creds.username); await delay(300); }
      if (submitFields.ownerEmail) { await page.fill(submitFields.ownerEmail, product.email); await delay(300); }
      if (submitFields.title)      { await page.fill(submitFields.title, product.name); await delay(300); }
      if (submitFields.description){ await page.fill(submitFields.description, product.description || product.long_description?.split('\n')[0] || ''); await delay(300); }
      if (submitFields.url)        { await page.fill(submitFields.url, product.url); await delay(300); }

      // Select the FREE listing type (last radio = "Text Only Listing - No Thumbnail Image - Free")
      await page.evalRun(`Array.from(document.querySelectorAll('input[type="radio"]')).at(-1)?.click()`);
      await delay(300);

      // Select a category matching product keywords
      await page.evalRun(`
        (function() {
          var sel = document.querySelector('select');
          if (!sel) return;
          var opt = Array.from(sel.options).find(o => /science|tools|education|utilities/i.test(o.text));
          if (!opt) opt = Array.from(sel.options).find(o => o.value && o.value !== '');
          if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event('change', {bubbles: true})); }
        })()
      `);
      await delay(300);

      // Screenshot before submit
      try {
        const screenshotDir = config.browser?.screenshot_dir || './screenshots';
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        await page.screenshot(`${screenshotDir}/viesearch-submit-${ts}.png`);
      } catch {}

      if (submitFields.submit) {
        console.log('  🚀 Submitting site...');
        // Use evalSubmitForm — ref-click doesn't trigger form submission
        await page.evalSubmitForm('form');
        await delay(4000);
      }

      const finalUrl = page.url();
      const screenshotDir2 = config.browser?.screenshot_dir || './screenshots';
      const ts2 = new Date().toISOString().replace(/[:.]/g, '-');
      await page.screenshot(`${screenshotDir2}/viesearch-result-${ts2}.png`).catch(() => {});
      return {
        url: finalUrl,
        confirmation: 'Viesearch site submitted — awaiting review',
      };
    });
  },
};

// --- Snapshot parsers ---

function parseFields(snapshot) {
  const fields = { username: null, password: null, submit: null };
  for (const line of snapshot.split('\n')) {
    const m = line.match(/^\s*(\w+)\s+\[ref=(\d+)\]\s*"?([^"]*)"?/);
    if (!m) continue;
    const [, role, ref, label] = m;
    const r = `@${ref}`;
    const l = label.toLowerCase();
    if (role === 'textbox') {
      if (!fields.username && /username|user|login/i.test(l)) fields.username = r;
      else if (!fields.password && /password/i.test(l)) fields.password = r;
    }
    if (role === 'button' && /sign.?in|log.?in/i.test(l)) fields.submit = r;
  }
  return fields;
}

function parseSubmitFields(snapshot) {
  const fields = {
    ownerName: null, ownerEmail: null, title: null,
    description: null, url: null, submit: null,
  };
  for (const line of snapshot.split('\n')) {
    const m = line.match(/^\s*(\w+)\s+\[ref=(\d+)\]\s*"?([^"]*)"?/);
    if (!m) continue;
    const [, role, ref, label] = m;
    const r = `@${ref}`;
    const l = label.toLowerCase();
    if (role === 'textbox') {
      if (/owner_name|owner.?name/i.test(l)) fields.ownerName = r;
      else if (/owner_email|owner.?email/i.test(l)) fields.ownerEmail = r;
      else if (/title|name/i.test(l) && !fields.title) fields.title = r;
      else if (/desc/i.test(l) && !fields.description) fields.description = r;
      else if (/url|website|link/i.test(l) && !fields.url) fields.url = r;
    }
    if (role === 'button' && /submit/i.test(l)) fields.submit = r;
  }
  return fields;
}
