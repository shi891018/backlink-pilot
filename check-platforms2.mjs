import { BbPage } from './src/bb.js';
const p = new BbPage();

const sites = [
  'https://dev.to/enter',
  'https://medium.com/m/signin',  
  'https://app.hashnode.com/login',
];

for (const url of sites) {
  try {
    await p.goto(url);
    await new Promise(r=>setTimeout(r,4000));
    const text = p._bb('eval', `document.body.innerText.substring(0,300)`);
    const links = p._bb('eval', `Array.from(document.querySelectorAll('a,button')).map(e=>e.textContent.trim()).filter(t=>t.toLowerCase().includes('google')).slice(0,3).join('|')`);
    console.log(`\n=== ${url} ===`);
    console.log('Google links:', links);
    console.log('Text:', text.substring(0,150));
  } catch(e) {
    console.log(`Error: ${e.message.substring(0,80)}`);
  }
}
