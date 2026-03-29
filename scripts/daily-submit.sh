#!/usr/bin/env bash

# daily-submit.sh — Daily automated directory site submission
#
# Picks N unsubmitted sites from targets.yaml and submits via bb-browser.
# Designed for cron: runs unattended, logs results, respects pacing.
#
# Usage:
#   ./scripts/daily-submit.sh              # submit 5 sites (default)
#   ./scripts/daily-submit.sh 10           # submit 10 sites
#
# Cron (daily at 10am):
#   0 10 * * * cd /path/to/backlink-pilot && ./scripts/daily-submit.sh >> logs/daily.log 2>&1
#
# Prerequisites:
#   - config.yaml configured
#   - bb-browser installed and Chrome accessible

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

LIMIT="${1:-5}"
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/daily-$(date +%Y-%m-%d).log"
PAUSE_MIN=60
PAUSE_MAX=180

mkdir -p "$LOG_DIR"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "========================================="
log "Daily Directory Submission — $(date '+%Y-%m-%d')"
log "Target: $LIMIT sites"
log "========================================="

# Check prerequisites
if ! command -v bb-browser &>/dev/null; then
  log "ERROR: bb-browser not installed. Run: npm install -g bb-browser"
  exit 1
fi

if [ ! -f config.yaml ]; then
  log "ERROR: config.yaml not found. Run: cp config.example.yaml config.yaml"
  exit 1
fi

# Ensure Chrome is running
if ! bb-browser tab list &>/dev/null 2>&1; then
  log "Starting Chrome via bb-browser..."
  bb-browser open about:blank &>/dev/null 2>&1 || true
  sleep 3
fi

# Get already-submitted sites from submissions.yaml
SUBMITTED=""
if [ -f submissions.yaml ]; then
  SUBMITTED=$(grep "site:" submissions.yaml 2>/dev/null | sed 's/.*site: *//' | sort -u)
fi

# Parse targets.yaml for auto-submittable, live sites
# Extract submit URLs where auto=yes and no dead/paid status
TARGETS=$(node -e "
const fs = require('fs');
const yaml = require('yaml');
const data = yaml.parse(fs.readFileSync('targets.yaml', 'utf-8'));
const submitted = new Set(process.argv.slice(1));
const urls = [];
for (const [category, sites] of Object.entries(data)) {
  if (!Array.isArray(sites)) continue;
  for (const site of sites) {
    if (site.auto !== 'yes') continue;
    if (site.status === 'dead' || site.status === 'paid') continue;
    if (!site.submit_url) continue;
    if (submitted.has(site.submit_url) || submitted.has(site.name)) continue;
    urls.push(site.submit_url);
  }
}
// Shuffle
for (let i = urls.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [urls[i], urls[j]] = [urls[j], urls[i]];
}
console.log(urls.slice(0, ${LIMIT}).join('\n'));
" $SUBMITTED 2>/dev/null)

if [ -z "$TARGETS" ]; then
  log "No unsubmitted sites available. All done!"
  exit 0
fi

COUNT=0
TOTAL=$(echo "$TARGETS" | wc -l | tr -d ' ')
SUCCESS=0
FAILED=0

log "Found $TOTAL sites to submit"
log ""

while IFS= read -r url; do
  COUNT=$((COUNT + 1))
  log "[$COUNT/$TOTAL] Submitting: $url"

  if node src/cli.js submit "$url" --engine bb >> "$LOG_FILE" 2>&1; then
    SUCCESS=$((SUCCESS + 1))
    log "  ✅ Success"
  else
    FAILED=$((FAILED + 1))
    log "  ❌ Failed (see log for details)"
  fi

  # Pace: random delay between submissions (except last one)
  if [ "$COUNT" -lt "$TOTAL" ]; then
    PAUSE=$(( RANDOM % (PAUSE_MAX - PAUSE_MIN + 1) + PAUSE_MIN ))
    log "  ⏳ Waiting ${PAUSE}s before next..."
    sleep "$PAUSE"
  fi
done <<< "$TARGETS"

log ""
log "========================================="
log "Results: $SUCCESS success / $FAILED failed / $TOTAL total"
log "========================================="
