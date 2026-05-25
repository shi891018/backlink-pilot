#!/usr/bin/env node
// Check more niche directories - round 7
const urls = [
  ['Curlie.org', 'https://curlie.org/'],
  ['FreeWebLinks.net', 'https://www.freeweblinks.net/submit.php'],
  ['DirectoryCritic', 'https://www.directorycritic.com/submit.php'],
  ['whasup.net', 'https://www.whasup.net/add-url.html'],
  ['webworldindex.com', 'https://webworldindex.com/submit.php'],
  ['topsitessearch.com', 'https://www.topsitessearch.com/add-site.html'],
  ['botid.org', 'https://www.botid.org/submit.html'],
  ['gainweb.org', 'https://www.gainweb.org/submitsite.php'],
  ['lkqs.com', 'https://www.lkqs.com/add.php'],
  ['dizzyweb.com', 'https://www.dizzyweb.com/submit.php'],
  ['bhanvad.com', 'https://bhanvad.com/submit.php'],
  ['bedwan.com', 'https://bedwan.com/submit.php'],
  ['place123.net', 'https://www.place123.net/addsite.php'],
  ['seofriendly.net', 'https://seofriendly.net/submit.php'],
  ['siteswebdirectory.com', 'https://www.siteswebdirectory.com/submit.php'],
];
for(const [name, url] of urls){
  try{
    const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(8000), redirect:'follow'});
    const html = await r.text();
    const forms = (html.match(/<form/gi)||[]).length;
    const hasURL = /(name="url"|name="siteurl"|name="website"|name="link"|type="url")/i.test(html);
    const captcha = /(captcha|recaptcha)/i.test(html);
    const paid = /(\$[0-9]+|fee required|paid only)/i.test(html.substring(0,2000));
    console.log(name.padEnd(25), 'HTTP:'+r.status, 'forms:'+forms, 'url:'+hasURL, 'cap:'+captcha, 'paid:'+paid);
  } catch(e) {
    console.log(name.padEnd(25), 'ERR:', e.message.substring(0,30));
  }
}
