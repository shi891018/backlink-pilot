#!/usr/bin/env node
for(const [name, url] of [
  ['PR.com submit', 'https://www.pr.com/submit-press-release'],
  ['OpenPR submit', 'https://www.openpr.com/news/submit/'],
  ['PRFree submit', 'https://www.prfree.org/?action=submit'],
  ['OpenPR register', 'https://www.openpr.com/register/'],
]){
  try{
    const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(8000), redirect:'follow'});
    const html = await r.text();
    const forms = (html.match(/<form/gi)||[]).length;
    const login = /(sign.in|log.in|register|login|account)/i.test(html.substring(0,3000));
    const paid = /(\$[0-9]+|fee|paid|premium)/i.test(html.substring(0,3000));
    const bodyText = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    console.log(`${name}: HTTP:${r.status} forms:${forms} login:${login} paid:${paid}`);
    console.log('  text:', bodyText.substring(0,200));
  } catch(e) {
    console.log(name, 'ERR:', e.message.substring(0,30));
  }
}
