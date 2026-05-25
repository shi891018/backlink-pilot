#!/usr/bin/env node
// Quick check of several remaining untried sites
const sites = [
  'https://humanalternative.com',
  'https://datatau.net',
  'https://openfuture.ai/en/submit-tool',
  'https://paxi.ai/submit',
  'https://www.fullstackai.co/',
  'https://app.therundown.ai/submit',
  'https://www.aitoprank.com/submit',
  'https://aistocks.ai/submit',
  'https://aitools.inc/submit',
  'https://www.toolify.ai/submit',
];
for(const url of sites){
  try{
    const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(6000), redirect:'follow'});
    const html = await r.text();
    const forms = (html.match(/<form/gi)||[]).length;
    const cf7 = /wpcf7-f(\d+)/.exec(html)?.[1];
    const captcha = /(captcha|recaptcha|turnstile)/i.test(html);
    const login = /(sign.in|log.in|oauth)/i.test(html.substring(0,2000));
    console.log(url.substring(8,50).padEnd(42), 'HTTP:'+r.status, 'forms:'+forms, 'CF7:'+cf7, 'cap:'+captcha, 'login:'+login);
  } catch(e) {
    console.log(url.substring(8,50).padEnd(42), 'ERR:', e.message.substring(0,20));
  }
}
