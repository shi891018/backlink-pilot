#!/usr/bin/env node
// Find AI tool directories using CF7 (no captcha, direct API)
const urls = [
  ['opentools.ai', 'https://opentools.ai/submit'],
  ['topaitools.net', 'https://topaitools.net/submit-tool/'],
  ['aitoolsguide.com', 'https://www.aitoolsguide.com/submit/'],
  ['aiforeducation.io', 'https://aiforeducation.io/submit-tool/'],
  ['aitools.fyi', 'https://aitools.fyi/submit-a-tool'],
  ['aicenter.io', 'https://aicenter.io/submit-tool/'],
  ['aisoftwarelist.com', 'https://www.aisoftwarelist.com/submit/'],
  ['aitoolsup.com', 'https://aitoolsup.com/submit-tool/'],
  ['aitoolguru.com', 'https://aitoolguru.com/submit-ai-tool/'],
  ['allthetoolsai.com', 'https://allthetoolsai.com/submit-tool/'],
  ['insidr.ai', 'https://www.insidr.ai/submit-tools/'],
  ['aistage.net', 'https://aistage.net/submit'],
  ['therundown.ai', 'https://supertools.therundown.ai/submit'],
  ['aicenter.tools', 'https://www.aicenter.tools/submit'],
  ['aitoolbox.cc', 'https://aitoolbox.cc/submit-tool/'],
];
for(const [name, url] of urls){
  try{
    const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(8000), redirect:'follow'});
    const html = await r.text();
    const hasCF7 = /wpcf7|contact-form-7/i.test(html);
    const forms = (html.match(/<form/gi)||[]).length;
    const captcha = /(captcha|recaptcha|turnstile|hcaptcha)/i.test(html);
    const login = /(sign.in|log.in|auth|account.required)/i.test(html.substring(0,2000));
    console.log(name.padEnd(25), 'HTTP:'+r.status, 'CF7:'+hasCF7, 'forms:'+forms, 'cap:'+captcha, 'login:'+login);
  } catch(e) {
    console.log(name.padEnd(25), 'ERR:', e.message.substring(0,30));
  }
}
