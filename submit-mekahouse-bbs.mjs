#!/usr/bin/env node
// Submit Mekahouse BBS (webkit.dti.ne.jp) - the one remaining from targets.yaml
import { execSync } from 'child_process';
import { parse as yamlParse } from 'yaml';
import fs from 'fs';

const config = yamlParse(fs.readFileSync('config.yaml', 'utf8'));
const { product, utm } = config;
const POST_URL = utm?.enabled !== false
  ? `${product.url}?utm_source=webkit-bbs&utm_medium=bbs&utm_campaign=backlink`
  : product.url;

const POST_NAME  = product.name || 'Unit Converter for Science';
const POST_EMAIL = product.email || '';
const POST_TITLE = 'Free Scientific Unit Converter Tool';
const POST_BODY  = `${product.name} - ${product.description}\n\n${POST_URL}`;
const POST_KEY   = 'edit1234';

const board = { userid: 'mekahouse', bbsid: 'mekag' };

// Step 1: GET write form to extract xcode
const writeUrl = `https://webkit.dti.ne.jp/bbs/write.do?cmd=write_form&userid=${board.userid}&bbsid=${board.bbsid}&page=1`;
const r1 = await fetch(writeUrl, {
  headers:{'User-Agent':'Mozilla/5.0 (compatible)','Accept':'text/html'},
  signal: AbortSignal.timeout(15000),
});
// Handle SSL/TLS by checking if we get a response
if(!r1.ok && r1.status !== 200){ console.log('GET failed:', r1.status); process.exit(1); }
const html = await r1.text();
const xcodeMatch = html.match(/name="xcode"\s+value="([^"]+)"/i);
const xcode = xcodeMatch?.[1];
console.log('xcode:', xcode ? xcode.substring(0,20) : 'NOT FOUND');
if(!xcode){ 
  console.log('Cannot find xcode. HTML snippet:', html.substring(0,300));
  process.exit(1);
}

// Step 2: POST submission
const fd = new URLSearchParams({
  userid: board.userid,
  bbsid: board.bbsid,
  cmd: 'write_confirm',
  name: POST_NAME,
  email: POST_EMAIL,
  title: POST_TITLE,
  body: POST_BODY,
  key: POST_KEY,
  xcode: xcode,
});

const r2 = await fetch('https://webkit.dti.ne.jp/bbs/write.do', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (compatible)',
    'Referer': writeUrl,
  },
  body: fd.toString(),
  signal: AbortSignal.timeout(15000),
});
const body2 = await r2.text();
const text = body2.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const success = /(ご投稿|投稿され|thank|success|書き込み)/i.test(body2);
console.log('HTTP:', r2.status, '| success:', success);
console.log('Response (300):', text.substring(0,300));
