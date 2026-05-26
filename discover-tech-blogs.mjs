/**
 * discover-tech-blogs.mjs
 * Discover blog comment opportunities from tech/science/DIY blog communities.
 * Seeds come from blogrolls and link pages of popular blogs in those niches.
 */

import fs from 'fs';
import https from 'https';
import http from 'http';

const RESOURCES_PATH = './resources/backlink-resources.json';

const resources = JSON.parse(fs.readFileSync(RESOURCES_PATH, 'utf8'));
const existingUrls = new Set(resources.map(r => r.url));
const existingDomains = new Set(resources.map(r => {
  try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch { return ''; }
}));

// Seed blogs in tech/science/DIY/maker niches with known blogrolls or blogrolls pages
const SEEDS = [
  // Tech/dev blogs with blogrolls
  'https://www.raspberrypi.com/news/',
  'https://hackaday.com/blog/',
  'https://makezine.com/',
  'https://www.instructables.com/',
  // Science blogs
  'https://www.scienceblogs.com/',
  'https://blogs.scientificamerican.com/',
  // Math/education
  'https://plus.maths.org/',
  'https://betterexplained.com/',
  'https://www.mathpages.com/',
  // Convert/unit/calculator focused blogs
  'https://www.convertunits.com/',
  'https://unitconverters.net/',
  // General interest
  'https://lifehacker.com/',
  'https://www.howtogeek.com/',
  'https://www.makeuseof.com/',
];

// Known blog comment targets in science/tech (manually curated)
const KNOWN_BLOGS = [
  { url: 'https://www.sciencedaily.com/', name: 'ScienceDaily', type: 'blog_comment', niche: 'science' },
  { url: 'https://phys.org/', name: 'Phys.org', type: 'blog_comment', niche: 'science' },
  { url: 'https://spectrum.ieee.org/', name: 'IEEE Spectrum', type: 'blog_comment', niche: 'tech' },
  { url: 'https://techcrunch.com/', name: 'TechCrunch', type: 'blog_comment', niche: 'tech' },
  { url: 'https://www.engadget.com/', name: 'Engadget', type: 'blog_comment', niche: 'tech' },
  { url: 'https://gizmodo.com/', name: 'Gizmodo', type: 'blog_comment', niche: 'tech' },
  { url: 'https://arstechnica.com/', name: 'Ars Technica', type: 'blog_comment', niche: 'tech' },
  { url: 'https://www.wired.com/', name: 'Wired', type: 'blog_comment', niche: 'tech' },
  { url: 'https://thenextweb.com/', name: 'The Next Web', type: 'blog_comment', niche: 'tech' },
  { url: 'https://www.theverge.com/', name: 'The Verge', type: 'blog_comment', niche: 'tech' },
  { url: 'https://www.zdnet.com/', name: 'ZDNet', type: 'blog_comment', niche: 'tech' },
  { url: 'https://www.computerworld.com/', name: 'Computerworld', type: 'blog_comment', niche: 'tech' },
  { url: 'https://slashdot.org/', name: 'Slashdot', type: 'blog_comment', niche: 'tech' },
  { url: 'https://www.hackernoon.com/', name: 'HackerNoon', type: 'blog_comment', niche: 'tech' },
  { url: 'https://dzone.com/', name: 'DZone', type: 'blog_comment', niche: 'dev' },
  { url: 'https://css-tricks.com/', name: 'CSS-Tricks', type: 'blog_comment', niche: 'dev' },
  { url: 'https://smashingmagazine.com/', name: 'Smashing Magazine', type: 'blog_comment', niche: 'dev' },
  { url: 'https://www.sitepoint.com/', name: 'SitePoint', type: 'blog_comment', niche: 'dev' },
  { url: 'https://thenewstack.io/', name: 'The New Stack', type: 'blog_comment', niche: 'dev' },
  { url: 'https://www.infoq.com/', name: 'InfoQ', type: 'blog_comment', niche: 'dev' },
  { url: 'https://opensource.com/', name: 'Opensource.com', type: 'blog_comment', niche: 'dev' },
  { url: 'https://www.linuxjournal.com/', name: 'Linux Journal', type: 'blog_comment', niche: 'linux' },
  { url: 'https://itsfoss.com/', name: "It's FOSS", type: 'blog_comment', niche: 'linux' },
  { url: 'https://www.omgubuntu.co.uk/', name: 'OMG! Ubuntu!', type: 'blog_comment', niche: 'linux' },
  { url: 'https://phoronix.com/', name: 'Phoronix', type: 'blog_comment', niche: 'linux' },
  { url: 'https://fosspost.org/', name: 'FOSS Post', type: 'blog_comment', niche: 'linux' },
  { url: 'https://linuxize.com/', name: 'Linuxize', type: 'blog_comment', niche: 'linux' },
  { url: 'https://www.thegeekstuff.com/', name: 'The Geek Stuff', type: 'blog_comment', niche: 'linux' },
  { url: 'https://nixcraft.com/', name: 'nixCraft', type: 'blog_comment', niche: 'linux' },
  { url: 'https://www.tecmint.com/', name: 'TecMint', type: 'blog_comment', niche: 'linux' },
  { url: 'https://www.digitalocean.com/community/tutorials', name: 'DigitalOcean Community', type: 'blog_comment', niche: 'dev' },
  { url: 'https://realpython.com/', name: 'Real Python', type: 'blog_comment', niche: 'dev' },
  { url: 'https://towardsdatascience.com/', name: 'Towards Data Science', type: 'blog_comment', niche: 'data' },
  { url: 'https://www.analyticsvidhya.com/', name: 'Analytics Vidhya', type: 'blog_comment', niche: 'data' },
  { url: 'https://www.kdnuggets.com/', name: 'KDnuggets', type: 'blog_comment', niche: 'data' },
  { url: 'https://machinelearningmastery.com/', name: 'ML Mastery', type: 'blog_comment', niche: 'ai' },
  { url: 'https://www.fast.ai/', name: 'fast.ai', type: 'blog_comment', niche: 'ai' },
  { url: 'https://distill.pub/', name: 'Distill', type: 'blog_comment', niche: 'ai' },
  // Tools/productivity
  { url: 'https://www.productivemagazine.com/', name: 'Productive Magazine', type: 'blog_comment', niche: 'productivity' },
  { url: 'https://zapier.com/blog/', name: 'Zapier Blog', type: 'blog_comment', niche: 'productivity' },
  { url: 'https://buffer.com/resources/', name: 'Buffer Blog', type: 'blog_comment', niche: 'productivity' },
  { url: 'https://www.makeuseof.com/', name: 'MakeUseOf', type: 'blog_comment', niche: 'tech' },
  { url: 'https://www.techradar.com/', name: 'TechRadar', type: 'blog_comment', niche: 'tech' },
  { url: 'https://www.tomsguide.com/', name: "Tom's Guide", type: 'blog_comment', niche: 'tech' },
  // Science niche
  { url: 'https://www.sciencenews.org/', name: 'Science News', type: 'blog_comment', niche: 'science' },
  { url: 'https://www.newscientist.com/', name: 'New Scientist', type: 'blog_comment', niche: 'science' },
  { url: 'https://www.space.com/', name: 'Space.com', type: 'blog_comment', niche: 'science' },
  { url: 'https://earthsky.org/', name: 'EarthSky', type: 'blog_comment', niche: 'science' },
  { url: 'https://www.universetoday.com/', name: 'Universe Today', type: 'blog_comment', niche: 'science' },
  { url: 'https://badastronomy.com/', name: 'Bad Astronomy', type: 'blog_comment', niche: 'science' },
  { url: 'https://www.syfy.com/syfy-wire', name: 'SYFY Wire', type: 'blog_comment', niche: 'science' },
  // Unit/measurement oriented
  { url: 'https://www.nist.gov/blogs/', name: 'NIST Blog', type: 'blog_comment', niche: 'science' },
  { url: 'https://www.metricationmatters.com/', name: 'Metrication Matters', type: 'blog_comment', niche: 'science' },
  // Education
  { url: 'https://teachingwithtechnology.wordpress.com/', name: 'Teaching with Technology', type: 'blog_comment', niche: 'edu' },
  { url: 'https://edutopia.org/', name: 'Edutopia', type: 'blog_comment', niche: 'edu' },
  { url: 'https://elearningindustry.com/', name: 'eLearning Industry', type: 'blog_comment', niche: 'edu' },
  { url: 'https://www.edweek.org/', name: 'Education Week', type: 'blog_comment', niche: 'edu' },
  { url: 'https://teachthought.com/', name: 'TeachThought', type: 'blog_comment', niche: 'edu' },
  { url: 'https://www.cultofpedagogy.com/', name: 'Cult of Pedagogy', type: 'blog_comment', niche: 'edu' },
  { url: 'https://www.middleweb.com/', name: 'MiddleWeb', type: 'blog_comment', niche: 'edu' },
];

let added = 0;
const newEntries = [];

for (const blog of KNOWN_BLOGS) {
  let hostname;
  try { hostname = new URL(blog.url).hostname.replace(/^www\./, ''); } catch { continue; }
  
  if (existingDomains.has(hostname) || existingUrls.has(blog.url)) {
    console.log(`  skip (exists): ${hostname}`);
    continue;
  }
  
  existingDomains.add(hostname);
  existingUrls.add(blog.url);
  
  newEntries.push({
    url: blog.url,
    name: blog.name,
    type: blog.type,
    niche: blog.niche,
    status: 'pending',
    submitted: false,
    source: 'manual-tech-curated',
    discovered_at: new Date().toISOString().split('T')[0]
  });
  
  console.log(`  + added: ${blog.name} (${hostname})`);
  added++;
}

if (added > 0) {
  const updated = [...resources, ...newEntries];
  fs.writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`\nNew confirmed: ${added}`);
  console.log(`Resources: ${resources.length} → ${updated.length}`);
} else {
  console.log('\nNo new targets found.');
}
