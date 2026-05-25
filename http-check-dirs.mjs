#!/usr/bin/env node
// http-check-dirs.mjs — static HTTP form check for directory sites
const SITES = [
  ['poweredbyai.app',     'https://poweredbyai.app/submit-tool'],
  ['aitoolsup.com',       'https://aitoolsup.com/submit-tool'],
  ['aitoolguru.com',      'https://aitoolguru.com/'],
  ['aibusinesstool.com',  'https://aibusinesstool.com/'],
  ['Startup AI Tools',    'https://www.startupaitools.com/submit-ai-tools/'],
  ['Future AGI Tools',    'https://www.futureagitools.com/submit'],
  ['AI Valley',           'https://aivalley.ai/submit-tool/'],
  ['AI Directory org',    'https://www.aidirectory.org/user-submit/'],
  ['SaaSBaba',            'https://saasbaba.com/add-ai-tool/'],
  ['AIWikiTools',         'https://aiwikitools.com/submit-a-tool/'],
  ['Ai Business Tool 2',  'https://aibusinesstool.com/submit-tool'],
  ['Dizila',              'https://www.dizila.com/addurl.php'],
  ['01webdir',            'https://www.01webdirectory.com/frmPreSubmit.aspx'],
  ['All Startups',        'http://www.allstartups.info/Startups/Submit'],
  ['The Startup Pitch',   'https://thestartuppitch.com/post-a-pitch/'],
  ['WebsiteHunt submit',  'https://www.websitehunt.co/submit'],
  ['DataTau submit',      'https://datatau.net/submit'],
  ['ToolPilot',           'https://www.toolpilot.ai/pages/submit-your-ai-tool'],
  ['Startup88',           'https://startup88.com/submit'],
];

for (const [name, url] of SITES) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 9000);
  try {
    const r = await fetch(url, {
      signal: ac.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
    });
    const html = await r.text();
    const form   = /<form/i.test(html);
    const cap    = /recaptcha|hcaptcha|turnstile/i.test(html);
    const hasUrl = /name=["'](url|website|link|toolurl|siteurl|tool_url)/i.test(html) ||
                   /placeholder=["'][^"']*https?/i.test(html);
    const login  = /login required|must be logged|sign in to/i.test(html);
    const dead   = /domain.*sale|godaddy|parked|for sale/i.test(html.substring(0, 2000));
    const tag = [
      r.status,
      form   ? 'FORM'    : 'no-form',
      hasUrl ? 'url✓'   : '',
      cap    ? 'CAPTCHA' : 'clean',
      login  ? 'LOGIN'   : '',
      dead   ? '💀DEAD'  : '',
    ].filter(Boolean).join(' ');
    console.log(name.padEnd(22), tag);
  } catch (e) {
    console.log(name.padEnd(22), 'ERR:', e.message.substring(0, 50));
  } finally { clearTimeout(t); }
  await new Promise(r => setTimeout(r, 300));
}
