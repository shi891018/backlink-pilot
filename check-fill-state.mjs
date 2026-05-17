import { BbPage } from './src/bb.js';

const p = new BbPage();

// First verify the URL field was filled correctly
const urlVal = p._bb('eval', `(function(){ var el = document.querySelector('input[value*="unitconv"]') || document.querySelector('[name=posturl]') || document.querySelector('input[type=text][id*=url]'); return el ? el.value : 'not found'; })()`);
console.log('URL field value:', urlVal);

const titleVal = p._bb('eval', `(function(){ var el = document.querySelector('[name=linkname]'); return el ? el.value : 'not found'; })()`);
console.log('Title field:', titleVal);

const captchaVal = p._bb('eval', `(function(){ var el = document.getElementById('txtNumber'); return el ? el.value : 'not found'; })()`);
console.log('Captcha field:', captchaVal);

await p.screenshot('screenshots/freedirectory-check-fill.png');

// Take screenshot to see current captcha code
const captchaImgSrc = p._bb('eval', `(function(){ var img = document.querySelector('img[src*=randomImage]'); return img ? img.src : 'not found'; })()`);
console.log('Captcha img src:', captchaImgSrc);
