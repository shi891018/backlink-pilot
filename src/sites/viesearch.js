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
  // Target the join form specifically by its known field (avoid submitting search bar)
  try {
    await page.evalRun(`
      (function() {
        var input = document.querySelector('[name="join_username"]');
        var form = input && input.closest('form');
        if (!form) form = Array.from(document.querySelectorAll('form')).at(-1);
        var btn = form && form.querySelector('input[type="submit"], button[type="submit"]');
        if (btn) btn.click();
      })()
    `);
  } catch (e) {
    if (!/timed out|timeout/i.test(e.message)) throw e;
  }
  await delay(6000);
  await page.screenshot(`${screenshotDir}/viesearch-join-after-${ts()}.png`).catch(() => {});

  let regUrl = '';
  try { regUrl = page.url(); } catch {}
  console.log(`  📍 Post-register URL: ${regUrl}`);
  if (regUrl.includes('/joined')) return { ok: true, autoSignedIn: false };
  if (regUrl.includes('/editor/')) return { ok: true, autoSignedIn: true };
  return { ok: false, reason: `Unexpected URL after submit: ${regUrl}` };
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

      // Viesearch's submit page allows only ONE CDP eval after navigation.
      // Strategy: combine login-check + form-fill + submit into a SINGLE evalRun call.
      // Sign-in page also gets ONE batched eval: fill-username + fill-password + click.

      const desc = product.description || product.long_description?.split('\n')[0] || '';

      // JS fragment: fill all form fields and click submit. Returns 'submitted' or 'no-form'.
      const FILL_AND_SUBMIT_JS = `(function(url, title, description, username) {
        function set(name, val) {
          var el = document.querySelector('[name=' + name + ']');
          if (!el) return;
          el.value = val;
          el.dispatchEvent(new Event('input',  {bubbles:true}));
          el.dispatchEvent(new Event('change', {bubbles:true}));
        }
        set('URL',         url);
        set('TITLE',       title);
        set('DESCRIPTION', description);

        // Select free listing (last radio = "Text Only Listing - Free")
        var radios = document.querySelectorAll('input[type=radio]');
        if (radios.length) radios[radios.length - 1].click();

        // Pick best matching category
        var sel = document.querySelector('[name=CATEGORY]');
        if (sel) {
          var opt = Array.from(sel.options).find(function(o) {
            return /science|tools|education|utilities/i.test(o.text);
          });
          if (!opt) opt = Array.from(sel.options).find(function(o) { return o.value && o.value !== ''; });
          if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event('change', {bubbles:true})); }
        }

        // Submit the form that contains the URL field
        var form = document.querySelector('input[name=URL]') &&
                   document.querySelector('input[name=URL]').closest('form');
        if (!form) {
          var forms = document.querySelectorAll('form');
          form = forms[forms.length - 1];
        }
        var btn = form && form.querySelector('input[type=submit], button[type=submit]');
        if (btn) { btn.click(); return 'submitted'; }
        if (form) { try { form.requestSubmit(); } catch(e) { form.submit(); } return 'submitted'; }
        return 'no-form';
      })(${JSON.stringify(product.url)}, ${JSON.stringify(product.name)}, ${JSON.stringify(desc)}, ${JSON.stringify(creds.username)})`;

      // ── Step 1: Try submit page directly (checks login + fills form in one eval) ──
      console.log('  📄 Opening submission form...');
      await page.goto(SUBMIT_URL);
      await delay(8000); // extra wait — Viesearch is heavy
      await page.screenshot(`${screenshotDir}/viesearch-submit-page.png`).catch(() => {});

      // ONE eval: check if logged in; if so, fill and submit immediately
      let phase1Result = '';
      try {
        phase1Result = await page.evalRun(`(function() {
          var owner = document.querySelector('[name=OWNER_USERNAME]') &&
                      document.querySelector('[name=OWNER_USERNAME]').value || '';
          if (owner !== ${JSON.stringify(creds.username)}) return 'NOT_SIGNED_IN';
          return ${FILL_AND_SUBMIT_JS};
        })()`);
      } catch (e) {
        if (!/timed out|timeout/i.test(e.message)) throw e;
        console.log('  ⚠️  Submit page eval timed out — will retry via sign-in');
        phase1Result = 'NOT_SIGNED_IN';
      }

      if (phase1Result === 'submitted') {
        console.log('  ✅ Already signed in — form submitted!');
        await delay(8000);
        await page.screenshot(`${screenshotDir}/viesearch-result-${ts()}.png`).catch(() => {});
        let finalUrl = ''; try { finalUrl = page.url(); } catch {}
        return { url: finalUrl || SUBMIT_URL, confirmation: 'Viesearch site submitted — awaiting review' };
      }

      // ── Step 2: Sign in (batched credentials fill + submit in ONE eval) ────
      console.log('  🔐 Signing in...');
      await page.goto(SIGNIN_URL);
      await delay(5000);

      // ONE eval: fill username + password + click sign-in button
      try {
        await page.evalRun(`(function() {
          function set(name, val) {
            var el = document.querySelector('[name=' + name + ']');
            if (!el) return;
            el.value = val;
            el.dispatchEvent(new Event('input',  {bubbles:true}));
            el.dispatchEvent(new Event('change', {bubbles:true}));
          }
          set('login_username', ${JSON.stringify(creds.username)});
          set('login_password', ${JSON.stringify(creds.password)});
          var form = document.querySelector('form[method=post]') || document.querySelector('form');
          var btn = form && form.querySelector('input[type=submit], button[type=submit]');
          if (btn) btn.click();
        })()`);
      } catch (e) {
        if (!/timed out|timeout/i.test(e.message)) throw e;
        // Timeout on form submit is OK — Chrome may still be processing
      }
      await delay(6000);
      await page.screenshot(`${screenshotDir}/viesearch-signin-attempt.png`).catch(() => {});

      // ONE eval on landing page: check if sign-in succeeded
      let signinOk = false;
      try {
        const bodyHtml = await page.evalRun('document.body.innerHTML');
        signinOk = bodyHtml.includes(creds.username);
      } catch {}
      if (!signinOk) {
        // url() check as fallback
        try { const u = page.url(); signinOk = u.includes('viesearch.com') && !u.includes('/signin'); } catch {}
      }

      // ── Step 3: Email verification + re-register (if sign-in failed) ───────
      if (!signinOk) {
        console.log('  ℹ️  Sign-in failed — will register new account via browser');
        const reg = await browserRegister(page, {
          username: creds.username, password: creds.password,
          email: regEmail, displayName, screenshotDir,
        });
        if (!reg.ok && !reg.autoSignedIn) {
          console.log(`  ⚠️  Registration: ${reg.reason}`);
        } else {
          console.log('  ✅ Registered!');
        }

        // Email verification via IMAP
        const gmailCreds = config.credentials?.gmail;
        if (gmailCreds?.app_password) {
          console.log('  📧 Requesting verification email...');
          await httpResend(regEmail);
          await delay(2000);
          try {
            console.log('  ⏳ Waiting for verification email (up to 60s)...');
            const verifyLink = await waitForVerificationLink({
              email: product.email, appPassword: gmailCreds.app_password,
              fromFilter: 'viesearch', linkPattern: /https?:\/\/viesearch\.com\/confirm\/[a-f0-9]+/gi,
              timeoutMs: 60000, pollMs: 8000, searchWindowMs: 5 * 60 * 1000,
            });
            console.log('  🔗 Confirming verification link...');
            const vr = await fetch(verifyLink, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0' } });
            console.log(`  ✅ Email verified! (status ${vr.status})`);
          } catch (e) {
            if (!/timed out/i.test(e.message)) throw e;
            console.log('  ℹ️  No new verification email — continuing...');
          }
        }

        // Sign in again after verification (ONE batched eval)
        console.log('  🔐 Signing in after verification...');
        await page.goto(SIGNIN_URL);
        await delay(5000);
        try {
          await page.evalRun(`(function() {
            function set(name, val) {
              var el = document.querySelector('[name=' + name + ']');
              if (!el) return;
              el.value = val;
              el.dispatchEvent(new Event('input',  {bubbles:true}));
              el.dispatchEvent(new Event('change', {bubbles:true}));
            }
            set('login_username', ${JSON.stringify(creds.username)});
            set('login_password', ${JSON.stringify(creds.password)});
            var form = document.querySelector('form[method=post]') || document.querySelector('form');
            var btn = form && form.querySelector('input[type=submit], button[type=submit]');
            if (btn) btn.click();
          })()`);
        } catch (e) {
          if (!/timed out|timeout/i.test(e.message)) throw e;
        }
        await delay(6000);
        await page.screenshot(`${screenshotDir}/viesearch-signin-result.png`).catch(() => {});

        let afterHtml = '';
        try { afterHtml = await page.evalRun('document.body.innerHTML'); } catch {}
        const signedInOk = afterHtml.includes(creds.username);
        if (!signedInOk) throw new Error('Sign-in failed — check credentials or verify email manually');
        console.log('  ✅ Signed in!');
      } else {
        console.log('  ✅ Signed in!');
      }

      // ── Step 4: Submit page — ONE eval: fill all fields + submit ───────────
      console.log('  📄 Opening submission form...');
      await page.goto(SUBMIT_URL);
      await delay(8000);

      console.log('  🚀 Filling form and submitting...');
      let submitResult = 'unknown';
      try {
        submitResult = await page.evalRun(FILL_AND_SUBMIT_JS);
      } catch (e) {
        if (!/timed out|timeout/i.test(e.message)) throw e;
        console.log('  ⚠️  Submit eval timed out — Chrome may still be processing...');
        submitResult = 'timeout-may-ok';
      }
      console.log(`  📋 Submit result: ${submitResult}`);
      await delay(8000);

      await page.screenshot(`${screenshotDir}/viesearch-result-${ts()}.png`).catch(() => {});
      let finalUrl = ''; try { finalUrl = page.url(); } catch {}
      return {
        url: finalUrl || SUBMIT_URL,
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
