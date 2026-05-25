#!/usr/bin/env node
// Check more diverse backlink sources
const checks = [
  ['F6S', 'https://www.f6s.com/'],
  ['Slashdot Submit', 'https://slashdot.org/submission'],
  ['DevPost', 'https://devpost.com/'],
  ['Lobsters', 'https://lobste.rs/'],
  ['GrowthRocks', 'https://growthrocks.com/submit/'],
  ['SideProjectors', 'https://www.sideprojectors.com/'],
  ['MarketingFox', 'https://marketingfox.io/submit/'],
  ['MassivePenguins', 'https://massivepenguins.com/'],
  ['StackShare', 'https://stackshare.io/'],
  ['Slant', 'https://www.slant.co/'],
];
for(const [name, url] of checks){
  try{
    const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(8000)});
    const html = await r.text();
    const forms = (html.match(/<form/gi)||[]).length;
    const login = /(sign.in|log.in|register|oauth)/i.test(html.substring(0,3000));
    const captcha = /(captcha|recaptcha|turnstile)/i.test(html);
    console.log(name.padEnd(20), 'HTTP:'+r.status, 'forms:'+forms, 'login:'+login, 'cap:'+captcha);
  } catch(e) {
    console.log(name.padEnd(20), 'ERR:', e.message.substring(0,35));
  }
}
