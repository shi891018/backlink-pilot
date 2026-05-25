#!/usr/bin/env node
// Submit and check full response
const fd = new URLSearchParams();
fd.append('url', 'https://www.unitconv.top');
fd.append('Name', 'Unit Converter for Science');
fd.append('email', 'shijm1989@gmail.com');
fd.append('Agreed to Terms', 'Yes');
for(const eng of ['ActiveSearchResults','Bing','Google','ExactSeek','SonicRun']){
  fd.append('engines', eng);
}
fd.append('submit', 'Submit Your Site');
const resp = await fetch('https://freewebsubmission.com/cgi-bin/submit-async.cgi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://freewebsubmission.com/', 'Origin': 'https://freewebsubmission.com' },
  body: fd.toString(),
  signal: AbortSignal.timeout(30000),
});
const body = await resp.text();
// Look for s_content area
const sIdx = body.indexOf('s_content');
const progressIdx = body.indexOf('submit_progress');
const thankIdx = body.toLowerCase().indexOf('thank');
const completeIdx = body.toLowerCase().indexOf('complete');
const errorIdx = body.toLowerCase().indexOf('error');
console.log('s_content:', sIdx, '| submit_progress:', progressIdx, '| thank:', thankIdx, '| complete:', completeIdx, '| error:', errorIdx);
if(sIdx > 0) console.log('s_content context:', body.substring(sIdx-20, sIdx+300));
// Print end of response
console.log('\nEnd of response (last 500):', body.substring(Math.max(0,body.length-500)));
