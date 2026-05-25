#!/usr/bin/env node
const r = await fetch('https://www.avivadirectory.com/submit.php', { headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(10000) });
const html = await r.text();
const forms = html.match(/<form[^>]*action="([^"]+)"/gi)||[];
const allFields = [...html.matchAll(/name="([^"]+)"/gi)].map(m=>m[1]);
const captcha = /(captcha|recaptcha|turnstile)/i.test(html);
console.log('HTTP:', r.status, '| captcha:', captcha);
console.log('Form actions:', forms.map(f=>f.match(/action="([^"]+)"/)?.[1]).join(', '));
console.log('All fields:', allFields.join(', '));
// print a bit of context
const bodyText = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
console.log('\nPage text (600):', bodyText.substring(0,600));
