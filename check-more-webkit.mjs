#!/usr/bin/env node
// Check TrackBes and look for more webkit BBS boards
// Also check a few more remaining AI directories

// TrackBes
const r1 = await fetch('https://trackbes.com/submit-tool', {headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(10000)});
const html1 = await r1.text();
const fields1 = [...html1.matchAll(/name="([^"]+)"/gi)].map(m=>m[1]).filter(n=>n.length<30);
const captcha1 = /(captcha|recaptcha|turnstile)/i.test(html1);
const cf7id1 = html1.match(/wpcf7-f(\d+)/)?.[1];
const bodyText1 = html1.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
console.log('TrackBes HTTP:', r1.status, 'CF7:', cf7id1, 'captcha:', captcha1);
console.log('Fields:', fields1.slice(0,12).join(', '));
console.log('Page (200):', bodyText1.substring(0,200));

// Check a few more webkit BBS boards by trying common userids
console.log('\n--- Checking more webkit BBS boards ---');
const candidates = ['rando123','hamfes','amateur','jk1','jp7','ja3','7m4','w7wez','nj7v','ye5','handy','hobby'];
for(const userid of candidates){
  try{
    const r = await fetch(`https://webkit.dti.ne.jp/bbs/list.do?userid=${userid}&bbsid=bbs`, {
      headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(6000)
    });
    if(r.ok){
      const html = await r.text();
      const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
      if(title && !/404|not found|error/i.test(title)){
        console.log('✅', userid+'/bbs', title?.substring(0,60));
      }
    }
  } catch(e){ /* skip */ }
}
