// viesearch.js — Viesearch adapter
// Flow: sign-in (skip if ok) → register via browser → auto-verify email (IMAP) → sign-in → submit
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

/**
 * Fill and submit the Viesearch join form via browser.
 * Returns { ok: true } on success, { ok: false, reason } on failure.
 * Screenshots are saved before and after submit.
 */
async function browserRegister(page, { username, password, email, displayName, screenshotDir }) {
  const ts = () => new Date().toISOString().replace(/[:.]/g, '-');
  console.log('  📝 Navigating to registration form...');
  await page.goto(JOIN_URL);
  await delay(2500);
  await page.screenshot(`${screenshotDir}/viesearch-join-page.png`).catch(() => {});

  // Fill all fields using CSS name-attribute selectors (more reliable than snapshot refs)
  const pngBase64 = (await makeAvatar200()).toString('base64');
  await page.evalRun(`
    (function() {
      function setVal(name, val) {
        var el = document.querySelector('[name="' + name + '"]');
        if (!el) return;
        el.value = val;
        el.dispatchEvent(new Event('input',  {bubbles: true}));
        el.dispatchEvent(new Event('change', {bubbles: true}));
      }
      setVal('join_username',         ${JSON.stringify(username)});
      setVal('join_password',         ${JSON.stringify(password)});
      setVal('join_password_confirm', ${JSON.stringify(password)});
      setVal('join_name',             ${JSON.stringify(displayName)});
      setVal('join_email',            ${JSON.stringify(email)});
      setVal('join_about_me', 'Scientific unit converter for science and engineering.');
    })()
  `);
  await delay(400);

  // Check terms checkbox
  await page.evalRun(`
    (function() {
      var cb = document.querySelector('input[name="join_terms"], input[type="checkbox"]');
      if (cb && !cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles: true})); }
    })()
  `);
  await delay(300);

  // Upload avatar via DataTransfer (works in CDP context)
  await page.evalRun(`
    (function() {
      var bin = atob(${JSON.stringify(pngBase64)});
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var file = new File([bytes], 'avatar.png', {type: 'image/png'});
      var dt = new DataTransfer();
      dt.items.add(file);
      var input = document.querySelector('input[name="join_picture"], input[type="file"]');
      if (input) { input.files = dt.files; input.dispatchEvent(new Event('change', {bubbles: true})); }
    })()
  `);
  await delay(500);

  await page.screenshot(`${screenshotDir}/viesearch-join-before-${ts()}.png`).catch(() => {});
  console.log('  📤 Submitting registration form...');
  await page.evalSubmitForm('form');
  await delay(5000);
  await page.screenshot(`${screenshotDir}/viesearch-join-after-${ts()}.png`).catch(() => {});

  const url = page.url();
  console.log(`  📍 Post-register URL: ${url}`);
  if (url.includes('/joined')) return { ok: true, autoSignedIn: false };
  if (url.includes('/editor/')) return { ok: true, autoSignedIn: true };
  return { ok: false, reason: `Unexpected URL after submit: ${url}` };
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

    const regEmail    = creds.email || product.email;
    const displayName = creds.display_name || product.name.split(' ').slice(0, 2).join(' ') || 'Unit Converter';
    const screenshotDir = config.browser?.screenshot_dir || './screenshots';
    const ts = () => new Date().toISOString().replace(/[:.]/g, '-');

    return withBrowser({ ...config, _engine: 'bb' }, async ({ page }) => {

      // ── Step 1: Try sign-in (skip registration if account already works) ──
      console.log('  🔐 Attempting sign-in...');
      await page.goto(SIGNIN_URL);
      await delay(2000);

      const signinSnap = await page.snapshot();
      const signinFields = parseSigninFields(signinSnap);
      if (signinFields.username && signinFields.password) {
        await page.fill(signinFields.username, creds.username);
        await delay(300);
        await page.fill(signinFields.password, creds.password);
        await delay(300);
        await page.evalSubmitForm('form[method="post"]');
        await delay(4000);
      }
      await page.screenshot(`${screenshotDir}/viesearch-signin-attempt.png`).catch(() => {});

      let isSignedIn = !page.url().includes('/signin');

      // ── Step 2: Register via browser if sign-in failed ────────────────────
      if (!isSignedIn) {
        console.log('  ℹ️  Sign-in failed — will register new account via browser');
        const reg = await browserRegister(page, {
          username: creds.username, password: creds.password,
          email: regEmail, displayName, screenshotDir,
        });

        if (reg.autoSignedIn) {
          console.log('  ✅ Registered and auto-signed-in!');
          isSignedIn = true;
        } else if (reg.ok) {
          console.log('  ✅ Registration succeeded — verifying email...');
        } else {
          console.log(`  ⚠️  Registration: ${reg.reason} — will attempt to continue...`);
        }
      }

      // ── Step 3: Email verification (IMAP, async) ──────────────────────────
      if (!isSignedIn) {
        const gmailCreds = config.credentials?.gmail;
        if (gmailCreds?.app_password) {
          console.log('  📧 Requesting verification email...');
          await httpResend(regEmail);
          await delay(2000);
          try {
            console.log('  ⏳ Waiting for verification email (up to 60s)...');
            const verifyLink = await waitForVerificationLink({
              email: product.email,
              appPassword: gmailCreds.app_password,
              fromFilter: 'viesearch',
              linkPattern: /https?:\/\/viesearch\.com\/confirm\/[a-f0-9]+/gi,
              timeoutMs: 60000,
              pollMs: 8000,
              searchWindowMs: 5 * 60 * 1000,
            });
            console.log('  🔗 Confirming verification link...');
            const vr = await fetch(verifyLink, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0' } });
            console.log(`  ✅ Email verified! (status ${vr.status})`);
          } catch (e) {
            if (/timed out/i.test(e.message)) {
              console.log('  ℹ️  No new verification email — account may already be verified, continuing...');
            } else {
              throw e;
            }
          }
        } else {
          console.log('  ⚠️  No Gmail App Password — skipping auto-verify. Add credentials.gmail.app_password to config.yaml');
        }

        // ── Step 4: Sign in after verification ───────────────────────────────
        console.log('  🔐 Signing in after verification...');
        await page.goto(SIGNIN_URL);
        await delay(2000);
        const snap2 = await page.snapshot();
        const sf2 = parseSigninFields(snap2);
        if (sf2.username && sf2.password) {
          await page.fill(sf2.username, creds.username);
          await delay(300);
          await page.fill(sf2.password, creds.password);
          await delay(300);
          await page.evalSubmitForm('form[method="post"]');
          await delay(4000);
        }
        await page.screenshot(`${screenshotDir}/viesearch-signin-result.png`).catch(() => {});
        if (page.url().includes('/signin')) {
          throw new Error('Sign-in failed — check credentials or verify email manually');
        }
        console.log('  ✅ Signed in!');
      }

      // ── Step 5: Submit site ────────────────────────────────────────────────
      console.log('  📄 Opening submission form...');
      await page.goto(SUBMIT_URL);
      await delay(2500);

      const submitSnap = await page.snapshot();
      const submitFields = parseSubmitFields(submitSnap);
      await page.screenshot(`${screenshotDir}/viesearch-submit-page.png`).catch(() => {});

      if (!submitFields.url && !submitFields.title) {
        throw new Error('Cannot find submission form (may require email verification first)');
      }

      if (submitFields.ownerName)   { await page.fill(submitFields.ownerName,   creds.username);  await delay(300); }
      if (submitFields.ownerEmail)  { await page.fill(submitFields.ownerEmail,  product.email);   await delay(300); }
      if (submitFields.title)       { await page.fill(submitFields.title,       product.name);    await delay(300); }
      if (submitFields.description) { await page.fill(submitFields.description, product.description || product.long_description?.split('\n')[0] || ''); await delay(300); }
      if (submitFields.url)         { await page.fill(submitFields.url,         product.url);     await delay(300); }

      // Select free listing type (last radio = "Text Only Listing - No Thumbnail Image - Free")
      await page.evalRun(`Array.from(document.querySelectorAll('input[type="radio"]')).at(-1)?.click()`);
      await delay(300);

      // Pick a matching category from the dropdown
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

      await page.screenshot(`${screenshotDir}/viesearch-submit-${ts()}.png`).catch(() => {});

      if (submitFields.submit) {
        console.log('  🚀 Submitting site...');
        await page.evalSubmitForm('form');
        await delay(4000);
      }

      await page.screenshot(`${screenshotDir}/viesearch-result-${ts()}.png`).catch(() => {});
      return {
        url: page.url(),
        confirmation: 'Viesearch site submitted — awaiting review',
      };
    });
  },
};

// --- Snapshot parsers ---

function parseSigninFields(snapshot) {
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
