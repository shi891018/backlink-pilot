import { BbPage } from './src/bb.js';

const p = new BbPage();

// Read the captcha value from the image/text displayed
const captchaText = p._bb('eval', `
  // Try to find the captcha display element
  const imgs = document.querySelectorAll('img');
  const captchaImg = Array.from(imgs).find(i => i.src && i.src.includes('captcha'));
  
  // Try to find text near the captcha input
  const captchaInput = document.getElementById('txtNumber');
  if (!captchaInput) return 'NOT FOUND';
  
  // Look for text elements near the captcha field
  const parent = captchaInput.closest('tr') || captchaInput.parentElement;
  const allText = parent?.innerText || '';
  return allText;
`);
console.log('Captcha area text:', captchaText);

// Look for the captcha image src to extract code
const captchaImgInfo = p._bb('eval', `
  const imgs = document.querySelectorAll('img');
  return JSON.stringify(Array.from(imgs).map(i=>({src:i.src, alt:i.alt, width:i.width, height:i.height})).filter(i=>i.width < 200 && i.height < 60));
`);
console.log('Small images (captcha candidates):', captchaImgInfo);

// Read the captcha display span/div near the input
const captchaVal = p._bb('eval', `
  const captchaField = document.querySelector('#txtNumber');
  if (!captchaField) return 'field not found';
  const tr = captchaField.closest('tr');
  if (!tr) return 'tr not found';
  // Look for the captcha display (usually an img or a span with the code)
  const spans = tr.querySelectorAll('span, div, td');
  return Array.from(spans).map(s => s.textContent.trim()).filter(t=>t).join(' | ');
`);
console.log('Captcha display value:', captchaVal);

// Try to get img[id*=captcha] or div[class*=captcha]
const captchaAlt = p._bb('eval', `
  const el = document.querySelector('[id*=captcha], [class*=captcha], [id*=Captcha]');
  return el ? el.outerHTML.substring(0, 200) : 'not found';
`);
console.log('Captcha element HTML:', captchaAlt);

await p.screenshot('screenshots/freedirectory-captcha-check.png');
