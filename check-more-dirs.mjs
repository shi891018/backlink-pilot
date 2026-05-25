#!/usr/bin/env node
// Check more classic free directories
const urls = [
  ['w3catalog.com', 'https://www.w3catalog.com/submitsite.php'],
  ['ourdirectory.info', 'https://www.ourdirectory.info/submit.php'],
  ['bestwebdirectory.info', 'https://www.bestwebdirectory.info/submit.php'],
  ['searchportal.info', 'https://www.searchportal.info/submit-url/'],
  ['generalweb.info', 'https://www.generalweb.info/submit.php'],
  ['SonicRun', 'https://www.sonicrun.com/freelisting.html'],
  ['linkcentre.com', 'https://www.linkcentre.com/submitlink.php'],
  ['ukdirectory.net', 'https://www.ukdirectory.net/submit.php'],
  ['directory3.org', 'https://www.directory3.org/submitsite.php'],
  ['directorydirect.net', 'https://directorydirect.net/submit.php'],
  ['alivelinks.com', 'https://www.alivelinks.com/submit.php'],
  ['linkmio.com', 'https://www.linkmio.com/submit.php'],
  ['thecreativefinder.com', 'https://www.thecreativefinder.com/addlisting'],
  ['scoop.it', 'https://www.scoop.it/'],
  ['startupstash.com', 'https://startupstash.com/add-resources/'],
];
for(const [name, url] of urls){
  try{
    const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(8000), redirect:'follow'});
    const html = await r.text();
    const forms = (html.match(/<form/gi)||[]).length;
    const hasURL = /(name="url"|name="siteurl"|name="website"|name="link"|type="url")/i.test(html);
    const captcha = /(captcha|recaptcha|turnstile|hcaptcha)/i.test(html);
    const paid = /(fee|price|payment|paid|upgrade|premium|\$[0-9])/i.test(html.substring(0,3000));
    console.log(name.padEnd(25), 'HTTP:'+r.status, 'forms:'+forms, 'url:'+hasURL, 'cap:'+captcha, 'paid:'+paid);
  } catch(e) {
    console.log(name.padEnd(25), 'ERR:', e.message.substring(0,40));
  }
}
