#!/usr/bin/env node
for(const [name, url] of [
  ['aitoolsguide.com', 'https://www.aitoolsguide.com/submit/'],
  ['aitoolsup.com', 'https://aitoolsup.com/submit-tool/'],
]){
  const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(10000)});
  const html = await r.text();
  const forms = html.match(/<form[^>]*action="([^"]+)"/gi)||[];
  const fields = [...html.matchAll(/name="([^"]+)"/gi)].map(m=>m[1]).filter(n=>n.length<40 && !['viewport','description','og:title'].includes(n));
  const cf7id = html.match(/wpcf7-f(\d+)/)?.[1];
  const captchaType = html.match(/(cf-turnstile|g-recaptcha|h-captcha|data-sitekey)/i)?.[1];
  const bodyText = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  console.log(`\n=== ${name} ===`);
  console.log('HTTP:', r.status, '| CF7 form ID:', cf7id, '| captcha:', captchaType);
  console.log('Form actions:', forms.map(f=>f.match(/action="([^"]+)"/)?.[1]).join(', '));
  console.log('Fields:', fields.slice(0,15).join(', '));
  console.log('Page (250):', bodyText.substring(0,250));
}
