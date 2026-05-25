#!/usr/bin/env node
// Check free press release sites
const urls = [
  ['PRLog', 'https://www.prlog.org/submit/'],
  ['PR.com', 'https://www.pr.com/'],
  ['PRFire', 'https://www.prfire.co.uk/'],
  ['Free-Press-Release', 'https://www.free-press-release.com/'],
  ['PRBuzz', 'https://www.prbuzz.com/'],
  ['1888PressRelease', 'https://www.1888pressrelease.com/submit/'],
  ['PR Newswire free', 'https://prnewswire.com/'],
  ['OpenPR', 'https://www.openpr.com/'],
  ['BusinessWire', 'https://www.businesswire.com/'],
  ['PRFree', 'https://www.prfree.org/'],
];
for(const [name, url] of urls){
  try{
    const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(8000), redirect:'follow'});
    const html = await r.text();
    const forms = (html.match(/<form/gi)||[]).length;
    const login = /(sign.in|log.in|register|account)/i.test(html.substring(0,2000));
    const paid = /(\$[0-9]+|fee|payment|paid|premium)/i.test(html.substring(0,2000));
    const captcha = /(captcha|recaptcha)/i.test(html);
    console.log(name.padEnd(25), 'HTTP:'+r.status, 'forms:'+forms, 'login:'+login, 'paid:'+paid, 'cap:'+captcha);
  } catch(e) {
    console.log(name.padEnd(25), 'ERR:', e.message.substring(0,30));
  }
}
