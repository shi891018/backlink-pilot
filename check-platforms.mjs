import { BbPage } from './src/bb.js';
const p = new BbPage();

// Batch check multiple Google-login platforms
const sites = [
  'https://dev.to/enter',
  'https://medium.com/m/signin',  
  'https://www.reddit.com/login',
  'https://app.hashnode.com/login',
  'https://www.producthunt.com/login',
];

for (const url of sites) {
  await p.goto(url);
  await new Promise(r=>setTimeout(r,4000));
  const data = p._bb('eval', `JSON.stringify({
    url: location.href.substring(0,60),
    googleBtn: !!document.querySelector('button[aria-label*=oogle],[data-provider=google],[class*=google-btn],a[href*=google_oauth],[href*=auth/google]'),
    title: document.title.substring(0,35)
  })`);
  console.log(data);
}
