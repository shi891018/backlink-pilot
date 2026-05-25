#!/usr/bin/env node
const urls = [
  'https://www.techdirectory.io/get-listed',
  'https://www.websitehunt.co/',
  'https://www.dizila.com/submit',
  'https://www.toolpilot.ai/pages/submit-your-ai-tool',
  'https://datatau.net/',
  'https://www.killerstartups.com/submit-startup/',
  'https://www.fullstackai.co/submit-a-tool/',
];
for(const url of urls){
  try{
    const r = await fetch(url, {method:'GET', headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(10000)});
    const html = await r.text();
    const forms = (html.match(/<form[^>]*>/gi)||[]).length;
    const captcha = /(captcha|recaptcha|turnstile|hcaptcha)/i.test(html);
    const login = /(login|signin|sign.in)/i.test(html.substring(0,2000));
    const fieldNames = (html.match(/name="([^"]+)"/gi)||[]).slice(0,8).join(' ');
    console.log('---', url);
    console.log('  HTTP:', r.status, '| forms:', forms, '| captcha:', captcha, '| login:', login);
    console.log('  fields:', fieldNames);
  } catch(e) {
    console.log('---', url, 'ERR:', e.message.substring(0,50));
  }
}
