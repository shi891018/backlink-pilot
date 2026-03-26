# Backlink Pilot

**One config, one command. Automated backlink submission for indie products.**

一条命令提交外链的自动化工具。配置一次产品信息，自动提交到目录站、awesome-list、搜索引擎。

> Built by an AI Agent ([OpenClaw](https://openclaw.ai)) during real-world link building — battle-tested on 30+ sites.

---

## Quick Start / 快速开始

```bash
# 1. Clone & install / 克隆安装
git clone https://github.com/s87343472/backlink-pilot.git
cd backlink-pilot && npm install

# 2. Configure / 配置产品信息
cp config.example.yaml config.yaml
# Edit config.yaml — fill in your product name, URL, description
# 编辑 config.yaml — 填入产品名、网址、描述

# 3. Submit / 提交
node src/cli.js submit submitaitools          # known site adapter
node src/cli.js submit https://any-site.com   # any directory (needs bb-browser)
```

### bb-browser Setup (Recommended / 推荐)

bb-browser uses your real Chrome browser — bypasses anti-bot, Cloudflare, and OAuth.
bb-browser 用你的真实 Chrome 浏览器 — 绕过反爬、Cloudflare、OAuth。

```bash
# Install / 安装
npm install -g bb-browser

# Verify / 验证
bb-browser --version    # should show 0.10.x+

# First launch — auto-starts a managed Chrome instance
# 首次启动 — 自动启动托管 Chrome 实例
bb-browser status

# If "No page target found", create an initial tab:
# 如果提示 "No page target found"，创建初始标签页：
curl -s -X PUT "http://localhost:19825/json/new?about:blank"

# Test / 测试
bb-browser open https://example.com
bb-browser snapshot -i
bb-browser tab close 0
```

**Google login for OAuth sites / Google 登录（用于 OAuth 站点）：**

bb-browser uses an isolated Chrome profile (`~/.bb-browser/browser/user-data`). Log in once:
bb-browser 使用独立 Chrome 配置文件，需要手动登录一次 Google：

```bash
bb-browser open https://accounts.google.com
# Log in manually in the browser window / 在打开的浏览器窗口登录
# After that, all Google OAuth sites work automatically / 之后 OAuth 站点自动工作
```

Set engine in config / 配置引擎：

```yaml
# config.yaml
browser:
  engine: bb    # bb | playwright (default: playwright)

bb_browser:
  auto_update: true
  update_interval_hours: 24
```

---

## Engine Comparison / 引擎对比

| Engine | Setup | Pros | Cons |
|--------|-------|------|------|
| **playwright** (default) | `npm install` | No extra setup / 零配置 | Detected by anti-bot, blocked by Cloudflare |
| **bb-browser** (recommended) | `npm i -g bb-browser` | Real Chrome, invisible, OAuth works / 真实浏览器，100% 隐身 | Requires Chrome setup / 需要 Chrome |

---

## Who is this for? / 适合谁？

| You / 你是谁 | How / 怎么用 | Section / 看哪 |
|-----|-----------|---------
| Non-technical / 不写代码 | Read strategy, submit manually / 看策略，手动提交 | [Strategy](#strategy--策略) |
| OpenClaw user / 有 OpenClaw | Install skill, talk to Agent / 装 skill，跟 Agent 说话 | [Agent](#agent--openclaw) |
| Developer / 开发者 | Modify source, write adapters / 改源码，写适配器 | [Developer](#developer--开发者) |

---

## Strategy / 策略

### Why backlinks matter / 为什么要做外链

Google ranking: **other sites linking to you = votes**. More votes from authoritative sources = higher ranking.

Google 排名逻辑：**别的网站链接到你 = 投票**。票越多、来源越权威，排名越高。

### Best channels by ROI / 最佳渠道

#### GitHub awesome-lists (highest ROI / 最高效)

Curated resource lists with thousands of stars. Submit an Issue, get permanently listed.

GitHub 上的 awesome-xxx 仓库。提 Issue，审核通过就永久收录。**成本 $0，每个 5 分钟。**

#### Free directory sites / 免费目录站

| Site | Notes | Review time | Adapter |
|------|-------|-------------|---------|
| SaaSHub | SaaS directory | Same day | `saashub` |
| submitaitools.org | AI tools (DA 73) | 1-3 days | `submitaitools` |
| toolverto.com | Tools directory | 1-3 days | `toolverto` |
| uneed.best | Tools (DR 72) | Queued | `uneed` |
| 600.tools | 3 dofollow links | 1-3 days | `600tools` |
| Dang.ai | AI directory (DA 35) | 3-4 weeks | `dangai` |
| Startup88 | Startup directory | 1-2 weeks | `startup88` |

#### Avoid / 避坑

| Site | Issue |
|------|-------|
| IndieHub | Looks free, costs $4.9 to publish / 看起来免费，发布要 $4.9 |
| OpenHunts | Free queue is 51 weeks / 免费排队 51 周 |
| toolify.ai | $99 to submit |
| Product Hunt | Anti-bot, manual only / 反爬机制，只能手动 |

### Submission pace / 提交节奏

- 1-3 min between sites / 不同站点间隔 1-3 分钟
- 5-10 submissions per day / 一天 5-10 个
- **Never submit the same product to the same site twice / 同一产品不要重复提交**

---

## Agent / OpenClaw

For [OpenClaw](https://openclaw.ai) users — install as a skill, then talk to your Agent.

给 OpenClaw 用户 — 装成 skill，跟 Agent 说话就行。

### Install / 安装

```bash
ln -s ~/path/to/backlink-pilot ~/.openclaw/skills/backlink-pilot
```

### Usage / 用法

| Say / 说 | Result / 效果 |
|----------|---------------|
| "Submit to submitaitools" / "提交到 submitaitools" | Auto-submits / 自动提交 |
| "Scout https://some-directory.com" / "看看这个站能不能提交" | Discovers form fields / 侦察站点 |
| "Generate awesome-cloudflare submission" / "生成 awesome-cloudflare 提交内容" | Creates Issue body / 生成 Issue |
| "Show backlink status" / "外链提交情况" | Shows progress / 查看进度 |

---

## Developer / 开发者

### Commands / 命令

```bash
# Scout a site / 侦察站点
node src/cli.js scout https://new-site.com --deep

# Submit to known adapter / 提交到已知站点
node src/cli.js submit submitaitools
node src/cli.js submit submitaitools --engine bb

# Generic submit to ANY directory (needs bb-browser)
# 通用提交（任何目录站，需要 bb-browser）
node src/cli.js submit https://any-directory.com/submit

# Awesome-list Issue
node src/cli.js awesome awesome-cloudflare

# Ping search engines / 通知搜索引擎
node src/cli.js indexnow https://your-site.com

# Batch blog comments / 批量博客评论
node src/batch-submit.js --limit 10
node src/batch-submit.js --limit 10 --engine bb

# Check status / 查看记录
node src/cli.js status

# Update bb-browser community adapters / 更新社区适配器
node src/cli.js bb-update
```

### Project Structure / 项目结构

```
backlink-pilot/
├── config.example.yaml       ← Config template / 配置模板
├── SKILL.md                   ← Agent skill definition
├── adapters.md                ← Site adapters & awesome-list targets
├── TROUBLESHOOTING.md         ← 20+ site debugging notes / 踩坑记录
├── src/
│   ├── cli.js                 ← CLI entry point
│   ├── browser.js             ← Dual-engine: playwright + bb-browser
│   ├── bb.js                  ← bb-browser wrapper (BbPage API)
│   ├── bb-update.js           ← Auto-update bb-browser adapters
│   ├── submit.js              ← Submission dispatcher
│   ├── batch-submit.js        ← Batch blog comment submitter
│   ├── config.js              ← Config loader + UTM
│   ├── tracker.js             ← Submission tracking
│   ├── captcha.js             ← CAPTCHA solvers
│   ├── indexnow.js            ← Search engine ping
│   ├── sites/                 ← Site adapters
│   │   ├── generic.js         ← Universal adapter (bb-browser)
│   │   ├── submitaitools.js
│   │   ├── toolverto.js
│   │   └── ...
│   ├── scout/
│   │   └── discover.js        ← Form field discovery
│   └── awesome/
│       └── templates.js       ← Awesome-list Issue generator
```

### Writing a new adapter / 写新适配器

Option 1: Generic (no code needed) / 通用提交（不用写代码）：

```bash
node src/cli.js submit https://new-site.com/submit --engine bb
```

Option 2: Custom adapter / 自定义适配器：

```bash
# 1. Scout
node src/cli.js scout https://new-site.com --deep
```

```javascript
// 2. Create src/sites/newsite.js
import { withBrowser, delay } from '../browser.js';

export default {
  name: 'new-site.com',
  url: 'https://new-site.com/submit',
  auth: 'none',
  captcha: 'none',
  engine: 'bb',  // optional: force bb-browser

  async submit(product, config) {
    return withBrowser(config, async ({ page }) => {
      await page.goto('https://new-site.com/submit', { waitUntil: 'networkidle' });
      await page.fill('input[name="tool_name"]', product.name);
      await page.fill('input[name="tool_url"]', product.utm_url);
      await page.click('button[type="submit"]');
      await delay(3000);
      return { url: page.url(), confirmation: 'Submitted' };
    });
  },
};
```

```bash
# 3. Run
node src/cli.js submit newsite
```

### Batch blog comments / 批量博客评论

Submit links via the Website field in blog comment forms.
在博客评论区的 Website 字段留下网站链接。

- URL goes in Website field, not comment body / URL 放 Website 字段，不放正文
- 20 comment templates, randomly rotated / 20 条评论模板随机轮换
- 5 personas rotated / 5 个 Persona 轮换
- Global dedup (`logs/global-history.json`) / 全局去重
- Auto-skips CAPTCHAs and closed comments / 自动跳过验证码和已关闭评论

```bash
node src/batch-submit.js --dry-run --limit 5   # test / 试跑
node src/batch-submit.js --limit 10 --site 0    # run / 真跑
```

### Technical notes / 技术要点

- **rebrowser-playwright** patches `navigator.webdriver` at compile level. 69% success across 13 sites.
- **bb-browser** uses real Chrome — 100% invisible, no fingerprint issues.
- Cloudflare Challenge/Turnstile is a hard wall for playwright → use `--engine bb`.
- Color CAPTCHA solved via text extraction + button matching (100% success).

> Full debugging notes: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) / 完整踩坑记录

---

## Contributing

PRs welcome: new site adapters, CAPTCHA solver improvements, bug fixes.

欢迎 PR：新站点适配器、验证码解法改进、Bug 修复。

## License

MIT

## Credits

Built with [OpenClaw](https://openclaw.ai). Browser automation by [rebrowser-playwright](https://github.com/nickthecoder/rebrowser-playwright) and [bb-browser](https://github.com/epiral/bb-browser).
