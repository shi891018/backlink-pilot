/**
 * submit-webkit-bbs.mjs
 * Submit a backlink post to webkit.dti.ne.jp BBS boards (DTI Japan).
 *
 * Usage:
 *   node submit-webkit-bbs.mjs                    # submit to all 10 boards
 *   node submit-webkit-bbs.mjs --board mariko/bbs  # submit to one board
 *   node submit-webkit-bbs.mjs --dry-run           # preview only, no actual POST
 *
 * Process for each board:
 *   1. GET the write form page to extract the xcode CSRF token
 *   2. POST the submission with name/email/title/body/xcode fields
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { parse as yamlParse } from 'yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load config ──────────────────────────────────────────────────────────────
const config = yamlParse(fs.readFileSync(join(__dirname, 'config.yaml'), 'utf8'));
const { product, utm } = config;

const POST_URL = utm?.enabled !== false
  ? `${product.url}?utm_source=webkit-bbs&utm_medium=bbs&utm_campaign=backlink`
  : product.url;

// ─── Target boards ────────────────────────────────────────────────────────────
const ALL_BOARDS = [
  { name: 'mariko/bbs',        userid: 'mariko',      bbsid: 'bbs' },
  { name: 'kazuf/001',         userid: 'kazuf',       bbsid: '001' },
  { name: 'apakabar/apakabar', userid: 'apakabar',    bbsid: 'apakabar' },
  { name: 'art-space/artall',  userid: 'art-space',   bbsid: 'artall' },
  { name: 'ookami/1ookami',    userid: 'ookami',      bbsid: '1ookami' },
  { name: 'yanack/567',        userid: 'yanack',      bbsid: '567' },
  { name: 'ozachou/1',         userid: 'ozachou',     bbsid: '1' },
  { name: 'yato/21bbs',        userid: 'yato',        bbsid: '21bbs' },
  { name: 'pony/250',          userid: 'pony',        bbsid: '250' },
  { name: 'jtnews/1',          userid: 'jtnews',      bbsid: '1' },
  { name: 'mekahouse/mekag',   userid: 'mekahouse',   bbsid: 'mekag' },
];

// ─── Message content ──────────────────────────────────────────────────────────
const POST_NAME  = product.name || 'Unit Converter for Science';
const POST_EMAIL = product.email || '';
const POST_TITLE = product.description?.substring(0, 40) || 'Free Scientific Unit Converter';
const POST_BODY  = `${product.name} - ${product.description}\n\n${POST_URL}`;
const POST_KEY   = 'edit1234'; // optional edit key for later deletion

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function listUrl(userid, bbsid) {
  return `https://webkit.dti.ne.jp/bbs/list.do?userid=${userid}&bbsid=${bbsid}`;
}

function writeFormUrl(userid, bbsid) {
  return `https://webkit.dti.ne.jp/bbs/write.do?cmd=write_form&userid=${userid}&bbsid=${bbsid}&page=1`;
}

// ─── curl-based HTTP helpers (Node.js 24 rejects webkit.dti.ne.jp's weak DH SSL)
function curlGet(url, referer) {
  const result = execSync(
    `curl -s -L -k --ssl-no-revoke -H "Referer: ${referer}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120" -H "Accept-Language: ja,en-US;q=0.9" "${url}"`,
    { encoding: 'utf8', timeout: 20000 }
  );
  return result;
}

function curlPost(url, referer, data) {
  // Write URL-encoded POST data to a temp file to avoid Windows shell escaping issues
  const encoded = new URLSearchParams(data).toString();
  const tmpFile = join(__dirname, '.bbs-post-tmp.txt');
  fs.writeFileSync(tmpFile, encoded, 'utf8');
  try {
    const result = execSync(
      `curl -s -L -k --ssl-no-revoke -X POST -H "Referer: ${referer}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120" -H "Accept-Language: ja,en-US;q=0.9" -H "Content-Type: application/x-www-form-urlencoded" --data-binary "@${tmpFile}" "${url}"`,
      { encoding: 'utf8', timeout: 20000 }
    );
    return result;
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

/** Fetch the write form and extract the xcode CSRF token */
async function fetchXcode(userid, bbsid) {
  const formUrl = writeFormUrl(userid, bbsid);
  const html = curlGet(formUrl, listUrl(userid, bbsid));
  const match = html.match(/name="xcode"\s+value="(\d+)"/);
  if (!match) throw new Error('xcode not found in form HTML');
  return match[1];
}

/** Submit a post to a single BBS board */
async function submitBoard(board, dryRun = false) {
  const { name, userid, bbsid } = board;
  console.log(`\n📋 Board: ${name}`);

  let xcode;
  try {
    xcode = await fetchXcode(userid, bbsid);
    console.log(`   ✅ xcode obtained: ${xcode}`);
  } catch (err) {
    console.log(`   ❌ Failed to get xcode: ${err.message}`);
    return { board: name, status: 'failed', error: err.message };
  }

  if (dryRun) {
    console.log(`   🔍 Dry run — would POST: name="${POST_NAME}" title="${POST_TITLE}"`);
    return { board: name, status: 'dry-run' };
  }

  try {
    const postData = {
      cmd:         'write_conf',
      bbsid:       bbsid,
      userid:      userid,
      xcode:       xcode,
      index_to:    '0',
      index_root:  '0',
      name:        POST_NAME,
      mail:        POST_EMAIL,
      title:       POST_TITLE,
      body:        POST_BODY,
      key:         POST_KEY,
    };
    const responseHtml = curlPost('https://webkit.dti.ne.jp/bbs/write.do', writeFormUrl(userid, bbsid), postData);

    // Check for success indicators
    if (responseHtml.includes('list.do') || responseHtml.includes('掲示板') || responseHtml.includes('投稿')) {
      console.log(`   ✅ Posted!`);
      return { board: name, status: 'submitted', url: listUrl(userid, bbsid) };
    } else if (responseHtml.includes('エラー') || responseHtml.includes('error')) {
      const errMsg = responseHtml.match(/エラー[^<]{0,200}/) || responseHtml.match(/error[^<]{0,200}/i);
      console.log(`   ⚠️  Post returned error: ${errMsg?.[0] || 'unknown'}`);
      return { board: name, status: 'error', detail: errMsg?.[0] };
    } else {
      console.log(`   ✅ POST completed`);
      return { board: name, status: 'submitted', url: listUrl(userid, bbsid) };
    }
  } catch (err) {
    console.log(`   ❌ POST failed: ${err.message}`);
    return { board: name, status: 'failed', error: err.message };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dryRun  = args.includes('--dry-run');
  const boardArg = args.find((_, i) => args[i - 1] === '--board');

  const boards = boardArg
    ? ALL_BOARDS.filter(b => b.name === boardArg)
    : ALL_BOARDS;

  if (boards.length === 0) {
    console.error(`Board "${boardArg}" not found. Available boards:`);
    ALL_BOARDS.forEach(b => console.log(`  ${b.name}`));
    process.exit(1);
  }

  console.log(`\n🚀 webkit.dti.ne.jp BBS Submitter`);
  console.log(`   Product: ${POST_NAME}`);
  console.log(`   URL:     ${POST_URL}`);
  console.log(`   Mode:    ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`   Boards:  ${boards.length}`);

  const results = [];
  for (const board of boards) {
    const result = await submitBoard(board, dryRun);
    results.push(result);

    if (!dryRun && board !== boards[boards.length - 1]) {
      const wait = 90_000; // 90s between posts to avoid rate limiting
      console.log(`   ⏳ Waiting ${wait / 1000}s before next board...`);
      await sleep(wait);
    }
  }

  console.log('\n\n── Summary ────────────────────────────────────────');
  results.forEach(r => {
    const icon = r.status === 'submitted' ? '✅' : r.status === 'dry-run' ? '🔍' : '❌';
    console.log(`${icon} ${r.board} — ${r.status}${r.url ? ' → ' + r.url : ''}${r.error ? ' | ' + r.error : ''}`);
  });

  const submitted = results.filter(r => r.status === 'submitted').length;
  const failed    = results.filter(r => r.status === 'failed').length;
  console.log(`\nTotal: ${submitted} submitted, ${failed} failed`);

  // Append to submissions.yaml
  if (!dryRun && submitted > 0) {
    const submissionsPath = join(__dirname, 'submissions.yaml');
    const existing = fs.existsSync(submissionsPath) ? fs.readFileSync(submissionsPath, 'utf8') : 'submissions:\n';
    const timestamp = new Date().toISOString();
    const newEntries = results
      .filter(r => r.status === 'submitted')
      .map(r => `  - site: ${r.url}\n    status: submitted\n    timestamp: ${timestamp}`)
      .join('\n');
    fs.writeFileSync(submissionsPath, existing.trimEnd() + '\n' + newEntries + '\n');
    console.log(`\n📝 Results saved to submissions.yaml`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
