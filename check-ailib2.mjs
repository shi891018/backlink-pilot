import { BbPage } from './src/bb.js';

const p = new BbPage();
await p.goto('https://ailib.ru/en/add-ai/');
await new Promise(r => setTimeout(r, 3000));

// Click "Choose a plan"
await p.evalClickReal('a.jet-listing-dynamic-link, .elementor-button, button');
// Try finding the button by text
const clicked = await p._bb('eval', `(function(){
  const btns = [...document.querySelectorAll('a,button')];
  const btn = btns.find(b => b.textContent.includes('Choose a plan'));
  if(btn){ btn.click(); return 'clicked: ' + btn.href; }
  return 'not found';
})()`);
console.log('Click result:', clicked);
await new Promise(r => setTimeout(r, 3000));

await p._bb('screenshot', 'screenshots/ailib-after-plan-click.png');
const url = await p._bb('eval', 'location.href');
const inputs = await p._bb('eval', `(function(){
  return [...document.querySelectorAll('input,textarea,select')].map(el => ({
    tag: el.tagName, type: el.type, name: el.name, placeholder: el.placeholder, id: el.id
  }));
})()`);
console.log('URL:', url);
console.log('Inputs:', JSON.stringify(inputs));
