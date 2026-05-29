/**
 * discover-from-winners.mjs
 * Crawl blogrolls/links pages of blogs that successfully accepted comments
 * to find more similar small personal blogs.
 */

import fs from 'fs';
import https from 'https';
import http from 'http';

const RESOURCES_PATH = './resources/backlink-resources.json';
const resources = JSON.parse(fs.readFileSync(RESOURCES_PATH, 'utf8'));
const existingDomains = new Set(resources.map(r => {
  try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch { return ''; }
}));

function fetchUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      timeout: 12000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlogDiscovery/1.0)' }
    }, res => {
      // Follow redirects
      if ([301,302,303,307].includes(res.statusCode) && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(() => resolve(''));
      }
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

// Domains that are definitely not personal blogs accepting comments
const BLOCKED_HOSTS = new Set([
  'typepad.com', 'substackcdn.com', 'cdn.shopify.com', 'shopify.com',
  'feeds.feedburner.com', 'feeds.feedblitz.com', 'feeds.kottke.org', 'feeds.castos.com',
  'threads.net', 'threads.com', 'bandcamp.com', 'patreon.com', 'linktr.ee',
  'tiktok.com', 'flipboard.com', 'pinterest.com', 'flickr.com', 'reddit.com',
  'vox.com', 'cnet.com', 'ign.com', 'screenrant.com', 'cnbc.com', 'bbc.com',
  'yahoo.com', 'sports.yahoo.com', 'ted.com', 'nber.org', 'vatican.va',
  'autodesk.com', 'wpvip.com', 'arcustech.com', 'ziffdavis.com', 'ziffmedia.com',
  'dublincore.org', 'aiimpacts.org', '80000hours.org',
]);

// Asset file extensions that aren't HTML pages
const ASSET_EXTS = /\.(css|js|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|ico|xml|json|rss|atom)(\?|$)/i;

function extractLinks(html, baseHost) {
  const links = [];
  const re = /href=["'](https?:\/\/[^"'>\s]+)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const u = new URL(m[1]);
      const host = u.hostname.replace(/^www\./, '');
      // Skip asset files
      if (ASSET_EXTS.test(u.pathname)) continue;
      // Skip blocked hosts
      if (BLOCKED_HOSTS.has(host)) continue;
      // Skip CDN subdomains (cdn.*, resources.*, static.*, assets.*)
      if (/^(cdn|resources|static|assets|media|img|images)\./i.test(u.hostname)) continue;
      // Skip TypePad (commenting disabled platform-wide)
      if (host.includes('typepad.com')) continue;
      if (host !== baseHost && !host.includes('google') && !host.includes('facebook')
        && !host.includes('twitter') && !host.includes('instagram') && !host.includes('youtube')
        && !host.includes('linkedin') && !host.includes('amazon') && !host.includes('wordpress.org')
        && !host.includes('gravatar') && !host.includes('wp.com') && !host.includes('w3.org')
        && !host.includes('jquery') && !host.includes('cloudflare') && !host.includes('googleapis')
        && !host.includes('gstatic') && !host.includes('bootstrapcdn') && u.pathname.length < 80) {
        links.push({ url: m[1].replace(/[?#].*/, ''), host });
      }
    } catch {}
  }
  return links;
}

function looksLikeBlog(url, html) {
  const h = html.toLowerCase();
  // Require concrete blog platform signals, not just loose "comment" keyword
  const hasPlatform = h.includes('wp-content') || h.includes('wordpress')
    || h.includes('blogger.com') || h.includes('blogspot')
    || h.includes('ghost.io') || h.includes('ghost-theme');
  const hasCommentForm = h.includes('leave a reply') || h.includes('post a comment')
    || h.includes('disqus') || h.includes('id="comment"') || h.includes('name="comment"')
    || h.includes('textarea') && h.includes('comment');
  // Substack: only accept .substack.com domains, not substackcdn
  const isSubstack = url.includes('.substack.com') && !url.includes('substackcdn');
  return (hasPlatform || hasCommentForm || isSubstack) && html.length > 5000;
}

// Seeds: fresh blogs that accepted comments — crawl THEIR blogrolls
const SEEDS = [
  // Math/academic WordPress blogs that accepted comments
  { url: 'http://johncarlosbaez.wordpress.com/', name: 'John Baez' },
  { url: 'http://gilkalai.wordpress.com/', name: 'Gil Kalai' },
  { url: 'http://lucatrevisan.wordpress.com/', name: 'Luca Trevisan' },
  { url: 'http://lamington.wordpress.com/', name: 'Lamington' },
  { url: 'http://matthewkahle.wordpress.com/', name: 'Matthew Kahle' },
  { url: 'http://mattbakerblog.wordpress.com/', name: 'Matt Baker' },
  { url: 'http://sbseminar.wordpress.com/', name: 'SB Seminar' },
  { url: 'http://mathbabe.org/', name: 'Mathbabe' },
  { url: 'https://polymathprojects.org/', name: 'Polymath Projects' },
  { url: 'http://blameitontheanalyst.wordpress.com/', name: 'Blame it on the Analyst' },
  { url: 'http://burttotaro.wordpress.com/', name: 'Burt Totaro' },
  { url: 'https://homotopytypetheory.org/', name: 'HoTT' },
  { url: 'http://orgprepdaily.wordpress.com/', name: 'OrgPrepDaily' },
  { url: 'http://cameroncounts.wordpress.com/', name: 'Cameron Counts' },
  // Philosophy/general intellectual blogs with blogrolls
  { url: 'https://crookedtimber.org/', name: 'Crooked Timber' },
  { url: 'https://www.languagehat.com/', name: 'Language Hat' },
  { url: 'https://andrewgelman.com/', name: 'Andrew Gelman' },
  { url: 'https://statmodeling.stat.columbia.edu/', name: 'Statistical Modeling' },
  // Math education blogs
  { url: 'https://danmeyer.wordpress.com/', name: 'Dan Meyer' },
  { url: 'https://samjshah.com/', name: 'Sam Shah' },
  // Chemistry/bio blogs with blogrolls
  { url: 'https://pipeline.corante.com/', name: 'In the Pipeline' },
  { url: 'https://www.chemistryworld.com/blogs', name: 'Chemistry World Blogs' },
  { url: 'https://scienceblogs.com/thescientificactivist/', name: 'Scientific Activist' },
  // Stats & data
  { url: 'https://www.fharrell.com/', name: 'Frank Harrell' },
  { url: 'https://www.statisticshowto.com/', name: 'Statistics How To' },
  // 2026-05-28 fresh successes
  { url: 'https://ratiobound.wordpress.com/', name: 'Ratio Bound' },
  { url: 'https://ifwisdomwereteachable.wordpress.com/', name: 'If Wisdom Were Teachable' },
  { url: 'https://sylvyanscombe.wordpress.com/', name: 'Sylvy Anscombe' },
  { url: 'https://symomega.wordpress.com/', name: 'Symomega' },
  { url: 'https://johnquiggin.com/', name: 'John Quiggin' },
  { url: 'https://emersonj.wordpress.com/', name: 'Emerson J' },
  { url: 'https://faroutliers.wordpress.com/', name: 'Far Outliers' },
  { url: 'https://abadguide.wordpress.com/', name: 'A Bad Guide' },
  { url: 'https://xixvek.wordpress.com/', name: 'Xixvek' },
  { url: 'https://bdralyuk.wordpress.com/', name: 'Bdralyuk' },
  { url: 'https://justinlanier.org/', name: 'Justin Lanier' },
  { url: 'https://thelondoncolumn.com/', name: 'The London Column' },
  { url: 'https://apt11d.com/', name: 'Apt11d' },
  { url: 'https://quicklatex.com/', name: 'QuickLaTeX' },
  // 2026-05-29 fresh successes
  { url: 'https://thephotoexchange.blogspot.com/', name: 'The Photo Exchange' },
  { url: 'https://honest-broker.substack.com/', name: 'The Honest Broker' },
  { url: 'https://pauldrybooks.com/', name: 'Paul Dry Books' },
  { url: 'https://www.eastlondonlocal.com/', name: 'East London Local' },
  { url: 'https://unrealisticdialogue.wordpress.com/', name: 'Unrealistic Dialogue' },
  // Diverse new niches - photography/art/hobbyist blogs with large blogrolls
  { url: 'https://www.naturescrusaders.com/', name: 'Natures Crusaders' },
  { url: 'https://digital-photography-school.com/', name: 'Digital Photography School' },
  { url: 'https://www.photocritique.net/', name: 'Photocritique' },
  { url: 'https://kottke.org/', name: 'Kottke' },
  { url: 'https://www.metafilter.com/', name: 'MetaFilter' },
  { url: 'https://boingboing.net/', name: 'Boing Boing' },
  { url: 'https://www.instructables.com/', name: 'Instructables' },
  { url: 'https://hackaday.com/', name: 'Hackaday' },
  { url: 'https://www.makeuseof.com/', name: 'MakeUseOf' },
  { url: 'https://lifehacker.com/', name: 'Lifehacker' },
  { url: 'https://marginalrevolution.com/', name: 'Marginal Revolution' },
  { url: 'https://slatestarcodex.com/', name: 'Slate Star Codex' },
  { url: 'https://www.scottaaronson.com/blog/', name: 'Shtetl-Optimized' },
  { url: 'https://michaelnielsen.org/blog/', name: 'Michael Nielsen' },
  { url: 'https://astralcodexten.substack.com/', name: 'Astral Codex Ten' },
  { url: 'https://www.gwern.net/', name: 'Gwern' },
  { url: 'https://rolfpotts.com/', name: 'Rolf Potts' },
  { url: 'https://zenhabits.net/', name: 'Zen Habits' },
  { url: 'https://paulgraham.com/', name: 'Paul Graham' },
  // Better seeds: small personal hobbyist/academic WordPress blogs with blogrolls
  // History & literature
  { url: 'https://electricliterature.com/', name: 'Electric Literature' },
  { url: 'https://www.historytoday.com/blog', name: 'History Today Blog' },
  // Cooking/food personal blogs with blogrolls
  { url: 'https://101cookbooks.com/', name: '101 Cookbooks' },
  // Personal science/engineering blogs
  { url: 'https://blog.regehr.org/', name: 'Embedded in Academia' },
  { url: 'https://jvns.ca/', name: 'Julia Evans' },
  { url: 'https://nullprogram.com/', name: 'Null Program' },
  // Philosophy/law/social science personal blogs
  { url: 'https://volokh.com/', name: 'Volokh Conspiracy' },
  { url: 'https://balkin.blogspot.com/', name: 'Balkinization' },
  // 2026-05-29 productive successes — quantum/rationalist/stats blogroll
  { url: 'https://quantumfrontiers.com/', name: 'Quantum Frontiers' },
  { url: 'http://windowsontheory.org/', name: 'Windows on Theory' },
  { url: 'https://thezvi.wordpress.com/', name: 'The Zvi' },
  { url: 'https://westhunt.wordpress.com/', name: 'West Hunter' },
  { url: 'http://acesounderglass.com/', name: 'Aceso Under Glass' },
  { url: 'https://sideways-view.com/', name: 'Sideways View' },
  { url: 'http://pseudoerasmus.com/', name: 'Pseudoerasmus' },
  { url: 'https://statmodeling.stat.columbia.edu/', name: 'Statistical Modeling Columbia' },
  // Additional EA/rationalist adjacent blogs with blogrolls
  { url: 'https://www.overcomingbias.com/', name: 'Overcoming Bias' },
  { url: 'https://lesswrong.com/', name: 'LessWrong' },
  { url: 'https://forum.effectivealtruism.org/', name: 'EA Forum' },
  // CS theory blogs
  { url: 'https://blog.computationalcomplexity.org/', name: 'Computational Complexity' },
  { url: 'https://godel-lost-letter.com/', name: 'Godel\'s Lost Letter' },
  { url: 'https://rjlipton.com/', name: 'P vs NP' },
  // Personal history/culture blogs
  { url: 'https://www.languagehat.com/', name: 'Language Hat' }, // already in seeds above but add here for 2nd crawl
  { url: 'https://www.aldaily.com/', name: 'Arts & Letters Daily' },
  { url: 'https://3quarksdaily.com/', name: '3 Quarks Daily' },
  // 2026-05-29 burn68 successes — EA/CS/rationalist/literary blogs
  { url: 'http://paulfchristiano.com/', name: 'Paul Christiano' },
  { url: 'http://rationalaltruist.com/', name: 'Rational Altruist' },
  { url: 'https://lemire.me/blog/', name: 'Daniel Lemire' },
  { url: 'https://mathenchant.wordpress.com/', name: 'Math Enchant' },
  { url: 'https://healthyalgorithms.com/', name: 'Healthy Algorithms' },
  { url: 'https://awwalker.com/', name: 'AW Walker' },
  { url: 'https://nisheethvishnoi.wordpress.com/', name: 'Nisheeth Vishnoi' },
  { url: 'https://redeemingmoments.com/', name: 'Redeeming Moments' },
  { url: 'https://www.commonreader.co.uk/', name: 'Common Reader' },
  { url: 'https://libertiesjournal.substack.com/', name: 'Liberties Journal' },
  { url: 'https://www.thenewcritic.com/', name: 'The New Critic' },
  { url: 'https://www.persuasion.community/', name: 'Persuasion' },
  { url: 'https://agtb.wordpress.com/', name: 'AGTB' },
  // === DISC7: knitting/fiber arts, humanities academics, intl personal blogs ===
  // Knitting/fiber arts community — legendary for huge blogrolls
  { url: 'https://www.yarnharlot.ca/', name: 'Yarn Harlot' },
  { url: 'https://www.knitty.com/', name: 'Knitty' },
  { url: 'https://brooklyntweed.com/blogs/journal/', name: 'Brooklyn Tweed Journal' },
  { url: 'https://www.ravelry.com/discuss/lazy-stupid-and-godless/', name: 'Ravelry' },
  { url: 'https://woollywormhead.com/', name: 'Woolly Wormhead' },
  { url: 'https://ysolda.com/blogs/journal/', name: 'Ysolda' },
  { url: 'https://www.freckledfrog.com/blog/', name: 'Freckled Frog' },
  { url: 'https://www.theknittingseason.com/', name: 'The Knitting Season' },
  // New batch40b/50b successes as seeds
  { url: 'https://nicoleandmaggie.wordpress.com/', name: 'Nicole and Maggie' },
  { url: 'https://georgiasummers.co.uk/', name: 'Georgia Summers' },
  { url: 'https://www.theblacklaser.net/', name: 'The Black Laser' },
  { url: 'https://www.richardhanania.com/', name: 'Richard Hanania' },
  { url: 'https://zachswinehart.com/', name: 'Zach Swinehart' },
  // Academic humanities professors with personal blogs (high blogroll density)
  { url: 'https://www.historiann.com/', name: 'Historiann' },
  { url: 'https://tenured-radical.blogspot.com/', name: 'Tenured Radical' },
  { url: 'https://www.chronicle.com/blogs/brainstorm', name: 'Chronicle Brainstorm' },
  { url: 'https://miriamburstein.typepad.com/', name: 'Little Professor' },
  { url: 'https://www.earlymodernweb.com/', name: 'Early Modern Web' },
  { url: 'https://rogueclassicism.com/', name: 'Rogue Classicism' },
  { url: 'https://edwired.org/', name: 'EdWired' },
  { url: 'https://profhacker.com/', name: 'ProfHacker' },
  // Australian/Canadian academic bloggers (untapped)
  { url: 'https://pollyprissypants.com/', name: 'Polly Prissy Pants' },
  { url: 'https://www.metaviews.ca/', name: 'MetaViews' },
  { url: 'https://www.dangerousminds.net/', name: 'Dangerous Minds' },
  { url: 'https://larvatusprodeo.net/', name: 'Larvatus Prodeo' },
  // Book/literature personal blogs with rich blogrolls
  { url: 'https://www.dovegreyreader.co.uk/', name: 'Dove Grey Reader' },
  { url: 'https://www.ofbooksandbirds.com/', name: 'Of Books and Birds' },
  { url: 'https://heavenali.wordpress.com/', name: 'Heaven Ali' },
  { url: 'https://kaggsysbookishramblings.wordpress.com/', name: 'Kaggsy' },
  { url: 'https://stillbookmarked.wordpress.com/', name: 'Still Bookmarked' },
  { url: 'https://whisperinggums.wordpress.com/', name: 'Whispering Gums' },
  { url: 'https://roughghosts.wordpress.com/', name: 'Rough Ghosts' },
  // Amateur astronomy personal blogs
  { url: 'https://www.astronomyblog.com/', name: 'Astronomy Blog' },
  { url: 'https://www.astroblog.net/', name: 'AstroBlog' },
  { url: 'https://inneririshastronomer.wordpress.com/', name: 'Irish Astronomer' },
  // SF/Fantasy author blogs (blogroll gold mines from early blogosphere)
  { url: 'https://whatever.scalzi.com/', name: 'Whatever (Scalzi)' },
  { url: 'https://www.antipope.org/charlie/blog-static/', name: 'Charlie Stross' },
  { url: 'https://terribleminds.com/', name: 'Terrible Minds' },
  { url: 'https://bookviewcafe.com/blog/', name: 'Book View Cafe' },
  { url: 'https://www.sfsignal.com/', name: 'SF Signal' },
  { url: 'https://www.sfsite.com/', name: 'SF Site' },
  { url: 'https://locusmag.com/', name: 'Locus Mag' },
  { url: 'http://www.tobiasbuckell.com/', name: 'Tobias Buckell' },
  { url: 'https://www.kathryncramer.com/', name: 'Kathryn Cramer' },
  // Personal finance/FIRE community (large WP blogroll network)
  { url: 'https://www.mrmoneymustache.com/', name: 'Mr. Money Mustache' },
  { url: 'https://jlcollinsnh.com/', name: 'JL Collins NH' },
  { url: 'https://earlyretirementextreme.com/', name: 'Early Retirement Extreme' },
  { url: 'https://www.getrichslowly.org/', name: 'Get Rich Slowly' },
  { url: 'https://frugalwoods.com/', name: 'Frugal Woods' },
  { url: 'https://affordanything.com/', name: 'Afford Anything' },
  { url: 'https://rootofgood.com/', name: 'Root of Good' },
  { url: 'https://www.madfientist.com/', name: 'Mad Fientist' },
  // Travel/expat/lifestyle blogs with blogrolls
  { url: 'https://www.nomadicmatt.com/', name: 'Nomadic Matt' },
  { url: 'https://chrisguillebeau.com/', name: 'Chris Guillebeau' },
  { url: 'https://www.worldnomads.com/explore/', name: 'World Nomads Blog' },
  { url: 'https://bemyescapefromreality.blogspot.com/', name: 'Be My Escape' },
  // Writing craft / author craft blogs
  { url: 'https://www.writersdigest.com/', name: 'Writers Digest' },
  { url: 'https://www.thepassivevoice.com/', name: 'The Passive Voice' },
  { url: 'https://killzoneblog.com/', name: 'Kill Zone Blog' },
  { url: 'https://absolutewrite.com/forums/', name: 'Absolute Write' },
  // New batch30e successes as seeds
  { url: 'http://fermatstheory.wordpress.com/', name: "Fermat's Theory" },
  { url: 'https://www.demandsage.com/', name: 'Demand Sage' },
  // Philosophy/social science blogs not yet tried
  { url: 'https://ndpr.nd.edu/', name: 'Notre Dame Phil Reviews' },
  { url: 'https://www.philosophyetc.net/', name: 'Philosophy Et Cetera' },
  { url: 'https://leiterreports.typepad.com/', name: 'Leiter Reports' },
  { url: 'https://philosophynow.org/', name: 'Philosophy Now' },
  // Amateur science / astronomy / maker
  { url: 'https://www.universetoday.com/', name: 'Universe Today' },
  { url: 'https://skyandtelescope.org/', name: 'Sky & Telescope' },
  { url: 'https://www.cloudynights.com/', name: 'Cloudy Nights' },
  { url: 'https://hackaday.io/', name: 'Hackaday.io' },
  // disc8 — burn60c UK book blog successes (all link to each other)
  { url: 'http://746books.com/', name: '746 Books' },
  { url: 'https://theclassicsclubblog.wordpress.com/', name: 'The Classics Club' },
  { url: 'http://roughghosts.com/', name: 'Rough Ghosts' },
  { url: 'https://jacquiwine.wordpress.com/', name: "Jacqui Wine's Journal" },
  { url: 'https://anzlitlovers.com/', name: 'ANZ LitLovers' },
  { url: 'https://whisperinggums.com/', name: 'Whispering Gums' },
  { url: 'https://argumentativeoldgit.wordpress.com/', name: 'Argumentative Old Git' },
  { url: 'https://tonysreadinglist.wordpress.com/', name: "Tony's Reading List" },
  { url: 'https://1streading.wordpress.com/', name: '1st Reading' },
  { url: 'https://bookaroundthecorner.wordpress.com/', name: 'Book Around the Corner' },
  { url: 'http://sciencefictionruminations.com/', name: 'SF Ruminations' },
  { url: 'http://grabthelapels.com/', name: 'Grab the Lapels' },
  { url: 'http://leavesandpages.com/', name: 'Leaves and Pages' },
  { url: 'https://theliterarysisters.wordpress.com/', name: 'The Literary Sisters' },
  { url: 'http://retroculturati.com/', name: 'Retroculturati' },
  { url: 'http://shereadsnovels.wordpress.com/', name: 'She Reads Novels' },
  { url: 'http://thewritesofwoman.wordpress.com/', name: 'Writes of Woman' },
  { url: 'http://theinvisibleevent.com/', name: 'The Invisible Event' },
  { url: 'http://bronasbooks.com/', name: "Brona's Books" },
  { url: 'https://calmgrove.wordpress.com/', name: 'Calmgrove' },
  { url: 'https://ellethinks.wordpress.com/', name: 'Elle Thinks' },
  { url: 'https://findingtimetowrite.wordpress.com/', name: 'Finding Time to Write' },
  { url: 'https://readersretreat2017.wordpress.com/', name: 'Readers Retreat' },
  // disc9 seeds — burn60g successes (mystery/crime + general lit)
  { url: 'https://witnesstothecrime.wordpress.com/', name: 'Witness to the Crime' },
  { url: 'http://russophilereads.wordpress.com/', name: 'Russophile Reads' },
  { url: 'http://thepagedreamer.wordpress.com/', name: 'The Paged Dreamer' },
  { url: 'http://sarahlefanu.wordpress.com/', name: 'Sarah LeFanu' },
  { url: 'http://reading-in-bed.com/', name: 'Reading in Bed' },
  { url: 'http://daphnelee.org/', name: 'Daphne Lee' },
  { url: 'http://emeraldcitybookreviewarchive.wordpress.com/', name: 'Emerald City Book Review' },
  { url: 'http://asemictarot.wordpress.com/', name: 'Asemic Tarot' },
  { url: 'http://thinkaboutreading.wordpress.com/', name: 'Think About Reading' },
  { url: 'http://writingverbaboutwritingnoun.wordpress.com/', name: 'Writing Verb About Writing Noun' },
  { url: 'http://alibrarylady.blog/', name: 'A Library Lady' },
  { url: 'https://captainawkward.com/', name: 'Captain Awkward' },
  { url: 'http://defeatingthedragons.wordpress.com/', name: 'Defeating the Dragons' },
  { url: 'https://estherdaponte.wordpress.com/', name: 'Esther da Ponte' },
  { url: 'http://litlove.wordpress.com/', name: 'LitLove' },
  { url: 'http://bellejar.ca/', name: 'The Belle Jar' },
  { url: 'https://maggiemcneill.wordpress.com/', name: 'Maggie McNeill' },
  { url: 'https://mookse.substack.com/', name: 'The Mookse and the Gripes (Substack)' },
  { url: 'http://thelongestchapter.com/', name: 'The Longest Chapter' },
  { url: 'http://onebrightbook.com/', name: 'One Bright Book' },
  { url: 'http://youmightaswellread.com/', name: 'You Might As Well Read' },
  { url: 'http://ravencrimereads.wordpress.com/', name: 'Raven Crime Reads' },
  { url: 'http://clairemcalpine.com/', name: 'Claire McAlpine' },
  { url: 'http://beyondedenrock.wordpress.com/', name: 'Beyond Eden Rock' },
  { url: 'http://winstonsdad.wordpress.com/', name: "Winston's Dad" },
  { url: 'http://mookseandgripes.com/', name: 'The Mookse and the Gripes' },
  { url: 'http://readingmattersblog.com/', name: 'Reading Matters' },
  // disc10 seeds — burn60h/i/j successes
  { url: 'http://mrsbakersbooks.wordpress.com/', name: "Mrs Baker's Books" },
  { url: 'http://tomsbookcorner.wordpress.com/', name: "Tom's Book Corner" },
  { url: 'http://readwithjulia.com/', name: 'Read With Julia' },
  { url: 'http://brontebabeblog.wordpress.com/', name: 'Bronte Babe Blog' },
  { url: 'http://thegreatbritishbookworm.wordpress.com/', name: 'The Great British Bookworm' },
  { url: 'http://bethsbookcase.org/', name: "Beth's Bookcase" },
  { url: 'http://scopeforimagination.co.uk/', name: 'Scope for Imagination' },
  { url: 'http://missclevelandsreading.com/', name: "Miss Cleveland's Reading" },
  { url: 'http://debuk.wordpress.com/', name: 'Debuk' },
  { url: 'https://rohanmaitzen.com/novelreadings/', name: 'Novel Readings' },
  { url: 'http://madcaphat.wordpress.com/', name: 'Mad Cap Hat' },
  { url: 'http://somethingrhymed.com/', name: 'Something Rhymed' },
  { url: 'https://winstonsdad.blog/', name: "Winston's Dad Blog" },
  { url: 'http://amckiereads.wordpress.com/', name: 'A McKie Reads' },
  { url: 'http://kinnareads.wordpress.com/', name: 'Kinna Reads' },
  { url: 'http://maphead.wordpress.com/', name: 'Map Head' },
  { url: 'http://readerdad.co.uk/', name: 'Reader Dad' },
  { url: 'http://solarbridge.wordpress.com/', name: 'Solar Bridge' },
  // disc11 seeds — burn60k/l successes (SF/specfic + diverse lit)
  { url: 'http://feministclassics.wordpress.com/', name: 'Feminist Classics' },
  { url: 'http://bookedallweek.wordpress.com/', name: 'Booked All Week' },
  { url: 'http://geosireads.wordpress.com/', name: 'Geosi Reads' },
  { url: 'http://irisonbooks.wordpress.com/', name: 'Iris on Books' },
  { url: 'http://novelniche.wordpress.com/', name: 'Novel Niche' },
  { url: 'http://theliterarylollipop.wordpress.com/', name: 'The Literary Lollipop' },
  { url: 'https://carolsnotebook.com/', name: "Carol's Notebook" },
  { url: 'https://thecaptivereader.com/', name: 'The Captive Reader' },
  { url: 'http://paperknife.maureenkincaidspeller.com/', name: 'Paperknife' },
  { url: 'http://everythingisnice.wordpress.com/', name: 'Everything is Nice' },
  { url: 'http://iansales.com/', name: 'Ian Sales' },
  { url: 'http://sfmistressworks.wordpress.com/', name: 'SF Mistressworks' },
  { url: 'http://foxhillreview.wordpress.com/', name: 'Fox Hill Review' },
  { url: 'http://worldsf.wordpress.com/', name: 'World SF Blog' },
  { url: 'http://astripedarmchair.wordpress.com/', name: 'A Striped Armchair' },
  // disc12 seeds — burn60m/n successes (lit reviews + SF review blogs)
  { url: 'http://katemacdonald.net/', name: 'Kate MacDonald' },
  { url: 'https://missbatesreadsromance.com/', name: 'Miss Bates Reads Romance' },
  { url: 'https://paperknife.wordpress.com/', name: 'Paperknife WP' },
  { url: 'http://thestoryandthetruth.wordpress.com/', name: 'The Story and the Truth' },
  { url: 'http://itdoesnthavetoberight.wordpress.com/', name: "It Doesn't Have to Be Right" },
  { url: 'http://jennysbooks.wordpress.com/', name: "Jenny's Books" },
  { url: 'http://bookssnob.wordpress.com/', name: 'Books Snob' },
  { url: 'http://hogglestock.com/', name: 'Hogglestock' },
  { url: 'http://carolsnotebook.com/', name: "Carol's Notebook" },
  { url: 'https://thecaptivereader.com/', name: 'The Captive Reader' },
  { url: 'http://feministclassics.wordpress.com/', name: 'Feminist Classics' },
  { url: 'http://geosireads.wordpress.com/', name: 'Geosi Reads' },
  // disc13 seeds — burn60o successes (mixed niches: art/NYC/garden/personal)
  { url: 'http://hitoshiasaumi.wordpress.com/', name: 'Hitoshi Asaumi' },
  { url: 'https://gavreads.co.uk/', name: 'Gav Reads' },
  { url: 'http://www.pentreath-hall.com/', name: 'Pentreath Hall' },
  { url: 'http://ephemeralnewyork.wordpress.com/', name: 'Ephemeral New York' },
  { url: 'https://myporchblog.wordpress.com/', name: 'My Porch Blog' },
  // disc14 seeds — brand new niches: food/recipe, gardening, travel, DIY/craft, parenting, fitness
  // Food & Recipe blogs
  { url: 'https://smittenkitchen.com/', name: 'Smitten Kitchen' },
  { url: 'https://www.davidlebovitz.com/', name: 'David Lebovitz' },
  { url: 'https://www.thekitchn.com/', name: 'The Kitchn' },
  { url: 'https://www.food52.com/', name: 'Food52' },
  { url: 'https://www.simplyrecipes.com/', name: 'Simply Recipes' },
  // Gardening blogs
  { url: 'https://www.gardenrant.com/', name: 'Garden Rant' },
  { url: 'https://www.thegardenglove.com/', name: 'The Garden Glove' },
  { url: 'https://gardenista.com/', name: 'Gardenista' },
  { url: 'https://www.awaytogarden.com/', name: 'A Way to Garden' },
  // Travel blogs
  { url: 'https://www.uncorneredmarket.com/', name: 'Uncornered Market' },
  { url: 'https://adventurouskate.com/', name: 'Adventurous Kate' },
  { url: 'https://www.theblondeabroad.com/', name: 'The Blonde Abroad' },
  { url: 'https://www.legalnomads.com/', name: 'Legal Nomads' },
  // DIY / Craft blogs
  { url: 'https://www.abeautifulmess.com/', name: 'A Beautiful Mess' },
  { url: 'https://www.iamahomemaker.com/', name: 'I Am a Homemaker' },
  { url: 'https://thecottagemarket.com/', name: 'The Cottage Market' },
  { url: 'https://www.persialou.com/', name: 'Persia Lou' },
  // Parenting blogs
  { url: 'https://www.scarymommy.com/', name: 'Scary Mommy' },
  { url: 'https://www.modernmom.com/', name: 'Modern Mom' },
  { url: 'https://www.babycenter.com/baby-names', name: 'BabyCenter Blog' },
  // Fitness / Wellness blogs
  { url: 'https://www.nerdfitness.com/', name: 'Nerd Fitness' },
  { url: 'https://www.marksdailyapple.com/', name: "Mark's Daily Apple" },
  { url: 'https://www.precisionnutrition.com/blog', name: 'Precision Nutrition' },
  { url: 'https://www.mindbodygreen.com/', name: 'MindBodyGreen' },
  // Education / Teacher blogs
  { url: 'https://www.cultofpedagogy.com/', name: 'Cult of Pedagogy' },
  { url: 'https://www.edutopia.org/', name: 'Edutopia' },
  { url: 'https://teachingwithsimplicity.com/', name: 'Teaching with Simplicity' },
  // Photography blogs
  { url: 'https://www.thedigitalpicture.com/', name: 'The Digital Picture' },
  { url: 'https://fstoppers.com/', name: 'Fstoppers' },
  { url: 'https://petapixel.com/', name: 'PetaPixel' },
  // disc15 seeds — personal bloggers with blogrolls in tight communities
  // Genealogy (all WP, huge blogrolls, active comments)
  { url: 'https://www.geneamusings.com/', name: 'Geneamusings (Randy Seaver)' },
  { url: 'https://www.geneabloggers.com/', name: 'GeneaBloggers' },
  { url: 'https://www.familylocket.com/', name: 'Family Locket' },
  { url: 'https://www.southernappalachianroots.com/', name: 'Southern Appalachian Roots' },
  { url: 'https://ancestorsinmyblood.wordpress.com/', name: 'Ancestors in My Blood' },
  { url: 'https://olivetreegenealogy.blogspot.com/', name: 'Olive Tree Genealogy' },
  { url: 'https://www.thegenealogygirl.com/', name: 'The Genealogy Girl' },
  // Quilting (huge WP community, active blogrolls)
  { url: 'https://gnomeangel.com/', name: 'Gnome Angel Quilts' },
  { url: 'https://www.myquiltinfatuation.com/', name: 'My Quilt Infatuation' },
  { url: 'https://www.filminthefridge.com/', name: 'Film in the Fridge' },
  { url: 'https://cabininthepines.wordpress.com/', name: 'Cabin in the Pines' },
  { url: 'https://quiltingjetgirl.com/', name: 'Quilting Jet Girl' },
  { url: 'https://www.swimbikequilt.com/', name: 'Swim Bike Quilt' },
  { url: 'https://www.needlesandlemons.com/', name: 'Needles and Lemons' },
  // Garden personal bloggers (UK/AU — tight community like book bloggers)
  { url: 'https://patientgardener.wordpress.com/', name: 'Patient Gardener' },
  { url: 'https://veddw.com/', name: 'Veddw Garden' },
  { url: 'https://www.gardenersworld.com/plants/garden-blogs/', name: 'Gardeners World Blogs' },
  { url: 'https://lotuslandgarden.wordpress.com/', name: 'Lotus Land Garden' },
  { url: 'https://gardengatedesigns.wordpress.com/', name: 'Garden Gate Designs' },
  // Running / triathlon personal blogs
  { url: 'https://runningwithspoons.wordpress.com/', name: 'Running with Spoons' },
  { url: 'https://www.runsaltrun.com/', name: 'Run Salt Run' },
  { url: 'https://www.cooktraineatlove.com/', name: 'Cook Train Eat Love' },
  { url: 'https://theathletarian.com/', name: 'The Athletarian' },
  // Homeschool (very tight WP community)
  { url: 'https://www.simplycharlottemason.com/', name: 'Simply Charlotte Mason' },
  { url: 'https://www.heart-of-the-matter.com/', name: 'Heart of the Matter' },
  { url: 'https://www.confessionsofahomeschooler.com/', name: 'Confessions of a Homeschooler' },
  { url: 'https://1plus1plus1equals1.net/', name: '1+1+1=1' },
];

const confirmed = [];
const checked = new Set();
let totalNew = 0;

console.log('Crawling blogrolls from winning blogs...\n');

for (const seed of SEEDS) {
  let seedHost;
  try { seedHost = new URL(seed.url).hostname.replace(/^www\./, ''); } catch { continue; }
  
  console.log(`Seed: ${seed.url}`);
  const html = await fetchUrl(seed.url);
  if (!html) { console.log('  → unreachable\n'); continue; }
  
  const links = extractLinks(html, seedHost);
  const unique = [...new Map(links.map(l => [l.host, l])).values()];
  console.log(`  ${unique.length} outbound links`);
  
  let seedNew = 0;
  for (const link of unique.slice(0, 40)) {
    if (existingDomains.has(link.host) || checked.has(link.host)) {
      continue;
    }
    checked.add(link.host);
    
    // Quick check if it looks like a blog
    const targetHtml = await fetchUrl(link.url);
    if (!targetHtml) continue;
    
    if (looksLikeBlog(link.url, targetHtml)) {
      existingDomains.add(link.host);
      confirmed.push({
        url: link.url,
        name: link.host,
        type: 'blog_comment',
        niche: 'general',
        status: 'pending',
        submitted: false,
        source: `blogroll-${seedHost}`,
        discovered_at: new Date().toISOString().split('T')[0]
      });
      console.log(`  ✓ blog: ${link.host}`);
      seedNew++;
      totalNew++;
    }
  }
  if (seedNew === 0) console.log('  (no new blogs found)');
  console.log();
}

if (totalNew > 0) {
  const updated = [...resources, ...confirmed];
  fs.writeFileSync(RESOURCES_PATH, JSON.stringify(updated, null, 2));
  console.log(`\n✅ New confirmed: ${totalNew}`);
  console.log(`Resources: ${resources.length} → ${updated.length}`);
} else {
  console.log('\nNo new blogs found.');
}
