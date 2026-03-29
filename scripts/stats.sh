#!/usr/bin/env bash

# stats.sh — Submission statistics and progress report
#
# Reads submissions.yaml and targets.yaml to show:
#   - Total submitted / remaining
#   - Success rate
#   - Per-category breakdown
#   - Recent activity
#
# Usage:
#   ./scripts/stats.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

node -e "
const fs = require('fs');
const yaml = require('yaml');

// Load targets
const targets = yaml.parse(fs.readFileSync('targets.yaml', 'utf-8'));
let totalSites = 0, autoSites = 0, deadSites = 0, paidSites = 0;
const categories = {};

for (const [cat, sites] of Object.entries(targets)) {
  if (!Array.isArray(sites)) continue;
  categories[cat] = { total: sites.length, auto: 0, dead: 0 };
  for (const s of sites) {
    totalSites++;
    if (s.auto === 'yes') { autoSites++; categories[cat].auto++; }
    if (s.status === 'dead') { deadSites++; categories[cat].dead++; }
    if (s.status === 'paid') paidSites++;
  }
}

// Load submissions
let submissions = [];
if (fs.existsSync('submissions.yaml')) {
  const subData = yaml.parse(fs.readFileSync('submissions.yaml', 'utf-8'));
  submissions = Array.isArray(subData) ? subData : (subData?.submissions || []);
}

const submitted = submissions.length;
const success = submissions.filter(s => s.status === 'submitted' || s.status === 'success').length;
const failed = submissions.filter(s => s.status === 'failed' || s.status === 'error').length;
const remaining = autoSites - submitted;

// Output
console.log('');
console.log('╔══════════════════════════════════════════╗');
console.log('║     Backlink Pilot — Statistics           ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');
console.log('📊 Overview');
console.log('───────────────────────────────────');
console.log('  Total sites in database:  ' + totalSites);
console.log('  Auto-submittable:         ' + autoSites);
console.log('  Dead (404/500):           ' + deadSites);
console.log('  Paid only:                ' + paidSites);
console.log('');
console.log('📬 Submissions');
console.log('───────────────────────────────────');
console.log('  Total submitted:          ' + submitted);
console.log('  Successful:               ' + success);
console.log('  Failed:                   ' + failed);
console.log('  Success rate:             ' + (submitted > 0 ? Math.round(success/submitted*100) + '%' : 'N/A'));
console.log('  Remaining (auto):         ' + Math.max(0, remaining));
console.log('  Progress:                 ' + (autoSites > 0 ? Math.round(submitted/autoSites*100) + '%' : '0%'));
console.log('');

// Progress bar
const pct = autoSites > 0 ? submitted / autoSites : 0;
const barLen = 30;
const filled = Math.round(pct * barLen);
const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);
console.log('  [' + bar + '] ' + Math.round(pct*100) + '%');
console.log('');

console.log('📁 By Category');
console.log('───────────────────────────────────');
for (const [cat, data] of Object.entries(categories)) {
  const label = cat.replace(/_/g, ' ');
  console.log('  ' + label);
  console.log('    Total: ' + data.total + ' | Auto: ' + data.auto + ' | Dead: ' + data.dead);
}
console.log('');

// Recent activity (last 10)
if (submissions.length > 0) {
  console.log('📅 Recent Activity (last 10)');
  console.log('───────────────────────────────────');
  const recent = submissions.slice(-10).reverse();
  for (const s of recent) {
    const icon = (s.status === 'submitted' || s.status === 'success') ? '✅' : '❌';
    const date = s.date || s.timestamp || '—';
    const site = s.site || s.url || '—';
    console.log('  ' + icon + ' ' + date + ' — ' + site);
  }
  console.log('');
}
" 2>/dev/null
