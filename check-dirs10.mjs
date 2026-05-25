#!/usr/bin/env node
// Check sites using Tally forms (can be submitted via API)
const urls = [
  ['newtools.fyi', 'https://newtools.fyi/submit'],
  ['toolsAI.net', 'https://toolsai.net/add-listing/'],
  ['aibase.com', 'https://www.aibase.com/'],
  ['aigc.cn', 'https://www.aigc.cn/'],
  ['toolnerve.com', 'https://toolnerve.com/submit'],
  ['aicyclopedia.com', 'https://aicyclopedia.com/submit'],
  ['getinference.com', 'https://getinference.com/submit'],
  ['unitedsoftwareguild.com', 'https://unitedsoftwareguild.com/submit/'],
  ['producthunt.com submit', 'https://www.producthunt.com/posts/new'],
  ['betabound.com', 'https://www.betabound.com/announce/'],
  ['erlibird.com', 'https://erlibird.com/beta-testing/'],
  ['startupbuffer.com', 'https://startupbuffer.com/'],
  ['betapage.co', 'https://betapage.co/'],
  ['killerstartups.com', 'https://www.killerstartups.com/submit-startup/'],
];
for(const [name, url] of urls){
  try{
    const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(8000), redirect:'follow'});
    const html = await r.text();
    const forms = (html.match(/<form/gi)||[]).length;
    const hasTally = /tally\.so/i.test(html);
    const captcha = /(captcha|recaptcha|turnstile)/i.test(html);
    const login = /(sign.in|log.in|register|oauth)/i.test(html.substring(0,2000));
    const paid = /(\$[0-9]+|fee|payment|paid)/i.test(html.substring(0,2000));
    const marker = hasTally ? '🟡tally' : (forms>0 ? '🟢form' : '🔴none');
    console.log(name.padEnd(25), marker, 'HTTP:'+r.status, 'cap:'+captcha, 'login:'+login, 'paid:'+paid);
  } catch(e) {
    console.log(name.padEnd(25), '❌ ERR:', e.message.substring(0,25));
  }
}
