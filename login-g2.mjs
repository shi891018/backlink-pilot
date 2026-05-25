import { BbPage } from './src/bb.js';
const p = new BbPage();
// Should be on g2.com/authorize
console.log('URL:', p.url()?.substring(0,60));

// Click "Google" to start OAuth
const clickResult = p._bb('eval', `(function(){
  var btns = Array.from(document.querySelectorAll('a,button'));
  var g = btns.find(b => b.textContent.trim() === 'Google' && b.href && b.href.includes('google'));
  if(g){ g.click(); return 'clicked Google: '+g.href.substring(0,60); }
  return 'not found';
})()`);
console.log('Click:', clickResult);

await new Promise(r=>setTimeout(r,8000));
const afterUrl = p.url();
const afterBody = p._bb('eval', 'document.body.innerText.substring(0,500)');
console.log('After URL:', afterUrl.substring(0,80));
console.log('After body:', afterBody);
