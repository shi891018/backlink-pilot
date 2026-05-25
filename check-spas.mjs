#!/usr/bin/env node
// One more batch with bb-browser for SPA sites
// Check aitools.fyi, paxi.ai, and a few others
const { BbPage } = await import('./src/bb.js');
const p = new BbPage();

const sites = [
  'https://aitools.fyi/submit-a-tool',
  'https://paxi.ai/submit',
  'https://aistage.net/submit',
];

for(const url of sites){
  try{
    await p.goto(url);
    await new Promise(r => setTimeout(r, 3000));
    const current = p.url();
    const inputs = p._bb('eval', `JSON.stringify(Array.from(document.querySelectorAll('input,textarea,select')).map(el=>({tag:el.tagName,type:el.type||'',name:el.name,placeholder:el.placeholder})).filter(el=>el.type!=='hidden'))`);
    console.log(url.substring(8,50), '→', current.substring(8,50));
    console.log('  inputs:', inputs?.substring(0,200)||'none');
    await new Promise(r => setTimeout(r, 1000));
  } catch(e) {
    console.log(url.substring(8,50), 'ERR:', e.message.substring(0,40));
  }
}
