#!/usr/bin/env node
// Check FreeWebSubmission partner search engines for direct submission
const urls = [
  ['Anoox', 'https://www.anoox.com/my/register.php'],
  ['Portelo', 'https://portelo.com/add'],
  ['SearchThis', 'https://www.searchthis.com/add/'],
  ['SitesOnDisplay', 'https://www.sitesonDisplay.com/add/'],
  ['Amidalla', 'https://www.amidalla.de/add_url.htm'],
  ['SecretSELabs', 'https://www.secretselabs.com/'],
  ['Entireweb', 'https://www.entireweb.com/free_submission/'],
  ['ExactSeek', 'https://www.exactseek.com/add.html'],
  ['SearchSight', 'https://www.searchsight.com/submit/'],
  ['SpeedySearch', 'https://speedysearch.com/submit/'],
];
for(const [name, url] of urls){
  try{
    const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(8000), redirect:'follow'});
    const html = await r.text();
    const forms = (html.match(/<form/gi)||[]).length;
    const hasURL = /(name="url"|name="siteurl"|name="website"|type="url")/i.test(html);
    const captcha = /(captcha|recaptcha)/i.test(html);
    console.log(name.padEnd(20), 'HTTP:'+r.status, 'forms:'+forms, 'url:'+hasURL, 'cap:'+captcha);
  } catch(e) {
    console.log(name.padEnd(20), 'ERR:', e.message.substring(0,35));
  }
}
