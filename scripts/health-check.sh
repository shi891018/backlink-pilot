#!/usr/bin/env bash

# health-check.sh — Audit targets.yaml for dead/alive sites
#
# HTTP HEAD checks every auto-submittable site, reports status.
# Updates targets.yaml with dead site markers.
#
# Usage:
#   ./scripts/health-check.sh              # check all auto sites
#   ./scripts/health-check.sh --quick      # check first 20 only
#   ./scripts/health-check.sh --fix        # auto-update targets.yaml
#
# Cron (weekly on Sunday at 3am):
#   0 3 * * 0 cd /path/to/backlink-pilot && ./scripts/health-check.sh --fix >> logs/health.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

QUICK=false
FIX=false
for arg in "$@"; do
  case "$arg" in
    --quick) QUICK=true ;;
    --fix)   FIX=true ;;
  esac
done

LOG_DIR="logs"
REPORT="$LOG_DIR/health-$(date +%Y-%m-%d).csv"
mkdir -p "$LOG_DIR"

echo "url,status,http_code,response_time" > "$REPORT"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

log "========================================="
log "Site Health Check — $(date '+%Y-%m-%d')"
log "========================================="

# Extract auto-submittable URLs
URLS=$(node -e "
const fs = require('fs');
const yaml = require('yaml');
const data = yaml.parse(fs.readFileSync('targets.yaml', 'utf-8'));
for (const [cat, sites] of Object.entries(data)) {
  if (!Array.isArray(sites)) continue;
  for (const s of sites) {
    if (s.auto === 'yes' && s.submit_url) console.log(s.submit_url);
  }
}
" 2>/dev/null)

TOTAL=$(echo "$URLS" | wc -l | tr -d ' ')
if $QUICK; then
  URLS=$(echo "$URLS" | head -20)
  TOTAL=20
  log "Quick mode: checking first 20 sites"
fi

log "Checking $TOTAL sites..."
log ""

ALIVE=0
DEAD=0
SLOW=0
COUNT=0

while IFS= read -r url; do
  COUNT=$((COUNT + 1))

  # HTTP HEAD with 10s timeout
  HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 -L -I "$url" 2>/dev/null || echo "000")
  RESPONSE_TIME=$(curl -sS -o /dev/null -w "%{time_total}" --max-time 10 -L -I "$url" 2>/dev/null || echo "99")

  if [ "$HTTP_CODE" = "000" ]; then
    STATUS="timeout"
    DEAD=$((DEAD + 1))
    ICON="💀"
  elif [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
    STATUS="alive"
    ALIVE=$((ALIVE + 1))
    ICON="✅"
    # Check if slow (>5s)
    if (( $(echo "$RESPONSE_TIME > 5.0" | bc -l 2>/dev/null || echo 0) )); then
      SLOW=$((SLOW + 1))
      ICON="🐢"
    fi
  elif [ "$HTTP_CODE" -ge 400 ]; then
    STATUS="dead"
    DEAD=$((DEAD + 1))
    ICON="💀"
  else
    STATUS="unknown"
    ICON="❓"
  fi

  printf "  %s [%3d/%d] %s — %s (%ss)\n" "$ICON" "$COUNT" "$TOTAL" "$HTTP_CODE" "$url" "$RESPONSE_TIME"
  echo "$url,$STATUS,$HTTP_CODE,$RESPONSE_TIME" >> "$REPORT"

done <<< "$URLS"

log ""
log "========================================="
log "Results: $ALIVE alive / $DEAD dead / $SLOW slow / $TOTAL total"
log "Report: $REPORT"
log "========================================="

# Auto-fix targets.yaml if --fix
if $FIX && [ "$DEAD" -gt 0 ]; then
  log ""
  log "Updating targets.yaml with dead site markers..."

  node -e "
const fs = require('fs');
const csv = fs.readFileSync('$REPORT', 'utf-8').split('\n').slice(1).filter(Boolean);
const dead = new Set();
for (const line of csv) {
  const [url, status] = line.split(',');
  if (status === 'dead' || status === 'timeout') dead.add(url);
}

let yaml = fs.readFileSync('targets.yaml', 'utf-8');
let fixed = 0;
for (const url of dead) {
  // Find the site entry and mark it
  const escaped = url.replace(/[.*+?^\${}()|[\]\\\\]/g, '\\\\$&');
  const re = new RegExp('(submit_url: ' + escaped + '[\\\\s\\\\S]*?)auto: yes', 'm');
  if (re.test(yaml)) {
    yaml = yaml.replace(re, '\$1auto: no');
    fixed++;
  }
}
if (fixed > 0) {
  fs.writeFileSync('targets.yaml', yaml);
  console.log('Updated ' + fixed + ' dead sites in targets.yaml');
}
" 2>/dev/null

  log "Done."
fi
