#!/usr/bin/env node
// check-dirs.mjs — pre-flight check for pending directory sites
const SITES = [
  ['KillerStartups',  'https://www.killerstartups.com/submit-startup/'],
  ['TechPluto',       'https://www.techpluto.com/submit-a-startup/'],
  ['Dizila',          'https://www.dizila.com/submit'],
  ['247WebDir',       'https://www.247webdirectory.com/'],
  ['ABC Directory',   'https://www.abc-directory.com/submiturl'],
  ['ToolPilot',       'https://www.toolpilot.ai/pages/submit-your-ai-tool'],
  ['ToolsAI',         'https://toolsai.net/add-listing/'],
  ['Gate2AI',         'https://www.gate2ai.com/zh-cn/submit-tool'],
  ['StartupBase',     'https://startupbase.io/submit'],
  ['AI Warehouse',    'https://www.thewarehouse.ai/product-submission'],
  ['InterestedInAI',  'https://www.interestedinai.com/submit-tool'],
  ['OpenFuture AI',   'https://openfuture.ai/zh/submit-tool'],
  ['business-sw',     'https://www.business-software.com/add-your-product/'],
  ['techdirectory',   'https://www.techdirectory.io/get-listed'],
];

for (const [name, url] of SITES) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 10000);
  try {
    const r = await fetch(url, {
      signal: ac.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
    });
    const html = await r.text();
    const hasForm = /<form/i.test(html);
    const hasCap  = /recaptcha|hcaptcha|turnstile/i.test(html);
    const inputs  = (html.match(/type=["'](text|email|url)/gi) || []).length;
    const hasUrl  = /name=["'](url|website|link|siteurl)/i.test(html);
    const login   = /login required|sign in|must be logged|please log/i.test(html);
    const parts = [
      String(r.status),
      hasForm  ? 'FORM'     : 'no-form',
      inputs + 'inp',
      hasUrl   ? 'url✓'    : '',
      hasCap   ? 'CAPTCHA' : 'clean',
      login    ? 'LOGIN'   : '',
    ].filter(Boolean);
    console.log(name.padEnd(18), parts.join(' '));
  } catch (e) {
    console.log(name.padEnd(18), 'ERR:', e.message.substring(0, 60));
  } finally { clearTimeout(timer); }
  await new Promise(r => setTimeout(r, 400));
}
