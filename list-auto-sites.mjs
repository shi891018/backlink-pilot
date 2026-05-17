import { readFileSync } from 'fs';
import { parse } from 'yaml';

const raw = readFileSync('targets.yaml', 'utf8');
const targets = parse(raw);

// Flatten all sites from all categories
const allSites = [];
for (const [cat, sites] of Object.entries(targets)) {
  if (Array.isArray(sites)) {
    for (const s of sites) {
      allSites.push({ ...s, category: cat });
    }
  }
}

console.log('Total sites:', allSites.length);

// Find auto=true, not dead/paid, with submit_url
const autoSites = allSites.filter(s => 
  s.auto === true && 
  s.status !== 'dead' && 
  s.status !== 'paid' && 
  s.submit_url
);

console.log('Auto-submittable:', autoSites.length);
console.log('\n--- Sites ---');
autoSites.forEach(s => console.log(`[${s.category}] ${s.name}: ${s.submit_url}`));
