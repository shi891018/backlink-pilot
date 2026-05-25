import { parse } from 'yaml';
import fs from 'fs';
const yaml = parse(fs.readFileSync('./targets.yaml', 'utf8'));
const submitted = parse(fs.readFileSync('./submissions.yaml', 'utf8'));
const doneSites = new Set((submitted.submissions||[]).filter(s=>s.status==='submitted').flatMap(s=>[s.site, s.url].filter(Boolean)));

let all = [];
for (const [section, entries] of Object.entries(yaml)) {
  if (!Array.isArray(entries)) continue;
  for (const s of entries) {
    all.push({...s, _section: section});
  }
}

const autoFree = all.filter(s =>
  s.auto === true &&
  s.status !== 'dead' &&
  s.status !== 'paid' &&
  s.status !== 'closed' &&
  !doneSites.has(s.name) &&
  !doneSites.has(s.url) &&
  !doneSites.has(s.submit_url)
);

console.log('Auto-submittable remaining:', autoFree.length);
autoFree.forEach(s => console.log(` [${s._section}] ${s.name||s.url} | ${s.submit_url||s.url} | DR:${s.dr||'?'} waiting:${s.waiting||false}`));
