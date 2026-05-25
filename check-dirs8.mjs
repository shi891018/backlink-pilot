#!/usr/bin/env node
// Round 8 - more AI directories
const urls = [
  ['allthingsai.com', 'https://allthingsai.com/submit'],
  ['theresanaiforthat', 'https://theresanaiforthat.com/request/'],
  ['toolslist.ai', 'https://toolslist.ai/submit'],
  ['aicollection.com', 'https://aicollection.com/submit/'],
  ['aizone.tools', 'https://aizone.tools/submit'],
  ['ai-finder.io', 'https://ai-finder.io/submit'],
  ['aiwizard.ai', 'https://www.aiwizard.ai/submit-ai-tool'],
  ['topai.tools', 'https://topai.tools/submit'],
  ['futurpedia.io', 'https://www.futurpedia.io/submit-tool'],
  ['aitoptools.com', 'https://aitoptools.com/submit-tool/'],
  ['ainewsletters.com', 'https://www.ainewsletters.com/'],
  ['allaitools.co', 'https://allaitools.co/submit-ai-tool'],
  ['toolpilot.ai', 'https://www.toolpilot.ai/'],
  ['bestaitools.net', 'https://bestaitools.net/submit/'],
  ['aibybusiness.com', 'https://aibybusiness.com/submit/'],
];
for(const [name, url] of urls){
  try{
    const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(8000), redirect:'follow'});
    const html = await r.text();
    const hasCF7 = /wpcf7|contact-form-7/i.test(html);
    const forms = (html.match(/<form/gi)||[]).length;
    const captcha = /(captcha|recaptcha|turnstile|hcaptcha)/i.test(html);
    const login = /(sign.in|log.in|account|oauth)/i.test(html.substring(0,2000));
    const paid = /(\$[0-9]|fee|payment)/i.test(html.substring(0,2000));
    const marker = hasCF7 ? '🟡CF7' : (forms>0 ? '🟢form' : '🔴none');
    console.log(name.padEnd(25), marker, 'HTTP:'+r.status, 'cap:'+captcha, 'login:'+login, 'paid:'+paid);
  } catch(e) {
    console.log(name.padEnd(25), '❌ERR:', e.message.substring(0,25));
  }
}
