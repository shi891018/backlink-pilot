// viesearch.js — Viesearch adapter
// Flow: register account → auto-verify email via Gmail IMAP → submit site
// Requires config.credentials.viesearch.{username, password}
// Requires config.credentials.gmail.app_password  (for email verification)

import { withBrowser, delay } from '../browser.js';
import { waitForVerificationLink } from '../email-verify.js';

const SUBMIT_URL = 'https://viesearch.com/submit';
const JOIN_URL = 'https://viesearch.com/join';
const SIGNIN_URL = 'https://viesearch.com/signin';

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

    return withBrowser({ ...config, _engine: 'bb' }, async ({ page }) => {
      // Step 1: Try to sign in first (account may already exist)
      console.log('  🔐 Attempting sign in...');
      await page.goto(SIGNIN_URL);
      await delay(2000);

      const signinSnap = await page.snapshot();
      const signinFields = parseFields(signinSnap);

      let signedIn = false;
      if (signinFields.username && signinFields.password) {
        await page.fill(signinFields.username, creds.username);
        await delay(300);
        await page.fill(signinFields.password, creds.password);
        await delay(300);
        if (signinFields.submit) {
          await page.click(signinFields.submit);
          await delay(3000);
        }
        // Check if login succeeded (no longer on signin page)
        const currentUrl = page.url();
        if (!currentUrl.includes('/signin') && !currentUrl.includes('/join')) {
          signedIn = true;
          console.log('  ✅ Signed in successfully');
        } else {
          console.log('  ℹ️  Sign in failed — will attempt registration');
        }
      }

      // Step 2: Register if not signed in
      if (!signedIn) {
        console.log('  📝 Registering new account...');
        await page.goto(JOIN_URL);
        await delay(2000);

        const joinSnap = await page.snapshot();
        const joinFields = parseJoinFields(joinSnap);

        if (!joinFields.username) {
          throw new Error('Could not find Viesearch registration form fields');
        }

        await page.fill(joinFields.username, creds.username);
        await delay(300);
        await page.fill(joinFields.password, creds.password);
        await delay(300);
        if (joinFields.passwordConfirm) {
          await page.fill(joinFields.passwordConfirm, creds.password);
          await delay(300);
        }
        if (joinFields.name) {
          await page.fill(joinFields.name, creds.username);
          await delay(300);
        }
        if (joinFields.email) {
          await page.fill(joinFields.email, product.email);
          await delay(300);
        }
        if (joinFields.about) {
          await page.fill(joinFields.about, product.description || '');
          await delay(300);
        }
        // Accept terms — use JavaScript eval since bb-browser click doesn't reliably toggle checkboxes
        if (joinFields.terms) {
          await page._bb('eval',
            `(function(){var el=document.querySelector('[name="join_terms"]');` +
            `if(el){el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));}})()` 
          );
          await delay(500);
        }

        // Screenshot before submitting registration
        try {
          const screenshotDir = config.browser?.screenshot_dir || './screenshots';
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          await page.screenshot(`${screenshotDir}/viesearch-register-${ts}.png`);
        } catch {}

        if (joinFields.submit) {
          console.log('  🚀 Submitting registration...');
          await page.click(joinFields.submit);
          await delay(4000);
        }

        const afterReg = page.url();
        if (afterReg.includes('/join') || afterReg.includes('error')) {
          throw new Error('Registration may have failed — check screenshot');
        }
        console.log('  ✅ Registration submitted — waiting for verification email...');

        // Step 2b: Trigger resend via /resend page (handles rate-limited or duplicate-email cases)
        try {
          console.log('  📧 Requesting verification email via /resend...');
          await page.goto('https://viesearch.com/resend');
          await delay(2000);
          const resendSnap = await page.snapshot();
          const resendInputLine = resendSnap.split('\n').find(l => /resend_for/i.test(l));
          const resendBtnLine  = resendSnap.split('\n').find(l => /button.*send.it/i.test(l));
          const inputRef = resendInputLine?.match(/\[ref=(\d+)\]/)?.[1];
          const btnRef   = resendBtnLine?.match(/\[ref=(\d+)\]/)?.[1];
          if (inputRef && btnRef) {
            await page.fill(`@${inputRef}`, product.email);
            await delay(500);
            await page.click(`@${btnRef}`);
            await delay(2000);
            console.log('  ✉️  Resend request submitted');
          }
        } catch (e) {
          console.log('  ⚠️  Resend step failed:', e.message);
        }

        // Step 2c: Auto-verify email via Gmail IMAP
        const gmailCreds = config.credentials?.gmail;
        if (gmailCreds?.app_password) {
          const verifyLink = await waitForVerificationLink({
            email: product.email,
            appPassword: gmailCreds.app_password,
            fromFilter: 'viesearch',
            linkPattern: /https?:\/\/viesearch\.com\/[^\s"<>\r\n]+/gi,
            timeoutMs: 300000,
            pollMs: 8000,
          });
          console.log('  🔗 Clicking verification link...');
          await page.goto(verifyLink);
          await delay(3000);
          console.log('  ✅ Email verified!');
        } else {
          console.log('  ⚠️  No Gmail App Password in config — skipping auto-verify.');
          console.log('     Add credentials.gmail.app_password to config.yaml to enable auto-verify.');
          console.log('     Continuing anyway (submission may fail if verification required)...');
        }
      }

      // Step 3: Submit site
      console.log('  📄 Opening submission form...');
      await page.goto(SUBMIT_URL);
      await delay(2500);

      const submitSnap = await page.snapshot();
      const submitFields = parseSubmitFields(submitSnap);

      if (!submitFields.url && !submitFields.title) {
        throw new Error('Could not find Viesearch site submission form (may need email verification first)');
      }

      if (submitFields.ownerName) {
        await page.fill(submitFields.ownerName, creds.username);
        await delay(300);
      }
      if (submitFields.ownerEmail) {
        await page.fill(submitFields.ownerEmail, product.email);
        await delay(300);
      }
      if (submitFields.title) {
        await page.fill(submitFields.title, product.name);
        await delay(300);
      }
      if (submitFields.description) {
        await page.fill(submitFields.description, product.description || product.long_description || '');
        await delay(300);
      }
      if (submitFields.url) {
        await page.fill(submitFields.url, product.url);
        await delay(300);
      }

      // Screenshot before submit
      try {
        const screenshotDir = config.browser?.screenshot_dir || './screenshots';
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        await page.screenshot(`${screenshotDir}/viesearch-submit-${ts}.png`);
      } catch {}

      if (submitFields.submit) {
        console.log('  🚀 Submitting site...');
        // Re-snapshot to get fresh refs after form fills (page may have re-rendered)
        const freshSnap = await page.snapshot();
        const freshFields = parseSubmitFields(freshSnap);
        const submitRef = freshFields.submit || submitFields.submit;
        await page.click(submitRef);
        await delay(3000);
      }

      const finalUrl = page.url();
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

function parseJoinFields(snapshot) {
  const fields = {
    username: null, password: null, passwordConfirm: null,
    name: null, email: null, about: null, terms: null, submit: null,
  };
  for (const line of snapshot.split('\n')) {
    const m = line.match(/^\s*(\w+)\s+\[ref=(\d+)\]\s*"?([^"]*)"?/);
    if (!m) continue;
    const [, role, ref, label] = m;
    const r = `@${ref}`;
    const l = label.toLowerCase();
    if (role === 'textbox') {
      if (l.includes('join_username') || (!fields.username && /^username/.test(l))) fields.username = r;
      else if (l === 'join_password' || l === 'join_password_confirm') {
        if (!fields.password) fields.password = r;
        else if (!fields.passwordConfirm) fields.passwordConfirm = r;
      } else if (l.includes('join_name') || (!fields.name && /^(name|full.?name)/.test(l))) fields.name = r;
      else if (l.includes('join_email') || (!fields.email && /email/.test(l))) fields.email = r;
      else if (l.includes('join_about') || (!fields.about && /about/.test(l))) fields.about = r;
    }
    if (role === 'checkbox' && /terms/i.test(l)) fields.terms = r;
    if (role === 'button' && /join|register|sign.?up|submit/i.test(l)) fields.submit = r;
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
