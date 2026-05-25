#!/usr/bin/env node
/**
 * discover-blogs.mjs
 * Discovers new WordPress blog posts for comment-submission, avoiding already-used domains.
 * Fetches each candidate, checks for WordPress comment form (textarea#comment + input#url),
 * and adds valid ones to backlink-resources.json (one per domain).
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const RESOURCES_PATH = resolve(ROOT, 'resources/backlink-resources.json');

// Candidate blog homepages/post-list pages to scan
const CANDIDATES = [
  // Math / Science / Tech
  'https://betterexplained.com/',
  'https://www.johndcook.com/blog/',
  'https://www.realclimate.org/',
  'https://aisnakeoil.com/',
  'https://www.ribbonfarm.com/',
  'https://neurologicablog.com/',
  'https://www.skepticalscience.com/',
  'https://blogs.sciencemag.org/',
  'https://www.sciencebasedmedicine.org/',
  'https://www.datanovia.com/en/blog/',
  'https://www.datasciencecentral.com/',
  'https://www.kdnuggets.com/',
  'https://www.r-bloggers.com/',
  'https://statmodeling.stat.columbia.edu/',
  'https://errorstatistics.com/',
  'https://www.johndcook.com/',

  // Education blogs
  'https://www.coolcatteacher.com/',
  'https://www.freetech4teachers.com/',
  'https://www.educationworld.com/',
  'https://blog.ed.ted.com/',
  'https://www.teachingchannel.org/blog/',
  'https://www.edweek.org/teaching-learning/',
  'https://thinkingmathematically.blogspot.com/',
  'https://www.thetechedvocate.org/',
  'https://classtechtips.com/',
  'https://technotes.idrea.ca/',
  'https://www.gettingsmart.com/',
  'https://www.middleweb.com/',

  // Small university/college blog platforms
  'https://blogs.otago.ac.nz/',
  'https://blogs.ub.edu/',
  'https://blogs.abo.fi/',
  'https://blogs.ntu.edu.sg/',
  'https://blogs.oulu.fi/',
  'https://blogs.helsinki.fi/',
  'https://blogs.uta.fi/',
  'https://blog.hw.ac.uk/',
  'https://blogs.bath.ac.uk/',
  'https://blogs.cardiff.ac.uk/',
  'https://blogs.ed.ac.uk/',
  'https://blogs.sussex.ac.uk/',

  // Food blogs (smaller, likely standard WP comments)
  'https://www.thefirstmess.com/',
  'https://www.browneyedbaker.com/',
  'https://www.lifesambrosia.com/',
  'https://www.bellyfull.net/',
  'https://www.thesaltymarshmallow.com/',
  'https://www.handletheheat.com/',
  'https://www.thetoastykitchen.com/',
  'https://iambaker.net/',
  'https://www.lifeloveandsugar.com/',
  'https://www.mybakingaddiction.com/',
  'https://www.shugarysweets.com/',
  'https://www.cookingclassy.com/',
  'https://tastesbetterfromscratch.com/',
  'https://dessertfortwo.com/',
  'https://www.foodwithfeeling.com/',
  'https://www.fifteenspatulas.com/',
  'https://www.butternutbakeryblog.com/',
  'https://www.sweetashoney.co/',
  'https://www.bromabakery.com/',
  'https://www.tablefortwoblog.com/',
  'https://www.sugarandsoul.co/',
  'https://www.savoryexperiments.com/',
  'https://www.completelydelicious.com/',
  'https://www.bluebowlrecipes.com/',
  'https://www.thecafesucrefarine.com/',
  'https://www.freshaprilflours.com/',
  'https://www.hummingbirdhigh.com/',
  'https://www.crazyforcrust.com/',
  'https://bakersroyale.com/',
  'https://www.foodiecrush.com/',
  'https://www.spendwithpennies.com/',
  'https://www.bunsinmyoven.com/',
  'https://www.abeautifulmess.com/',
  'https://www.twopeasandtheirpod.com/',
  'https://www.iwashyoudry.com/',
  'https://www.ambitiouskitchen.com/',
  'https://www.houseofnasheats.com/',
  'https://www.lecremedelacrumb.com/',
  'https://www.modernhoney.com/',
  'https://www.laurenslatest.com/',
  'https://www.yummymummykitchen.com/',
  'https://www.gimmesomeoven.com/',
  'https://www.melskitchencafe.com/',
  'https://www.chefsavvy.com/',
  'https://saltandbaker.com/',
  'https://www.thegunnysack.com/',
  'https://www.garnishandglaze.com/',
  'https://www.persnicketyplates.com/',

  // Travel blogs
  'https://www.adventurouskate.com/',
  'https://expertvagabond.com/',
  'https://www.ytravelblog.com/',
  'https://www.bemytravelmuse.com/',
  'https://alongdustyroads.com/',
  'https://www.dangerous-business.com/',
  'https://www.handluggageonly.co.uk/',
  'https://theplanetd.com/',
  'https://www.nomadicmatt.com/',
  'https://goatsontheroad.com/',
  'https://www.thevagabondstory.com/',
  'https://www.tropicaltravelblog.com/',
  'https://www.earthtrekkers.com/',
  'https://www.thewanderlustwithin.com/',
  'https://www.losttraveler.net/',
  'https://wanderingtraveler.com/',
  'https://www.nomadbyaccident.com/',
  'https://www.christineabroad.com/',
  'https://www.worldnomads.com/explore/',

  // Craft / DIY / Home
  'https://www.craftsbyamanda.com/',
  'https://www.skiptomylou.org/',
  'https://www.modpodgerocksblog.com/',
  'https://www.iheartcraftythings.com/',
  'https://www.thecraftpatchblog.com/',
  'https://www.happinessishomemade.net/',
  'https://www.sewmuchado.com/',
  'https://www.cleanandscentsible.com/',
  'https://www.polkadotchair.com/',
  'https://www.jaderbomb.com/',
  'https://www.madetobeamomma.com/',
  'https://www.simpleasthatblog.com/',
  'https://www.100layercake.com/',
  'https://www.hgtv.com/design/decorating',
  'https://www.thelovelycupboard.com/',
  'https://thecountrychiccottage.net/',
  'https://www.thistlewoodfarms.com/',

  // Health / Fitness
  'https://www.nerdfitness.com/',
  'https://marksdailyapple.com/',
  'https://breakingmuscle.com/',
  'https://www.muscleforlife.com/',
  'https://www.strongerbyscience.com/',
  'https://examine.com/articles/',
  'https://www.draxe.com/',
  'https://www.mindbodygreen.com/',
  'https://www.fitnesspainfree.com/',
  'https://www.menno.io/',

  // Personal development / Productivity
  'https://www.pickthebrain.com/',
  'https://www.thechangeblog.com/',
  'https://www.stevepavlina.com/blog/',
  'https://jamesclear.com/articles',
  'https://zenhabits.net/',
  'https://www.developgoodhabits.com/',
  'https://www.positivityblog.com/',
  'https://www.productivityist.com/',
  'https://asiancashflow.com/',
  'https://www.danpink.com/',

  // Photography / Design / Creative
  'https://www.lightstalking.com/',
  'https://digital-photography-school.com/',
  'https://www.slrlounge.com/',
  'https://www.photographytalk.com/',
  'https://www.photographymad.com/',
  'https://shotkit.com/',
  'https://www.capturetheatlas.com/',
  'https://www.bwvision.com/',

  // Parenting / Family
  'https://mommysblockparty.com/',
  'https://www.livingwellmom.com/',
  'https://www.raisinglittlesuperheroes.com/',
  'https://www.playpartyplan.com/',
  'https://frugalmomeh.com/',
  'https://www.lalymom.com/',
  'https://www.growingajeweledrose.com/',
  'https://www.fiskars.com/en-us/blog',
  'https://childhood101.com/',

  // Finance / Frugal living
  'https://www.getrichslowly.org/',
  'https://affordanything.com/',
  'https://www.rockstarmoneynerd.com/',
  'https://frugalwoodlands.com/',
  'https://www.youneedabudget.com/blog/',
  'https://www.budgetbytes.com/',
  'https://www.moneysavingmom.com/',
  'https://www.thefrugalgirl.com/',
  'https://frugallivingnw.com/',
  'https://wisebread.com/',

  // Gardening / Nature
  'https://gardentherapy.ca/',
  'https://savvygardening.com/',
  'https://awaytogarden.com/',
  'https://www.epicgardening.com/',
  'https://www.thespruceeats.com/',
  'https://coldclimategardening.com/',
  'https://www.younghouselove.com/',
  'https://practicalselfreliance.com/',
  'https://www.thetreecenter.com/blog/',

  // Green / Sustainability
  'https://www.sustainablog.org/',
  'https://www.treehugger.com/',
  'https://www.earthday.org/blog/',
  'https://www.naturallivingideas.com/',
  'https://ecowatch.com/',
  'https://www.greenamerica.org/blog',
  'https://inhabitat.com/',

  // General / Community blogs
  'https://www.theatlantic.com/',
  'https://www.vox.com/',
  'https://waitbutwhy.com/',
  'https://kottke.org/',
  'https://www.brainpickings.org/',
  'https://www.themarginaliandotcom.com/',
  'https://longreads.com/',
  'https://www.brainpickings.org/',
];

// How many URLs to attempt extracting from each homepage
const POSTS_PER_SITE = 2;
// Fetch timeout
const TIMEOUT_MS = 10000;

function getHostname(url) {
  try { return new URL(url).hostname; } catch { return ''; }
}

// Lightweight HTTP fetch (no browser)
async function httpGet(url, timeoutMs = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
  finally { clearTimeout(id); }
}

// Extract blog post URLs from RSS feed XML
function extractFromRss(xml, host) {
  const found = [];
  const linkRe = /<link>(https?:\/\/[^<]+)<\/link>/g;
  const guidRe = /<guid(?:[^>]*)>(https?:\/\/[^<]+)<\/guid>/g;
  let m;
  while ((m = linkRe.exec(xml)) !== null) {
    try { if (new URL(m[1]).hostname === host) found.push(m[1]); } catch {}
  }
  while ((m = guidRe.exec(xml)) !== null) {
    try { if (new URL(m[1]).hostname === host && !found.includes(m[1])) found.push(m[1]); } catch {}
  }
  return found.slice(0, POSTS_PER_SITE);
}

// Extract blog post URLs from a page's HTML (fallback)
function extractPostUrls(html, baseUrl) {
  const host = getHostname(baseUrl);
  // Match href links that look like WordPress posts (year/month/day or /articles/ or /blog/)
  const patterns = [
    /href="(https?:\/\/[^"#?]+\/\d{4}\/\d{2}\/[^"#?/][^"#?]*)"/g,
    /href="(https?:\/\/[^"#?]+\/\d{4}\/[^"#?/][^"#?]*)"/g,
    /href="(https?:\/\/[^"#?]+\/(?:articles|blog|post|posts)\/[^"#?/][^"#?]*)"/g,
  ];
  const found = new Set();
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      try {
        const u = new URL(m[1]);
        if (u.hostname === host && !m[1].match(/\/(author|category|tag|page|feed|wp-content|wp-json)\//))
          found.add(m[1]);
      } catch {}
    }
  }
  return [...found].slice(0, POSTS_PER_SITE);
}

// Check if a blog post has an open WordPress comment form with URL field
function hasOpenCommentForm(html) {
  if (!html) return false;
  const lower = html.toLowerCase();
  // Must have comment textarea
  if (!lower.includes('name="comment"') && !lower.includes('id="comment"')) return false;
  // Must have URL field
  if (!lower.includes('name="url"') && !lower.includes('id="url"')) return false;
  // Skip if captcha
  if (/recaptcha|hcaptcha|cf-turnstile|g-recaptcha/i.test(html)) return false;
  // Skip if login required
  if (/you must be logged in|login to comment|sign in to comment/i.test(html)) return false;
  return true;
}

async function main() {
  const resources = JSON.parse(readFileSync(RESOURCES_PATH, 'utf-8'));
  const existing = new Set(resources.map(r => r.url));
  const submittedDomains = new Set(
    resources.filter(r => r.submitted).map(r => getHostname(r.url)).filter(Boolean)
  );
  const allDomains = new Set(resources.map(r => getHostname(r.url)).filter(Boolean));

  console.log(`Existing resources: ${resources.length}, submitted domains: ${submittedDomains.size}`);

  let added = 0;
  const newEntries = [];

  for (let i = 0; i < CANDIDATES.length; i++) {
    const candidateUrl = CANDIDATES[i];
    const host = getHostname(candidateUrl);
    if (!host) continue;
    // Skip already-submitted domains
    if (submittedDomains.has(host)) {
      console.log(`[${i+1}/${CANDIDATES.length}] SKIP (submitted domain): ${host}`);
      continue;
    }

    process.stdout.write(`[${i+1}/${CANDIDATES.length}] ${host} ... `);

    // Try RSS feed first (most reliable for WordPress)
    const feedUrls = [`https://${host}/feed/`, `https://${host}/rss`, `https://${host}/feed`];
    let postUrls = [];
    for (const feedUrl of feedUrls) {
      const feedXml = await httpGet(feedUrl, 8000);
      if (feedXml && feedXml.includes('<rss') || feedXml && feedXml.includes('<feed')) {
        postUrls = extractFromRss(feedXml, host);
        if (postUrls.length > 0) break;
      }
    }
    // Fallback: parse homepage HTML
    if (postUrls.length === 0) {
      const html = await httpGet(candidateUrl);
      if (!html) { console.log('unreachable'); continue; }
      postUrls = extractPostUrls(html, candidateUrl);
    }
    if (postUrls.length === 0) { console.log('no posts found'); continue; }

    // Check each post for open comment form
    let added_this = false;
    for (const postUrl of postUrls) {
      if (existing.has(postUrl)) continue;
      if (allDomains.has(getHostname(postUrl)) && getHostname(postUrl) !== host) continue;

      const postHtml = await httpGet(postUrl, 8000);
      if (!postHtml) continue;

      if (hasOpenCommentForm(postHtml)) {
        newEntries.push({
          type: 'blog_comment',
          url: postUrl,
          discovered_from: 'manual:discover-blogs',
          has_captcha: false,
          link_strategy: 'url_field',
          link_format: 'html',
          has_url_field: true,
        });
        existing.add(postUrl);
        added++;
        added_this = true;
        console.log(`✅ ${postUrl.slice(0, 80)}`);
        break; // one per domain
      }
    }
    if (!added_this) {
      console.log(`no valid comment form`);
    }

    // Brief pacing
    await new Promise(r => setTimeout(r, 500));
  }

  // Write back
  const updated = [...resources, ...newEntries];
  writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`\n✅ Added ${added} new blog targets. Total resources: ${updated.length}`);
}

main().catch(console.error);
