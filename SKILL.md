---
name: backlink-pilot
description: Use for submitting products to directory sites, awesome-lists, or search engines.
disable-auto-invoke: true
---

# Backlink Pilot

Automated backlink submission for indie products. One config, one command.

## Setup

```bash
cd ~/Downloads/backlink-pilot
cp config.example.yaml config.yaml   # edit with product details
```

## Commands

```bash
node src/cli.js scout <url> --deep          # discover form fields
node src/cli.js submit <site>               # submit to directory
node src/cli.js submit <site> --dry-run     # preview only
node src/cli.js awesome <list-key>          # generate awesome-list issue
node src/cli.js indexnow <url>              # ping search engines
node src/cli.js status                      # check submissions
```

Site adapters and awesome-list targets: see `adapters.md`

## Agent Workflow

1. Check `config.yaml` exists
2. Scout unknown sites first: `scout <url> --deep`
3. Submit one at a time — check output for success/failure
4. Track progress: `status`
5. Pace: 1-3 min between sites, 30-60 min same-site retry

## Key Constraints

- **Never submit same product twice to same site**
- Some sites reject UTM params → submit clean URL
- Google OAuth sites need manual first login (2FA)
- Cloudflare Turnstile = hard wall → skip (AlternativeTo, ProductHunt)
- rebrowser-playwright must be installed (`npm install`)
- Troubleshooting: see `TROUBLESHOOTING.md`
