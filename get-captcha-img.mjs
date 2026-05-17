import { BbPage } from './src/bb.js';

const p = new BbPage();

// First take a fresh screenshot to get current captcha
await p.screenshot('screenshots/freedirectory-current-captcha.png');
console.log('Screenshot saved - check for current captcha value');

// Get current URL to confirm we're on the right page
const url = p.url();
console.log('Current URL:', url);

// Try to read the captcha image src
const captchaImgSrc = p._bb('eval', `(function(){ 
  var imgs = Array.from(document.images);
  var small = imgs.filter(i => i.naturalWidth && i.naturalWidth < 200);
  return small.map(i => i.src).join('|');
})()`);
console.log('Captcha image src candidates:', captchaImgSrc);
