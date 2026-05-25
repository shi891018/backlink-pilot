#!/usr/bin/env node
// Classic web directory form check
const urls = [
  'https://www.exactseek.com/add.html',
  'https://www.cipinet.com/submitmysite.html',
  'https://www.skaffe.com/addsite.php',
  'https://www.elitesitesdirectory.com/submit-a-site/',
  'https://www.freewebdirectory.net/submit.php',
  'https://a1webdirectory.org/submit.php',
  'https://www.sitepromotiondirectory.com/submit.php',
  'https://www.submissionwebdirectory.com/submit.php',
  'https://homedirectorylist.com/submit.php',
  'https://www.directoryworld.net/submit.php',
  'https://www.avivadirectory.com/submit.php',
  'https://www.happal.com/add.php',
  'https://www.99weblinks.com/add-url.html',
  'https://www.gimpsy.com/',
  'https://www.alistdirectory.com/submit.php',
];
for(const url of urls){
  try{
    const r = await fetch(url, {method:'GET', headers:{'User-Agent':'Mozilla/5.0 (compatible; Googlebot/2.1)'}, signal:AbortSignal.timeout(8000), redirect:'follow'});
    const html = await r.text();
    const forms = (html.match(/<form/gi)||[]).length;
    const urlInput = /(name="url"|name="siteurl"|name="website"|type="url")/i.test(html);
    const captcha = /(captcha|recaptcha)/i.test(html);
    console.log(url.replace('https://','').replace('http://','').substring(0,50).padEnd(50), 'HTTP:'+r.status, 'forms:'+forms, 'url:'+urlInput, 'cap:'+captcha);
  } catch(e) {
    console.log(url.replace('https://','').replace('http://','').substring(0,50).padEnd(50), 'ERR:'+e.message.substring(0,30));
  }
}
