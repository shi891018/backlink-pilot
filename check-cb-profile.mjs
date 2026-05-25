import { BbPage } from './src/bb.js';
const p = new BbPage();

// Click "Return To New Company" to get the profile URL
const link = p._bb('eval', `(function(){
  var links = Array.from(document.querySelectorAll('a'));
  var ret = links.find(a => /return to new company/i.test(a.textContent));
  return ret ? ret.href : 'not found';
})()`);
console.log('Return link:', link);

// Navigate to it
if(link && link !== 'not found') {
  const p2 = new (await import('./src/bb.js').then(m=>m.BbPage))();
  await p2.goto(link);
  await new Promise(r=>setTimeout(r,5000));
  const finalUrl = p2.url();
  console.log('Profile URL:', finalUrl);
}
