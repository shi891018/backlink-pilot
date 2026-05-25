#!/usr/bin/env node
// Discover more webkit.dti.ne.jp BBS boards by brute-force probing known patterns
// Known boards: mariko, kazuf, apakabar, art-space, ookami, yanack, ozachou, yato, pony, jtnews, mekahouse
// Try: common Japanese userids + ham radio callsigns

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function curlGet(url) {
  try {
    return execSync(
      `curl -s -L -k --ssl-no-revoke --max-time 8 -H "User-Agent: Mozilla/5.0" "${url}"`,
      { encoding: 'utf8', timeout: 12000 }
    );
  } catch { return ''; }
}

// Try various userids with common bbsids
const userids = [
  'hamfes', 'hamclub', 'hamworld', 'javanet', 'densha',
  'nozomi', 'sakura', 'takumi', 'hikaru', 'katsura',
  'ohtani', 'yamada', 'tanaka', 'suzuki', 'watanabe',
  'blue', 'green', 'river', 'ocean', 'mountain',
  'digital', 'pc', 'mac', 'linux', 'programming',
  'cooking', 'anime', 'manga', 'game', 'music',
  'photo', 'travel', 'sports', 'news', 'blog',
];

const bbsids = ['bbs', '1', '001', 'top', 'main', 'free'];

const found = [];
for(const userid of userids){
  for(const bbsid of bbsids.slice(0,2)){ // Only check 'bbs' and '1' for speed
    const url = `https://webkit.dti.ne.jp/bbs/list.do?userid=${userid}&bbsid=${bbsid}`;
    const html = curlGet(url);
    if(!html) continue;
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || '';
    // A valid board will have a title that's not generic error
    if(html.length > 500 && !/Not Found|403|404|Error|エラー|存在しない/.test(title) && title && title !== 'webkit.dti.ne.jp'){
      found.push({userid, bbsid, title: title.substring(0,60)});
      console.log('✅ FOUND:', userid+'/'+bbsid, '→', title.substring(0,60));
    }
  }
}
console.log(`\nFound ${found.length} new boards`);
