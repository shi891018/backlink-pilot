#!/usr/bin/env node
// Debug: check if aivalley has CF7 form and captcha
import { BbPage } from './src/bb.js';
const p = new BbPage();
await p.goto('https://aivalley.ai/submit-tool/');
await new Promise(r => setTimeout(r, 5000));

// Check for captcha
const hasCaptcha = p._bb('eval', `(function(){
  var iframes = Array.from(document.querySelectorAll('iframe'));
  var captchaFrame = iframes.find(f => /captcha|recaptcha|turnstile|hcaptcha/i.test(f.src||f.title||f.id||f.name||''));
  var recaptchaDiv = document.querySelector('.g-recaptcha, .cf-turnstile, [data-sitekey]');
  return {
    captchaIframe: captchaFrame ? captchaFrame.src : null,
    captchaDiv: recaptchaDiv ? recaptchaDiv.className + ' key=' + recaptchaDiv.getAttribute('data-sitekey') : null,
    iframeCount: iframes.length,
    iframeSrcs: iframes.slice(0,5).map(f=>f.src).join(' | ')
  };
})()`);
console.log('Captcha check:', hasCaptcha);

// Check form details  
const formInfo = p._bb('eval', `(function(){
  var form = document.querySelector('form.wpcf7-form');
  if(!form) return 'no CF7 form';
  var action = form.getAttribute('action');
  var required = Array.from(form.querySelectorAll('[required],[aria-required="true"]')).map(el=>el.name||el.id).filter(Boolean);
  return {action, required};
})()`);
console.log('Form info:', formInfo);

await p.screenshot('screenshots/aivalley-debug.png');
