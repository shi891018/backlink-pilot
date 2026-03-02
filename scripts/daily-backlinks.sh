#!/usr/bin/env bash

# daily-backlinks.sh — Daily cron job for automated backlink submission
#
# Usage:
#   ./scripts/daily-backlinks.sh
#
# Add to crontab (run daily at 9am):
#   0 9 * * * cd /path/to/backlink-pilot && ./scripts/daily-backlinks.sh >> logs/cron.log 2>&1

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "========================================="
echo "Daily Backlink Submission"
echo "Date: $(date)"
echo "========================================="
echo ""

# Calculate which site to target (rotate daily)
# Day 0,3,6,9... → site 0
# Day 1,4,7,10... → site 1
# Day 2,5,8,11... → site 2
DAY_OF_YEAR=$(date +%j)
SITE_INDEX=$((DAY_OF_YEAR % 3))

echo "🎯 Target site index: $SITE_INDEX"
echo ""

# Run batch submission with limit of 7 per site per day
node src/batch-submit.js --site "$SITE_INDEX" --limit 7

echo ""
echo "✅ Daily submission completed"
echo "========================================="
