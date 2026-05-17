import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://ai-hunter.io/submit-ai-tool/');
await new Promise(r => setTimeout(r, 5000));

// Check categories and captcha
const hasCaptcha = p._bb('eval', `(function(){ return document.body.innerHTML.includes('recaptcha') || document.body.innerHTML.includes('hcaptcha') || document.body.innerHTML.includes('captcha'); })()`);
console.log('Has captcha:', hasCaptcha);

const cats = p._bb('eval', `(function(){ var s = document.querySelector('[name="select-1"]'); return s ? Array.from(s.options).map(o=>o.value).join(',') : 'not found'; })()`);
console.log('Categories:', cats);

const pricing = p._bb('eval', `(function(){ var s = document.querySelector('[name="select-2"]'); return s ? Array.from(s.options).map(o=>o.value).join(',') : 'not found'; })()`);
console.log('Pricing:', pricing);
