/**
 * discover-wp-niches.mjs
 * Discover small niche WordPress blogs via WordPress.com tag/category feeds
 * and Google-style searches via common blog directories.
 * Targets science, math, education, tools niches.
 */

import fs from 'fs';
import https from 'https';

const RESOURCES_PATH = './resources/backlink-resources.json';

const resources = JSON.parse(fs.readFileSync(RESOURCES_PATH, 'utf8'));
const existingDomains = new Set(resources.map(r => {
  try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch { return ''; }
}));

function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', ...opts.headers } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// WordPress.com tag feeds — returns list of recent posts per tag
const WP_TAGS = [
  'unit-conversion', 'measurement', 'science-education',
  'metric-system', 'physics', 'chemistry', 'mathematics',
  'calculator', 'stem-education', 'data-science',
  'engineering', 'scientific-computing', 'unit-converter',
  'online-tools', 'web-tools', 'developer-tools',
];

// Known small blogs (personally curated, self-hosted WordPress-like)
const CURATED = [
  { url: 'https://www.johndcook.com/blog/', name: 'John D Cook', niche: 'math' },
  { url: 'https://terrytao.wordpress.com/', name: 'Terence Tao Blog', niche: 'math' },
  { url: 'https://gowers.wordpress.com/', name: 'Gowers Weblog', niche: 'math' },
  { url: 'https://mathwithbaddrawings.com/', name: 'Math With Bad Drawings', niche: 'math' },
  { url: 'https://www.quantamagazine.org/', name: 'Quanta Magazine', niche: 'science' },
  { url: 'https://notevenpast.org/', name: 'Not Even Past', niche: 'edu' },
  { url: 'https://www.scientificamerican.com/blog/', name: 'SciAm Blog', niche: 'science' },
  { url: 'https://www.wired.com/science/', name: 'Wired Science', niche: 'science' },
  { url: 'https://blogs.sciencemag.org/', name: 'Science Magazine Blogs', niche: 'science' },
  { url: 'https://www.chemistryworld.com/opinion/', name: 'Chemistry World', niche: 'science' },
  { url: 'https://www.nature.com/news/', name: 'Nature News', niche: 'science' },
  { url: 'https://www.popularmechanics.com/', name: 'Popular Mechanics', niche: 'tech' },
  { url: 'https://www.popularsciencemag.com/', name: 'Popular Science', niche: 'science' },
  { url: 'https://io9.gizmodo.com/', name: 'io9', niche: 'science' },
  { url: 'https://www.discovermagazine.com/', name: 'Discover Magazine', niche: 'science' },
  // Smaller WordPress blogs with comment sections
  { url: 'https://scienceblog.com/', name: 'Science Blog', niche: 'science' },
  { url: 'https://www.realclimate.org/', name: 'RealClimate', niche: 'science' },
  { url: 'https://www.iflscience.com/', name: 'IFLScience', niche: 'science' },
  { url: 'https://www.sciencebuddies.org/blog/', name: 'Science Buddies Blog', niche: 'edu' },
  { url: 'https://blogs.ams.org/mathgradblog/', name: 'AMS Math Grad Blog', niche: 'math' },
  { url: 'https://divisbyzero.com/', name: 'Division by Zero', niche: 'math' },
  { url: 'https://plus.maths.org/content/', name: 'Plus Maths', niche: 'math' },
  { url: 'https://www.mathsisfun.com/', name: 'Maths Is Fun', niche: 'math' },
  { url: 'https://brilliant.org/blog/', name: 'Brilliant Blog', niche: 'math' },
  { url: 'https://artofproblemsolving.com/blog/', name: 'AoPS Blog', niche: 'math' },
  { url: 'https://www.dataversity.net/', name: 'Dataversity', niche: 'data' },
  { url: 'https://www.datasciencecentral.com/', name: 'Data Science Central', niche: 'data' },
  { url: 'https://www.r-bloggers.com/', name: 'R-Bloggers', niche: 'data' },
  { url: 'https://www.statology.org/', name: 'Statology', niche: 'data' },
  { url: 'https://statisticsbyjim.com/', name: 'Statistics By Jim', niche: 'data' },
  { url: 'https://blog.minitab.com/', name: 'Minitab Blog', niche: 'data' },
  { url: 'https://www.stemwizard.com/blog/', name: 'STEM Wizard Blog', niche: 'edu' },
  { url: 'https://www.sciencekids.co.nz/blog/', name: 'Science Kids Blog', niche: 'edu' },
  { url: 'https://www.education.com/blog/', name: 'Education.com Blog', niche: 'edu' },
  { url: 'https://www.teachhub.com/', name: 'TeachHub', niche: 'edu' },
  { url: 'https://www.smartclassroommanagement.com/', name: 'Smart Classroom Mgmt', niche: 'edu' },
  { url: 'https://www.weareteachers.com/', name: 'We Are Teachers', niche: 'edu' },
  { url: 'https://www.eschoolnews.com/', name: 'eSchool News', niche: 'edu' },
  { url: 'https://campustechnology.com/', name: 'Campus Technology', niche: 'edu' },
  { url: 'https://www.techlearning.com/', name: 'Tech & Learning', niche: 'edu' },
  // Physics/chemistry
  { url: 'https://profmattstrassler.com/', name: 'Of Particular Significance', niche: 'physics' },
  { url: 'https://backreaction.blogspot.com/', name: 'Backreaction', niche: 'physics' },
  { url: 'https://www.preposterousuniverse.com/blog/', name: 'Preposterous Universe', niche: 'physics' },
  { url: 'https://scienceandreason.blogspot.com/', name: 'Science and Reason', niche: 'science' },
  { url: 'https://www.physicsforums.com/insights/', name: 'Physics Forums Insights', niche: 'physics' },
  { url: 'https://www.askamathematician.com/', name: 'Ask a Mathematician', niche: 'math' },
  { url: 'https://www.askaphysicist.com/', name: 'Ask a Physicist', niche: 'physics' },
  { url: 'https://www.physicsclassroom.com/', name: 'Physics Classroom', niche: 'physics' },
  { url: 'https://www.khanacademy.org/college-careers-more/career-content/', name: 'Khan Academy Blog', niche: 'edu' },
  // Maker/DIY/engineering
  { url: 'https://www.electronicshub.org/', name: 'Electronics Hub', niche: 'maker' },
  { url: 'https://www.circuitbasics.com/', name: 'Circuit Basics', niche: 'maker' },
  { url: 'https://randomnerdtutorials.com/', name: 'Random Nerd Tutorials', niche: 'maker' },
  { url: 'https://lastminuteengineers.com/', name: 'Last Minute Engineers', niche: 'maker' },
  { url: 'https://www.eevblog.com/', name: 'EEVblog', niche: 'maker' },
  { url: 'https://www.learningaboutelectronics.com/', name: 'Learning About Electronics', niche: 'maker' },
  { url: 'https://www.allaboutcircuits.com/', name: 'All About Circuits', niche: 'maker' },
  { url: 'https://www.electroschematics.com/', name: 'Electroschematics', niche: 'maker' },
  { url: 'https://electronics.stackexchange.com/', name: 'Electronics SE', niche: 'maker' },
  { url: 'https://www.instructables.com/technology/', name: 'Instructables Tech', niche: 'maker' },
  // General tech/tools focused small blogs
  { url: 'https://www.ghacks.net/', name: 'gHacks', niche: 'tech' },
  { url: 'https://betanews.com/', name: 'BetaNews', niche: 'tech' },
  { url: 'https://www.techrepublic.com/', name: 'TechRepublic', niche: 'tech' },
  { url: 'https://www.tomshardware.com/', name: "Tom's Hardware", niche: 'tech' },
  { url: 'https://www.anandtech.com/', name: 'AnandTech', niche: 'tech' },
  { url: 'https://www.extremetech.com/', name: 'ExtremeTech', niche: 'tech' },
  { url: 'https://www.windowscentral.com/', name: 'Windows Central', niche: 'tech' },
  { url: 'https://www.bleepingcomputer.com/', name: 'BleepingComputer', niche: 'security' },
  { url: 'https://nakedsecurity.sophos.com/', name: 'Naked Security', niche: 'security' },
  { url: 'https://www.darkreading.com/', name: 'Dark Reading', niche: 'security' },
  { url: 'https://www.securityweek.com/', name: 'SecurityWeek', niche: 'security' },
  // International/multilingual
  { url: 'https://www.heise.de/newsticker/', name: 'Heise Online', niche: 'tech' },
  { url: 'https://www.golem.de/', name: 'Golem.de', niche: 'tech' },
  // Personal blogs with known comment sections
  { url: 'https://sivers.org/', name: 'Derek Sivers', niche: 'general' },
  { url: 'https://paulgraham.com/', name: 'Paul Graham', niche: 'general' },
  { url: 'https://www.ribbonfarm.com/', name: 'Ribbon Farm', niche: 'general' },
  { url: 'https://waitbutwhy.com/', name: 'Wait But Why', niche: 'general' },
  { url: 'https://slatestarcodex.com/', name: 'Slate Star Codex', niche: 'general' },
  { url: 'https://www.lesswrong.com/', name: 'LessWrong', niche: 'general' },
  { url: 'https://marginalrevolution.com/', name: 'Marginal Revolution', niche: 'general' },
  { url: 'https://www.overcomingbias.com/', name: 'Overcoming Bias', niche: 'general' },
  { url: 'https://www.econlib.org/econlog/', name: 'EconLog', niche: 'general' },
  { url: 'https://freakonomics.com/', name: 'Freakonomics', niche: 'general' },
  { url: 'https://kottke.org/', name: 'Kottke', niche: 'general' },
  { url: 'https://boing boing.net/', name: 'Boing Boing', niche: 'general' },
  { url: 'https://www.boingboing.net/', name: 'Boing Boing', niche: 'general' },
  { url: 'https://www.jwz.org/blog/', name: 'JWZ Blog', niche: 'tech' },
  { url: 'https://daringfireball.net/', name: 'Daring Fireball', niche: 'tech' },
  { url: 'https://stratechery.com/', name: 'Stratechery', niche: 'tech' },
  { url: 'https://www.joelonsoftware.com/', name: 'Joel on Software', niche: 'dev' },
  { url: 'https://blog.codinghorror.com/', name: 'Coding Horror', niche: 'dev' },
  { url: 'https://martinfowler.com/', name: 'Martin Fowler', niche: 'dev' },
  { url: 'https://kentcdodds.com/blog/', name: 'Kent C. Dodds Blog', niche: 'dev' },
  { url: 'https://overreacted.io/', name: 'Overreacted (Dan Abramov)', niche: 'dev' },
  { url: 'https://www.kalzumeus.com/blog/', name: 'Kalzumeus Blog', niche: 'dev' },
  { url: 'https://www.indiehackers.com/', name: 'Indie Hackers', niche: 'startup' },
  { url: 'https://hackernoon.com/', name: 'Hacker Noon', niche: 'tech' },
  { url: 'https://nesslabs.com/', name: 'Ness Labs', niche: 'productivity' },
  { url: 'https://fortelabs.com/blog/', name: 'Forte Labs', niche: 'productivity' },
  { url: 'https://www.animalz.co/blog/', name: 'Animalz Blog', niche: 'marketing' },
];

let added = 0;
const newEntries = [];

for (const blog of CURATED) {
  let hostname;
  try { hostname = new URL(blog.url).hostname.replace(/^www\./, ''); } catch { continue; }
  
  if (existingDomains.has(hostname)) {
    continue;
  }
  
  existingDomains.add(hostname);
  newEntries.push({
    url: blog.url,
    name: blog.name,
    type: 'blog_comment',
    niche: blog.niche,
    status: 'pending',
    submitted: false,
    source: 'manual-wp-niches',
    discovered_at: new Date().toISOString().split('T')[0]
  });
  
  console.log(`  + ${blog.name} (${hostname})`);
  added++;
}

if (added > 0) {
  const updated = [...resources, ...newEntries];
  fs.writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`\nNew: ${added}, Total: ${updated.length}`);
} else {
  console.log('\nNo new targets.');
}
