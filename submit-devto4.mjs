import { BbPage } from './src/bb.js';
const p = new BbPage();

// Try navigating and waiting for the editor to load
await p.goto('https://dev.to/new');
await new Promise(r=>setTimeout(r,8000));

const url = p.url();
const bodyText = p._bb('eval', 'document.body.innerText.substring(0,200)');
const titleEl = p._bb('eval', `JSON.stringify({
  exists: !!document.getElementById('article-form-title'),
  allTextareas: Array.from(document.querySelectorAll('textarea')).map(t=>t.id),
  url: location.href.substring(0,60)
})`);
console.log('URL:', url.substring(0,80));
console.log('Title el:', titleEl);
console.log('Body:', bodyText.substring(0,150));
