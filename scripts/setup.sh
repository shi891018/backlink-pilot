#!/usr/bin/env bash

# setup.sh — First-time setup wizard
#
# Checks all prerequisites and guides the user through initial setup.
# Safe to run multiple times — skips already-completed steps.
#
# Usage:
#   ./scripts/setup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✅ $*${NC}"; }
fail() { echo -e "  ${RED}❌ $*${NC}"; }
warn() { echo -e "  ${YELLOW}⚠️  $*${NC}"; }

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     Backlink Pilot v2.1 — Setup          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

ERRORS=0

# 1. Node.js
echo "1️⃣  Node.js"
if command -v node &>/dev/null; then
  NODE_VER=$(node --version | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    ok "Node.js $NODE_VER"
  else
    fail "Node.js $NODE_VER (need 18+)"
    ERRORS=$((ERRORS + 1))
  fi
else
  fail "Node.js not installed — https://nodejs.org"
  ERRORS=$((ERRORS + 1))
fi

# 2. npm dependencies
echo "2️⃣  Dependencies"
if [ -d node_modules ]; then
  ok "node_modules exists"
else
  warn "node_modules missing — running npm install..."
  npm install --silent
  ok "npm install done"
fi

# 3. bb-browser
echo "3️⃣  bb-browser"
if command -v bb-browser &>/dev/null; then
  BB_VER=$(bb-browser --version 2>/dev/null || echo "unknown")
  ok "bb-browser $BB_VER"
else
  warn "bb-browser not installed"
  echo "     Install: npm install -g bb-browser"
  echo "     (Optional but recommended — uses real Chrome)"
fi

# 4. Chrome connectivity
echo "4️⃣  Chrome"
if command -v bb-browser &>/dev/null; then
  if bb-browser tab list &>/dev/null 2>&1; then
    ok "Chrome is running and reachable"
  else
    warn "Chrome not running"
    echo "     Start: bb-browser open about:blank"
  fi
else
  warn "Skipped (bb-browser not installed)"
fi

# 5. config.yaml
echo "5️⃣  Configuration"
if [ -f config.yaml ]; then
  PRODUCT_NAME=$(node -e "const y=require('yaml');const d=y.parse(require('fs').readFileSync('config.yaml','utf-8'));console.log(d.product?.name||'NOT SET')" 2>/dev/null)
  if [ "$PRODUCT_NAME" != "NOT SET" ] && [ -n "$PRODUCT_NAME" ]; then
    ok "config.yaml — product: $PRODUCT_NAME"
  else
    warn "config.yaml exists but product.name is empty"
  fi
else
  warn "config.yaml not found"
  echo "     Create: cp config.example.yaml config.yaml"
  echo "     Then edit with your product info"
fi

# 6. targets.yaml
echo "6️⃣  Targets database"
if [ -f targets.yaml ]; then
  SITE_COUNT=$(node -e "
const y=require('yaml');const d=y.parse(require('fs').readFileSync('targets.yaml','utf-8'));
let c=0;for(const[,s]of Object.entries(d)){if(Array.isArray(s))c+=s.length;}console.log(c);
" 2>/dev/null)
  ok "targets.yaml — $SITE_COUNT sites"
else
  fail "targets.yaml missing"
  ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "───────────────────────────────────"
if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}All checks passed! Ready to submit.${NC}"
  echo ""
  echo "Next steps:"
  echo "  • Claude Code:  claude → \"帮我提交外链\""
  echo "  • Manual:       node src/cli.js submit <site> --engine bb"
  echo "  • Stats:        ./scripts/stats.sh"
else
  echo -e "${RED}$ERRORS issue(s) found. Fix them before submitting.${NC}"
fi
echo ""
