import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://landing.mycloudmedia.co.uk/apps-and-websites-submit-ai-or-saas-tool/new-submission.html');
await new Promise(r => setTimeout(r, 3000));

// Get category options
const cats = await p._bb('eval', `(function(){
  const sel = document.querySelectorAll('select');
  return [...sel].map(s => ({name: s.name.slice(0,10), opts: [...s.options].map(o => o.text + ':' + o.value).join(', ')}));
})()`);
console.log('Categories:', JSON.stringify(cats));
