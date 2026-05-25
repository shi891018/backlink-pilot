#!/usr/bin/env node
// Round 9 - traditional directories + niche sites
const urls = [
  ['infotiger.com', 'https://www.infotiger.com/addurl.html'],
  ['entireweb.com', 'https://www.entireweb.com/free_submission/'],
  ['weboworld.com', 'https://www.weboworld.com/submit.php'],
  ['Giga alert', 'https://www.gigaalert.com/submit.php'],
  ['btails.com', 'https://www.btails.com/submit.php'],
  ['biznesdirectory', 'https://www.biznesdirectory.com/add-link.php'],
  ['calx.fun', 'https://calx.fun/submit'],
  ['unitconversion.org', 'https://www.unitconversion.org/'],
  ['tools-directory.io', 'https://tools-directory.io/submit'],
  ['freecomputertools.com', 'https://www.freecomputertools.com/submit.php'],
  ['123directory.co.uk', 'https://www.123directory.co.uk/submit.html'],
  ['sitesplus.co.uk', 'https://www.sitesplus.co.uk/addsite'],
  ['onlinecalc.net', 'https://onlinecalc.net/'],
  ['dirjournal.com', 'https://www.dirjournal.com/submit.php'],
  ['thefreelibrary.com', 'https://www.thefreelibrary.com/'],
];
for(const [name, url] of urls){
  try{
    const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(8000), redirect:'follow'});
    const html = await r.text();
    const forms = (html.match(/<form/gi)||[]).length;
    const hasURL = /(name="url"|name="siteurl"|name="website"|name="link"|type="url")/i.test(html);
    const captcha = /(captcha|recaptcha)/i.test(html);
    const paid = /(\$[0-9]+|fee required|paid\s)/i.test(html.substring(0,2000));
    console.log(name.padEnd(22), 'HTTP:'+r.status, 'forms:'+forms, 'url:'+hasURL, 'cap:'+captcha, 'paid:'+paid);
  } catch(e) {
    console.log(name.padEnd(22), 'ERR:', e.message.substring(0,25));
  }
}
