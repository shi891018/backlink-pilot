#!/usr/bin/env node
// Check remaining promising directories
const urls = [
  ['StartupRanking', 'https://www.startupranking.com/'],
  ['Changelog', 'https://changelog.com/news/submit'],
  ['AllTopStartups', 'https://alltopstartups.com/submit-startup/'],
  ['GrowthHackers', 'https://growthhackers.com/'],
  ['HackerNews', 'https://news.ycombinator.com/submit'],
  ['IndexNow', 'https://api.indexnow.org/indexnow'],
  ['MicroLaunch', 'https://microlaunch.net/'],
  ['Launched.io', 'https://launched.io/'],
  ['Uneed.best', 'https://www.uneed.best/'],
  ['ProductHunt', 'https://www.producthunt.com/'],
];
for(const [name, url] of urls){
  try{
    const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(8000), redirect:'follow'});
    const html = await r.text();
    const forms = (html.match(/<form/gi)||[]).length;
    const login = /(sign.in|login|oauth|register)/i.test(html.substring(0,3000));
    const captcha = /(captcha|recaptcha|turnstile)/i.test(html);
    console.log(name.padEnd(20), 'HTTP:'+r.status, 'forms:'+forms, 'login:'+login, 'cap:'+captcha);
  } catch(e) {
    console.log(name.padEnd(20), 'ERR:', e.message.substring(0,40));
  }
}
