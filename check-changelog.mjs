import { BbPage } from './src/bb.js';
const p = new BbPage();
const urlVal = p._bb('eval', 'document.getElementById("news_item_url")?.value');
const titleVal = p._bb('eval', 'document.getElementById("news_item_headline")?.value');
const storyVal = p._bb('eval', 'document.getElementById("news_item_story")?.value');
console.log('URL:', urlVal);
console.log('Title:', titleVal);
console.log('Story:', storyVal?.substring(0, 100));
await p.screenshot('screenshots/changelog-filled.png');
