#!/usr/bin/env node
// Check more free web directories - round 3
const urls = [
  ['freewebsubmission.com', 'https://freewebsubmission.com/'],
  ['addme.com', 'https://www.addme.com/submission.htm'],
  ['globalpromotion.net', 'https://www.globalpromotion.net/addurl.php'],
  ['ezilon.com', 'https://www.ezilon.com/add_url.shtml'],
  ['lemon.directory', 'https://lemon.directory/submit.php'],
  ['freethesaurus.net', 'https://freethesaurus.net/'],
  ['starting-point.com', 'https://www.starting-point.com/addurl/index.asp'],
  ['add-url-free.com', 'https://www.add-url-free.com/'],
  ['urlm.co.uk', 'https://www.urlm.co.uk/add'],
  ['nicedirectory.net', 'https://www.nicedirectory.net/submit.php'],
  ['9sites.net', 'https://www.9sites.net/freesubmit.php'],
  ['somuch.com', 'https://www.somuch.com/submit/'],
  ['abilogic.com', 'https://www.abilogic.com/add-site.html'],
  ['freedirectory.info', 'https://www.freedirectory.info/submit.php'],
  ['becanada.com', 'https://becanada.com/free-seo-directory-link/'],
];
for(const [name, url] of urls){
  try{
    const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(8000), redirect:'follow'});
    const html = await r.text();
    const forms = (html.match(/<form/gi)||[]).length;
    const hasURL = /(name="url"|name="siteurl"|name="website"|name="link"|type="url")/i.test(html);
    const captcha = /(captcha|recaptcha)/i.test(html);
    const paid = /(\$[0-9]+|fee|payment|upgrade|paid\s+listing)/i.test(html.substring(0,3000));
    console.log(name.padEnd(28), 'HTTP:'+r.status, 'forms:'+forms, 'url:'+hasURL, 'cap:'+captcha, 'paid:'+paid);
  } catch(e) {
    console.log(name.padEnd(28), 'ERR:', e.message.substring(0,35));
  }
}
