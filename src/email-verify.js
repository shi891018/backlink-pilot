// email-verify.js — Read verification emails via Gmail IMAP
// Uses App Password (not regular password); works even with 2FA enabled.
//
// Setup:
//   Google Account → Security → 2-Step Verification → App passwords
//   → Select "Mail" → Generate → copy 16-char password into config.yaml:
//
//   credentials:
//     gmail:
//       app_password: "xxxx xxxx xxxx xxxx"

import { ImapFlow } from 'imapflow';

const IMAP_CONFIG = {
  host: 'imap.gmail.com',
  port: 993,
  secure: true,
};

/**
 * Poll Gmail for a verification email and return the first matching link.
 *
 * @param {object} opts
 * @param {string} opts.email       - Gmail address (e.g. shijm1989@gmail.com)
 * @param {string} opts.appPassword - Gmail App Password (16 chars, spaces ok)
 * @param {string|RegExp} opts.fromFilter  - Sender to search (e.g. "viesearch")
 * @param {string|RegExp} opts.linkPattern - Regex to match the verification link
 * @param {number} [opts.timeoutMs=120000] - How long to wait (ms)
 * @param {number} [opts.pollMs=5000]      - Poll interval (ms)
 * @returns {Promise<string>} - The verification URL
 */
export async function waitForVerificationLink(opts) {
  const {
    email,
    appPassword,
    fromFilter,
    linkPattern,
    timeoutMs = 120000,
    pollMs = 5000,
  } = opts;

  if (!email || !appPassword) {
    throw new Error(
      'Gmail credentials missing.\n' +
      '  Add to config.yaml:\n' +
      '    credentials:\n' +
      '      gmail:\n' +
      '        app_password: "xxxx xxxx xxxx xxxx"'
    );
  }

  const deadline = Date.now() + timeoutMs;
  const searchedSince = new Date(Date.now() - 30 * 60 * 1000); // last 30 min

  console.log(`  📬 Waiting for verification email from "${fromFilter}"...`);

  while (Date.now() < deadline) {
    const link = await checkInbox({ email, appPassword, fromFilter, linkPattern, since: searchedSince });
    if (link) {
      console.log(`  ✉️  Found verification link`);
      return link;
    }
    const remaining = Math.round((deadline - Date.now()) / 1000);
    console.log(`  ⏳ Not found yet, retrying... (${remaining}s remaining)`);
    await new Promise(r => setTimeout(r, pollMs));
  }

  throw new Error(`Timed out waiting for verification email from "${fromFilter}"`);
}

async function checkInbox({ email, appPassword, fromFilter, linkPattern, since }) {
  const client = new ImapFlow({
    host: IMAP_CONFIG.host,
    port: IMAP_CONFIG.port,
    secure: IMAP_CONFIG.secure,
    auth: {
      user: email,
      pass: appPassword.replace(/\s/g, ''), // strip spaces from App Password
    },
    logger: false,
  });

  try {
    await client.connect();
    await client.mailboxOpen('INBOX');

    // Search for recent emails from the sender
    const searchCriteria = { since };
    if (fromFilter) {
      searchCriteria.from = typeof fromFilter === 'string' ? fromFilter : undefined;
    }

    const messages = await client.search(searchCriteria);
    if (!messages.length) return null;

    // Check most recent messages first
    for (const uid of messages.reverse().slice(0, 10)) {
      const msg = await client.fetchOne(uid, { source: true });
      if (!msg?.source) continue;

      const body = msg.source.toString('utf-8');

      // Filter by sender if fromFilter is provided
      if (fromFilter && typeof fromFilter === 'string') {
        if (!body.toLowerCase().includes(fromFilter.toLowerCase())) continue;
      }

      // Extract verification link
      const pattern = linkPattern || /https?:\/\/[^\s"<>]+verif[^\s"<>]*/gi;
      const matches = body.match(pattern);
      if (matches?.length) {
        // Clean up encoded URLs (e.g. =3D → =, line breaks)
        const link = matches[0]
          .replace(/=\r?\n/g, '')  // quoted-printable line continuations
          .replace(/=3D/g, '=');   // quoted-printable =
        return link;
      }
    }

    return null;
  } catch (e) {
    // IMAP errors (bad credentials, network) — rethrow with clearer message
    if (e.message?.includes('Invalid credentials') || e.message?.includes('AUTHENTICATIONFAILED')) {
      throw new Error(
        'Gmail IMAP authentication failed.\n' +
        '  Make sure you used an App Password (not your Google account password).\n' +
        '  Generate one at: https://myaccount.google.com/apppasswords'
      );
    }
    throw e;
  } finally {
    await client.logout().catch(() => {});
  }
}
