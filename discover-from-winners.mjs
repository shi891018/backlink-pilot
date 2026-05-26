/**
 * discover-from-winners.mjs
 * Crawl blogrolls/links pages of blogs that successfully accepted comments
 * to find more similar small personal blogs.
 */

import fs from 'fs';
import https from 'https';
import http from 'http';

const RESOURCES_PATH = './resources/backlink-resources.json';
const resources = JSON.parse(fs.readFileSync(RESOURCES_PATH, 'utf8'));
const existingDomains = new Set(resources.map(r => {
  try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch { return ''; }
}));

function fetchUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      timeout: 12000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlogDiscovery/1.0)' }
    }, res => {
      // Follow redirects
      if ([301,302,303,307].includes(res.statusCode) && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(() => resolve(''));
      }
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

function extractLinks(html, baseHost) {
  const links = [];
  const re = /href=["'](https?:\/\/[^"'>\s]+)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const u = new URL(m[1]);
      const host = u.hostname.replace(/^www\./, '');
      if (host !== baseHost && !host.includes('google') && !host.includes('facebook')
        && !host.includes('twitter') && !host.includes('instagram') && !host.includes('youtube')
        && !host.includes('linkedin') && !host.includes('amazon') && !host.includes('wordpress.org')
        && !host.includes('gravatar') && !host.includes('wp.com') && !host.includes('w3.org')
        && !host.includes('jquery') && !host.includes('cloudflare') && !host.includes('googleapis')
        && !host.includes('gstatic') && !host.includes('bootstrapcdn') && u.pathname.length < 80) {
        links.push({ url: m[1].replace(/[?#].*/, ''), host });
      }
    } catch {}
  }
  return links;
}

function looksLikeBlog(url, html) {
  const h = html.toLowerCase();
  return (h.includes('wp-content') || h.includes('wordpress') || h.includes('blogger.com')
    || h.includes('blogspot') || h.includes('typepad') || h.includes('ghost.io')
    || h.includes('substack') || h.includes('comment') || h.includes('leave a reply')
    || h.includes('post a comment') || h.includes('disqus')) && html.length > 5000;
}

// Seeds: blogs that DID accept comments + blogs known to have blogrolls
const SEEDS = [
  { url: 'https://terrytao.wordpress.com/', name: 'Terence Tao' },
  { url: 'https://mathwithbaddrawings.com/', name: 'Math With Bad Drawings' },
  { url: 'https://divisbyzero.com/', name: 'Division by Zero' },
  { url: 'https://profmattstrassler.com/', name: 'Matt Strassler' },
  { url: 'https://fortelabs.com/blog/', name: 'Forte Labs' },
  // Blogs known to have blogrolls in sidebar
  { url: 'https://terrytao.wordpress.com/links/', name: 'Tao Links' },
  { url: 'https://divisbyzero.com/links/', name: 'DivByZero Links' },
  { url: 'https://gowers.wordpress.com/', name: 'Gowers Blog' },
  { url: 'https://profmattstrassler.com/blogroll/', name: 'Strassler Blogroll' },
  { url: 'https://backreaction.blogspot.com/', name: 'Backreaction' },
  // More personal/academic blogs with blogrolls
  { url: 'https://www.math.columbia.edu/~woit/wordpress/', name: 'Woit Blog' },
  { url: 'https://golem.ph.utexas.edu/category/', name: 'n-Category Cafe' },
  { url: 'https://www.physicsbuzz.com/', name: 'Physics Buzz' },
  { url: 'https://www.cosmicvariance.com/', name: 'Cosmic Variance' },
  { url: 'https://scienceblogs.com/', name: 'ScienceBlogs Hub' },
  { url: 'https://chemjobber.blogspot.com/', name: 'ChemJobber' },
  { url: 'https://www.christoph-schwemmer.de/', name: 'Schwemmer' },
  { url: 'https://www.labnol.org/', name: 'Labnol' },
];

const confirmed = [];
const checked = new Set();
let totalNew = 0;

console.log('Crawling blogrolls from winning blogs...\n');

for (const seed of SEEDS) {
  let seedHost;
  try { seedHost = new URL(seed.url).hostname.replace(/^www\./, ''); } catch { continue; }
  
  console.log(`Seed: ${seed.url}`);
  const html = await fetchUrl(seed.url);
  if (!html) { console.log('  → unreachable\n'); continue; }
  
  const links = extractLinks(html, seedHost);
  const unique = [...new Map(links.map(l => [l.host, l])).values()];
  console.log(`  ${unique.length} outbound links`);
  
  let seedNew = 0;
  for (const link of unique.slice(0, 40)) {
    if (existingDomains.has(link.host) || checked.has(link.host)) {
      continue;
    }
    checked.add(link.host);
    
    // Quick check if it looks like a blog
    const targetHtml = await fetchUrl(link.url);
    if (!targetHtml) continue;
    
    if (looksLikeBlog(link.url, targetHtml)) {
      existingDomains.add(link.host);
      confirmed.push({
        url: link.url,
        name: link.host,
        type: 'blog_comment',
        niche: 'general',
        status: 'pending',
        submitted: false,
        source: `blogroll-${seedHost}`,
        discovered_at: new Date().toISOString().split('T')[0]
      });
      console.log(`  ✓ blog: ${link.host}`);
      seedNew++;
      totalNew++;
    }
  }
  if (seedNew === 0) console.log('  (no new blogs found)');
  console.log();
}

if (totalNew > 0) {
  const updated = [...resources, ...confirmed];
  fs.writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`\n✅ New confirmed: ${totalNew}`);
  console.log(`Resources: ${resources.length} → ${updated.length}`);
} else {
  console.log('\nNo new blogs found.');
}
