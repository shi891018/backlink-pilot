import https from 'https';
import { URL } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120', ...headers },
      secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT,
    };
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
    req.end();
  });
}

const r = await httpsGet('https://webkit.dti.ne.jp/bbs/write.do?cmd=write_form&userid=mariko&bbsid=bbs&page=1', {
  Referer: 'https://webkit.dti.ne.jp/bbs/list.do?userid=mariko&bbsid=bbs'
});
console.log('Status:', r.status);
const m = r.body.match(/name="xcode"\s+value="(\d+)"/);
console.log('xcode:', m ? m[1] : 'NOT FOUND');
console.log('first 500:', r.body.substring(0, 500));
